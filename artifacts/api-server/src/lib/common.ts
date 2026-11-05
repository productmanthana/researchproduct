import type { Request, RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import { z } from "zod";
import { spending } from "./ai-budget";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const uid = (req: Request) => {
  const id = getAuth(req).userId;
  if (!id) throw new HttpError(401, "Sign in to use your private workspace.");
  return id;
};
export const requireUser: RequestHandler = async (req, _res, next) => {
  const id = uid(req);
  await pool.query("INSERT INTO research_accounts(id) VALUES($1) ON CONFLICT DO NOTHING", [id]);
  next();
};
export const routeId = (req: Request) => z.string().uuid().parse(req.params.id);
export const iso = (v: Date | string) => new Date(v).toISOString();
export const plans = [
  { id: "student", name: "Student", priceInr: 499, answers: 20, reviews: 1, images: 10 },
  { id: "researcher", name: "Researcher", priceInr: 999, answers: 60, reviews: 3, images: 30 },
  { id: "pro", name: "Faculty / Pro", priceInr: 1999, answers: 150, reviews: 6, images: 60 },
];
export const trial = { id: "trial", name: "Starter trial", priceInr: 0, answers: 3, reviews: 1, images: 2 };
export async function entitlement(owner: string, executor: Pick<typeof pool, "query"> = pool) {
  const { rows } = await executor.query("SELECT plan FROM research_accounts WHERE id=$1", [owner]);
  return plans.find(p => p.id === rows[0]?.plan) ?? trial;
}
export async function usage(owner: string, executor: Pick<typeof pool, "query"> = pool) {
  const plan = await entitlement(owner, executor);
  // The starter allowance is lifetime, not a new free allowance every month.
  const period = plan.id === "trial" ? "starter" : new Date().toISOString().slice(0, 7);
  const { rows } = await executor.query("SELECT kind,count(*)::int AS n FROM research_usage WHERE owner_id=$1 AND period=$2 AND status IN ('reserved','completed') GROUP BY kind", [owner, period]);
  const count = (kind: string) => rows.find(r => r.kind === kind)?.n ?? 0;
  return { plan: plan.id, period, answersUsed: count("answer"), reviewsUsed: count("review"), imagesUsed: count("image"), answersLimit: plan.answers, reviewsLimit: plan.reviews, imagesLimit: plan.images, paymentsEnabled: false, ...await spending(owner,executor) };
}
