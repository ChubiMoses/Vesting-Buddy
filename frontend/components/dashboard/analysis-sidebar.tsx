"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  DollarSign,
  FileText,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AnalysisRow, AnalysisTrace } from "@/actions/backend";
import { getAnalysisTraces } from "@/actions/backend";
import { ActionPlanSection } from "@/components/analysis/action-plan-section";
import { LeakedValueSection } from "@/components/analysis/leaked-value-section";
import { PaystubSection } from "@/components/analysis/paystub-section";
import { PolicySection } from "@/components/analysis/policy-section";
import { ReasoningSection } from "@/components/analysis/reasoning-section";

interface AnalysisSidebarProps {
  analysis: AnalysisRow | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabId =
  | "summary"
  | "paystub"
  | "policy"
  | "financial"
  | "reasoning"
  | "actions";

const tabs: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "paystub", label: "Paystub", icon: DollarSign },
  { id: "policy", label: "Policy", icon: FileText },
  { id: "financial", label: "Financial", icon: TrendingUp },
  { id: "reasoning", label: "Reasoning", icon: Brain },
  { id: "actions", label: "Actions", icon: Target },
];

// Convert traces to reasoning steps format
function convertTracesToReasoningSteps(traces: AnalysisTrace[]): any[] {
  const steps: any[] = [];
  
  // Group traces by agent/task name
  const groupedTraces = new Map<string, AnalysisTrace[]>();
  
  traces.forEach((trace) => {
    if (!groupedTraces.has(trace.step_name)) {
      groupedTraces.set(trace.step_name, []);
    }
    groupedTraces.get(trace.step_name)!.push(trace);
  });
  
  // Convert each group to a reasoning step
  groupedTraces.forEach((traceGroup, name) => {
    const processingTrace = traceGroup.find(t => t.step_status === 'processing');
    const completedTrace = traceGroup.find(t => t.step_status === 'completed');
    
    if (completedTrace) {
      const payloadInfo = completedTrace.payload 
        ? Object.entries(completedTrace.payload)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : 'No additional data';
      
      steps.push({
        assumption: `Agent: ${name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        calculation: `Status: ${completedTrace.step_status}`,
        result: payloadInfo,
      });
    }
  });
  
  return steps;
}

export function AnalysisSidebar({
  analysis,
  isOpen,
  onClose,
}: AnalysisSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [reasoningSteps, setReasoningSteps] = useState<any[]>([]);

  useEffect(() => {
    if (analysis?.id) {
      getAnalysisTraces(analysis.id).then((traces) => {
        if (traces && traces.length > 0) {
          const steps = convertTracesToReasoningSteps(traces);
          setReasoningSteps(steps);
        }
      });
    }
  }, [analysis?.id]);

  if (!analysis) return null;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-[640px] bg-background border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex-none p-6 border-b border-border bg-card/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">Analysis Details</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(analysis.created_at)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-none border-b border-border bg-card/30 overflow-x-auto">
              <div className="flex gap-1 px-6 py-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "summary" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold mb-4">
                          Executive Summary
                        </h3>
                        {analysis.recommendation ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-bold prose-p:text-muted-foreground prose-strong:text-foreground prose-ul:text-muted-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {analysis.recommendation}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No summary available
                          </p>
                        )}
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                        <div className="p-4 rounded-xl bg-linear-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Opportunity Cost
                          </span>
                          <p className="text-2xl font-bold font-mono mt-1 bg-linear-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                            $
                            {(
                              (analysis.leaked_value as any)
                                ?.annual_opportunity_cost ?? 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-card border border-border">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Action Items
                          </span>
                          <p className="text-2xl font-bold font-mono mt-1">
                            {((analysis.action_plan as any[]) ?? []).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "paystub" && (
                    <PaystubSection
                      data={(analysis.paystub_data ?? {}) as any}
                    />
                  )}

                  {activeTab === "policy" && (
                    <PolicySection data={(analysis.policy_answer ?? {}) as any} />
                  )}

                  {activeTab === "financial" && (
                    <LeakedValueSection
                      data={(analysis.leaked_value ?? {}) as any}
                    />
                  )}

                  {activeTab === "reasoning" && (
                    <ReasoningSection 
                      data={reasoningSteps} 
                      analysisId={analysis.id}
                    />
                  )}

                  {activeTab === "actions" && (
                    <ActionPlanSection
                      data={((analysis.action_plan ?? []) as any[]) || []}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
