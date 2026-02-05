"use client";

import {
  ArrowLeft,
  Bot,
  FileText,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  Upload,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Zap, label: "Analyse", href: "/dashboard/upload" },
  { icon: GitBranch, label: "Traces", href: "/dashboard/traces" },
  { icon: Bot, label: "AI Chat", href: "/dashboard/chat" },
  { icon: FileText, label: "Manage", href: "/dashboard/manage" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<{
    email?: string;
    full_name?: string;
  } | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user: u } }) =>
        setUser(
          u
            ? {
                email: u.email ?? undefined,
                full_name: u.user_metadata?.full_name as string | undefined,
              }
            : null,
        ),
      );
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newTheme);
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));

    const event = new CustomEvent("sidebar-toggle", { detail: newState });
    window.dispatchEvent(event);
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-card/50 backdrop-blur-xl border-r border-border flex flex-col z-40 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="p-6 border-b border-primary/10 flex items-center justify-between gap-2">
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-500 whitespace-nowrap">
              Vesting Buddy
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="shrink-0"
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <ArrowLeft className="w-5 h-5" />
            )}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                    isActive
                      ? "bg-linear-to-r from-primary/20 to-purple-500/20 border border-primary/30 text-primary"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary/10 space-y-2">
          {user && (
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10",
                isCollapsed ? "justify-center px-3" : "justify-start",
              )}
              title={isCollapsed ? (user.email ?? "Profile") : undefined}
            >
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {user.full_name || "Profile"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email ?? ""}
                  </p>
                </div>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className={cn(
              "w-full gap-3 text-muted-foreground hover:text-foreground",
              isCollapsed ? "justify-center" : "justify-start",
            )}
            title={isCollapsed ? "Toggle Theme" : undefined}
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 shrink-0" />
            ) : (
              <Sun className="w-5 h-5 shrink-0" />
            )}
            {!isCollapsed && <span>Toggle Theme</span>}
          </Button>
          <form
            action={() => {
              if (window.confirm("Are you sure you want to log out?")) {
                signOut();
              }
            }}
            className="w-full"
          >
            <Button
              type="submit"
              variant="ghost"
              className={cn(
                "w-full gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                isCollapsed ? "justify-center" : "justify-start",
              )}
              title={isCollapsed ? "Log out" : undefined}
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span>Log out</span>}
            </Button>
          </form>
        </div>
      </aside>
      <div
        className={cn(
          "fixed left-0 top-0 h-screen transition-all duration-300 pointer-events-none",
          isCollapsed ? "w-20" : "w-64",
        )}
      />
    </>
  );
}
