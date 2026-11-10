import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useClerk, useUser } from "@clerk/react";
import { useGenerateStudioDocument, useSaveStudioItem, getListStudioItemsQueryKey, getGetStudioItemQueryKey, useCreateAnalysis, useListAnalyses, getListAnalysesQueryKey, useGetUsage, getGetUsageQueryKey, useSaveAnalysisDraft, type Analysis, useCreateDocumentReview, useListDocuments, getListDocumentsQueryKey, useListStudioItems, type Document } from "@workspace/api-client-react";
import { ArrowDownToLine, ArrowUp, BookOpen, Check, ChevronDown, Copy, FileText, FolderOpen, History, LogOut, Plus, ScanSearch, Wind, X } from "lucide-react";
import { exportAnalysis } from "@workspace/api-client-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
import { FIGURE_GUARD, ROUTE_FOR_KIND } from "@/lib/figures";
import "@/components/research-studio/studio.css";
import "./ask-workspace.css";
import { InternetSourcesNote } from "@/components/web-evidence";
import { DocumentReviewWorkspace } from "@/components/document-review/document-review-workspace";
import { REVIEW_KIND, parsePages } from "@/components/document-review/review-model";
import { ChatAttachments } from "@/components/chat-attachments";
import { HistoryDrawer } from "@/components/studio/workspace-shell";
import { isWorking } from "@/lib/studio";
import { FigureView, MissingFigure } from "@/components/studio/figure-view";
import type { StudioFigure } from "@/lib/figures";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const reviewable = (d: Pick<Document, "contentType" | "name">) => d.contentType === "application/pdf" || d.contentType === DOCX_TYPE || /\.(pdf|docx)$/i.test(d.name);

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
  const reviewId = params.get("review");
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
  const [exporting, setExporting] = useState<string | null>(null);
  const [attached, setAttached] = useState<Document | null>(null);
  const [pagesText, setPagesText] = useState("");
  const [pickOpen, setPickOpen] = useState(false);
  const createReview = useCreateDocumentReview();
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
  if (!question.trim()) problem = parent ? "Write a follow-up message." : "Write at least 5 characters to begin.";
  else if (!parent && question.trim().length < 5) problem = "Write at least 5 characters to begin.";
  else if (question.length > 2000) problem = "Keep your message under 2,000 characters.";
  else if (ownActive) problem = "Wait for the current answer to finish.";
  const evidenceTurns = currentThread.filter(t => t.status === "completed" && t.responseMode !== "guidance" && (t.sources.length > 0 || (t.discoveredPapers?.length ?? 0) > 0));
  const sourceAnalysis = evidenceTurns.find(t => t.id === sourceAnalysisId) ?? evidenceTurns.at(-1);
  const hasDirtyDraft = Object.values(draftBuffers).some(value => value.dirty);
  useUnsavedGuard("ask-draft", hasDirtyDraft, "You have unsaved draft changes in AI Chat.");
  const { project: activeProject } = useActiveProject();
  const intent = projectIntent(question);
  const generate = useGenerateStudioDocument();
  const saveContext = useSaveStudioItem();
  const docs = useListDocuments({ query: { queryKey: getListDocumentsQueryKey(), enabled: pickOpen || !!attached } });
  const readyDocs = (docs.data ?? []).filter(d => reviewable(d) && (d.status === "ready" || d.status === "completed"));
  const reviewsQ = useListStudioItems({ projectId: activeProject?.id ?? "" }, { query: { queryKey: getListStudioItemsQueryKey({ projectId: activeProject?.id ?? "" }), enabled: !!activeProject } });
  const reviews = (reviewsQ.data ?? []).filter(i => i.kind === REVIEW_KIND).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const isPdf = !!attached && (attached.contentType === "application/pdf" || /\.pdf$/i.test(attached.name));
  const pageParse = isPdf ? parsePages(pagesText) : {};
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
  const openThread = (id: string) => { if (!mayLeave()) return; setLocation(`/ask?t=${encodeURIComponent(id)}`); setHistoryOpen(false); setPanel(null); setActiveDraftId(null); setSourceAnalysisId(null); setSelectedSource(null); };
  const newChat = () => {
    if (!mayLeave() || ownActive) return;
    setQuestion("");
    setPanel(null);
    setHistoryOpen(false);
    setActiveDraftId(null);
    setSourceAnalysisId(null);
    setSelectedSource(null);
    setLocation("/ask");
    requestAnimationFrame(() => composer.current?.focus());
  };
  const submitReview = async () => {
    if (!attached || createReview.isPending) return;
    if (question.trim().length < 5) { toast({ title: "Add a request", description: "Say what to check, for example: check my diagrams and claims against related papers and patents." }); return; }
    if (!activeProject) { toast({ title: "Choose a project first", description: "Document reviews are saved to a project so you can reopen them. Pick or create one in the sidebar.", variant: "destructive" }); return; }
    if (pageParse.error) { toast({ title: "Check the page list", description: pageParse.error, variant: "destructive" }); return; }
    if (!mayLeave()) return;
    try {
      const item = await createReview.mutateAsync({ data: { projectId: activeProject.id, documentId: attached.id, prompt: question.trim().slice(0, 5000), includePatents: true, ...(pageParse.pages?.length ? { pageNumbers: pageParse.pages } : {}) } });
      qc.setQueryData(getGetStudioItemQueryKey(item.id), item);
      void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
      setQuestion(""); setAttached(null); setPagesText(""); setPanel(null);
      setLocation(`/ask?review=${encodeURIComponent(item.id)}`);
    } catch (error) {
      toast({ title: "Couldn't start the review", description: friendlyError(error), variant: "destructive" });
      void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
    }
  };
  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (attached) { await submitReview(); return; }
    if (intent) {
      // Explicit "my idea / my references" request: generate from the active project, never silently fall back to public research.
      // Quota is decided by the backend for the inferred kind (reviews vs answers); only warn locally from the matching allowance.
      if (problem || generate.isPending || saveContext.isPending) return;
      if (!activeProject) {
        toast({ title: "Choose a project first", description: intent.figure ? "Figures are built from a project's own data and sources. Pick or create a project in the sidebar, then send again." : "You asked to use your own material. Pick or create a project in the sidebar, then send again.", variant: "destructive" });
        return;
      }
      if (sendLimit) { toast({ title: "Limit reached", description: sendLimit, variant: "destructive" }); return; }
      if (!mayLeave()) return;
      try {
        // Carry the selected conversation into the new document, not a random recent project item.
        const savedContext = parent ? await saveContext.mutateAsync({ data: { projectId: activeProject.id, kind: "answer", title: parent.question.slice(0, 300), content: parent.content, analysisId: parent.id } }) : null;
        const item = await generate.mutateAsync({ data: { projectId: activeProject.id, kind: intent.kind, parentId: savedContext?.id, prompt: (intent.figure ? question.trim().slice(0, 4700) + FIGURE_GUARD : question.trim().slice(0, 5000)), evidenceMode: "project", includePatents: true } });
        qc.setQueryData(getGetStudioItemQueryKey(item.id), item);
        void qc.invalidateQueries({ queryKey: getListStudioItemsQueryKey() });
        void qc.invalidateQueries({ queryKey: getGetUsageQueryKey() });
        setQuestion(current => current === question ? "" : current);
        const route = ROUTE_FOR_KIND[item.kind] ?? intent.route;
        setLocation(`${route}${route.includes("?") ? "&" : "?"}item=${encodeURIComponent(item.id)}`);
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
  const copyAnswer = async (analysis: Analysis) => {
    try {
      const references = answerReferences(analysis);
      await navigator.clipboard.writeText(analysis.content + (references ? `\n\n## References\n\n${references}` : ""));
      setCopied("Answer and references copied.");
    } catch { setCopied("Copy unavailable. Select the answer text to copy."); }
  };
  const downloadAnswer = async (analysis: Analysis, format: "pdf" | "docx") => {
    setExporting(analysis.id);
    try {
      const blob = await exportAnalysis(analysis.id, { format, style: "ieee" }, { responseType: "blob" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `evidora-answer.${format}`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (error) {
      toast({ title: "Export failed", description: friendlyError(error), variant: "destructive" });
    } finally { setExporting(null); }
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
    <main className="es-main">
      <header className="es-topbar es-topbar-compact"><div className="es-top-title">
        <button className="es-button es-primary es-new-chat" onClick={reviewId ? () => { if (mayLeave()) setLocation("/ask"); } : newChat} disabled={!reviewId && !!ownActive} data-testid="button-new-chat"><Plus /><span>New chat</span></button>
        <h1 title={reviewId ? "Document review" : title}>{reviewId ? "Document review" : title}</h1></div>
        <div className="es-top-actions">{!reviewId && sourceAnalysis && panel !== "sources" && <button className="es-button" onClick={() => setPanel("sources")}><BookOpen />Sources</button>}{!reviewId && activeDraftId && panel !== "draft" && <button className="es-button" onClick={() => setPanel("draft")}><FileText />Draft</button>}<button className="es-button" onClick={() => setHistoryOpen(true)} aria-haspopup="dialog" data-testid="button-open-history"><History /><span className="es-hide-sm">History and reviews</span><span className="es-show-sm">History</span></button>{activeProject && <Link href="/my-library" onClick={guardNavigation} className="es-button es-hide-sm" data-testid="link-project-library"><FolderOpen /><span className="es-project-name">{activeProject.name}</span></Link>}</div>
      </header>
      {allUsageLimitMessages(usageData).length > 0 && <div className="es-limit-notice" role="status">{allUsageLimitMessages(usageData).map(message => <p key={message}>{message} <Link href="/plans" onClick={guardNavigation}>Plans &amp; usage</Link></p>)}</div>}
      {reviewId ? <div className="es-workspace dr-mode"><DocumentReviewWorkspace key={reviewId} reviewId={reviewId} chatMode onClose={() => setLocation("/ask")} /></div> :
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
              {analysis.status === "completed" && analysis.responseMode !== "guidance" && <InternetSourcesNote sources={analysis.sources} warnings={analysis.warnings ?? []} />}
              {analysis.status === "completed" && <div className="es-chat-actions">
                {analysis.responseMode !== "guidance" && analysis.sources.length > 0 && <button className="es-button es-primary" onClick={() => startDraft(analysis)}><FileText />{analysis.draftContent != null || draftBuffers[analysis.id] ? "Continue draft" : "Start a draft"}</button>}
                {analysis.responseMode !== "guidance" && analysis.content && <SaveAnalysisToProject analysis={analysis} />}
                {analysis.content && <>
                  <button className="es-button" onClick={() => void copyAnswer(analysis)}><Copy />Copy answer</button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><button className="es-button" disabled={exporting !== null} aria-label="Export answer" data-testid={`button-export-${analysis.id}`}><ArrowDownToLine />{exporting === analysis.id ? "Preparing…" : "Export"}<ChevronDown /></button></DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-44 border-[#dce1d5] bg-[#fcfbf7] text-[#263d3b]">
                      <DropdownMenuItem onSelect={() => void downloadAnswer(analysis, "pdf")}><ArrowDownToLine className="mr-2 h-4 w-4" />PDF (.pdf)</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void downloadAnswer(analysis, "docx")}><FileText className="mr-2 h-4 w-4" />Word (.docx)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>}
              </div>}
            </div>)}
          </div></div>
          {copied && <p className="es-copy-status" role="status">{copied}</p>}
          <div className="es-composer-wrap">{!attached && intent && <p className="es-small" role="status" style={{ marginBottom: 8 }} data-testid="notice-project-aware">{activeProject
            ? intent.figure
              ? <>Sending will build this figure from project <b>{activeProject.name}</b> and open the result. To add it to an existing draft, name that draft (or say &ldquo;my latest draft&rdquo;); Evidora writes a new revision and asks you to choose if more than one draft matches. Otherwise it opens as a new {intent.kind === "answer" ? "project answer" : `${intent.kind} draft`}. Include table data with a header row, or an equation; Evidora will ask for missing data rather than invent values. You can also open a draft and use <i>Add or revise a figure</i>.</>
              : <>Sending will {intent.kind === "answer" ? "answer" : `draft a ${intent.kind === "ideas" ? "set of five ideas" : intent.kind}`} from your project <b>{activeProject.name}</b> only, and open it.</>
            : intent.figure ? <>Figures are generated from a project&rsquo;s own data, but no project is selected. <Link href="/my-library" onClick={guardNavigation} style={{ color: "var(--teal)", textDecoration: "underline" }} data-testid="link-ask-choose-project-figure">Choose a project</Link> first.</>
            : <>You asked to use your own material, but no project is selected. <Link href="/my-library" onClick={guardNavigation} style={{ color: "var(--teal)", textDecoration: "underline" }} data-testid="link-ask-choose-project">Choose a project</Link> first.</>}</p>}
          {pickOpen && !attached && <div className="dr-attach"><label className="dr-attach-row">Choose a ready PDF or Word file
            <select aria-label="Choose an uploaded document" defaultValue="" onChange={e => { const d = readyDocs.find(x => x.id === e.target.value); if (d) { setAttached(d); setPickOpen(false); } }} data-testid="select-review-document">
              <option value="" disabled>{docs.isLoading ? "Loading..." : readyDocs.length ? "Select a file" : "No ready PDF or Word files"}</option>
              {readyDocs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></label>{docs.isError && <span className="es-small">Couldn't load your files. <button type="button" className="es-button dr-small" onClick={() => void docs.refetch()}>Retry</button></span>}</div>}
          {attached && <div className="dr-attach" data-testid="panel-review-attachment">
            <div className="dr-attach-row"><span className="dr-attach-chip"><ScanSearch />{attached.name}<button type="button" className="es-icon" style={{ minWidth: 28, height: 28 }} aria-label="Detach file" onClick={() => { setAttached(null); setPagesText(""); }} data-testid="button-detach-document"><X /></button></span></div>
            <p>Review mode: sending checks this file's text and visuals against related papers and, where available, patents. You get colour-coded suggestions to approve or dismiss one by one. Nothing changes until you approve, and your original file is never modified. Privacy: your request and the file’s text and images are sent to our AI processing service; only short topic queries go to scholarly and patent search providers. Word charts and SmartArt may not be read; export to PDF first if they matter.{!activeProject && <> <b>Choose a project in My Library first.</b></>}</p>
            {isPdf && <label className="dr-attach-row">PDF pages to review (optional, up to 12)
              <input value={pagesText} onChange={e => setPagesText(e.target.value)} placeholder="e.g. 1-4, 9" aria-describedby="dr-pages-help" data-testid="input-review-pages" /></label>}
            {isPdf && <span id="dr-pages-help" className="es-small" role="status">{pageParse.error ?? (pageParse.pages?.length ? `Pages ${pageParse.pages.join(", ")}` : "Leave blank to select up to 12 visual pages, prioritising figure mentions; exact coverage is shown with the results.")}</span>}
          </div>}
          <form className="es-composer" onSubmit={submit}>
            <textarea ref={composer} aria-label="Message Evidora" placeholder={attached ? "What should Evidora check? e.g. Check my diagrams and claims against related papers and patents." : "A question, an idea, a half-formed thought…"} value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={onComposerKey} rows={2} maxLength={2000} data-testid="input-ask-question" />
            <div className="es-composer-bottom">
              <ChatAttachments disabled={!!attached || !!ownActive || createReview.isPending} onStartUpload={() => setPickOpen(false)}
                onChooseExisting={() => setPickOpen(value => !value)}
                onReady={doc => { if (reviewable(doc)) { setAttached(doc); setPickOpen(false); } else toast({ title: "Not reviewable", description: "Document review works with PDF or Word (.docx) files." }); }} />
              <span role="status">{attached ? (question.trim().length < 5 ? "Describe what to review (at least 5 characters)." : !activeProject ? "Choose a project to save this review." : pageParse.error ?? "Sends a document review, not a chat answer.") : sendLimit ?? problem ?? `Start anywhere. ${left === null ? "" : left === Infinity ? "Unlimited answers." : `${left} answers left.`}`}</span><button className={`es-icon ${sendLimit ? "es-limit-send" : ""}`} type="submit" disabled={attached ? (createReview.isPending || question.trim().length < 5 || !activeProject || !!pageParse.error) : askSendDisabled({ limitReached: !!sendLimit, blocked: !!problem, pending: create.isPending || generate.isPending, loading: list.isLoading || usage.isLoading })} aria-label={attached ? "Start document review" : sendLimit ? "Limit reached" : "Send message"} data-testid="button-ask-send">{!attached && sendLimit ? "Limit reached" : <ArrowUp />}</button></div>
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
              : <div className="es-document-preview"><AcademicAnswer content={editor.content} inline={draftInline} renderFigure={id=>{
                const figures=(draftAnalysis?.figures??[]) as StudioFigure[];
                const index=figures.findIndex(f=>f.id===id);
                return index<0?<MissingFigure id={id}/>:<FigureView itemId={activeDraftId} figure={figures[index]} number={index+1} analysis/>;
              }}/></div>}
            <p className="es-provenance">{draftAnalysis?.draftProvenance ?? "AI-assisted source answer retained above."} Local edits are user-authored and not evidence-checked. No study results are generated.</p>
            <div className="es-status" role="status">{editor.status}</div><button className="es-button es-primary es-save-draft" onClick={() => void saveCurrentDraft()} disabled={saveDraft.isPending || !editor.dirty}><Check />{saveDraft.isPending ? "Saving…" : "Save draft"}</button>
          </div><div className="es-document-footer"><span>{editor.content.trim() ? editor.content.trim().split(/\s+/).length : 0} words</span><span>{editor.dirty ? "Unsaved changes" : `Saved · revision ${editor.revision}`}</span></div>
        </aside>}
      </div>}
      <HistoryDrawer open={historyOpen} onOpenChange={setHistoryOpen} title="History and reviews" description="Saved research conversations and document reviews. Opening one restores every saved turn.">
        <div className="es-recent es-drawer-list" aria-label="Saved conversations"><span className="es-eyebrow">Your conversations</span>
          {threads.map(item => <button key={item.id} aria-current={thread?.id === item.id ? "page" : undefined} onClick={() => openThread(item.id)} data-testid={`button-open-thread-${item.id}`}>{item.turns[0]?.question}<small>{item.turns.length} {item.turns.length === 1 ? "turn" : "turns"}</small></button>)}
          {!threads.length && <p className="es-small">{list.isLoading ? "Loading conversations…" : "Your saved conversations will appear here."}</p>}
        </div>
        {activeProject ? <div className="es-recent es-drawer-list dr-review-hist" aria-label="Document reviews"><span className="es-eyebrow">Document reviews in {activeProject.name}</span>
          {reviews.slice(0, 12).map(item => <button key={item.id} aria-current={reviewId === item.id ? "page" : undefined} onClick={() => { if (!mayLeave()) return; setHistoryOpen(false); setPanel(null); setLocation(`/ask?review=${encodeURIComponent(item.id)}`); }} data-testid={`button-open-review-${item.id}`}>{item.title}<small>{isWorking(item.status) ? "Reviewing" : item.status === "failed" ? "Failed" : "Ready"}</small></button>)}
          {!reviews.length && <p className="es-small">{reviewsQ.isLoading ? "Loading reviews..." : "Attach a PDF or Word file with the paperclip to start one."}</p>}
        </div> : <p className="es-small">Choose a project in My Library to see its document reviews.</p>}
        <div className="es-sidebar-bottom es-drawer-account"><span className="es-avatar">{initials}</span><span className="es-account-name">{name}<small className="es-small">{usageData?.plan ?? "Research workspace"}</small></span><button className="es-icon es-signout" aria-label="Sign out" title="Sign out" onClick={() => { if (mayLeave()) void signOut(); }}><LogOut /></button></div>
      </HistoryDrawer>
    </main>
  </div>;
}

export default function Ask() { return <RequireAuth what="research conversation"><AskInner /></RequireAuth>; }
