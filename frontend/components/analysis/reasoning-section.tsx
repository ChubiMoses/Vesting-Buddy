"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Brain, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { TraceEvent } from "@/actions/backend";
import { getAnalysisTraces } from "@/actions/backend";
import { TraceProgress } from "@/components/dashboard/trace-progress";

interface ReasoningStep {
  assumption?: string;
  calculation?: string;
  result?: string;
}

interface ReasoningSectionProps {
  data: ReasoningStep[];
  analysisId?: string;
}

export function ReasoningSection({ data, analysisId }: ReasoningSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [showTraces, setShowTraces] = useState(false);

  useEffect(() => {
    if (analysisId) {
      getAnalysisTraces(analysisId).then((result) => {
        if (result) {
          setTraces(result.map((trace) => ({
            step: trace.step_number,
            name: trace.step_name,
            status: trace.step_status as "processing" | "completed" | "failed",
            timestamp: trace.created_at,
          })));
        }
      });
    }
  }, [analysisId]);

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold mb-2">No Reasoning Data Available</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          The AI reasoning steps were not captured for this analysis. This data
          is typically available for newer analyses.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-purple-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">AI Reasoning</h3>
            <p className="text-sm text-muted-foreground">
              Step-by-step analysis logic
            </p>
          </div>
        </div>
        {traces.length > 0 && (
          <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setShowTraces(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !showTraces
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Brain className="w-3.5 h-3.5 inline mr-1" />
              Steps
            </button>
            <button
              onClick={() => setShowTraces(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                showTraces
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="w-3.5 h-3.5 inline mr-1" />
              Traces ({traces.length})
            </button>
          </div>
        )}
      </div>

      {/* Content: Either Reasoning Steps or Traces */}
      {showTraces && traces.length > 0 ? (
        <div className="p-4 rounded-xl bg-card border border-border">
          <TraceProgress traces={traces} />
        </div>
      ) : (
        <>
          {/* Reasoning Steps */}
          <div className="space-y-3">
            {data.map((step, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-left">
                        {step.assumption || `Step ${index + 1}`}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                          {step.calculation && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Calculation
                              </span>
                              <p className="mt-1 text-sm font-mono bg-muted/50 p-3 rounded-lg">
                                {step.calculation}
                              </p>
                            </div>
                          )}
                          {step.result && (
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Result
                              </span>
                              <p className="mt-1 text-sm text-foreground">
                                {step.result}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">
              All calculations are transparent and based on your actual policy
              documents and paystub data. Powered by Opik for complete
              observability.
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}
