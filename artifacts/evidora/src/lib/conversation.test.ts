import { test } from "node:test";
import assert from "node:assert/strict";
import { buildConversations, conversationFor, answerConversations, followUpParent, questionCount, conversationBusy, type ConvItem } from "./conversation";
test("all project workspaces keep a document and its follow-ups in one thread",()=>{
  for(const kind of ["literature","synopsis","journal","thesis","patent","note"] as const){
    const seed:ConvItem={id:"document",projectId:"project",kind,title:"Saved work",status:"completed",createdAt:"2026-11-01T00:00:00Z",revision:1,parentId:null,metadata:{}};
    const first:ConvItem={...seed,id:"first",kind:"answer",createdAt:"2026-11-02T00:00:00Z",metadata:{request:{parentId:seed.id,prompt:"My first follow-up"}}};
    const second:ConvItem={...first,id:"second",createdAt:"2026-11-03T00:00:00Z",metadata:{request:{parentId:first.id,prompt:"What did I ask earlier?"}}};
    const convs=buildConversations([seed,first,second],"project");
    assert.equal(convs.length,1);
    assert.equal(conversationFor(convs,seed.id)?.turns.length,3);
    assert.equal(followUpParent(convs[0]),second.id);
    assert.equal(buildConversations([seed,first,second],"other-project").length,0);
  }
});

let t = 0;
const mk = (id: string, o: Partial<ConvItem> & { ask?: string; on?: string } = {}): ConvItem => ({
  id, projectId: o.projectId ?? "p1", kind: o.kind ?? "answer", title: o.title ?? `T ${id}`, status: o.status ?? "completed",
  createdAt: o.createdAt ?? new Date(Date.UTC(2024, 0, 1, 0, t++)).toISOString(), revision: o.revision ?? 1, parentId: o.parentId ?? null,
  metadata: o.metadata ?? (o.ask ? { request: { prompt: o.ask, ...(o.on ? { parentId: o.on } : {}) } } : {}),
});

test("follow-ups chain into one conversation with original prompts in order", () => {
  const a = mk("a", { ask: "Q1" }), b = mk("b", { ask: "Q2", on: "a" }), c = mk("c", { ask: "Q3", on: "b" });
  const convs = buildConversations([c, a, b], "p1");
  assert.equal(convs.length, 1);
  assert.deepEqual(convs[0].turns.map(x => x.prompt), ["Q1", "Q2", "Q3"]);
  assert.equal(questionCount(convs[0]), 3);
  assert.equal(followUpParent(convs[0]), "c");
});

test("edits collapse into one turn showing latest body; prompt kept; follow-up parent maps through", () => {
  const a = mk("a", { ask: "Q1" });
  const a2 = mk("a2", { parentId: "a", revision: 2, metadata: { request: { prompt: "Q1" } } });
  const b = mk("b", { ask: "Q2", on: "a2" });
  const conv = buildConversations([a, a2, b], "p1")[0];
  assert.equal(conv.turns.length, 2);
  assert.equal(conv.turns[0].latest.id, "a2");
  assert.equal(conv.turns[0].prompt, "Q1");
  assert.equal(conversationFor([conv], "a")?.rootId, "a");
});

test("figure revisions are one turn, not a new message", () => {
  const a = mk("a", { ask: "Q1" });
  const f = mk("f", { revision: 2, metadata: { request: { prompt: "Add or revise a figure", parentId: "a" }, figureRevisionOf: "a" } });
  const conv = buildConversations([a, f], "p1")[0];
  assert.equal(conv.turns.length, 1);
  assert.equal(conv.turns[0].latest.id, "f");
});

test("unrelated roots and other projects never merge; same title does not link", () => {
  const a = mk("a", { ask: "Q", title: "Same" }), b = mk("b", { ask: "Q", title: "Same" });
  const x = mk("x", { ask: "Q", on: "a", projectId: "p2" });
  const convs = buildConversations([a, b, x], "p1");
  assert.equal(convs.length, 2);
  assert.equal(conversationFor(convs, "x"), undefined);
});

test("idea set seeds a conversation; answers list one entry", () => {
  const s = mk("s", { kind: "ideas", ask: "curious" }), q = mk("q", { ask: "compare 1 and 2", on: "s" });
  const convs = buildConversations([s, q], "p1");
  assert.equal(convs.length, 1);
  assert.ok(convs[0].turns[0].seed);
  assert.equal(questionCount(convs[0]), 1);
  assert.equal(answerConversations(convs).length, 1);
});

test("cycles and missing links are safe", () => {
  const a = mk("a", { ask: "1", on: "b" }), b = mk("b", { ask: "2", on: "a" }), c = mk("c", { ask: "3", on: "gone" });
  const d = mk("d", { parentId: "e" }), e = mk("e", { parentId: "d" });
  const convs = buildConversations([a, b, c, d, e], "p1");
  assert.equal(convs.flatMap(x => x.turns).length, 4);
});

test("failed or running last turn is not a follow-up parent", () => {
  const a = mk("a", { ask: "1" }), b = mk("b", { ask: "2", on: "a", status: "failed" });
  const conv = buildConversations([a, b], "p1")[0];
  assert.equal(followUpParent(conv), "a");
  const r = buildConversations([a, mk("r", { ask: "3", on: "a", status: "running" })], "p1")[0];
  assert.ok(conversationBusy(r));
});
