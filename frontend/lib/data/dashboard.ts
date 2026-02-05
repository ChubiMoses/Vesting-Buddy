export interface Document {
  id: string;
  name: string;
  type: "paystub" | "benefits" | "other";
  uploadedAt: string;
  status: "processing" | "completed" | "error";
  progress?: number;
}

export interface ReasoningStep {
  id: string;
  step: number;
  action: string;
  file?: string;
  calculation?: string;
  status: "completed" | "processing" | "pending";
}

export interface WealthPulse {
  unlockedThisMonth: number;
  totalUnlocked: number;
  growthPercentage: number;
  lastUpdated: string;
}

export interface AgentNudge {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  action: string;
  value?: string;
  icon: string;
}

export interface InsightCard {
  id: string;
  title: string;
  value: string;
  change: string;
  description: string;
  color: "primary" | "purple" | "yellow";
  icon: string;
}

export interface SavedAnalysis {
  id: string;
  date: string;
  totalSavings: number;
  opportunities: number;
  status: "active" | "archived";
}

export const mockWealthPulse: WealthPulse = {
  unlockedThisMonth: 840,
  totalUnlocked: 3768,
  growthPercentage: 22,
  lastUpdated: new Date().toISOString(),
};

export const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Paystub_Jan_2026.pdf",
    type: "paystub",
    uploadedAt: "2026-01-15T10:30:00Z",
    status: "completed",
  },
  {
    id: "2",
    name: "Benefits_Handbook.pdf",
    type: "benefits",
    uploadedAt: "2026-01-15T10:32:00Z",
    status: "completed",
  },
  {
    id: "3",
    name: "Paystub_Feb_2026.pdf",
    type: "paystub",
    uploadedAt: new Date().toISOString(),
    status: "processing",
    progress: 67,
  },
];

export const mockReasoningTrace: ReasoningStep[] = [
  {
    id: "1",
    step: 1,
    action: "Parsed Paystub_Jan_2026.pdf",
    file: "Paystub_Jan_2026.pdf",
    status: "completed",
  },
  {
    id: "2",
    step: 2,
    action: "Consulted Benefits_Handbook.pdf",
    file: "Benefits_Handbook.pdf (Section 4.2: Matching)",
    status: "completed",
  },
  {
    id: "3",
    step: 3,
    action: "Calculation",
    calculation: "($8k Gross * 6%) - Current $240 = $240 missing",
    status: "completed",
  },
  {
    id: "4",
    step: 4,
    action: "Analyzing HSA contributions",
    status: "processing",
  },
];

export const mockAgentNudges: AgentNudge[] = [
  {
    id: "1",
    priority: "high",
    title: "Maximize Your Match",
    message:
      "Found a 3% match gap in your 401k. Click to generate an HR update email.",
    action: "Generate Email",
    value: "+$160/month",
    icon: "trending-up",
  },
  {
    id: "2",
    priority: "medium",
    title: "HSA Optimization",
    message:
      "You're missing $892 in tax savings. Increase contributions by $75/month.",
    action: "Update Contribution",
    value: "$892/year",
    icon: "piggy-bank",
  },
];

export const mockInsightCards: InsightCard[] = [
  {
    id: "1",
    title: "Maximize Your Match",
    value: "+$160/month",
    change: "6%",
    description: "Employer Match Opportunity",
    color: "purple",
    icon: "trending-up",
  },
  {
    id: "2",
    title: "Debt Destroyer",
    value: "SAVE $45/month",
    change: "12%",
    description: "Consolidate high-interest debt",
    color: "primary",
    icon: "credit-card",
  },
  {
    id: "3",
    title: "Unlock Benefits",
    value: "$1,540/year",
    change: "18%",
    description:
      "Hidden HSA/FSA funds, RSU vesting schedule, Tax advantaged accounts",
    color: "primary",
    icon: "unlock",
  },
];

export const mockSavedAnalyses: SavedAnalysis[] = [
  {
    id: "1",
    date: "2026-01-15",
    totalSavings: 3768,
    opportunities: 5,
    status: "active",
  },
  {
    id: "2",
    date: "2025-12-20",
    totalSavings: 2928,
    opportunities: 4,
    status: "archived",
  },
  {
    id: "3",
    date: "2025-11-15",
    totalSavings: 2156,
    opportunities: 3,
    status: "archived",
  },
];

export const exampleFiles = [
  { name: "Paystub sample", type: "paystub", href: "/demo/paystub-sample.pdf" },
  {
    name: "Handbook sample",
    type: "benefits",
    href: "/demo/handbook-sample.pdf",
  },
  { name: "RSU sample", type: "other", href: "/demo/rsu-sample.pdf" },
];
