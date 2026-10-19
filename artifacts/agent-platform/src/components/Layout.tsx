import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import { LayoutDashboard, Users, Zap, History, BarChart3, Settings } from "lucide-react";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Agents", href: "/agents", icon: Users },
    { name: "Deployments", href: "/deployments", icon: Zap },
    { name: "Runs", href: "/runs", icon: History },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <div className="font-bold text-lg flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
              OS
            </div>
            AgentOS
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/");
            return (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}>
                <item.icon className="w-4 h-4" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-muted/20">
        {children}
      </main>
    </div>
  );
}