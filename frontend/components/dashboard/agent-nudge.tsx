"use client";

import { motion } from "framer-motion";
import { ArrowRight, PiggyBank, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentNudge } from "@/lib/data/dashboard";

interface AgentNudgeProps {
  nudge: AgentNudge;
  onViewDetails?: () => void;
}

const iconMap = {
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
};

const priorityStyles = {
  high: "border-l-4 border-l-primary",
  medium: "border-l-4 border-l-primary",
  low: "border-l-4 border-l-muted-foreground/30 bg-muted/20",
};

export function AgentNudgeCard({ nudge, onViewDetails }: AgentNudgeProps) {
  const Icon = iconMap[nudge.icon as keyof typeof iconMap] || TrendingUp;
  const style = priorityStyles[nudge.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow ${style}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-muted-foreground/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground">{nudge.title}</h4>
          {nudge.value && (
            <p className="text-sm font-semibold text-primary mt-0.5 font-mono">
              {nudge.value}
            </p>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {nudge.message}
      </p>
      <Button
        size="sm"
        variant="outline"
        className="w-full group text-sm"
        onClick={onViewDetails}
      >
        {nudge.action}
        <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Button>
    </motion.div>
  );
}
