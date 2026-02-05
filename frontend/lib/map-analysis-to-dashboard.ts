import type { AnalysisRow } from "@/actions/backend";
import type {
  AgentNudge,
  InsightCard,
  WealthPulse,
} from "@/lib/data/dashboard";

function toNum(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") return parseFloat(v) || 0;
  return 0;
}

export function analysisToWealthPulse(row: AnalysisRow): WealthPulse {
  const paystub = row.paystub_data ?? {};
  const lv = row.leaked_value ?? {};
  const netPay = toNum(paystub.net_pay ?? paystub.gross_pay ?? 0);
  const annualCost = toNum(lv.annual_opportunity_cost ?? 0);
  const totalUnlocked = annualCost > 0 ? annualCost : 0;
  return {
    unlockedThisMonth: netPay > 0 ? Math.round(netPay) : 0,
    totalUnlocked: Math.round(totalUnlocked),
    growthPercentage: totalUnlocked > 0 ? 22 : 0,
    lastUpdated: row.created_at ?? new Date().toISOString(),
  };
}

const impactToPriority = (impact: string): "high" | "medium" | "low" =>
  impact === "high" ? "high" : impact === "medium" ? "medium" : "low";

const actionToIcon = (action: string): string => {
  const lower = action.toLowerCase();
  if (
    lower.includes("401k") ||
    lower.includes("match") ||
    lower.includes("contribution")
  )
    return "trending-up";
  if (
    lower.includes("hsa") ||
    lower.includes("tax") ||
    lower.includes("savings")
  )
    return "piggy-bank";
  if (lower.includes("vesting")) return "unlock";
  return "trending-up";
};

export function analysisToAgentNudges(row: AnalysisRow): AgentNudge[] {
  const plan = (row.action_plan ?? []) as Array<{
    action?: string;
    impact?: string;
    effort?: string;
  }>;
  const lv = row.leaked_value ?? {};
  const annualCost = toNum(lv.annual_opportunity_cost ?? 0);
  const valueStr =
    annualCost > 0 ? `+$${Math.round(annualCost)}/year` : undefined;

  return plan.map((item, i) => ({
    id: `nudge-${row.id}-${i}`,
    priority: impactToPriority(item.impact ?? "medium"),
    title: item.action ?? "Review benefit",
    message: [item.action, item.effort && `Effort: ${item.effort}`]
      .filter(Boolean)
      .join(". "),
    action: "Learn more",
    value: i === 0 ? valueStr : undefined,
    icon: actionToIcon(item.action ?? ""),
  }));
}

const actionToCardColor = (index: number): "primary" | "purple" | "yellow" =>
  index % 3 === 0 ? "purple" : index % 3 === 1 ? "primary" : "yellow";

export function analysisToInsightCards(row: AnalysisRow): InsightCard[] {
  const plan = (row.action_plan ?? []) as Array<{
    action?: string;
    impact?: string;
  }>;
  const lv = row.leaked_value ?? {};
  const gapRate = toNum(lv.gap_rate ?? 0) * 100;
  const annualCost = toNum(lv.annual_opportunity_cost ?? 0);

  const cards: InsightCard[] = [];
  if (annualCost > 0) {
    cards.push({
      id: `insight-${row.id}-opp`,
      title: "Match opportunity",
      value: `+$${Math.round(annualCost)}/year`,
      change: gapRate > 0 ? `${gapRate.toFixed(1)}%` : "—",
      description: "401k match gap from latest analysis",
      color: "purple",
      icon: "trending-up",
    });
  }
  plan.forEach((item, i) => {
    cards.push({
      id: `insight-${row.id}-${i}`,
      title: item.action ?? "Review",
      value: "—",
      change: item.impact ?? "—",
      description: `Impact: ${item.impact ?? "medium"}`,
      color: actionToCardColor(cards.length),
      icon: actionToIcon(item.action ?? ""),
    });
  });
  return cards.slice(0, 3);
}

export function analysisToSavedAnalysis(row: AnalysisRow): {
  id: string;
  date: string;
  totalSavings: number;
  opportunities: number;
  status: "active" | "archived";
} {
  const lv = row.leaked_value ?? {};
  const plan = (row.action_plan ?? []) as unknown[];
  const created = row.created_at ?? "";
  const date = created.slice(0, 10);
  const totalSavings = Math.round(toNum(lv.annual_opportunity_cost ?? 0));
  return {
    id: row.id,
    date,
    totalSavings,
    opportunities: plan.length,
    status: "active",
  };
}
