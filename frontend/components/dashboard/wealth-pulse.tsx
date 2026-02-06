"use client";

import { DollarSign, TrendingUp } from "lucide-react";
import type { WealthPulse } from "@/lib/data/dashboard";
import { cn } from "@/lib/utils";

interface WealthPulseProps {
  data: WealthPulse;
}

export function WealthPulseCard({ data }: WealthPulseProps) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Wealth Pulse</span>
          </div>
          <p className="text-4xl font-semibold tabular-nums">
            ${data.unlockedThisMonth.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Unlocked this month
          </p>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <div className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
              data.growthPercentage >= 0 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              <TrendingUp className="w-4 h-4" />
              <span>{data.growthPercentage >= 0 ? "+" : ""}{data.growthPercentage}%</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Total Unlocked</p>
            <p className="text-2xl font-semibold tabular-nums">
              ${data.totalUnlocked.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
