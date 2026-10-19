import {
  useGetRunsOverTime,
  useGetAgentPerformance,
  useGetDashboardStats,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { TrendingUp, CheckCircle, XCircle, Cpu } from "lucide-react";

export default function Analytics() {
  const { data: runsOverTime, isLoading: loadingRuns } = useGetRunsOverTime();
  const { data: agentPerf, isLoading: loadingPerf } = useGetAgentPerformance();
  const { data: stats, isLoading: loadingStats } = useGetDashboardStats();

  const isLoading = loadingRuns || loadingPerf || loadingStats;

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-muted rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const successRate =
    stats && stats.totalRuns > 0
      ? Math.round((stats.successfulRuns / stats.totalRuns) * 100)
      : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Platform metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.successfulRuns ?? 0} of {stats?.totalRuns ?? 0} runs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Runs</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.failedRuns ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {100 - successRate}% failure rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.totalTokensUsed ?? 0) / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">Tokens consumed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Runs Over Time (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!runsOverTime || runsOverTime.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No run data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={runsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  }
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(v) =>
                    new Date(v as string).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Legend />
                <Bar dataKey="successful" name="Successful" fill="#22c55e" stackId="a" />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {!agentPerf || agentPerf.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No agent performance data yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Agent</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Runs</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Success Rate</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Avg Duration</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Tokens Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {agentPerf.map((a) => (
                    <tr key={a.agentId}>
                      <td className="py-3 font-medium">{a.agentName}</td>
                      <td className="py-3 text-right tabular-nums">{a.totalRuns}</td>
                      <td className="py-3 text-right">
                        <span
                          className={
                            a.successRate >= 0.9
                              ? "text-green-600"
                              : a.successRate >= 0.7
                              ? "text-yellow-600"
                              : "text-red-600"
                          }
                        >
                          {Math.round(a.successRate * 100)}%
                        </span>
                      </td>
                      <td className="py-3 text-right tabular-nums text-muted-foreground">
                        {a.avgDurationMs.toLocaleString()}ms
                      </td>
                      <td className="py-3 text-right tabular-nums text-muted-foreground">
                        {(a.totalTokensUsed / 1000).toFixed(1)}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
