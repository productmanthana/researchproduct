import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { accounts, projects } from "./research";
export const studioItems = pgTable("research_studio_items", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull().references(() => accounts.id),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  status: text("status").notNull().default("completed"),
  error: text("error").notNull().default(""),
  revision: integer("revision").notNull().default(1),
  parentId: text("parent_id"),
  metadata: jsonb("metadata").notNull().default({}),
  indexStatus: text("index_status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
});
