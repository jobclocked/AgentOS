import { useState } from "react";
import { useListRuns, useCreateRun, getListRunsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Loader, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const statusIcon = {
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  running: <Loader className="h-4 w-4 text-blue-500 animate-spin" />,
  cancelled: <AlertCircle className="h-4 w-4 text-yellow-500" />,
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  failed: "destructive",
  pending: "secondary",
  running: "outline",
  cancelled: "secondary",
};

export default function Runs() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { data: runs, isLoading } = useListRuns({ limit: 100 });
  const createRun = useCreateRun({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRunsQueryKey() });
      },
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Runs</h1>
          <p className="text-muted-foreground mt-1">View execution history</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
        </CardHeader>
        <CardContent>
          {!runs || runs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No runs yet. Trigger a run from an agent or deployment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Agent</th>
                    <th className="pb-3 font-medium text-muted-foreground">Started</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Duration</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Tokens</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {runs.map((run) => (
                    <>
                      <tr
                        key={run.id}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {statusIcon[run.status as keyof typeof statusIcon] ?? null}
                            <Badge variant={statusVariant[run.status] ?? "secondary"}>
                              {run.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 font-medium">{run.agentName}</td>
                        <td className="py-3 text-muted-foreground">
                          {run.startedAt
                            ? format(new Date(run.startedAt), "MMM d, HH:mm")
                            : format(new Date(run.createdAt), "MMM d, HH:mm")}
                        </td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">
                          {run.durationMs != null ? `${run.durationMs.toLocaleString()}ms` : "—"}
                        </td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">
                          {run.tokensUsed != null ? run.tokensUsed.toLocaleString() : "—"}
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-xs text-muted-foreground">
                            {expanded === run.id ? "hide" : "details"}
                          </span>
                        </td>
                      </tr>
                      {expanded === run.id && (
                        <tr key={`${run.id}-details`}>
                          <td colSpan={6} className="pb-4 pt-1">
                            <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
                              {run.input && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Input: </span>
                                  <span>{run.input}</span>
                                </div>
                              )}
                              {run.output && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Output: </span>
                                  <span className="text-muted-foreground">{run.output}</span>
                                </div>
                              )}
                              {run.errorMessage && (
                                <div className="text-destructive">
                                  <span className="font-medium">Error: </span>
                                  <span>{run.errorMessage}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
