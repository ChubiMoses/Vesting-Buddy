"use client";

import { motion } from "framer-motion";
import { TrendingUp, PiggyBank, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentNudge } from "@/lib/data/dashboard";

interface AgentNudgeProps {
  nudge: AgentNudge;
}

const iconMap = {
  "trending-up": TrendingUp,
  "piggy-bank": PiggyBank,
};

export function AgentNudgeCard({ nudge }: AgentNudgeProps) {
  const Icon = iconMap[nudge.icon as keyof typeof iconMap] || TrendingUp;
  const priorityColors = {
    high: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    medium: "from-primary/20 to-cyan-500/20 border-primary/30",
    low: "from-muted/20 to-muted/20 border-muted/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-xl rounded-2xl border-2 p-6 shadow-xl`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-lg">{nudge.title}</h4>
            {nudge.value && (
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                {nudge.value}
              </p>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{nudge.message}</p>
      <Button size="sm" className="w-full group">
        {nudge.action}
        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Button>
    </motion.div>
  );
}
