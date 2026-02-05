"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(256);

  useEffect(() => {
    const updateWidth = () => {
      const collapsed = localStorage.getItem("sidebar-collapsed") === "true";
      setSidebarWidth(collapsed ? 80 : 256);
    };

    updateWidth();

    const handleToggle = () => updateWidth();
    window.addEventListener("sidebar-toggle", handleToggle as EventListener);

    return () => {
      window.removeEventListener(
        "sidebar-toggle",
        handleToggle as EventListener,
      );
    };
  }, []);

  return (
    <div className="min-h-screen">
      <DashboardSidebar />
      <main
        className="transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        {children}
      </main>
    </div>
  );
}
