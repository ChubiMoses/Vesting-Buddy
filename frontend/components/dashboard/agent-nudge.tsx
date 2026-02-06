"use client";

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

export function AgentNudgeCard({ nudge, onViewDetails }: AgentNudgeProps) {
  const Icon = iconMap[nudge.icon as keyof typeof iconMap] || TrendingUp;

  return (
    <div className="p-5 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-foreground">{nudge.title}</h4>
          {nudge.value && (
            <p className="text-sm font-semibold text-primary mt-0.5 tabular-nums">
              {nudge.value}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {nudge.message}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 group"
            onClick={onViewDetails}
          >
            {nudge.action}
            <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
