import test from "node:test";
import assert from "node:assert/strict";
import { unsuitableVenue } from "./venue-quality";
import { hedgeRate, HEDGE_RATE_LIMIT, isJournalReview } from "./journal-review-policy";
import { readerFigureText } from "./scientific-figures";

test("hijacked and low-tier venues are rejected; normal engineering journals are kept", () => {
  assert.ok(unsuitableVenue({ title: "Machine Learning-Based Forecasting of Hybrid Wind–Solar Energy Generation", venue: "Adolescência e Saúde" }));
  assert.ok(unsuitableVenue({ title: "Integration of Solar PV and Wind Power", venue: "International Research Journal on Advanced Engineering Hub (IRJAEH)" }));
  assert.ok(unsuitableVenue({ title: "Spatio-Temporal Prediction of Solar Irradiance", venue: "International journal of research and scientific innovation" }));
  assert.ok(unsuitableVenue({ title: "A Systematic Literature Review on Intelligent Methods", venue: "Journal of Intelligent Decision Making and Information Science" }));
  assert.equal(unsuitableVenue({ title: "A review of short-term wind power forecasting", venue: "Energy Reports" }), undefined);
  assert.equal(unsuitableVenue({ title: "Climate Impacts on Wind and Solar", venue: "Meteorological Applications" }), undefined);
  assert.equal(unsuitableVenue({ title: "Air pollution and adolescent health outcomes", venue: "Adolescência e Saúde" }), undefined);
});

test("journal drafts without results are reviews", () => {
  assert.equal(isJournalReview("journal"), true);
  assert.equal(isJournalReview("journal", "  "), true);
  assert.equal(isJournalReview("journal", "RMSE 3.2 kW on site A"), false);
  assert.equal(isJournalReview("synopsis"), false);
});

test("repeated limitation phrases raise the hedge rate", () => {
  const hedgy = "The abstract does not establish this. It cannot be inferred. The protocol remains untested. ".repeat(10) + "word ".repeat(200);
  const confident = "Weather inputs cut forecast error by half in the benchmark. ".repeat(40);
  assert.ok(hedgeRate(hedgy) > HEDGE_RATE_LIMIT);
  assert.ok(hedgeRate(confident) <= HEDGE_RATE_LIMIT);
});

test("figure captions never refer to the user", () => {
  const out = readerFigureText("Conceptual representation of the user's proposed evaluation protocol.");
  assert.equal(out, "Conceptual representation of the proposed evaluation protocol.");
});
