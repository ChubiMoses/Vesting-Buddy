"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  DollarSign,
  Eye,
  MoreHorizontal,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AnalysisRow } from "@/actions/backend";
import type { StoredDocument } from "@/actions/storage";
import { AgentNudgeCard } from "@/components/dashboard/agent-nudge";
import { AnalysisSidebar } from "@/components/dashboard/analysis-sidebar";
import { FloatingChat } from "@/components/dashboard/floating-chat";
import { InsightCards } from "@/components/dashboard/insight-cards";
import { Button } from "@/components/ui/button";
import type { SavedAnalysis, WealthPulse } from "@/lib/data/dashboard";
import {
  analysisToAgentNudges,
  analysisToInsightCards,
  analysisToSavedAnalysis,
  analysisToWealthPulse,
} from "@/lib/map-analysis-to-dashboard";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const EMPTY_WEALTH_PULSE: WealthPulse = {
  unlockedThisMonth: 0,
  totalUnlocked: 0,
  growthPercentage: 0,
  lastUpdated: new Date().toISOString(),
};

interface DashboardContentProps {
  analyses: AnalysisRow[];
  documents: StoredDocument[];
}

function SavingsChart({ analyses }: { analyses: SavedAnalysis[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxSavings = Math.max(...analyses.map((a) => a.totalSavings), 1);
  const ordered = [...analyses].reverse();

  // Calculate Y-axis values
  const yAxisSteps = 4;
  const yAxisValues = Array.from({ length: yAxisSteps + 1 }, (_, i) =>
    Math.round((maxSavings * i) / yAxisSteps),
  );

  return (
    <div className="flex gap-6">
      {/* Y-axis */}
      <div className="flex flex-col justify-between h-32 py-0.5">
        {yAxisValues.reverse().map((value, i) => (
          <div
            key={i}
            className="text-xs text-muted-foreground tabular-nums"
          >
            ${(value / 1000).toFixed(0)}k
          </div>
        ))}
      </div>

      {/* Chart - Gray bars with teal accent for selected (PayU style) */}
      <div className="flex-1 flex gap-3 items-end">
        {ordered.map((a, i) => (
          <div
            key={a.id}
            className="flex-1 min-w-0 flex flex-col items-center gap-2 relative"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Tooltip */}
            {hoveredIndex === i && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full mb-2 px-3 py-2 rounded-lg bg-card border border-border shadow-lg z-10 whitespace-nowrap"
              >
                <p className="text-sm font-semibold">
                  ${a.totalSavings.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </motion.div>
            )}

            <div className="h-32 w-full flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(a.totalSavings / maxSavings) * 100}%` }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "w-full rounded-t-lg transition-all min-h-[4px]",
                  hoveredIndex === i
                    ? "bg-primary"
                    : "bg-gray-300",
                )}
              />
            </div>
            <span className="text-xs text-muted-foreground truncate w-full text-center">
              {new Date(a.date).toLocaleDateString("en-US", {
                month: "short",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardContent({
  analyses,
  documents,
}: DashboardContentProps) {
  const router = useRouter();
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRow | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const latest = analyses[0] ?? null;
  const leakedValue = (latest?.leaked_value ?? {}) as Record<string, unknown>;
  const paystubData = (latest?.paystub_data ?? {}) as Record<string, unknown>;
  const policyAnswer = (latest?.policy_answer ?? {}) as Record<string, unknown>;
  const wealthPulse = latest
    ? analysisToWealthPulse(latest)
    : EMPTY_WEALTH_PULSE;
  const nudges = latest ? analysisToAgentNudges(latest) : [];
  const insightCards = latest ? analysisToInsightCards(latest) : [];
  const savedAnalyses = analyses.map(analysisToSavedAnalysis);

  const handleViewDetails = (analysis: AnalysisRow) => {
    setSelectedAnalysis(analysis);
    setSidebarOpen(true);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const name =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email ||
        null;
      setUserName(name);
    });
  }, []);

  const formatPercent = (value: unknown) => {
    if (typeof value !== "number") return "—";
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (value: unknown) => {
    if (typeof value !== "number") return "—";
    return `$${Math.round(value).toLocaleString()}`;
  };

  return (
    <>
      <AnalysisSidebar
        analysis={selectedAnalysis}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <FloatingChat />

      <div className="p-6 lg:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Dashboard &gt; Overview
              </p>
            </div>
            {analyses &&(
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Welcome back,</p>
                <p className="text-base font-semibold text-foreground">
                  {((analyses[0]?.paystub_data as Record<string, unknown>)?.employee_name as string) || userName}
                </p>
              </div>
            )}
          </div>

          {/* Stats Row - PayU Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Balance Card */}
            <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total Unlocked</span>
                </div>
                <div className="relative group">
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <span className="pointer-events-none absolute -top-9 right-0 px-2 py-1 rounded-md bg-foreground text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Total unlocked from analyses
                  </span>
                </div>
              </div>
              <p className="text-3xl font-semibold tabular-nums">
                $ {wealthPulse.totalUnlocked.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  wealthPulse.growthPercentage >= 0 
                    ? "bg-success/10 text-success" 
                    : "bg-destructive/10 text-destructive"
                )}>
                  {wealthPulse.growthPercentage >= 0 ? "+" : ""}{wealthPulse.growthPercentage}% growth
                </span>
              </div>
            </div>

            {/* This Month Card */}
            <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">This Month</span>
                </div>
                <div className="relative group">
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <span className="pointer-events-none absolute -top-9 right-0 px-2 py-1 rounded-md bg-foreground text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Unlocked this month
                  </span>
                </div>
              </div>
              <p className="text-3xl font-semibold tabular-nums">
                $ {wealthPulse.unlockedThisMonth.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  Unlocked this month
                </span>
              </div>
            </div>

            {/* Analyses Count Card */}
            <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total Analyses</span>
                </div>
                <div className="relative group">
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <span className="pointer-events-none absolute -top-9 right-0 px-2 py-1 rounded-md bg-foreground text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Total analyses run
                  </span>
                </div>
              </div>
              <p className="text-3xl font-semibold tabular-nums">
                {analyses.length}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  Documents analyzed
                </span>
              </div>
            </div>
          </div>

          {/* Latest Analysis Snapshot */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Latest Analysis Snapshot
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Key values from your most recent analysis
                </p>
              </div>
              {latest && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/traces")}
                >
                  View history
                </Button>
              )}
            </div>

            {latest ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">
                    Opportunity Cost
                  </p>
                  <p className="text-2xl font-semibold text-emerald-900 mt-2 tabular-nums">
                    {formatCurrency(leakedValue.annual_opportunity_cost)}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Annual savings potential
                  </p>
                </div> */}

                <div className="p-5 rounded-xl bg-sky-50 border border-sky-200">
                  <p className="text-xs text-sky-700 font-semibold uppercase tracking-wide">
                    Employee Profile
                  </p>
                  <p className="text-lg font-semibold text-sky-900 mt-2 truncate">
                    {(leakedValue.employee_name as string) ||
                      (paystubData.employee_name as string) ||
                      "—"}
                  </p>
                  <p className="text-xs text-sky-700 mt-1">
                    Gross pay{" "}
                    {formatCurrency(
                      leakedValue.gross_pay ?? paystubData.gross_pay,
                    )}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">
                    Match Gap
                  </p>
                  <p className="text-2xl font-semibold text-amber-900 mt-2 tabular-nums">
                    {formatPercent(leakedValue.gap_rate)}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    To maximize match
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-indigo-50 border border-indigo-200">
                  <p className="text-xs text-indigo-700 font-semibold uppercase tracking-wide">
                    Payroll Status
                  </p>
                  <p className="text-lg font-semibold text-indigo-900 mt-2 capitalize">
                    {(leakedValue.paystub_verification as { status?: string })
                      ?.status || "—"}
                  </p>
                  <p className="text-xs text-indigo-700 mt-1">
                    Calculations verified
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-gray-100 border border-gray-200">
                  <p className="text-xs text-gray-700 font-semibold uppercase tracking-wide">
                    Policy Check
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">
                    {typeof leakedValue.policy_missing_match === "boolean"
                      ? leakedValue.policy_missing_match
                        ? "Missing Match"
                        : "Match Found"
                      : "—"}
                  </p>
                  <p className="text-xs text-gray-700 mt-1">
                    {policyAnswer.question
                      ? `By HSA contribution & vesting schedule`
                      : "Policy question not available"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  No analysis data yet. Run your first analysis to populate this
                  section.
                </p>
              </div>
            )}
          </section>

          {/* Recommended Actions */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Recommended steps for you
            </h2>
            {nudges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nudges.map((nudge, index) => (
                  <motion.div
                    key={nudge.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                  >
                    <AgentNudgeCard
                      nudge={nudge}
                      onViewDetails={
                        latest ? () => handleViewDetails(latest) : undefined
                      }
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Run an analysis to unlock personalized recommendations.
                </p>
                <Button onClick={() => router.push("/dashboard/upload")}>
                  Start analysis
                </Button>
              </div>
            )}
          </section>

          {/* Key Metrics */}
          {insightCards.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Key metrics
              </h2>
              <InsightCards cards={insightCards} />
            </section>
          )}

          {/* Savings Overview Chart - PayU Style */}
          <section className="rounded-xl bg-card border border-border/50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Savings Overview</h3>
                  <p className="text-xs text-muted-foreground">
                    Opportunity value from your analyses
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm rounded-lg bg-muted text-foreground font-medium">
                  Monthly
                </button>
                <button className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground">
                  Filter
                </button>
              </div>
            </div>
            <div className="p-6">
              {savedAnalyses.length > 0 ? (
                <div className="space-y-6">
                  <SavingsChart analyses={savedAnalyses} />
                  
                  {/* Recent Analyses Table */}
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Recent Analyses
                    </h4>
                    <div className="rounded-lg border border-border overflow-hidden">
                      {/* Table Header */}
                      <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border">
                        <span>Date</span>
                        <span>Savings</span>
                        <span>Opportunities</span>
                        <span className="text-right">Action</span>
                      </div>
                      {/* Table Rows */}
                      {savedAnalyses.slice(0, 5).map((analysis) => {
                        const fullAnalysis = analyses.find(
                          (a) => a.id === analysis.id,
                        );
                        return (
                          <div
                            key={analysis.id}
                            className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <span className="text-sm font-medium">
                              {new Date(analysis.date).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric", year: "numeric" },
                              )}
                            </span>
                            <span className="text-sm font-semibold tabular-nums">
                              ${analysis.totalSavings.toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {analysis.opportunities} found
                            </span>
                            <div className="text-right">
                              <button
                                onClick={() => fullAnalysis && handleViewDetails(fullAnalysis)}
                                className="text-sm text-primary hover:underline"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No analyses yet
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-sm">
                    Upload your documents and run your first analysis to see
                    insights here.
                  </p>
                  <Button onClick={() => router.push("/dashboard/upload")}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
