"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type AnalysisRow,
  getAnalyses,
  saveAnalysis,
  saveTraces,
  type TraceEvent,
} from "@/actions/backend";
import {
  createSignedUrl,
  listUserDocuments,
  type StoredDocument,
} from "@/actions/storage";
import { TraceProgress } from "@/components/dashboard/trace-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { consumeAnalysisStream } from "@/lib/analysis-stream";
import {
  DEMO_HANDBOOK_PATH,
  DEMO_PAYSTUB_PATH,
  DEMO_RSU_PATH,
} from "@/lib/demo-paths";
import { createClient } from "@/lib/supabase/client";

type Slot = "paystub" | "handbook" | "rsu";

const SLOT_CONFIG = {
  paystub: {
    label: "Monthly Paystub",
    description: "Recent pay statement with deductions",
    required: true,
  },
  handbook: {
    label: "Benefits Handbook",
    description: "Company policy document (401k, HSA, etc.)",
    required: true,
  },
  rsu: {
    label: "Equity/RSU Grant",
    description: "Stock compensation details (optional)",
    required: false,
  },
};

export default function AnalysePage() {
  const router = useRouter();
  const [paths, setPaths] = useState<Record<Slot, string | null>>({
    paystub: null,
    handbook: null,
    rsu: null,
  });
  const [useDemo, setUseDemo] = useState(false);
  const [uploading, setUploading] = useState<Slot | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentDocs, setRecentDocs] = useState<StoredDocument[]>([]);
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [showTraces, setShowTraces] = useState(false);
  const [showDocPicker, setShowDocPicker] = useState<Slot | null>(null);
  const [previousAnalyses, setPreviousAnalyses] = useState<AnalysisRow[]>([]);

  useEffect(() => {
    listUserDocuments().then(setRecentDocs);
    getAnalyses(5).then(setPreviousAnalyses);
  }, []);

  const uploadFile = async (slot: Slot, file: File) => {
    setError(null);
    setUploading(slot);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      setUploading(null);
      return;
    }
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file);
    setUploading(null);
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    setPaths((prev) => ({ ...prev, [slot]: path }));
    setUseDemo(false);
    listUserDocuments().then(setRecentDocs);
  };

  const selectExistingDocument = (slot: Slot, path: string) => {
    setPaths((prev) => ({ ...prev, [slot]: path }));
    setUseDemo(false);
    setShowDocPicker(null);
  };

  const canRunAnalysis = useDemo || (paths.paystub && paths.handbook);

  const handleRunAnalysis = async () => {
    if (!canRunAnalysis) return;
    setError(null);
    setIsAnalyzing(true);
    setTraces([]);
    setShowTraces(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    let paystubUrl: string;
    let handbookUrl: string;
    let rsuUrl: string | null = null;
    let storagePaths = { paystub_url: "", handbook_url: "", rsu_url: "" };

    if (useDemo) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      if (!origin) {
        setError("Could not determine site URL. Try uploading files instead.");
        setIsAnalyzing(false);
        return;
      }
      paystubUrl = origin + DEMO_PAYSTUB_PATH;
      handbookUrl = origin + DEMO_HANDBOOK_PATH;
      rsuUrl = origin + DEMO_RSU_PATH;
      storagePaths = {
        paystub_url: paystubUrl,
        handbook_url: handbookUrl,
        rsu_url: rsuUrl,
      };
    } else {
      const { url: pUrl, error: e1 } = await createSignedUrl(
        paths.paystub!,
        3600,
      );
      const { url: hUrl, error: e2 } = await createSignedUrl(
        paths.handbook!,
        3600,
      );
      if (e1 || !pUrl || e2 || !hUrl) {
        setError(e1 || e2 || "Failed to get signed URLs");
        setIsAnalyzing(false);
        return;
      }
      paystubUrl = pUrl;
      handbookUrl = hUrl;
      storagePaths = {
        paystub_url: paths.paystub!,
        handbook_url: paths.handbook!,
        rsu_url: paths.rsu || "",
      };

      if (paths.rsu) {
        const { url, error: e3 } = await createSignedUrl(paths.rsu, 3600);
        if (!e3 && url) rsuUrl = url;
      }
    }

    const collectedTraces: TraceEvent[] = [];
    console.log("[Upload] Starting analysis stream...");
    const result = await consumeAnalysisStream(
      paystubUrl,
      handbookUrl,
      rsuUrl,
      (trace) => {
        collectedTraces.push(trace);
        setTraces((prev) => [...prev, trace]);
      },
    );

    setIsAnalyzing(false);
    console.log("[Upload] Stream finished. Result:", result);

    if (result.error) {
      console.error("[Upload] Analysis error:", result.error);
      setError(result.error);
      return;
    }

    if (!result.result) {
      console.error("[Upload] No result received from analysis");
      setError("Analysis completed but no result was received");
      return;
    }

    if (result.analysisId) {
      console.log(
        "[Upload] Saving analysis with stream ID:",
        result.analysisId,
        "with",
        collectedTraces.length,
        "traces",
      );

      const saveResult = await saveAnalysis(
        user.id,
        result.result,
        storagePaths,
        result.analysisId,
      );
      if (saveResult.error) {
        console.error("[Upload] Failed to save analysis:", saveResult.error);
        setError(`Analysis completed but failed to save: ${saveResult.error}`);
        return;
      }
      console.log(
        "[Upload] Analysis saved successfully with ID:",
        saveResult.id,
      );

      if (collectedTraces.length > 0) {
        console.log(
          "[Upload] Saving",
          collectedTraces.length,
          "traces for analysis ID:",
          result.analysisId,
        );
        const traceResult = await saveTraces(
          result.analysisId,
          collectedTraces,
        );
        if (traceResult.error) {
          console.error("[Upload] Failed to save traces:", traceResult.error);
          setError(`Analysis saved but traces failed: ${traceResult.error}`);
        } else {
          console.log("[Upload] Traces saved successfully!");
        }
      } else {
        console.warn("[Upload] No traces to save!");
      }

      // Refresh analyses list
      getAnalyses(5).then(setPreviousAnalyses);
    }

    router.push("/dashboard");
    router.refresh();
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getOpportunityCost = (analysis: AnalysisRow): number => {
    const lv = analysis.leaked_value as Record<string, unknown> | null;
    return (lv?.annual_opportunity_cost as number) ?? 0;
  };

  const toggleDemo = () => {
    if (useDemo) {
      setUseDemo(false);
      setPaths({ paystub: null, handbook: null, rsu: null });
    } else {
      setUseDemo(true);
      setPaths({ paystub: null, handbook: null, rsu: null });
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background/95 to-primary/5 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-tight">
            Financial Analysis
          </h1>
          <p className="text-xl text-muted-foreground font-light">
            Uncover hidden value in your compensation package
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Analysis Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Document Upload Section */}
            <Card className="bg-card/80 backdrop-blur-2xl border border-border shadow-2xl shadow-primary/10">
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Upload Documents</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your Personal CFO analyzes these to find unclaimed wealth
                    </p>
                  </div>
                  <Button
                    variant={useDemo ? "default" : "outline"}
                    size="sm"
                    onClick={toggleDemo}
                    className={
                      useDemo
                        ? "bg-navy-blue text-white hover:opacity-90"
                        : "border-border"
                    }
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {useDemo ? "Switch to upload" : "Try Demo"}
                  </Button>
                </div>

                <AnimatePresence mode="wait">
                  {useDemo && (
                    <motion.div
                      key="demo-banner"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="p-4 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/40"
                    >
                      <p className="text-sm font-medium text-primary">
                        ✓ Demo files loaded — Click "Run Analysis" below
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  {/* Gray overlay when demo is on: works in light and dark */}
                  {useDemo && (
                    <div
                      className="absolute inset-0 z-10 rounded-xl bg-muted/50 dark:bg-background/60 pointer-events-auto transition-opacity duration-200"
                      aria-hidden
                    />
                  )}
                  <div
                    className={`space-y-4 transition-opacity duration-200 ${useDemo ? "pointer-events-none" : ""}`}
                  >
                    {(["paystub", "handbook", "rsu"] as Slot[]).map((slot) => (
                      <div key={slot} className="space-y-3">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-500 text-lg">
                              {SLOT_CONFIG[slot].label}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {SLOT_CONFIG[slot].description}
                              {!SLOT_CONFIG[slot].required && " · Optional"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <input
                            type="file"
                            id={`file-${slot}`}
                            accept=".pdf"
                            className="hidden"
                            disabled={!!uploading || useDemo}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setUseDemo(false);
                                uploadFile(slot, f);
                              }
                            }}
                          />
                          <label
                            htmlFor={`file-${slot}`}
                            className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-primary/50 bg-gradient-to-br from-card to-primary/5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 cursor-pointer transition-all group"
                          >
                            {paths[slot] ? (
                              <>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate">
                                    {paths[slot]!.split("/").pop() ??
                                      "Document uploaded"}
                                  </p>
                                  <p className="text-xs text-primary font-medium">
                                    Ready for analysis
                                  </p>
                                </div>
                              </>
                            ) : uploading === slot ? (
                              <>
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">
                                  Uploading...
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-colors">
                                  <Upload className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-500">
                                    Upload PDF
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    or drag and drop here
                                  </p>
                                </div>
                              </>
                            )}
                          </label>

                          {recentDocs.length > 0 && !useDemo && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setShowDocPicker(
                                  showDocPicker === slot ? null : slot,
                                )
                              }
                              disabled={!!uploading}
                              className="shrink-0 border-border hover:bg-primary/10"
                            >
                              Select Previous
                            </Button>
                          )}
                        </div>

                        <AnimatePresence>
                          {showDocPicker === slot && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="p-4 rounded-xl bg-card/50 border border-border space-y-2 max-h-64 overflow-y-auto"
                            >
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                Your Documents
                              </p>
                              {recentDocs.map((doc) => (
                                <button
                                  key={doc.path}
                                  type="button"
                                  onClick={() =>
                                    selectExistingDocument(slot, doc.path)
                                  }
                                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 border border-transparent hover:border-border transition-all text-left group"
                                >
                                  <FileText className="w-4 h-4 text-primary shrink-0" />
                                  <span className="text-sm font-medium truncate flex-1">
                                    {doc.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0 font-mono">
                                    {new Date(
                                      doc.created_at ?? "",
                                    ).toLocaleDateString()}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  onClick={handleRunAnalysis}
                  disabled={!canRunAnalysis || isAnalyzing}
                  size="lg"
                  className="w-full bg-primary text-primary-foreground font-semibold py-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Run analysis
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Real-time Trace Display */}
            <AnimatePresence>
              {showTraces && traces.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-card/80 backdrop-blur-2xl border border-border ">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            AI Processing Your Data
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Multi-agent system analyzing your compensation
                          </p>
                        </div>
                      </div>
                      <TraceProgress traces={traces} />
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Previous Analyses Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="bg-card/80 backdrop-blur-2xl border border-border ">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">Recent Analyses</h3>
                </div>

                {previousAnalyses.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No analyses yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run your first analysis to start saving
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {previousAnalyses.map((analysis, idx) => {
                      const cost = getOpportunityCost(analysis);
                      return (
                        <motion.button
                          key={analysis.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => router.push("/dashboard/traces")}
                          className="w-full p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-border hover:border-primary/40 hover:shadow-lg transition-all text-left group"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                              <span className="text-xs font-mono text-muted-foreground">
                                {formatDate(analysis.created_at)}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>

                          {cost > 0 && (
                            <div className="flex items-baseline gap-2">
                              <DollarSign className="w-5 h-5 text-primary shrink-0" />
                              <span className="text-2xl font-bold bg-linear-to-r from-primary to-navy-blue bg-clip-text text-transparent">
                                {cost.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                /year unclaimed
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {analysis.recommendation?.slice(0, 50)}...
                          </p>
                        </motion.button>
                      );
                    })}

                    {previousAnalyses.length >= 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/manage")}
                        className="w-full text-primary hover:bg-primary/10"
                      >
                        View All Analyses
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Info Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-border shadow-lg">
              <div className="p-6 space-y-3">
                <h4 className="font-bold text-sm uppercase tracking-wide text-primary">
                  How It Works
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      1
                    </div>
                    <p>Upload your documents or try demo files</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      2
                    </div>
                    <p>AI agents extract and analyze your benefits</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                      3
                    </div>
                    <p>Receive personalized action plan to save money</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
