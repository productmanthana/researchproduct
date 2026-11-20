import test from "node:test";
import assert from "node:assert/strict";
import { implausibleDoiYear } from "./manuscript-references";
import { readerFigureText } from "./scientific-figures";
import { LITERATURE_SURVEY_INSTRUCTIONS, SURVEY_PAPERS } from "./literature-survey-policy";

test("a DOI encoding a year past the publication date is flagged", () => {
  assert.equal(implausibleDoiYear("10.1142/s0219455428500988", 2026), true);
  assert.equal(implausibleDoiYear("10.1142/S0219455426500988", 2026), false);
  assert.equal(implausibleDoiYear("10.1016/j.epsr.2026.114413", 2026), false);
});

test("figure captions drop defensive 'this schematic is not…' disclaimers", () => {
  const caption = readerFigureText("Blade regions relevant to inspection. Based on Meng et al. [1]; this schematic is not a measured geometry, a stress map or evidence of a completed inspection. This is the author's organising interpretation, not a validated framework.");
  assert.equal(caption, "Blade regions relevant to inspection. Based on Meng et al. [1].");
});

test("survey instructions demand one focus, deep coverage and a reported search", () => {
  assert.ok(SURVEY_PAPERS >= 60);
  assert.match(LITERATURE_SURVEY_INSTRUCTIONS, /ONE narrow topic/);
  assert.match(LITERATURE_SURVEY_INSTRUCTIONS, /at least 50 distinct/);
  assert.match(LITERATURE_SURVEY_INSTRUCTIONS, /inclusion and exclusion criteria/);
});
