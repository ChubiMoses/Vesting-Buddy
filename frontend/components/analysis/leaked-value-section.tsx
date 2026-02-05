"use client";

import { TrendingUp, AlertTriangle, CheckCircle2, Percent, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

interface LeakedValueData {
  gross_pay?: number;
  current_401k?: number;
  current_401k_rate?: number;
  match_rate?: number;
  match_up_to?: number;
  gap_rate?: number;
  annual_opportunity_cost?: number;
  pay_periods_per_year?: number;
  policy_missing_match?: boolean;
  tiers_present?: boolean;
  tiers?: [number, number][];
  employee_name?: string;
  paystub_verification?: {
    status?: string;
    message?: string;
  };
}

interface LeakedValueSectionProps {
  data: LeakedValueData;
}

export function LeakedValueSection({ data }: LeakedValueSectionProps) {
  const oppCost = data.annual_opportunity_cost ?? 0;
  const gapRate = (data.gap_rate ?? 0) * 100;
  const currentRate = (data.current_401k_rate ?? 0) * 100;
  const matchUpTo = (data.match_up_to ?? 0) * 100;
  const verification = data.paystub_verification?.status || "unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold">Financial Breakdown</h3>
        <p className="text-sm text-muted-foreground">Opportunity cost analysis</p>
      </div>

      {/* Opportunity Cost Highlight */}
      {oppCost > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Annual Opportunity Cost</span>
            <AlertTriangle className="w-5 h-5 text-primary" />
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent font-mono">
            ${oppCost.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Money left on the table annually
          </p>
        </div>
      )}

      {/* Current vs. Optimal */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current Rate
            </span>
          </div>
          <div className="text-2xl font-bold font-mono">{currentRate.toFixed(1)}%</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Match Up To
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-primary">{matchUpTo.toFixed(1)}%</div>
        </div>
      </div>

      {/* Gap Visualization */}
      {gapRate > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Contribution Gap</span>
            <span className="text-sm font-bold text-primary font-mono">{gapRate.toFixed(1)}%</span>
          </div>
          <div className="relative h-8 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentRate / matchUpTo) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-purple-500"
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
              {currentRate.toFixed(1)}% of {matchUpTo.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Match Tiers */}
      {data.tiers_present && data.tiers && data.tiers.length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Match Structure
          </h4>
          <div className="space-y-2">
            {data.tiers.map(([matchPercent, upToPercent], i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                <span className="text-sm font-medium">
                  {(matchPercent * 100).toFixed(0)}% match
                </span>
                <span className="text-sm text-muted-foreground">
                  on first {(upToPercent * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Gross Pay
            </span>
          </div>
          <div className="text-lg font-bold font-mono">
            ${(data.gross_pay ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pay Periods/Year
            </span>
          </div>
          <div className="text-lg font-bold font-mono">
            {data.pay_periods_per_year ?? "—"}
          </div>
        </div>
      </div>

      {/* Verification Status */}
      {data.paystub_verification && (
        <div className={`p-4 rounded-xl border ${
          verification === 'correct' 
            ? 'bg-green-500/10 border-green-500/20' 
            : 'bg-yellow-500/10 border-yellow-500/20'
        }`}>
          <div className="flex items-start gap-3">
            {verification === 'correct' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-semibold mb-1">Verification Status</h4>
              <p className="text-sm text-muted-foreground">
                {data.paystub_verification.message || verification}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
