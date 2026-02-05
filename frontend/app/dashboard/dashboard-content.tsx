"use client";

import { motion } from "framer-motion";
import { BarChart3, Eye, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AnalysisRow } from "@/actions/backend";
import type { StoredDocument } from "@/actions/storage";
import { AgentNudgeCard } from "@/components/dashboard/agent-nudge";
import { AnalysisSidebar } from "@/components/dashboard/analysis-sidebar";
import { InsightCards } from "@/components/dashboard/insight-cards";
import { WealthPulseCard } from "@/components/dashboard/wealth-pulse";
import type { SavedAnalysis, WealthPulse } from "@/lib/data/dashboard";
import {
  analysisToAgentNudges,
  analysisToInsightCards,
  analysisToSavedAnalysis,
  analysisToWealthPulse,
} from "@/lib/map-analysis-to-dashboard";
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
      <div className="flex flex-col justify-between h-28 py-0.5">
        {yAxisValues.reverse().map((value, i) => (
          <div
            key={i}
            className="text-[10px] text-muted-foreground font-mono tabular-nums"
          >
            ${(value / 1000).toFixed(0)}k
          </div>
        ))}
      </div>

      {/* Chart */}
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
                className="absolute bottom-full mb-2 px-3 py-2 rounded-lg bg-popover border border-border shadow-lg z-10 whitespace-nowrap"
              >
                <p className="text-xs font-semibold">
                  ${a.totalSavings.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(a.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </motion.div>
            )}

            <div className="h-28 w-full flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(a.totalSavings / maxSavings) * 100}%` }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: "easeOut" }}
                className={cn(
                  "w-full rounded-t-lg bg-linear-to-t from-primary to-navy-blue transition-all min-h-[4px]",
                  hoveredIndex === i
                    ? "opacity-100 shadow-lg shadow-primary/50"
                    : "opacity-70",
                )}
              />
            </div>
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
              {new Date(a.date).toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
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

  const latest = analyses[0] ?? null;
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

  return (
    <>
      <AnalysisSidebar
        analysis={selectedAnalysis}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="p-6 md:p-8 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero: single Wealth Pulse card */}
          <WealthPulseCard data={wealthPulse} />

          {/* Recommended actions: nudges in 2 columns */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Recommended for you
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
              <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Run an analysis to unlock personalized recommendations.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/upload")}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                >
                  Start analysis
                </button>
              </div>
            )}
          </section>

          {/* Insights: compact single row when we have cards */}
          {insightCards.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Key metrics
              </h2>
              <InsightCards cards={insightCards} />
            </section>
          )}

          {/* Savings over time + saved analyses */}
          <section className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Savings over time</h3>
                  <p className="text-xs text-muted-foreground">
                    Opportunity value from your analyses
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {savedAnalyses.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-muted/20 dark:bg-muted/10 rounded-xl p-4 border border-border/50">
                    <SavingsChart analyses={savedAnalyses} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Recent Analyses
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {savedAnalyses.map((analysis, index) => {
                        const fullAnalysis = analyses.find(
                          (a) => a.id === analysis.id,
                        );
                        return (
                          <motion.button
                            key={analysis.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            onClick={() =>
                              fullAnalysis && handleViewDetails(fullAnalysis)
                            }
                            className="relative rounded-xl border border-border bg-card hover:bg-accent transition-all text-left group overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(analysis.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </span>
                                <Eye className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <p className="text-xl font-bold font-mono text-foreground">
                                ${analysis.totalSavings.toLocaleString()}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {analysis.opportunities} opportunities
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 dark:bg-muted/20 flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    No analyses yet
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 max-w-sm">
                    Upload your documents and run your first analysis to see
                    insights here.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/upload")}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
