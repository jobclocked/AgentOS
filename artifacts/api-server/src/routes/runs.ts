import { Router, type IRouter } from "express";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { db, runsTable, agentsTable, deploymentsTable } from "@workspace/db";
import {
  CreateRunBody,
  GetRunParams,
  ListRunsQueryParams,
  ListRunsResponse,
  GetRunResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/runs", async (req, res): Promise<void> => {
  const params = ListRunsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db
    .select({
      id: runsTable.id,
      agentId: runsTable.agentId,
      agentName: agentsTable.name,
      deploymentId: runsTable.deploymentId,
      status: runsTable.status,
      input: runsTable.input,
      output: runsTable.output,
      errorMessage: runsTable.errorMessage,
      tokensUsed: runsTable.tokensUsed,
      durationMs: runsTable.durationMs,
      startedAt: runsTable.startedAt,
      completedAt: runsTable.completedAt,
      createdAt: runsTable.createdAt,
    })
    .from(runsTable)
    .innerJoin(agentsTable, eq(runsTable.agentId, agentsTable.id))
    .$dynamic();

  if (params.data.agentId != null) {
    query = query.where(eq(runsTable.agentId, params.data.agentId));
  }

  if (params.data.limit != null) {
    query = query.limit(params.data.limit);
  } else {
    query = query.limit(100);
  }

  const runs = await query.orderBy(sql`${runsTable.createdAt} desc`);
  res.json(ListRunsResponse.parse(runs));
});

router.post("/runs", async (req, res): Promise<void> => {
  const parsed = CreateRunBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, parsed.data.agentId));
  if (!agent) {
    res.status(400).json({ error: "Agent not found" });
    return;
  }

  const startedAt = new Date();
  const durationMs = Math.floor(Math.random() * 8000) + 500;
  const tokensUsed = Math.floor(Math.random() * 3000) + 200;
  const success = Math.random() > 0.15;

  const [run] = await db.insert(runsTable).values({
    agentId: parsed.data.agentId,
    deploymentId: parsed.data.deploymentId ?? null,
    status: success ? "success" : "failed",
    input: parsed.data.input ?? null,
    output: success ? `Agent "${agent.name}" completed task successfully. Processed input and generated response based on goal: ${agent.goal}` : null,
    errorMessage: success ? null : "Rate limit exceeded. Please try again later.",
    tokensUsed,
    durationMs,
    startedAt,
    completedAt: new Date(startedAt.getTime() + durationMs),
  }).returning();

  if (parsed.data.deploymentId != null) {
    await db
      .update(deploymentsTable)
      .set({
        lastRunAt: new Date(),
        runCount: sql`${deploymentsTable.runCount} + 1`,
      })
      .where(eq(deploymentsTable.id, parsed.data.deploymentId));
  }

  const result = { ...run, agentName: agent.name };
  res.status(201).json(GetRunResponse.parse(result));
});

router.get("/runs/:id", async (req, res): Promise<void> => {
  const params = GetRunParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: runsTable.id,
      agentId: runsTable.agentId,
      agentName: agentsTable.name,
      deploymentId: runsTable.deploymentId,
      status: runsTable.status,
      input: runsTable.input,
      output: runsTable.output,
      errorMessage: runsTable.errorMessage,
      tokensUsed: runsTable.tokensUsed,
      durationMs: runsTable.durationMs,
      startedAt: runsTable.startedAt,
      completedAt: runsTable.completedAt,
      createdAt: runsTable.createdAt,
    })
    .from(runsTable)
    .innerJoin(agentsTable, eq(runsTable.agentId, agentsTable.id))
    .where(eq(runsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  res.json(GetRunResponse.parse(row));
});

export default router;
