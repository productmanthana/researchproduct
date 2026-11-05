import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
export const sourceRegistry=pgTable("research_sources",{
  name:text("name").primaryKey(),
  license:text("license").notNull(),
  commercialOk:boolean("commercial_ok").notNull().default(false),
  attributionText:text("attribution_text").notNull(),
  rateLimitMs:integer("rate_limit_ms").notNull(),
  enabled:boolean("enabled").notNull().default(true),
  lastStatus:integer("last_status").notNull().default(0),
  lastChecked:timestamp("last_checked",{withTimezone:true}),
});
