import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route, Router as WouterRouter } from "wouter";
import Layout from "./components/Layout";
import Dashboard from "./pages/dashboard";
import Agents from "./pages/agents";
import AgentDetail from "./pages/agent-detail";
import Deployments from "./pages/deployments";
import Runs from "./pages/runs";
import Analytics from "./pages/analytics";
import NotFound from "./pages/not-found";

import AgentNew from "./pages/agent-new";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/agents" component={Agents} />
      <Route path="/agents/new" component={AgentNew} />
      <Route path="/agents/:id" component={AgentDetail} />
      <Route path="/deployments" component={Deployments} />
      <Route path="/runs" component={Runs} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
