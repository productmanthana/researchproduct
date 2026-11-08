import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useClerk, useUser } from "@clerk/react";
import { useGenerateStudioDocument, getListStudioItemsQueryKey, getGetStudioItemQueryKey, useCreateAnalysis, useListAnalyses, getListAnalysesQueryKey, useGetUsage, getGetUsageQueryKey, useSaveAnalysisDraft, type Analysis } from "@workspace/api-client-react";
import { ArrowDownToLine, ArrowUp, BookOpen, Check, Copy, FileText, Leaf, LogOut, Menu, MoreHorizontal, Plus, Wind, X } from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, ErrorState, RowSkeleton } from "@/components/states";
import { StudioTurn } from "@/components/research-studio/turn";
import { EvidencePanel } from "@/components/research-studio/evidence-panel";
import { AcademicAnswer } from "@/components/academic-answer";
import { useToast } from "@/hooks/use-toast";
import { errMessage } from "@/lib/format";
import { allUsageLimitMessages, usageLimitMessage } from "@/lib/usage-limits";
import { markdownSections, replaceMarkdownSection } from "./draft-markdown";
import { askSendDisabled } from "./ask-workspace-state";
import { SaveAnalysisToProject } from "@/components/studio/save-analysis";
import { useActiveProject } from "@/lib/active-project";
import { useUnsavedGuard } from "@/lib/unsaved";
import { friendlyError, projectIntent } from "@/lib/studio";
import "@/components/research-studio/studio.css";
import "./ask-workspace.css";

const isDone = (status?: string) => status === "completed" || status === "failed";
type Thread = { id: string; turns: Analysis[]; updatedAt: string };
type DraftBuffer = { content: string; revision: number; dirty: boolean; status: string };

