"use client";

import { ReasoningTrace } from "@/components/dashboard/reasoning-trace";
import { mockReasoningTrace } from "@/lib/data/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

export default function TracesPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-primary" />
            Reasoning Traces
          </h1>
          <p className="text-muted-foreground">
            View the complete AI reasoning process for your financial analysis
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ReasoningTrace steps={mockReasoningTrace} />
          </div>

          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Trace Details</CardTitle>
                <CardDescription>
                  Understanding the AI's decision-making process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Total Steps</p>
                  <p className="text-2xl font-bold text-primary">
                    {mockReasoningTrace.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Completed</p>
                  <p className="text-2xl font-bold text-primary">
                    {mockReasoningTrace.filter((s) => s.status === "completed").length}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Processing</p>
                  <p className="text-2xl font-bold text-purple-500">
                    {mockReasoningTrace.filter((s) => s.status === "processing").length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">About Traces</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Reasoning traces show you exactly how our AI analyzes your documents,
                  making every recommendation transparent and trustworthy. Powered by Opik
                  for complete observability.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
