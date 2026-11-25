import test from "node:test";
import assert from "node:assert/strict";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { drawCallouts } from "./labelled-illustration";
import { validateFigure } from "./scientific-figures";

test("illustration callouts are kept, trimmed and de-duplicated", () => {
  const f = validateFigure({ kind: "illustration", title: "Turbine", caption: "AI-generated conceptual illustration.", prompt: "Side cutaway of a three-blade horizontal-axis wind turbine",
    callouts: [" Hub ", "Hub", "Gearbox"] }, [], "fig-test");
  assert.deepEqual(f.callouts, ["Hub", "Gearbox"]);
});

test("labels are drawn in side margins without changing the picture's height", async () => {
  const c = createCanvas(600, 400), ctx = c.getContext("2d");
  ctx.fillStyle = "#bde"; ctx.fillRect(0, 0, 600, 400);
  const out = await drawCallouts(c.toBuffer("image/png"), [{ label: "Rotor blade", x: 0.2, y: 0.1 }, { label: "Hub", x: 0.25, y: 0.12 }, { label: "Generator", x: 0.8, y: 0.6 }]);
  const img = await loadImage(out.bytes);
  assert.equal(img.height, 400);
  assert.ok(img.width > 600 && img.width === out.width);
});