function groupThreads(list: Analysis[]): Thread[] {
  const map = new Map<string, Analysis[]>();
  for (const analysis of list) {
    if (analysis.mode !== "ask") continue;
    const id = analysis.conversationId || analysis.id;
    map.set(id, [...(map.get(id) ?? []), analysis]);
  }
  return [...map.entries()].map(([id, turns]) => {
    const sorted = [...turns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { id, turns: sorted, updatedAt: sorted.at(-1)!.createdAt };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function answerReferences(analysis: Analysis) {
  return analysis.sources.map((source, index) => {
    const paper = analysis.discoveredPapers?.find(item => item.id === source.paperId);
    return `[${index + 1}] ${paper?.authors?.length ? `${paper.authors.join(", ")}. ` : ""}${source.title}${paper?.year ? ` (${paper.year})` : ""}. ${source.url}`;
  }).join("\n\n");
}

function AskInner() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const threadId = params.get("t");
  const prefill = params.get("q") ?? "";
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();
  const { signOut } = useClerk();
  const list = useListAnalyses({ query: { queryKey: getListAnalysesQueryKey(), refetchInterval: q => ((q.state.data ?? []).some(a => !isDone(a.status)) ? 3500 : false) } });
  const usage = useGetUsage({ query: { queryKey: getGetUsageQueryKey() } });
  const create = useCreateAnalysis();
  const saveDraft = useSaveAnalysisDraft();
  const threads = useMemo(() => groupThreads(list.data ?? []), [list.data]);
  const thread = threadId ? threads.find(t => t.id === threadId || t.turns.some(x => x.id === threadId)) : undefined;
  const [question, setQuestion] = useState(prefill);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"sources" | "draft" | null>(null);
  const [sourceAnalysisId, setSourceAnalysisId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [sourceRevealRequest, setSourceRevealRequest] = useState(0);
  const [draftBuffers, setDraftBuffers] = useState<Record<string, DraftBuffer>>({});
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftEditing, setDraftEditing] = useState(false);
  const [draftSectionId, setDraftSectionId] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const composer = useRef<HTMLTextAreaElement>(null);
  const threadScroll = useRef<HTMLDivElement>(null);
  const editor = activeDraftId ? draftBuffers[activeDraftId] : undefined;

  useEffect(() => { setQuestion(prefill); }, [threadId, prefill]);
  useEffect(() => {
    setDraftBuffers(current => {
      let changed = false;
      const next = { ...current };
      for (const analysis of list.data ?? []) {
        if (analysis.draftContent == null || analysis.draftRevision == null) continue;
        const local = current[analysis.id];
        if (!local || (!local.dirty && analysis.draftRevision > local.revision)) {
          next[analysis.id] = { content: analysis.draftContent, revision: analysis.draftRevision, dirty: false, status: "Saved" };
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [list.data]);

  const currentThread = thread?.turns ?? [];
  const draftAnalysis = activeDraftId ? (list.data ?? []).find(a => a.id === activeDraftId) : undefined;
  const draftSections = editor ? markdownSections(editor.content) : [];
  const selectedDraftSection = draftSections.find(section => section.id === draftSectionId) ?? draftSections[0];
  const active = currentThread.some(t => !isDone(t.status)) || (!!pendingId && !(list.data ?? []).some(a => a.id === pendingId && isDone(a.status)) && !threadId);
  const ownActive = (list.data ?? []).some(a => !isDone(a.status)) || active;
  const parent = [...currentThread].reverse().find(t => t.status === "completed");
  const usageData = usage.data;
  const left = usageData ? usageData.answersLimit < 0 ? Infinity : usageData.answersLimit - usageData.answersUsed : null;
  const limitMessage = usageLimitMessage(usageData, "answer");
  let problem: string | null = null;
  if (question.trim().length < 5) problem = "Write at least 5 characters to begin.";
  else if (question.length > 2000) problem = "Keep your message under 2,000 characters.";
  else if (ownActive) problem = "Wait for the current answer to finish.";
  const evidenceTurns = currentThread.filter(t => t.status === "completed" && t.responseMode !== "guidance" && (t.sources.length > 0 || (t.discoveredPapers?.length ?? 0) > 0));
  const sourceAnalysis = evidenceTurns.find(t => t.id === sourceAnalysisId) ?? evidenceTurns.at(-1);
  const hasDirtyDraft = Object.values(draftBuffers).some(value => value.dirty);
  useUnsavedGuard("ask-draft", hasDirtyDraft, "You have unsaved draft changes in AI Chat.");
  const { project: activeProject } = useActiveProject();
  const intent = projectIntent(question);
  const generate = useGenerateStudioDocument();
  const sendLimit = intent ? usageLimitMessage(usageData, intent.kind === "literature" ? "review" : "answer") : limitMessage;

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasDirtyDraft) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasDirtyDraft]);
  const lastAskUrl = useRef(`${window.location.pathname}${window.location.search}${window.location.hash}`);
  useEffect(() => {
    lastAskUrl.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }, [threadId, prefill]);
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const nextUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (hasDirtyDraft && !window.confirm("You have unsaved draft changes. Leave anyway? Save first if you want to keep them after leaving Ask.")) {
        event.stopImmediatePropagation();
        window.history.pushState(window.history.state, "", lastAskUrl.current);
        return;
      }
      lastAskUrl.current = nextUrl;
    };
    window.addEventListener("popstate", onPopState, true);
    return () => window.removeEventListener("popstate", onPopState, true);
  }, [hasDirtyDraft]);
  useEffect(() => {
    const element = threadScroll.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [currentThread.length, currentThread.at(-1)?.status, currentThread.at(-1)?.content]);

  const mayLeave = () => !hasDirtyDraft || window.confirm("You have unsaved draft changes. Leave anyway? Save first if you want to keep them after leaving Ask.");
  const guardNavigation = (event: { preventDefault: () => void }) => {
    const allowed = mayLeave();
    if (!allowed) event.preventDefault();
    return allowed;
  };
  const openThread = (id: string) => { if (!mayLeave()) return; setLocation(`/ask?t=${encodeURIComponent(id)}`); setMenuOpen(false); setPanel(null); setActiveDraftId(null); setSourceAnalysisId(null); setSelectedSource(null); };
  const newChat = () => {
    if (!mayLeave() || ownActive) return;
    setQuestion("");
    setPanel(null);
    setMenuOpen(false);
    setActiveDraftId(null);
    setSourceAnalysisId(null);
    setSelectedSource(null);
    setLocation("/ask");
    requestAnimationFrame(() => composer.current?.focus());
  };
  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (intent) {
      // Explicit "my idea / my references" request: generate from the active project, never silently fall back to public research.
      // Quota is decided by the backend for the inferred kind (reviews vs answers); only warn locally from the matching allowance.
      if (problem || generate.isPending) return;
      if (!activeProject) {
        toast({ title: "Choose a project first", description: "You asked to use your own material. Pick or create a project in the sidebar, then send again.", variant: "destructive" });
        return;
      }
      if (sendLimit) { toast({ title: "Limit reached", description: sendLimit, variant: "destructive" }); return; }
      if (!mayLeave()) return;
      try {
        const item = await generate.mutateAsync({ data: { projectId: activeProject.id, kind: intent.kind, prompt: question.trim().slice(0, 5000), evidenceMode: "project", includePatents: true } });
        qc.setQueryData(getGetStudioItemQueryKey(item.id), item);
        void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
        void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
        setQuestion("");
        setLocation(`${intent.route}${intent.route.includes("?") ? "&" : "?"}item=${encodeURIComponent(item.id)}`);
      } catch (error) {
        toast({ title: "Couldn't start from your project", description: friendlyError(error), variant: "destructive" });
        void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      }
      return;
    }
    if (limitMessage) {
      toast({ title: "Limit reached", description: limitMessage, variant: "destructive" });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      return;
    }
    if (problem || create.isPending) return;
    try {
      const analysis = await create.mutateAsync({ data: {
        kind: "answer", question: question.trim(), autoDiscover: true, guided: true,
        parentAnalysisId: parent?.id, inspectFigures: true, aiConsent: true,
      } });
      setQuestion("");
      setPendingId(analysis.id);
      qc.setQueryData<Analysis[]>(getListAnalysesQueryKey(), old => old ? [analysis, ...old.filter(x => x.id !== analysis.id)] : [analysis]);
      void qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      setLocation(`/ask?t=${encodeURIComponent(analysis.conversationId || analysis.id)}`);
    } catch (error) {
      toast({ title: "Couldn't send your message", description: errMessage(error), variant: "destructive" });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
    }
  };
  const onComposerKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  };
  const startDraft = (analysis: Analysis) => {
    if (analysis.status !== "completed" || analysis.responseMode === "guidance" || !analysis.sources.length) return;
    const existing = draftBuffers[analysis.id];
    if (!existing && analysis.draftContent != null) {
      setDraftBuffers(current => ({ ...current, [analysis.id]: { content: analysis.draftContent!, revision: analysis.draftRevision ?? 0, dirty: false, status: "Saved" } }));
    } else if (!existing) {
      const references = answerReferences(analysis);
      const citationList = references && !analysis.content.includes("## References") ? `\n\n## References\n\n${references}` : "";
      const content = `# Working research draft\n\n> Editable working draft based on the completed evidence answer below. This is not a journal manuscript; no empirical results or claims beyond the cited synthesis have been added.\n\n## Evidence-grounded synthesis\n\n${analysis.content}${citationList}`;
      setDraftBuffers(current => ({ ...current, [analysis.id]: { content, revision: 0, dirty: true, status: "Not saved yet" } }));
    }
    setActiveDraftId(analysis.id);
    setDraftSectionId(null);
    setDraftEditing(false);
    setPanel("draft");
  };
  const closePanel = () => {
    if (panel === "draft" && editor?.dirty && !window.confirm("This working draft has unsaved changes. Close the panel and keep the edits here?")) return;
    setPanel(null);
  };
  const updateDraft = (content: string) => {
    if (!activeDraftId) return;
    setDraftBuffers(current => ({ ...current, [activeDraftId]: { ...(current[activeDraftId] ?? { revision: 0, status: "Not saved yet" }), content, dirty: true, status: "Unsaved changes" } }));
  };
  const saveCurrentDraft = async () => {
    if (!activeDraftId || !editor || saveDraft.isPending) return;
    const savedContent = editor.content;
    const savedAnalysisId = activeDraftId;
    setDraftBuffers(current => ({ ...current, [activeDraftId]: { ...current[activeDraftId], status: "Saving…" } }));
    try {
      const saved = await saveDraft.mutateAsync({ id: savedAnalysisId, data: { content: savedContent, expectedRevision: editor.revision } });
      setDraftBuffers(current => {
        const latest = current[savedAnalysisId];
        const editedDuringSave = latest.content !== savedContent;
        return { ...current, [savedAnalysisId]: {
          content: latest.content,
          revision: saved.draftRevision ?? editor.revision + 1,
          dirty: editedDuringSave,
          status: editedDuringSave ? "Saved previous text; newer edits still need saving." : "Saved",
        } };
      });
      void qc.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
    } catch (error) {
      const message = errMessage(error);
      setDraftBuffers(current => ({ ...current, [savedAnalysisId]: { ...current[savedAnalysisId], status: message.includes("409") || message.toLowerCase().includes("changed in another tab") ? "Conflict: reload and copy your text before resolving." : `Save failed: ${message}` } }));
    }
  };
  const updateDraftSection = (body: string) => {
    if (!editor || !activeDraftId || !selectedDraftSection) return;
    updateDraft(replaceMarkdownSection(editor.content, selectedDraftSection, body));
  };
  const exploreFurther = (analysis: Analysis) => {
    setQuestion(analysis.responseMode === "guidance"
      ? "Could you help me narrow this topic into a researchable question?"
      : "Could you explain the methods or limitations in this answer?");
    requestAnimationFrame(() => composer.current?.focus());
  };
  const copyAnswer = async (analysis: Analysis) => {
    try {
      const references = answerReferences(analysis);
      await navigator.clipboard.writeText(analysis.content + (references ? `\n\n## References\n\n${references}` : ""));
      setCopied("Answer and references copied.");
    } catch { setCopied("Copy unavailable. Select the answer text to copy."); }
  };
  const exportDraft = () => {
    if (!editor) return;
    const url = URL.createObjectURL(new Blob([editor.content], { type: "text/markdown" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "evidora-working-draft.md"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const handleEvidenceSelect = (analysis: Analysis, id: string) => {
    setSourceAnalysisId(analysis.id);
    setSelectedSource(id);
    setSourceRevealRequest(value => value + 1);
    setPanel("sources");
  };
  const draftInline = (text: string) => text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g).map((part, index) => {
    const cite = /^\[(\d+)\]$/.exec(part);
    if (cite && draftAnalysis) {
      const source = draftAnalysis.sources[Number(cite[1]) - 1];
      if (source) return <button key={index} className="ev-cite" aria-label={`Inspect draft source ${cite[1]}`} onClick={() => handleEvidenceSelect(draftAnalysis, source.id)}>{cite[1]}</button>;
    }
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return part;
  });

  const title = thread?.turns[0]?.question ?? "A new research conversation";
  const name = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Your workspace";
  const initials = name.slice(0, 2).toUpperCase();

  return <div className="es-root">
    {menuOpen && <button className="es-backdrop es-visible" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`es-sidebar ${menuOpen ? "es-sidebar-open" : ""}`} aria-label="Workspace navigation">
      <div className="es-brand"><span className="es-brand-mark"><Leaf /></span><span>evidora<b>.</b></span></div>
      <nav aria-label="Research"><button className="es-button es-new-chat" onClick={newChat} disabled={!!ownActive}><Plus />New chat</button><button className="es-nav-plain" onClick={() => setHistoryOpen(value => !value)} aria-expanded={historyOpen}><BookOpen />My research</button></nav>
      {historyOpen && <div className="es-recent" aria-label="Saved conversations"><span className="es-eyebrow">Your conversations</span>
        {threads.map(item => <button key={item.id} aria-current={thread?.id === item.id ? "page" : undefined} onClick={() => openThread(item.id)}>{item.turns[0]?.question}<small>{item.turns.length} {item.turns.length === 1 ? "turn" : "turns"}</small></button>)}
        {!threads.length && <p className="es-small">{list.isLoading ? "Loading conversations…" : "Your saved conversations will appear here."}</p>}
      </div>}
      <div className="es-sidebar-bottom"><span className="es-avatar">{initials}</span><span className="es-account-name">{name}<small className="es-small">{usageData?.plan ?? "Research workspace"}</small></span><button className="es-icon es-signout" aria-label="Sign out" title="Sign out" onClick={() => { if (mayLeave()) void signOut(); }}><LogOut /></button></div>
    </aside>
    <main className="es-main">
      <header className="es-topbar"><div className="es-top-title"><button className="es-icon es-mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu /></button><h1 title={title}>{title}</h1></div>
        <div className="es-top-actions">{sourceAnalysis && panel !== "sources" && <button className="es-button" onClick={() => setPanel("sources")}><BookOpen />Sources</button>}{activeDraftId && panel !== "draft" && <button className="es-button" onClick={() => setPanel("draft")}><FileText />Draft</button>}</div>
      </header>
      {allUsageLimitMessages(usageData).length > 0 && <div className="es-limit-notice" role="status">{allUsageLimitMessages(usageData).map(message => <p key={message}>{message} <Link href="/plans" onClick={guardNavigation}>Plans &amp; usage</Link></p>)}</div>}
      <div className={`es-workspace ${panel === "draft" ? "es-written" : ""}`}>
        <section className="es-conversation" aria-label="Research conversation">
          <div className="es-thread" ref={threadScroll}><div className="es-thread-inner">
            {!threadId && !list.isLoading && !list.isError && <div className="es-welcome"><div className="es-assistant-head"><span><Wind /></span>Evidora</div><div className="es-prose"><h2>Let’s find a question you care about.</h2><p>Start with a rough idea, a writing question, or a specific scientific question. We can clarify first—or look for scholarly evidence when the question is ready.</p><p className="es-choice-note">Guidance is conversational and separate from evidence-backed research answers.</p></div></div>}
            {list.isLoading && <RowSkeleton rows={2} />}
            {list.isError && <ErrorState error={list.error} onRetry={() => list.refetch()} title="Couldn't load your conversations" />}
            {threadId && !list.isLoading && !thread && <EmptyState icon={<BookOpen />} title="Conversation not found" body="It may belong to another account. Start a new conversation." />}
            {thread?.turns.map(analysis => <div className="es-chat-item" key={analysis.id}>
              <div className="es-turn es-user">{analysis.question}</div>
              <ol className="es-turn-list"><StudioTurn initial={analysis} retryDisabled={!!ownActive} onRetry={text => { setQuestion(text); composer.current?.focus(); }} chatMode onSourceSelect={handleEvidenceSelect} /></ol>
              {analysis.status === "completed" && <div className="es-chat-actions">
                <button className="es-button" onClick={() => exploreFurther(analysis)}><Wind />Explore further</button>
                {analysis.responseMode !== "guidance" && analysis.sources.length > 0 && <button className="es-button es-primary" onClick={() => startDraft(analysis)}><FileText />{analysis.draftContent != null || draftBuffers[analysis.id] ? "Continue draft" : "Start a draft"}</button>}
                {analysis.responseMode !== "guidance" && analysis.content && <SaveAnalysisToProject analysis={analysis} />}
                {analysis.content && <details className="es-more-actions"><summary aria-label="More answer actions"><MoreHorizontal />More</summary><div role="group" aria-label="More answer actions">
                  <button className="es-button" onClick={() => void copyAnswer(analysis)}><Copy />Copy answer &amp; references</button>
                  <button className="es-button" onClick={() => {
                    const references = answerReferences(analysis);
                    const url = URL.createObjectURL(new Blob([analysis.content + (references ? `\n\n## References\n\n${references}` : "")], { type: "text/markdown" }));
                    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "evidora-answer.md"; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                  }}><ArrowDownToLine />Export</button>
                </div></details>}
              </div>}
            </div>)}
          </div></div>
          {copied && <p className="es-copy-status" role="status">{copied}</p>}
          <div className="es-composer-wrap">{intent && <p className="es-small" role="status" style={{ marginBottom: 8 }} data-testid="notice-project-aware">{activeProject
            ? <>Sending will {intent.kind === "answer" ? "answer" : `draft a ${intent.kind === "ideas" ? "set of five ideas" : intent.kind}`} from your project <b>{activeProject.name}</b> only, and open it.</>
            : <>You asked to use your own material, but no project is selected. <Link href="/my-library" onClick={guardNavigation} style={{ color: "var(--teal)", textDecoration: "underline" }} data-testid="link-ask-choose-project">Choose a project</Link> first.</>}</p>}<form className="es-composer" onSubmit={submit}>
            <textarea ref={composer} aria-label="Message Evidora" placeholder="A question, an idea, a half-formed thought…" value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={onComposerKey} rows={2} maxLength={2000} data-testid="input-ask-question" />
            <div className="es-composer-bottom"><span role="status">{sendLimit ?? problem ?? `Start anywhere. ${left === null ? "" : left === Infinity ? "Unlimited answers." : `${left} answers left.`}`}</span><button className={`es-icon ${sendLimit ? "es-limit-send" : ""}`} type="submit" disabled={askSendDisabled({ limitReached: !!sendLimit, blocked: !!problem, pending: create.isPending || generate.isPending, loading: list.isLoading || usage.isLoading })} aria-label={sendLimit ? "Limit reached" : "Send message"} data-testid="button-ask-send">{sendLimit ? "Limit reached" : <ArrowUp />}</button></div>
          </form><p className="es-local-note">Enter to send · Shift+Enter for a new line · AI-assisted answers need original-source review.</p></div>
        </section>
        {panel === "sources" && sourceAnalysis && <aside className="es-panel" aria-label="Sources"><div className="es-panel-header"><h2>Sources <span className="es-small">/ {sourceAnalysis.discoveredPapers?.length ?? sourceAnalysis.sources.length} papers</span></h2><button className="es-icon" aria-label="Close sources and return to chat" onClick={closePanel}><X /></button></div><div className="es-source-panel"><EvidencePanel analysis={sourceAnalysis} selected={selectedSource} onSelect={setSelectedSource} revealRequest={sourceRevealRequest} /></div></aside>}
        {panel === "draft" && editor && activeDraftId && <aside className="es-panel es-writing" aria-label="Editable working draft"><div className="es-panel-header"><div><FileText /><h2>Working draft</h2></div><button className="es-icon" aria-label="Close draft and return to chat" onClick={closePanel}><X /></button></div>
          <div className="es-document-toolbar"><label className="es-section-select-label">Section
            <select aria-label="Choose draft section" value={selectedDraftSection?.id ?? ""} onChange={event => setDraftSectionId(event.target.value)}>
              {draftSections.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}
            </select></label><div>
            <button className="es-button es-view-toggle" onClick={() => setDraftEditing(value => !value)}>{draftEditing ? "Preview document" : "Edit selected section"}</button>
            {sourceAnalysis && <button className="es-icon" aria-label="Open sources" title="Open sources" onClick={() => { setSourceAnalysisId(activeDraftId); setPanel("sources"); }}><BookOpen /></button>}
            <button className="es-icon" aria-label="Download working draft" title="Download draft" onClick={exportDraft}><ArrowDownToLine /></button>
          </div></div>
          <div className="es-document"><span className="es-eyebrow">Editable research working draft</span>
            {draftEditing && selectedDraftSection
              ? <div className="es-section-editor"><h3>{selectedDraftSection.title}</h3><textarea className="es-editor" aria-label={`Edit ${selectedDraftSection.title}`} value={selectedDraftSection.body} onChange={event => updateDraftSection(event.target.value)} spellCheck /></div>
              : <div className="es-document-preview"><AcademicAnswer content={editor.content} inline={draftInline} /></div>}
            <p className="es-provenance">{draftAnalysis?.draftProvenance ?? "AI-assisted source answer retained above."} Local edits are user-authored and not evidence-checked. No study results are generated.</p>
            <div className="es-status" role="status">{editor.status}</div><button className="es-button es-primary es-save-draft" onClick={() => void saveCurrentDraft()} disabled={saveDraft.isPending || !editor.dirty}><Check />{saveDraft.isPending ? "Saving…" : "Save draft"}</button>
          </div><div className="es-document-footer"><span>{editor.content.trim() ? editor.content.trim().split(/\s+/).length : 0} words</span><span>{editor.dirty ? "Unsaved changes" : `Saved · revision ${editor.revision}`}</span></div>
        </aside>}
      </div>
    </main>
  </div>;
}

export default function Ask() { return <RequireAuth what="research conversation"><AskInner /></RequireAuth>; }
