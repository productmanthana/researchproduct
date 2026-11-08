import { pgTable, text, boolean, jsonb, timestamp, integer, primaryKey, unique } from "drizzle-orm/pg-core";
import { accounts, projects } from "./research";
export const researchWatches = pgTable("research_watches",{
  projectId:text("project_id").primaryKey().references(()=>projects.id,{onDelete:"cascade"}),
  ownerId:text("owner_id").notNull().references(()=>accounts.id),topic:text("topic").notNull(),
  enabled:boolean("enabled").notNull().default(true),patents:boolean("patents").notNull().default(true),
  status:text("status").notNull().default("queued"),notices:jsonb("notices").notNull().default([]),
  lastCheckedAt:timestamp("last_checked_at",{withTimezone:true}),lastSuccessfulAt:timestamp("last_successful_at",{withTimezone:true}),
  nextCheckAt:timestamp("next_check_at",{withTimezone:true}).notNull().defaultNow(),lockedAt:timestamp("locked_at",{withTimezone:true}),
  runToken:text("run_token"),version:integer("version").notNull().default(1),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
export const researchWatchSeen = pgTable("research_watch_seen",{
  projectId:text("project_id").notNull().references(()=>researchWatches.projectId,{onDelete:"cascade"}),
  sourceKey:text("source_key").notNull(),contentHash:text("content_hash").notNull(),decisionVersion:integer("decision_version").notNull(),
  firstSeenAt:timestamp("first_seen_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[primaryKey({columns:[t.projectId,t.sourceKey]})]);
export const researchAlerts = pgTable("research_alerts",{
  id:text("id").primaryKey(),projectId:text("project_id").notNull().references(()=>researchWatches.projectId,{onDelete:"cascade"}),
  ownerId:text("owner_id").notNull().references(()=>accounts.id),sourceKey:text("source_key").notNull(),payload:jsonb("payload").notNull(),
  read:boolean("read").notNull().default(false),dismissed:boolean("dismissed").notNull().default(false),savedItemId:text("saved_item_id"),
  foundAt:timestamp("found_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[unique().on(t.projectId,t.sourceKey)]);
export const researchWatchEmbeddings=pgTable("research_watch_embeddings",{
  key:text("key").primaryKey(),embedding:jsonb("embedding").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
