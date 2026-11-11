export type ChatContext = { question: string; answer: string };
type Kind = "journal" | "thesis" | "literature" | "synopsis";
const routes: Record<Kind, string> = { journal: "/journals", thesis: "/thesis", literature: "/literature", synopsis: "/synopsis" };

function requestedKind(text: string): Kind | null {
  // Common writing-verb typos must not silently send a manuscript request
  // through ordinary question answering. Only normalise for intent detection.
  text=text.replace(/\b(?:genreate|genrate|gerenate|gernate|generte|geneate)\b/gi,"generate")
    .replace(/\b(?:jorunal|journel|joirnal)\b/gi,"journal");
  if (/\b(?:how (?:to|do|can|should)|what (?:is|are)|outline|suggest (?:a |some )?topics?|find papers|search for papers)\b/i.test(text)) return null;
  if (/\b(?:do not|don't|not yet)\s+(?:write|generate|create|draft|prepare)\b/i.test(text)) return null;
  if (!/\b(?:write|generate|create|prepare|draft|provide|make|give|want|need)\b/i.test(text)) return null;
  if (/\b(?:journals?\s+(?:paper|article)s?|research (?:paper|article)s?|manuscript|paper for (?:journal|publication|submission))\b/i.test(text)) return "journal";
  if (/\b(?:write|generate|create|prepare|draft|make)\b/i.test(text)&&/\bjournals?\b/i.test(text)) return "journal";
  if (/\b(?:thesis|dissertation)\b/i.test(text)) return "thesis";
  if (/\b(?:literature (?:review|survey)|lit review|review of (?:the )?literature)\b/i.test(text)) return "literature";
  if (/\bsynopsis\b/i.test(text)) return "synopsis";
  return null;
}

/** An explicit writing assignment must not become a conversational outline. */
export function chatDocumentIntent(text: string, history: ChatContext[] = []) {
  let assignment = text.trim();
  let kind = requestedKind(assignment);
  if (!kind && /^(?:yes|yes please|go ahead|please do|proceed|do it|continue|okay|ok)[.!]?$/i.test(assignment)) {
    // Resolve only the immediately preceding writing request, not an unrelated
    // old assignment elsewhere in the chat.
    const previous = history.at(-1)?.question;
    if (previous && (kind = requestedKind(previous))) assignment = `${previous}\nUser confirmation: ${text.trim()}`;
  }
  if (!kind) return null;
  const own = /\b(?:my|our)\s+(?:own\s+)?(?:ideas?|references?|papers|project|notes|documents|uploads|sources|draft)\b|\b(?:same|existing|uploaded|project)\s+(?:papers|sources|documents|evidence)\b|\b(?:no new|without web|without internet|do not|don't)\s+search\b/i.test(assignment);
  return { kind, route: routes[kind], document: true as const, evidenceMode: own ? "project" as const : "combined" as const };
}

export function chatDocumentPrompt(text: string, history: ChatContext[]) {
  const context = history.slice(-5).map(t => ({
    question: t.question.slice(0, 350),
    answer: t.answer.slice(0, 450),
  }));
  return `Current assignment: ${text.trim()}
Create the actual developed document, not an outline, a list of instructions, or advice on how to write it. Resolve its subject from the conversation below. Preserve requested length and formatting. Include relevant source-grounded conceptual scientific diagrams with captions where appropriate; numerical charts require real supplied or cited data. If no original experiments are supplied, write a clearly labelled literature-based review or proposed-study manuscript, not fabricated empirical results.
Conversation context (not independently verified evidence):
${JSON.stringify(context)}`.slice(0, 5000);
}
