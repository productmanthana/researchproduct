import test from "node:test";
import assert from "node:assert/strict";
import { stripProcessNotes } from "./process-notes";
import { submissionReady } from "./manuscript-policy";
import { cleanReferenceTitle } from "./manuscript-references";
import { diagramIcon, illustratedDiagramSvg } from "./illustrated-diagram";
import { readerFigureText } from "./scientific-figures";

test("sentences about how sources were accessed or where the draft came from are removed", () => {
  const md = [
    "## 2. Review Approach",
    "Selected abstracts and publication extracts provide the source material. The article describes no systematic database search. Nor does it document a screening flow. Studies were grouped by the inference they support.",
    "The task includes the timing specifications named in the project synopsis: issue time and lead time. EnergyBench freezes inputs at the deadline [15].",
    "Earlier project documents provide no independent research evidence. The citation numbers used here do not come from those documents either.",
    "| Study | Result |\n|---|---|\n| Publication extracts [1] | x |",
    "[1] A. Author (2026). Search excerpts as a genre. Venue.",
  ].join("\n\n");
  const clean = stripProcessNotes(md);
  assert.doesNotMatch(clean, /publication extracts provide|no systematic database search|screening flow|project synopsis|citation numbers/i);
  assert.match(clean, /Studies were grouped by the inference they support\./);
  assert.match(clean, /EnergyBench freezes inputs at the deadline \[15\]\./);
  assert.match(clean, /\| Publication extracts \[1\] \| x \|/);
  assert.match(clean, /\[1\] A\. Author \(2026\)\. Search excerpts as a genre/);
  assert.match(submissionReady("Restricted text access limits methodological appraisal. Wind output varies [2]."), /^Wind output varies \[2\]\.$/);
});

test("reference titles lose LaTeX, double periods and all-capitals", () => {
  assert.equal(cleanReferenceTitle("R$^2$Energy: A Large-Scale Benchmark"), "R²Energy: A Large-Scale Benchmark");
  assert.equal(cleanReferenceTitle("Short-Term Wind Power Forecasting Framework."), "Short-Term Wind Power Forecasting Framework");
  assert.equal(cleanReferenceTitle("ENHANCING SHORT-TERM SOLAR GENERATION FORECASTING ACCURACY USING A CNN-TRANSFORMER MODEL"),
    "Enhancing short-term solar generation forecasting accuracy using a CNN-transformer model");
});

test("diagram stages show the component they name and connections name their endpoints", () => {
  assert.equal(diagramIcon("Photovoltaic array", "experiment"), "solar");
  assert.equal(diagramIcon("Photovoltaic inverter", "experiment"), "compute");
  assert.equal(diagramIcon("Wind-generation subsystem"), "wind");
  assert.equal(diagramIcon("Battery energy storage subsystem", "experiment"), "battery");
  assert.equal(diagramIcon("Define the decision", "experiment"), undefined);
  const svg = illustratedDiagramSvg({ id: "f", title: "T", caption: "C", kind: "diagram", provenance: "", layout: "system",
    nodes: [{ id: "a", label: "Photovoltaic array" }, { id: "b", label: "Microgrid bus" }], edges: [{ from: "a", to: "b", label: "Direct-current power" }] } as any);
  assert.match(svg, /Photovoltaic array → Microgrid bus: Direct-current power/);
  assert.doesNotMatch(svg, /Stage 1 to 2|No measured results are implied/);
  assert.equal(readerFigureText("Battery paths are separate. This proposed explanatory schematic does not reproduce a published circuit."), "Battery paths are separate.");
});
