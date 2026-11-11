import { test } from "node:test";
import assert from "node:assert/strict";
import { SaveStudioItemBody } from "@workspace/api-zod";
import { selectedIdeaContext } from "./selected-idea";
import { studioConversation } from "./studio-conversation";

const source = { id: "set", owner_id: "owner", project_id: "project", kind: "ideas", status: "completed",
  title: "Solar research ideas", content: "Five proposed investigations.",
  metadata: { ideas: [{ title: "Battery coordination" }], request: { parentId: "bridge", prompt: "Suggest five solar ideas" },
    sources: [{ id: "source", title: "Real source identity", url: "https://example.org/paper" }] } };
const input = { projectId: "project", kind: "idea", title: "Battery coordination" };

test("Idea confirmation preserves set ancestry and evidence without creating a revision", () => {
  const metadata = selectedIdeaContext(source, input);
  assert.equal(metadata.ideaSetId, "set");
  assert.equal(metadata.request.parentId, "set");
  assert.deepEqual(metadata.sources, source.metadata.sources);
  assert.equal("parentId" in metadata, false);
  const bridge = { id: "bridge", owner_id: "owner", project_id: "project", kind: "answer", status: "completed",
    title: "Earlier chat", content: "Focus on solar power.", metadata: { analysisQuestion: "I study power generation",
      analysisHistory: [{ question: "Can you help with research?", answer: "Yes, what interests you?" }] } };
  const selected = { ...source, id: "selected", kind: "idea", title: input.title, content: "Selected battery proposal.", metadata };
  const reply = { ...source, id: "reply", kind: "answer", content: "Compare these approaches.",
    metadata: { request: { parentId: "selected", prompt: "Compare it to the others" } } };
  const result = studioConversation([bridge, source, selected, reply], "reply", "owner", "project");
  assert.deepEqual(result.turns.map(turn => turn.id), ["bridge:chat-0", "bridge", "set", "selected", "reply"]);
  assert.equal(result.turns[0].question, "Can you help with research?");
  assert.equal(result.turns[2].question, "Suggest five solar ideas");
});

test("Confirmation rejects unrelated, incomplete or cross-project sources and revision mixing", () => {
  for (const badSource of [{ ...source, project_id: "other" }, { ...source, kind: "answer" }, { ...source, status: "running" }])
    assert.throws(() => selectedIdeaContext(badSource, input), /completed idea set/);
  assert.throws(() => selectedIdeaContext(source, { ...input, title: "Unrelated invention" }), /from this saved set/);
  assert.throws(() => selectedIdeaContext(source, { ...input, kind: "answer" }), /Confirm an idea separately/);
  assert.throws(() => selectedIdeaContext(source, { ...input, parentId: "revision" }), /Confirm an idea separately/);
  assert.throws(() => selectedIdeaContext(source, { ...input, analysisId: "answer" }), /Confirm an idea separately/);
});

test("Save contract retains the persisted source-set link for selected ideas", () => {
  const value = SaveStudioItemBody.parse({ ...input, ideaSetId: "set", content: "Selected proposal" });
  assert.equal(value.ideaSetId, "set");
});
