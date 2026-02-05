"use client";

import { motion } from "framer-motion";
import {
  Book,
  Bot,
  Calculator,
  CheckCircle2,
  Dot,
  FileDown,
  FileText,
  Loader2,
  Shield,
} from "lucide-react";
import type { TraceEvent } from "@/actions/backend";

const TRACE_LABELS: Record<string, { label: string; icon: typeof FileDown }> = {
  download_files: { label: "Downloading documents", icon: FileDown },
  load_agents: { label: "Initializing AI agents", icon: Bot },
  extract_paystub: { label: "Reading paystub", icon: FileText },
  extract_rsu: { label: "Reading RSU grant", icon: FileText },
  policy_scout: { label: "Analyzing benefits handbook", icon: Book },
  strategist: { label: "Computing leaked value", icon: Calculator },
  guardrail: { label: "Running safety checks", icon: Shield },
};

interface TraceProgressProps {
  traces: TraceEvent[];
}

export function TraceProgress({ traces }: TraceProgressProps) {
  return (
    <div className="space-y-3">
      {traces.map((trace, index) => {
        const config = TRACE_LABELS[trace.name] || {
          label: trace.name,
          icon: Loader2,
        };
        const Icon = config.icon;
        const isProcessing = trace.status === "processing";
        const isCompleted = trace.status === "completed";
        const isFailed = trace.status === "failed";

        return (
          <motion.div
            key={trace.step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-primary/10"
          >
            <div className="shrink-0">
              {isCompleted && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
              )}
              {isProcessing && (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Dot className="w-20 h-20 text-amber-500 animate-pulse" />
                </div>
              )}
              {isFailed && (
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-destructive" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{config.label}</p>
              {trace.payload && Object.keys(trace.payload).length > 0 && (
                <p className="text-xs text-muted-foreground truncate">
                  {JSON.stringify(trace.payload).slice(0, 80)}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
