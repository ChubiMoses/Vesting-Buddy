// import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { WealthPulseCard } from "@/components/dashboard/wealth-pulse";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { ReasoningTrace } from "@/components/dashboard/reasoning-trace";
import { AgentNudgeCard } from "@/components/dashboard/agent-nudge";
import { InsightCards } from "@/components/dashboard/insight-cards";
import { motion } from "framer-motion";
import {
  mockWealthPulse,
  mockDocuments,
  mockReasoningTrace,
  mockAgentNudges,
  mockInsightCards,
} from "@/lib/data/dashboard";

export default function DashboardPage() {
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) { redirect("/login"); }

  const handleUpload = (files: File[]) => {
    console.log("Uploading files:", files);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-background to-background">
      <DashboardSidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <WealthPulseCard data={mockWealthPulse} />
              
              {mockAgentNudges.map((nudge) => (
                <AgentNudgeCard key={nudge.id} nudge={nudge} />
              ))}

              <DocumentUpload
                documents={mockDocuments}
                reasoningTrace={mockReasoningTrace}
                onUpload={handleUpload}
              />
            </div>

            <div>
              <ReasoningTrace steps={mockReasoningTrace} />
            </div>
          </div>

          <InsightCards cards={mockInsightCards} />

          <div className="bg-card/50 backdrop-blur-xl rounded-3xl border-2 border-primary/20 p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-6">Saved Analyses</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { date: "Jan 15, 2026", savings: 3768, opportunities: 5 },
                { date: "Dec 20, 2025", savings: 2928, opportunities: 4 },
                { date: "Nov 15, 2025", savings: 2156, opportunities: 3 },
              ].map((analysis, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5"
                >
                  <p className="text-sm text-muted-foreground mb-2">{analysis.date}</p>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                    ${analysis.savings.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysis.opportunities} opportunities found
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
