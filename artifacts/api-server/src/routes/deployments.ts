import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, deploymentsTable, agentsTable } from "@workspace/db";
import {
  CreateDeploymentBody,
  UpdateDeploymentBody,
  UpdateDeploymentParams,
  GetDeploymentParams,
  DeleteDeploymentParams,
  ListDeploymentsResponse,
  GetDeploymentResponse,
  UpdateDeploymentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/deployments", async (req, res): Promise<void> => {
  const deployments = await db
    .select({
      id: deploymentsTable.id,
      agentId: deploymentsTable.agentId,
      agentName: agentsTable.name,
      environment: deploymentsTable.environment,
      status: deploymentsTable.status,
      trigger: deploymentsTable.trigger,
      schedule: deploymentsTable.schedule,
      webhookUrl: deploymentsTable.webhookUrl,
      lastRunAt: deploymentsTable.lastRunAt,
      runCount: deploymentsTable.runCount,
      createdAt: deploymentsTable.createdAt,
      updatedAt: deploymentsTable.updatedAt,
    })
    .from(deploymentsTable)
    .innerJoin(agentsTable, eq(deploymentsTable.agentId, agentsTable.id))
    .orderBy(deploymentsTable.createdAt);

  res.json(ListDeploymentsResponse.parse(deployments));
});

router.post("/deployments", async (req, res): Promise<void> => {
  const parsed = CreateDeploymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, parsed.data.agentId));
  if (!agent) {
    res.status(400).json({ error: "Agent not found" });
    return;
  }

  const [deployment] = await db.insert(deploymentsTable).values({
    agentId: parsed.data.agentId,
    environment: parsed.data.environment,
    trigger: parsed.data.trigger,
    schedule: parsed.data.schedule ?? null,
    webhookUrl: parsed.data.webhookUrl ?? null,
  }).returning();

  const result = { ...deployment, agentName: agent.name };
  res.status(201).json(GetDeploymentResponse.parse(result));
});

router.get("/deployments/:id", async (req, res): Promise<void> => {
  const params = GetDeploymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      id: deploymentsTable.id,
      agentId: deploymentsTable.agentId,
      agentName: agentsTable.name,
      environment: deploymentsTable.environment,
      status: deploymentsTable.status,
      trigger: deploymentsTable.trigger,
      schedule: deploymentsTable.schedule,
      webhookUrl: deploymentsTable.webhookUrl,
      lastRunAt: deploymentsTable.lastRunAt,
      runCount: deploymentsTable.runCount,
      createdAt: deploymentsTable.createdAt,
      updatedAt: deploymentsTable.updatedAt,
    })
    .from(deploymentsTable)
    .innerJoin(agentsTable, eq(deploymentsTable.agentId, agentsTable.id))
    .where(eq(deploymentsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Deployment not found" });
    return;
  }

  res.json(GetDeploymentResponse.parse(row));
});

router.patch("/deployments/:id", async (req, res): Promise<void> => {
  const params = UpdateDeploymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDeploymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.schedule !== undefined) updateData.schedule = parsed.data.schedule;

  const [deployment] = await db.update(deploymentsTable).set(updateData).where(eq(deploymentsTable.id, params.data.id)).returning();
  if (!deployment) {
    res.status(404).json({ error: "Deployment not found" });
    return;
  }

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, deployment.agentId));
  const result = { ...deployment, agentName: agent?.name ?? "Unknown" };
  res.json(UpdateDeploymentResponse.parse(result));
});

router.delete("/deployments/:id", async (req, res): Promise<void> => {
  const params = DeleteDeploymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deployment] = await db.delete(deploymentsTable).where(eq(deploymentsTable.id, params.data.id)).returning();
  if (!deployment) {
    res.status(404).json({ error: "Deployment not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
