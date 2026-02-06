"use client";

import { CreditCard, TrendingUp, Unlock } from "lucide-react";
import type { InsightCard } from "@/lib/data/dashboard";

interface InsightCardsProps {
  cards: InsightCard[];
}

const iconMap = {
  "trending-up": TrendingUp,
  "credit-card": CreditCard,
  unlock: Unlock,
};

export function InsightCards({ cards }: InsightCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = iconMap[card.icon as keyof typeof iconMap] || TrendingUp;
        return (
          <div
            key={card.id}
            className="p-4 rounded-xl bg-card border border-border/50 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {card.title}
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground truncate">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
