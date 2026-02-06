"use client";

import {
  ArrowLeft,
  Bot,
  FileText,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
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
  { icon: GitBranch, label: "History", href: "/dashboard/traces" },
  { icon: Bot, label: "AI Chat", href: "/dashboard/chat" },
  { icon: FileText, label: "Manage", href: "/dashboard/manage" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
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
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));

    const event = new CustomEvent("sidebar-toggle", { detail: newState });
    window.dispatchEvent(event);
  };

  return (
    <>
      {/* Dark Sidebar - PayU Style */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-40 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        {/* Logo Area */}
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between gap-2">
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-white whitespace-nowrap">
              Vesting Buddy
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="shrink-0 text-sidebar-foreground hover:text-white hover:bg-white/10"
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <ArrowLeft className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary text-white"
                      : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
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
                    <div className="absolute left-full ml-2 px-3 py-2 bg-sidebar border border-sidebar-border rounded-lg text-sm font-medium text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Actions */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          {user && (
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg",
                isCollapsed ? "justify-center px-3" : "justify-start",
              )}
              title={isCollapsed ? (user.email ?? "Profile") : undefined}
            >
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {user.full_name || "Profile"}
                  </p>
                  <p className="text-xs text-sidebar-foreground truncate">
                    {user.email ?? ""}
                  </p>
                </div>
              )}
            </div>
          )}
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
                "w-full gap-3 text-sidebar-foreground hover:text-white hover:bg-white/5",
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
      
      {/* Spacer for main content */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen transition-all duration-300 pointer-events-none",
          isCollapsed ? "w-20" : "w-64",
        )}
      />
    </>
  );
}
