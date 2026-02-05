"use client";

import { motion } from "framer-motion";
import { Clock, Target, Zap } from "lucide-react";

interface ActionItem {
  action?: string;
  impact?: string;
  effort?: string;
}

interface ActionPlanSectionProps {
  data: ActionItem[];
}

const impactColors = {
  high: "from-primary to-purple-500",
  medium: "from-purple-500 to-primary",
  low: "from-muted-foreground to-muted-foreground",
};

const impactIcons = {
  high: Zap,
  medium: Target,
  low: Clock,
};

export function ActionPlanSection({ data }: ActionPlanSectionProps) {
  if (!data || data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold">Action Plan</h3>
        <p className="text-sm text-muted-foreground">
          Recommended next steps to maximize your benefits
        </p>
      </div>

      {/* Action Cards */}
      <div className="space-y-4">
        {data.map((item, index) => {
          const impact = (item.impact?.toLowerCase() ||
            "medium") as keyof typeof impactColors;
          const Icon = impactIcons[impact] || Target;
          const gradientClass = impactColors[impact] || impactColors.medium;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-5 rounded-xl border-2 border-border bg-card hover:border-primary/40 transition-all group"
            >
              <div className="flex items-start gap-4">
                {/* Priority Indicator */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Action */}
                  <h4 className="text-base font-bold mb-2 group-hover:text-primary transition-colors">
                    {item.action || "Action item"}
                  </h4>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2">
                    {item.impact && (
                      <div
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          impact === "high"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : impact === "medium"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {item.impact.toUpperCase()} IMPACT
                      </div>
                    )}
                    {item.effort && (
                      <div className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium border border-border">
                        {item.effort} effort
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Number */}
                <div className="text-3xl font-bold text-muted-foreground/20 font-mono shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <p className="text-sm font-medium">
            <span className="font-bold">{data.length}</span> action
            {data.length !== 1 ? "s" : ""} to optimize your benefits
          </p>
        </div>
      </div>
    </motion.div>
  );
}
