"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { WealthPulse } from "@/lib/data/dashboard";

interface WealthPulseProps {
  data: WealthPulse;
}

export function WealthPulseCard({ data }: WealthPulseProps) {
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (data.growthPercentage / 100) * circumference;

  return (
    <div className="relative bg-card/50 backdrop-blur-xl rounded-3xl border-2 border-primary/20 p-8 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent rounded-3xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Wealth Pulse</h3>
            <p className="text-3xl font-bold text-foreground">${data.unlockedThisMonth}</p>
            <p className="text-sm text-muted-foreground mt-1">Unlocked This Month</p>
          </div>
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-primary/10"
              />
              <motion.circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-navy-blue)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{data.growthPercentage}%</div>
                <div className="text-xs text-muted-foreground">Growth</div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Unlocked</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                ${data.totalUnlocked.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">+{data.growthPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
