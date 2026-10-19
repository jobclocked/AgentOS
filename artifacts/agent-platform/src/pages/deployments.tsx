import { useState } from "react";
import {
  useListDeployments,
  useUpdateDeployment,
  useDeleteDeployment,
  useCreateDeployment,
  useListAgents,
  getListDeploymentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Pause, Trash2, Plus, Zap, Globe, Calendar, Hand } from "lucide-react";
import { format } from "date-fns";

const envColor: Record<string, string> = {
  production: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  staging: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  development: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const triggerIcon: Record<string, React.ReactNode> = {
  manual: <Hand className="h-3 w-3" />,
  scheduled: <Calendar className="h-3 w-3" />,
  webhook: <Globe className="h-3 w-3" />,
  event: <Zap className="h-3 w-3" />,
};

export default function Deployments() {
  const [showCreate, setShowCreate] = useState(false);
  const [newAgentId, setNewAgentId] = useState<string>("");
  const [newEnv, setNewEnv] = useState<string>("production");
  const [newTrigger, setNewTrigger] = useState<string>("manual");
  const queryClient = useQueryClient();

  const { data: deployments, isLoading } = useListDeployments();
  const { data: agents } = useListAgents();

  const updateDeployment = useUpdateDeployment({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDeploymentsQueryKey() }),
    },
  });
  const deleteDeployment = useDeleteDeployment({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDeploymentsQueryKey() }),
    },
  });
  const createDeployment = useCreateDeployment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeploymentsQueryKey() });
        setShowCreate(false);
        setNewAgentId("");
      },
    },
  });

  const handleToggle = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    updateDeployment.mutate({ id, data: { status: newStatus as "active" | "paused" | "stopped" | "failed" } });
  };

  const handleDelete = (id: number) => {
    if (confirm("Remove this deployment?")) {
      deleteDeployment.mutate({ id });
    }
  };

  const handleCreate = () => {
    if (!newAgentId) return;
    createDeployment.mutate({
      data: {
        agentId: Number(newAgentId),
        environment: newEnv as "development" | "staging" | "production",
        trigger: newTrigger as "manual" | "scheduled" | "webhook" | "event",
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-40" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deployments</h1>
          <p className="text-muted-foreground mt-1">Manage agent deployments</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Deploy Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deploy Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={newAgentId} onValueChange={setNewAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents?.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <Select value={newEnv} onValueChange={setNewEnv}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select value={newTrigger} onValueChange={setNewTrigger}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={!newAgentId || createDeployment.isPending}
                >
                  {createDeployment.isPending ? "Deploying..." : "Deploy"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          {!deployments || deployments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No deployments yet. Deploy an agent to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Agent</th>
                    <th className="pb-3 font-medium text-muted-foreground">Environment</th>
                    <th className="pb-3 font-medium text-muted-foreground">Trigger</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground text-right">Runs</th>
                    <th className="pb-3 font-medium text-muted-foreground">Last Run</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deployments.map((d) => (
                    <tr key={d.id}>
                      <td className="py-3 font-medium">{d.agentName}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            envColor[d.environment] ?? ""
                          }`}
                        >
                          {d.environment}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {triggerIcon[d.trigger]}
                          {d.trigger}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge variant={d.status === "active" ? "default" : "secondary"}>
                          {d.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right tabular-nums">{d.runCount}</td>
                      <td className="py-3 text-muted-foreground">
                        {d.lastRunAt
                          ? format(new Date(d.lastRunAt), "MMM d, HH:mm")
                          : "Never"}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(d.id, d.status)}
                            disabled={updateDeployment.isPending}
                          >
                            {d.status === "active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(d.id)}
                            disabled={deleteDeployment.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
