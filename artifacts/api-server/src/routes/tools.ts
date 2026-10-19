import { Router, type IRouter } from "express";
import { db, toolsTable } from "@workspace/db";
import { ListToolsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tools", async (_req, res): Promise<void> => {
  const tools = await db.select().from(toolsTable).orderBy(toolsTable.category);
  res.json(ListToolsResponse.parse(tools));
});

export default router;
