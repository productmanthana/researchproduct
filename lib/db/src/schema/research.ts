import { pgTable, text, integer, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const accounts = pgTable("research_accounts", {
  id: text("id").primaryKey(),
  role: text("role").notNull().default("student"),
  institutionId: text("institution_id"),
  plan: text("plan").notNull().default("trial"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const papers = pgTable("research_papers", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const projects = pgTable("research_projects", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => accounts.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("teal"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const library = pgTable("research_library", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => accounts.id),
  paperId: text("paper_id").notNull().references(() => papers.id),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  notes: text("notes").notNull().default(""),
  tags: jsonb("tags").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("research_library_owner_paper").on(t.ownerId, t.paperId)]);
export const documents = pgTable("research_documents", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => accounts.id),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  objectPath: text("object_path").notNull(),
  paperId: text("paper_id").references(() => papers.id, { onDelete:"set null" }),
  status: text("status").notNull().default("uploading"),
  pageCount: integer("page_count").notNull().default(0),
  pages: jsonb("pages").notNull().default([]),
  error: text("error").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const analyses = pgTable("research_analyses", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => accounts.id),
  kind: text("kind").notNull(),
  question: text("question").notNull(),
  input: jsonb("input").notNull(),
  status: text("status").notNull().default("queued"),
  result: jsonb("result").notNull().default({}),
  error: text("error").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
});
export const usageLedger = pgTable("research_usage", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => accounts.id),
  period: text("period").notNull(),
  kind: text("kind").notNull(),
  status: text("status").notNull().default("reserved"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const searchCache = pgTable("research_search_cache", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
