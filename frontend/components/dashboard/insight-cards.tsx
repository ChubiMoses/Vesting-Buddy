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
  "unlock": Unlock,
};

const colorClasses = {
  primary: "from-primary/20 to-cyan-500/20 border-primary/30",
  purple: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  yellow: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
};

export function InsightCards({ cards }: InsightCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = iconMap[card.icon as keyof typeof iconMap] || TrendingUp;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className={`backdrop-blur-xl rounded-2xl border-2 p-6 shadow-xl cursor-pointer transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground">{card.change}</p>
              </div>
            </div>
            <h4 className="font-bold text-lg mb-2">{card.title}</h4>
            <p className="text-sm text-muted-foreground">{card.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
