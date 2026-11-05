import { pgTable, text, integer, jsonb, timestamp, vector, index } from "drizzle-orm/pg-core";
import { documents, papers, accounts } from "./research";

// Full-size OpenAI embeddings; exact search over the selected evidence avoids
// approximate-index recall loss and the HNSW vector dimension limit.
export const evidenceChunks = pgTable("research_evidence_chunks", {
  id: text("id").primaryKey(),
  scope: text("scope").notNull(),
  sourceKey: text("source_key").notNull(),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }),
  model: text("model").notNull(),
  contentHash: text("content_hash").notNull(),
  page: integer("page").notNull(),
  text: text("text").notNull(),
  embedding: vector("embedding", { dimensions: 3072 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("research_chunks_scope_source").on(t.scope, t.sourceKey)]);

export const paperAssets = pgTable("research_paper_assets", {
  paperId: text("paper_id").primaryKey().references(() => papers.id, { onDelete: "cascade" }),
  objectPath: text("object_path").notNull(),
  sourceUrl: text("source_url").notNull(),
  license: text("license").notNull(),
  pages: jsonb("pages").notNull(),
  contentHash: text("content_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pageAssets = pgTable("research_page_assets", {
  id: text("id").primaryKey(),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }),
  objectPath: text("object_path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Monetary amounts are integer micro-INR, not floating point currency.
export const aiSpend = pgTable("research_ai_spend", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => accounts.id),
  analysisId: text("analysis_id").notNull(),
  period: text("period").notNull(),
  model: text("model").notNull(),
  status: text("status").notNull(),
  amountMicros: integer("amount_micros").notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
