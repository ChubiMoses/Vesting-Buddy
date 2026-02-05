"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitBranch, ChevronDown, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TraceProgress } from "@/components/dashboard/trace-progress";
import { AnalysisSidebar } from "@/components/dashboard/analysis-sidebar";
import type { AnalysisRow, AnalysisTrace } from "@/actions/backend";

interface AnalysisWithTraces {
  analysis: AnalysisRow;
  traces: AnalysisTrace[];
}

interface TracesContentProps {
  analysesWithTraces: AnalysisWithTraces[];
}

export function TracesContent({ analysesWithTraces }: TracesContentProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    analysesWithTraces[0]?.analysis.id ?? null,
  );
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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <AnalysisSidebar
        analysis={selectedAnalysis}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <GitBranch className="w-8 h-8 text-primary" />
              Reasoning Traces
            </h1>
            <p className="text-muted-foreground">
              View the complete AI reasoning process for your financial analyses
            </p>
          </div>

          {analysesWithTraces.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur-xl border border-border">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  No analyses yet. Run an analysis to see traces here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analysesWithTraces.map(({ analysis, traces }) => {
                const isExpanded = expandedId === analysis.id;
                const traceEvents = traces.map((t) => ({
                  step: t.step_number,
                  name: t.step_name,
                  status: t.step_status as
                    | "processing"
                    | "completed"
                    | "failed",
                  payload: (t.payload ?? {}) as Record<string, unknown>,
                  timestamp: t.created_at,
                }));

                return (
                  <Card
                    key={analysis.id}
                    className="bg-card/50 backdrop-blur-xl border border-border"
                  >
                    <CardHeader>
                      <div
                        onClick={() =>
                          setExpandedId(isExpanded ? null : analysis.id)
                        }
                        className="w-full text-left flex items-start justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <CardTitle className="flex items-center gap-2 mb-2">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-primary shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                            )}
                            <span className="text-lg font-bold">
                              Analysis from {formatDate(analysis.created_at)}
                            </span>
                          </CardTitle>
                          <CardDescription className="truncate">
                            {analysis.recommendation?.slice(0, 120)}
                            {(analysis.recommendation?.length ?? 0) > 120
                              ? "…"
                              : ""}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(analysis);
                            }}
                            className="text-primary hover:bg-primary/10"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              Steps
                            </div>
                            <div className="text-2xl font-bold text-primary">
                              {traces.length}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent>
                        <TraceProgress traces={traceEvents} />
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="bg-card/50 backdrop-blur-xl border border-border">
            <CardHeader>
              <CardTitle className="text-lg">About Traces</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reasoning traces show you exactly how our AI analyzes your
                documents, making every recommendation transparent and
                trustworthy. Powered by Opik for complete observability.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
