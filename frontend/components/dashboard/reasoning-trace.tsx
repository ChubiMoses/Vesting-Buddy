"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Clock } from "lucide-react";
import type { ReasoningStep } from "@/lib/data/dashboard";

interface ReasoningTraceProps {
  steps: ReasoningStep[];
}

export function ReasoningTrace({ steps }: ReasoningTraceProps) {
  return (
    <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border p-6 ">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Reasoning Trace</h3>
        <button className="text-sm text-primary hover:underline">
          View Full Trace
        </button>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-4"
          >
            <div className="shrink-0 mt-1">
              {step.status === "completed" && (
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              )}
              {step.status === "processing" && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              )}
              {step.status === "pending" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Step {step.step}.
                </span>
                <span className="text-sm font-medium">{step.action}</span>
              </div>
              {step.file && (
                <p className="text-xs text-muted-foreground pl-6">
                  {step.file}
                </p>
              )}
              {step.calculation && (
                <div className="pl-6 mt-2 p-3 rounded-lg bg-primary/10 border border-border">
                  <p className="text-xs font-mono text-primary">
                    {step.calculation}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
