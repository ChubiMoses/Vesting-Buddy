"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, FileText } from "lucide-react";

interface PolicyData {
  question?: string;
  answer?: string;
  sources?: string[];
  conflicts?: boolean;
}

interface PolicySectionProps {
  data: PolicyData;
}

export function PolicySection({ data }: PolicySectionProps) {
  if (!data.answer) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold mb-2">No Policy Data Available</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          No benefits handbook was analyzed in this session. Upload a benefits
          handbook to see policy insights.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Policy Insights</h3>
          <p className="text-sm text-muted-foreground">
            Extracted from benefits handbook
          </p>
        </div>
        {data.conflicts !== undefined && (
          <div
            className={`px-3 py-1 rounded-lg ${data.conflicts ? "bg-yellow-500/10 border-yellow-500/20" : "bg-green-500/10 border-green-500/20"} border`}
          >
            <span
              className={`text-xs font-medium flex items-center gap-1 ${data.conflicts ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}
            >
              {data.conflicts ? (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Conflicts Found
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  No Conflicts
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Question Asked */}
      {data.question && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold mb-1">Query</h4>
              <p className="text-sm text-muted-foreground">{data.question}</p>
            </div>
          </div>
        </div>
      )}

      {/* Answer */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Policy Answer
        </h4>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {data.answer}
          </p>
        </div>
      </div>

      {/* Sources */}
      {data.sources && data.sources.length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Sources
          </h4>
          <ul className="space-y-2">
            {data.sources.map((source, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
