"use client";

import { ChevronRight, Eye, GitBranch, Info } from "lucide-react";
import { useState } from "react";
import type { AnalysisRow, AnalysisTrace } from "@/actions/backend";
import { AnalysisSidebar } from "@/components/dashboard/analysis-sidebar";
import { Button } from "@/components/ui/button";

interface AnalysisWithTraces {
  analysis: AnalysisRow;
  traces: AnalysisTrace[];
}

interface TracesContentProps {
  analysesWithTraces: AnalysisWithTraces[];
}

export function TracesContent({ analysesWithTraces }: TracesContentProps) {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRow | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleViewDetails = (analysis: AnalysisRow) => {
    setSelectedAnalysis(analysis);
    setSidebarOpen(true);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      <AnalysisSidebar
        analysis={selectedAnalysis}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-3">
                <GitBranch className="w-6 h-6 text-primary" />
                Analysis History
              </h1>
              <p className="text-muted-foreground">
                View the AI reasoning process for your analyses
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Last 7 Days
              </Button>
              <Button variant="outline" size="sm">
                Filter
              </Button>
            </div>
          </div>

          {analysesWithTraces.length === 0 ? (
            <div className="rounded-xl bg-card border border-border/50 shadow-sm p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No analyses yet. Run an analysis to see your history here.
              </p>
            </div>
          ) : (
            /* Table Card - PayU Style */
            <div className="rounded-xl bg-card border border-border/50 shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b border-border uppercase tracking-wide">
                <span>Date</span>
                <span>Time</span>
                <span>Steps</span>
                <span>Summary</span>
                <span className="text-right">Action</span>
              </div>

              {/* Table Rows */}
              {analysesWithTraces.map(({ analysis, traces }) => (
                <div
                  key={analysis.id}
                  className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors items-center"
                >
                  <span className="font-medium text-sm">
                    {formatDate(analysis.created_at)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(analysis.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {traces.length}
                    </span>
                    <span className="text-xs text-muted-foreground">steps</span>
                  </div>
                  <span className="text-sm text-muted-foreground truncate">
                    {analysis.recommendation?.slice(0, 50)}...
                  </span>
                  <div className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDetails(analysis)}
                      className="text-primary hover:bg-primary/10"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Card */}
          <div className="rounded-xl bg-card border border-border/50 shadow-sm p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">About Analysis History</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your analysis history shows you exactly how our AI analyzes your
                  documents, making every recommendation transparent and
                  trustworthy. Powered by Opik for complete observability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
