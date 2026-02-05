"use client";

import { motion } from "framer-motion";
import { TrendingUp, CreditCard, Unlock } from "lucide-react";
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
      {cards.map((card, index) => {
        const Icon = iconMap[card.icon as keyof typeof iconMap] || TrendingUp;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-border bg-card/50 px-4 py-3 flex items-center gap-3 hover:bg-card/80 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-muted-foreground/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {card.title}
              </p>
              <p className="text-sm font-semibold font-mono text-foreground truncate">
                {card.value}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
