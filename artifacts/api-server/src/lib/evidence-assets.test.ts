import test from "node:test";
import assert from "node:assert/strict";
import { cleanPages } from "./evidence-assets";

test("extracted PDF text drops characters Postgres JSON cannot store", () => {
  const [page] = cleanPages([{ page: 1, text: "Wind\u0000 power\u0007 and \uD800 storage \uD83D\uDE00 ok\n" }]);
  assert.equal(page.text, "Wind  power  and   storage \uD83D\uDE00 ok\n");
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(page)));
  assert.ok(!JSON.stringify(page).includes("\\u0000"));
});
