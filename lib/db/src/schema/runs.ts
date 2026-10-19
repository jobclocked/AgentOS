import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { agentsTable } from "./agents";
import { deploymentsTable } from "./deployments";

export const runsTable = pgTable("runs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  deploymentId: integer("deployment_id").references(() => deploymentsTable.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending"),
  input: text("input"),
  output: text("output"),
  errorMessage: text("error_message"),
  tokensUsed: integer("tokens_used"),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRunSchema = createInsertSchema(runsTable).omit({ id: true, createdAt: true });
export type InsertRun = z.infer<typeof insertRunSchema>;
export type Run = typeof runsTable.$inferSelect;
