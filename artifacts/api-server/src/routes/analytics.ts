import { Router, type IRouter } from "express";
import { eq, sql, count, avg, sum } from "drizzle-orm";
import { db, agentsTable, deploymentsTable, runsTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetRunsOverTimeResponse,
  GetAgentPerformanceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/dashboard", async (req, res): Promise<void> => {
  const [agentStats] = await db
    .select({
      totalAgents: count(),
      activeAgents: sql<number>`count(*) filter (where ${agentsTable.status} = 'active')`,
    })
    .from(agentsTable);

  const [deploymentStats] = await db
    .select({
      totalDeployments: count(),
      activeDeployments: sql<number>`count(*) filter (where ${deploymentsTable.status} = 'active')`,
    })
    .from(deploymentsTable);

  const [runStats] = await db
    .select({
      totalRuns: count(),
      successfulRuns: sql<number>`count(*) filter (where ${runsTable.status} = 'success')`,
      failedRuns: sql<number>`count(*) filter (where ${runsTable.status} = 'failed')`,
      totalTokensUsed: sql<number>`coalesce(sum(${runsTable.tokensUsed}), 0)`,
      avgRunDurationMs: sql<number>`coalesce(avg(${runsTable.durationMs}), 0)`,
    })
    .from(runsTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayStats] = await db
    .select({ runsToday: count() })
    .from(runsTable)
    .where(sql`${runsTable.createdAt} >= ${today}`);

  const stats = {
    totalAgents: Number(agentStats?.totalAgents ?? 0),
    activeAgents: Number(agentStats?.activeAgents ?? 0),
    totalDeployments: Number(deploymentStats?.totalDeployments ?? 0),
    activeDeployments: Number(deploymentStats?.activeDeployments ?? 0),
    totalRuns: Number(runStats?.totalRuns ?? 0),
    successfulRuns: Number(runStats?.successfulRuns ?? 0),
    failedRuns: Number(runStats?.failedRuns ?? 0),
    totalTokensUsed: Number(runStats?.totalTokensUsed ?? 0),
    avgRunDurationMs: Math.round(Number(runStats?.avgRunDurationMs ?? 0)),
    runsToday: Number(todayStats?.runsToday ?? 0),
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/analytics/runs-over-time", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      date: sql<string>`date_trunc('day', ${runsTable.createdAt})::date::text`,
      runs: count(),
      successful: sql<number>`count(*) filter (where ${runsTable.status} = 'success')`,
      failed: sql<number>`count(*) filter (where ${runsTable.status} = 'failed')`,
    })
    .from(runsTable)
    .where(sql`${runsTable.createdAt} >= now() - interval '30 days'`)
    .groupBy(sql`date_trunc('day', ${runsTable.createdAt})`)
    .orderBy(sql`date_trunc('day', ${runsTable.createdAt})`);

  const points = rows.map((r) => ({
    date: r.date,
    runs: Number(r.runs),
    successful: Number(r.successful),
    failed: Number(r.failed),
  }));

  res.json(GetRunsOverTimeResponse.parse(points));
});

router.get("/analytics/agent-performance", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      agentId: agentsTable.id,
      agentName: agentsTable.name,
      totalRuns: count(runsTable.id),
      successfulRuns: sql<number>`count(${runsTable.id}) filter (where ${runsTable.status} = 'success')`,
      avgDurationMs: sql<number>`coalesce(avg(${runsTable.durationMs}), 0)`,
      totalTokensUsed: sql<number>`coalesce(sum(${runsTable.tokensUsed}), 0)`,
    })
    .from(agentsTable)
    .leftJoin(runsTable, eq(runsTable.agentId, agentsTable.id))
    .groupBy(agentsTable.id, agentsTable.name)
    .orderBy(sql`count(${runsTable.id}) desc`);

  const performance = rows.map((r) => {
    const total = Number(r.totalRuns);
    const successful = Number(r.successfulRuns);
    return {
      agentId: r.agentId,
      agentName: r.agentName,
      totalRuns: total,
      successRate: total > 0 ? Math.round((successful / total) * 100) / 100 : 0,
      avgDurationMs: Math.round(Number(r.avgDurationMs)),
      totalTokensUsed: Number(r.totalTokensUsed),
    };
  });

  res.json(GetAgentPerformanceResponse.parse(performance));
});

export default router;
