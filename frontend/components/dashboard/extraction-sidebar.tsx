"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Copy, Download, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExtractionSidebarProps {
  data: Record<string, unknown> | null;
  type: "paystub" | "rsu" | "policy" | null;
  isOpen: boolean;
  onClose: () => void;
}

const typeLabels = {
  paystub: "Paystub Extraction",
  rsu: "RSU Grant Extraction",
  policy: "Policy Extraction",
};

export function ExtractionSidebar({
  data,
  type,
  isOpen,
  onClose,
}: ExtractionSidebarProps) {
  const [copied, setCopied] = useState(false);

  if (!data || !type) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-extraction-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return value.toLocaleString();
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === "object") return "[Object]";
    return String(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-[640px] bg-background border-l border-border shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex-none p-6 border-b border-border bg-card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-1">
                    {typeLabels[type]}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    AI-extracted structured data
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy JSON"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {Object.entries(data).map(([key, value], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                          {key.replace(/_/g, " ")}
                        </h4>
                        {typeof value === "object" &&
                        value !== null &&
                        !Array.isArray(value) ? (
                          <div className="space-y-2 mt-2">
                            {Object.entries(
                              value as Record<string, unknown>,
                            ).map(([subKey, subValue]) => (
                              <div
                                key={subKey}
                                className="flex items-center justify-between py-1"
                              >
                                <span className="text-xs text-muted-foreground">
                                  {subKey.replace(/_/g, " ")}
                                </span>
                                <span className="text-sm font-medium tabular-nums">
                                  {renderValue(subValue)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : Array.isArray(value) ? (
                          <div className="space-y-1 mt-2">
                            {value.map((item, i) => (
                              <div
                                key={i}
                                className="text-sm p-2 rounded bg-muted/50"
                              >
                                {renderValue(item)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-base font-medium tabular-nums">
                            {renderValue(value)}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Confidence Score */}
              {data._extraction_confidence !== undefined && (
                <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Extraction Confidence
                    </span>
                    <span className="text-lg font-semibold text-primary tabular-nums">
                      {((data._extraction_confidence as number) * 100).toFixed(
                        0,
                      )}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
