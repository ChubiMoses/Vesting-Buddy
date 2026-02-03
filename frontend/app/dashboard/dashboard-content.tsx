"use client";

import { useRouter } from "next/navigation";
import { WealthPulseCard } from "@/components/dashboard/wealth-pulse";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { ReasoningTrace } from "@/components/dashboard/reasoning-trace";
import { AgentNudgeCard } from "@/components/dashboard/agent-nudge";
import { InsightCards } from "@/components/dashboard/insight-cards";
import { motion } from "framer-motion";
import {
  analysisToWealthPulse,
  analysisToAgentNudges,
  analysisToInsightCards,
  analysisToSavedAnalysis,
} from "@/lib/map-analysis-to-dashboard";
import { mockReasoningTrace } from "@/lib/data/dashboard";
import type { Document } from "@/lib/data/dashboard";
import type { AnalysisRow } from "@/actions/backend";
import type { StoredDocument } from "@/actions/storage";
import type { WealthPulse } from "@/lib/data/dashboard";

const EMPTY_WEALTH_PULSE: WealthPulse = {
  unlockedThisMonth: 0,
  totalUnlocked: 0,
  growthPercentage: 0,
  lastUpdated: new Date().toISOString(),
};

function storedToDocuments(stored: StoredDocument[]): Document[] {
  return stored.map((d) => ({
    id: d.path,
    name: d.name,
    type: "other",
    uploadedAt: d.created_at ?? new Date().toISOString(),
    status: "completed",
  }));
}

interface DashboardContentProps {
  analyses: AnalysisRow[];
  documents: StoredDocument[];
}

export function DashboardContent({ analyses, documents }: DashboardContentProps) {
  const router = useRouter();
  const latest = analyses[0] ?? null;
  const wealthPulse = latest ? analysisToWealthPulse(latest) : EMPTY_WEALTH_PULSE;
  const nudges = latest ? analysisToAgentNudges(latest) : [];
  const insightCards = latest ? analysisToInsightCards(latest) : [];
  const savedAnalyses = analyses.map(analysisToSavedAnalysis);
  const docList = storedToDocuments(documents);

  const handleUpload = () => {
    router.push("/dashboard/upload");
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <WealthPulseCard data={wealthPulse} />
            {nudges.length > 0 ? (
              nudges.map((nudge) => (
                <AgentNudgeCard key={nudge.id} nudge={nudge} />
              ))
            ) : (
              <div className="bg-card/50 backdrop-blur-xl rounded-2xl border-2 border-primary/20 p-6 text-center text-muted-foreground">
                <p>Run an analysis to see personalized nudges.</p>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/upload")}
                  className="mt-2 text-primary hover:underline"
                >
                  Upload documents and analyze
                </button>
              </div>
            )}
            <DocumentUpload
              documents={docList}
              reasoningTrace={mockReasoningTrace}
              onUpload={handleUpload}
            />
          </div>
          <div>
            <ReasoningTrace steps={mockReasoningTrace} />
          </div>
        </div>

        {insightCards.length > 0 ? (
          <InsightCards cards={insightCards} />
        ) : (
          <div className="bg-card/50 backdrop-blur-xl rounded-2xl border-2 border-primary/20 p-6 text-center text-muted-foreground">
            <p>Upload documents and run analysis to see insights.</p>
          </div>
        )}

        <div className="bg-card/50 backdrop-blur-xl rounded-3xl border-2 border-primary/20 p-8 shadow-xl">
          <h3 className="text-xl font-bold mb-6">Saved Analyses</h3>
          {savedAnalyses.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {savedAnalyses.map((analysis, index) => (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5"
                >
                  <p className="text-sm text-muted-foreground mb-2">{analysis.date}</p>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                    ${analysis.totalSavings.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.opportunities} opportunities found
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No analyses yet. Upload documents and run analysis from the Upload page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
