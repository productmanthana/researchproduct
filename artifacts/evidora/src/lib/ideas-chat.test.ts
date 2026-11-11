import { test } from "node:test";
import assert from "node:assert/strict";
import { conversationContext, ownOnly, ideasIntent, ideaSelection, ideaSetIdOf, confirmedFor, analysisTurnsOf, legacyIdeasUrl } from "./ideas-chat";
import { buildConversations, conversationFor, type ConvItem } from "./conversation";
import { ROUTE_FOR_KIND } from "./figures";

test("explicit idea generation is detected with topic", () => {
  const a = ideasIntent("suggest five research ideas on solar");
  assert.ok(a); assert.equal(a!.topic, "solar"); assert.equal(a!.own, false); assert.equal(a!.needsTopic, false);
  assert.equal(ideasIntent("ideas for groundwater arsenic in Bihar")?.topic, "groundwater arsenic in Bihar");
  assert.ok(ideasIntent("Generate ideas"));
  assert.equal(ideasIntent("generate ideas")?.needsTopic, true);
  assert.equal(ideasIntent("suggest some ideas from my project")?.own, true);
  assert.equal(ideasIntent("suggest some ideas from my project")?.needsTopic, false);
});

test("non-generation questions stay ordinary chat", () => {
  assert.equal(ideasIntent("What is a perovskite solar cell?"), null);
  assert.equal(ideasIntent("compare idea 2 and idea 4"), null);
  assert.equal(ideasIntent("which of these ideas is most feasible?"), null);
  assert.equal(ideasIntent("write a journal paper on solar"), null);
});

test("terse idea requests resolve topic from earlier turns", () => {
  const h = [{ question: "How does dust affect solar panel output in Rajasthan?", answer: "..." }];
  const r = ideasIntent("give me some ideas", h);
  assert.equal(r?.topic, h[0].question);
  assert.match(r!.prompt, /Rajasthan/);
  assert.equal(ideasIntent("more ideas", h)?.needsTopic, false);
});

test("selection followups map to an idea index", () => {
  assert.equal(ideaSelection("select idea 2"), 1);
  assert.equal(ideaSelection("I will go with the third one"), 2);
  assert.equal(ideaSelection("open the last"), 4);
  assert.equal(ideaSelection("tell me about idea 2"), null);
  assert.equal(ideaSelection("pick 7"), null);
});

test("legacy /ideas URLs map to /ask without loops", () => {
  assert.equal(legacyIdeasUrl("?item=abc"), "/ask?item=abc");
  assert.equal(legacyIdeasUrl("mode=answer&q=hello"), "/ask?q=hello&mode=answer");
  assert.equal(legacyIdeasUrl(""), "/ask");
  assert.equal(legacyIdeasUrl("?item=x&mode=answer"), "/ask?item=x");
  assert.ok(!legacyIdeasUrl("?item=x").includes("/ideas"));
  for (const k of ["ideas", "idea", "answer"]) assert.equal(ROUTE_FOR_KIND[k], "/ask");
});

const mk = (id: string, o: Partial<ConvItem>): ConvItem => ({ id, projectId: "p", kind: "answer", title: id, status: "completed", createdAt: "2026-01-01T00:00:00Z", revision: 1, parentId: null, metadata: {}, ...o });

test("bridge answer, idea set, selected idea and reply form one conversation", () => {
  const bridge = mk("b", { metadata: { analysisId: "an1", analysisQuestion: "Q2", analysisHistory: [{ question: "Q1", answer: "A1" }, { question: "Q2", answer: "A2" }] } });
  const set = mk("s", { kind: "ideas", createdAt: "2026-01-01T00:01:00Z", metadata: { request: { parentId: "b", prompt: "ideas on solar" } } });
  const idea = mk("i", { kind: "idea", title: "Dust", createdAt: "2026-01-01T00:02:00Z", metadata: { ideaSetId: "s", request: { parentId: "s", prompt: "Selected research idea: Dust" } } });
  const reply = mk("r", { createdAt: "2026-01-01T00:03:00Z", metadata: { request: { parentId: "i", prompt: "refine it" } } });
  const convs = buildConversations([reply, idea, set, bridge], "p");
  assert.equal(convs.length, 1);
  assert.deepEqual(conversationFor(convs, "i")!.turns.map(t => t.id), ["b", "s", "i", "r"]);
  assert.equal(ideaSetIdOf(idea), "s");
  assert.deepEqual(analysisTurnsOf(bridge).map(x => x.question), ["Q1", "Q2"]);
});

test("confirmed ideas are scoped to their source set; legacy unlinked ones remain visible", () => {
  const set = mk("s", { kind: "ideas" });
  const mine = mk("i1", { kind: "idea", title: "Same", metadata: { ideaSetId: "s" } });
  const other = mk("i2", { kind: "idea", title: "Same", metadata: { ideaSetId: "other" } });
  const legacy = mk("i3", { kind: "idea", title: "Old" });
  assert.deepEqual(confirmedFor(set, [mine, other, legacy]).map(x => x.id), ["i1"]);
  const viaRequest = mk("i4", { kind: "idea", title: "Same", metadata: { request: { parentId: "s" } } });
  assert.deepEqual(confirmedFor(set, [viaRequest]).map(x => x.id), ["i4"]);
});

test("evidence restrictions and own-idea wording keep generation in the project", () => {
  assert.equal(ownOnly("suggest ideas based on my idea"), true);
  assert.equal(ideasIntent("suggest five ideas on solar, do not search the internet")?.own, true);
  assert.equal(ideasIntent("generate ideas on solar using only my references")?.own, true);
  assert.equal(ideasIntent("suggest five ideas on solar")?.own, false);
});

test("conversation context keeps chronological order with real content and the selected idea last", () => {
  const set = mk("s", { kind: "ideas", title: "Solar ideas", metadata: { request: { prompt: "ideas on solar" }, ideas: [{ title: "Dust" }, { title: "Storage" }] } });
  const idea = { ...mk("i", { kind: "idea", title: "Dust" }), content: "# Dust\nProblem..." };
  const ctx = conversationContext([{ prompt: "ideas on solar", latest: set }, { prompt: "select idea 1", latest: idea }], p => /^select/.test(p));
  assert.equal(ctx.length, 1);
  const ctx2 = conversationContext([{ prompt: "ideas on solar", latest: set }, { prompt: null, latest: idea }]);
  assert.equal(ctx2.at(-1)!.question, "Selected research idea: Dust");
  assert.match(ctx2[0].answer, /2\. Storage/);
  assert.equal(ideasIntent("more ideas", ctx2)?.topic, "Dust");
});
