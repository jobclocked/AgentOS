import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, agentsTable } from "@workspace/db";
import {
  CreateAgentBody,
  UpdateAgentBody,
  UpdateAgentParams,
  GetAgentParams,
  DeleteAgentParams,
  DuplicateAgentParams,
  ListAgentsResponse,
  GetAgentResponse,
  UpdateAgentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/agents", async (req, res): Promise<void> => {
  const agents = await db.select().from(agentsTable).orderBy(agentsTable.createdAt);
  res.json(ListAgentsResponse.parse(agents));
});

router.post("/agents", async (req, res): Promise<void> => {
  const parsed = CreateAgentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [agent] = await db.insert(agentsTable).values({
    name: data.name,
    description: data.description ?? "",
    goal: data.goal,
    model: data.model ?? "gpt-4o-mini",
    instructions: data.instructions ?? "",
    tools: data.tools ?? [],
    temperature: data.temperature ?? 0.7,
    maxTokens: data.maxTokens ?? 2048,
  }).returning();

  res.status(201).json(GetAgentResponse.parse(agent));
});

router.get("/agents/:id", async (req, res): Promise<void> => {
  const params = GetAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, params.data.id));
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  res.json(GetAgentResponse.parse(agent));
});

router.patch("/agents/:id", async (req, res): Promise<void> => {
  const params = UpdateAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAgentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.goal !== undefined) updateData.goal = parsed.data.goal;
  if (parsed.data.model !== undefined) updateData.model = parsed.data.model;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.instructions !== undefined) updateData.instructions = parsed.data.instructions;
  if (parsed.data.tools !== undefined) updateData.tools = parsed.data.tools;
  if (parsed.data.temperature !== undefined) updateData.temperature = parsed.data.temperature;
  if (parsed.data.maxTokens !== undefined) updateData.maxTokens = parsed.data.maxTokens;

  const [agent] = await db.update(agentsTable).set(updateData).where(eq(agentsTable.id, params.data.id)).returning();
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  res.json(UpdateAgentResponse.parse(agent));
});

router.delete("/agents/:id", async (req, res): Promise<void> => {
  const params = DeleteAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [agent] = await db.delete(agentsTable).where(eq(agentsTable.id, params.data.id)).returning();
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/agents/:id/duplicate", async (req, res): Promise<void> => {
  const params = DuplicateAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [source] = await db.select().from(agentsTable).where(eq(agentsTable.id, params.data.id));
  if (!source) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  const [duplicate] = await db.insert(agentsTable).values({
    name: `${source.name} (Copy)`,
    description: source.description,
    goal: source.goal,
    model: source.model,
    status: "draft",
    instructions: source.instructions,
    tools: source.tools,
    temperature: source.temperature,
    maxTokens: source.maxTokens,
  }).returning();

  res.status(201).json(GetAgentResponse.parse(duplicate));
});

export default router;
