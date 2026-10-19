import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetAgent,
  useUpdateAgent,
  useDeleteAgent,
  useListRuns,
  useCreateRun,
  getGetAgentQueryKey,
  getListRunsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, Play, Trash2, ArrowLeft, Loader } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

const statusColors: Record<string, string> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  archived: "secondary",
};

const runStatusIcon: Record<string, React.ReactNode> = {
  success: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  pending: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
  running: <Loader className="h-3.5 w-3.5 text-blue-500 animate-spin" />,
};

export default function AgentDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [runInput, setRunInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const { data: agent, isLoading, error: agentError, refetch: refetchAgent } = useGetAgent(Number(id), {
    query: { queryKey: getGetAgentQueryKey(Number(id)), enabled: !!id },
  });
  const { data: runs, error: runsError, refetch: refetchRuns } = useListRuns({ agentId: Number(id) }, {
    query: { queryKey: getListRunsQueryKey({ agentId: Number(id) }), enabled: !!id },
  });

  const updateAgent = useUpdateAgent({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAgentQueryKey(Number(id)) }),
    },
  });
  const deleteAgent = useDeleteAgent({
    mutation: {
      onSuccess: () => navigate("/agents"),
    },
  });
  const createRun = useCreateRun({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRunsQueryKey({ agentId: Number(id) }) });
        setRunInput("");
        setIsRunning(false);
      },
      onError: () => setIsRunning(false),
    },
  });

  const handleRunAgent = () => {
    if (!agent) return;
    setIsRunning(true);
    createRun.mutate({ data: { agentId: agent.id, input: runInput || null } });
  };

  const handleToggleStatus = () => {
    if (!agent) return;
    const next = agent.status === "active" ? "paused" : "active";
    updateAgent.mutate({
      id: agent.id,
      data: { status: next as "draft" | "active" | "paused" | "archived" },
    });
  };

  const handleDelete = () => {
    if (!agent || !confirm(`Delete "${agent.name}"? This cannot be undone.`)) return;
    deleteAgent.mutate({ id: agent.id });
  };

  if (agentError) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-4">
        <p role="alert" className="text-destructive">
          {agentError.data?.error || agentError.message || "Failed to load agent."}
        </p>
        <Button variant="outline" onClick={() => void refetchAgent()}>Retry</Button>
        <Button variant="ghost" asChild><Link href="/agents">Back to Agents</Link></Button>
      </div>
    );
  }

  if (isLoading || !agent) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const recentRuns = runs?.slice(0, 10) ?? [];
  const successRate =
    recentRuns.length > 0
      ? Math.round(
          (recentRuns.filter((r) => r.status === "success").length / recentRuns.length) * 100
        )
      : null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/agents">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Agents
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <Badge variant={(statusColors[agent.status] as any) ?? "secondary"}>
              {agent.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={updateAgent.isPending}
          >
            {agent.status === "active" ? "Pause" : "Activate"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-mono font-medium">{agent.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature</span>
              <span className="font-mono">{agent.temperature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Tokens</span>
              <span className="font-mono">{agent.maxTokens.toLocaleString()}</span>
            </div>
            {agent.tools.length > 0 && (
              <div>
                <span className="text-muted-foreground">Tools</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.tools.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{agent.goal}</p>
          </CardContent>
        </Card>
      </div>

      {agent.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{agent.instructions}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Optional: provide input or context for this run..."
            value={runInput}
            onChange={(e) => setRunInput(e.target.value)}
            rows={3}
          />
          <Button onClick={handleRunAgent} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Runs</CardTitle>
            {!runsError && successRate !== null && (
              <span className="text-sm text-muted-foreground">
                {successRate}% success rate
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {runsError ? (
            <div className="space-y-3">
              <p role="alert" className="text-sm text-destructive">
                {runsError.message || "Failed to load recent runs."}
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetchRuns()}>Retry</Button>
            </div>
          ) : recentRuns.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No runs yet. Click "Run Now" to execute this agent.
            </div>
          ) : (
            <div className="space-y-2">
              {recentRuns.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card text-sm"
                >
                  {runStatusIcon[run.status]}
                  <span className="font-medium capitalize">{run.status}</span>
                  <span className="text-muted-foreground flex-1">
                    {run.durationMs != null && `${run.durationMs.toLocaleString()}ms`}
                    {run.tokensUsed != null && ` · ${run.tokensUsed.toLocaleString()} tokens`}
                  </span>
                  <span className="text-muted-foreground">
                    {format(new Date(run.createdAt), "MMM d, HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
