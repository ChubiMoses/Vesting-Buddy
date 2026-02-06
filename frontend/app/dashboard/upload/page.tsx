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

    if (result.error) {
      setError(result.error);
      return;
    }

    if (!result.result) {
      setError("Analysis completed but no result was received");
      return;
    }

    if (result.analysisId) {
      const saveResult = await saveAnalysis(
        user.id,
        result.result,
        storagePaths,
        result.analysisId,
      );
      if (saveResult.error) {
        setError(`Analysis completed but failed to save: ${saveResult.error}`);
        return;
      }

      if (collectedTraces.length > 0) {
        const traceResult = await saveTraces(
          result.analysisId,
          collectedTraces,
        );
        if (traceResult.error) {
          setError(`Analysis saved but traces failed: ${traceResult.error}`);
        }
      }

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
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Financial Analysis
          </h1>
          <p className="text-muted-foreground">
            Upload documents to analyze your compensation package
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Upload Card */}
            <div className="rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Upload Documents</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your Personal CFO analyzes these to find unclaimed wealth
                    </p>
                  </div>
                  <Button
                    variant={useDemo ? "default" : "outline"}
                    size="sm"
                    onClick={toggleDemo}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {useDemo ? "Using Demo" : "Try Demo"}
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Demo Banner */}
                <AnimatePresence mode="wait">
                  {useDemo && (
                    <motion.div
                      key="demo-banner"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-lg bg-primary/10 border border-primary/20"
                    >
                      <p className="text-sm font-medium text-primary">
                        Demo files loaded — Click "Run Analysis" below
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload Slots */}
                <div className="relative">
                  {useDemo && (
                    <div className="absolute inset-0 z-10 rounded-lg bg-muted/50 pointer-events-auto" />
                  )}
                  <div className={`space-y-4 ${useDemo ? "pointer-events-none" : ""}`}>
                    {(["paystub", "handbook", "rsu"] as Slot[]).map((slot) => (
                      <div key={slot} className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <h3 className="font-medium text-foreground">
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
                            className="flex-1 flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors"
                          >
                            {paths[slot] ? (
                              <>
                                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="w-5 h-5 text-success" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate text-sm">
                                    {paths[slot]!.split("/").pop() ?? "Document uploaded"}
                                  </p>
                                  <p className="text-xs text-success">
                                    Ready for analysis
                                  </p>
                                </div>
                              </>
                            ) : uploading === slot ? (
                              <>
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Uploading...
                                </p>
                              </>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                  <Upload className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">Upload PDF</p>
                                  <p className="text-xs text-muted-foreground">
                                    or drag and drop
                                  </p>
                                </div>
                              </>
                            )}
                          </label>

                          {recentDocs.length > 0 && !useDemo && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setShowDocPicker(showDocPicker === slot ? null : slot)
                              }
                              disabled={!!uploading}
                              className="shrink-0 h-auto py-4"
                            >
                              Library
                            </Button>
                          )}
                        </div>

                        {/* Document Picker Dropdown */}
                        <AnimatePresence>
                          {showDocPicker === slot && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="rounded-lg border border-border bg-card overflow-hidden"
                            >
                              <div className="p-3 bg-muted/50 border-b border-border">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Your Documents
                                </p>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {recentDocs.map((doc) => (
                                  <button
                                    key={doc.path}
                                    type="button"
                                    onClick={() => selectExistingDocument(slot, doc.path)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 border-b border-border last:border-0 transition-colors text-left"
                                  >
                                    <FileText className="w-4 h-4 text-primary shrink-0" />
                                    <span className="text-sm font-medium truncate flex-1">
                                      {doc.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      {new Date(doc.created_at ?? "").toLocaleDateString()}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Run Analysis Button */}
                <Button
                  onClick={handleRunAnalysis}
                  disabled={!canRunAnalysis || isAnalyzing}
                  size="lg"
                  className="w-full h-12"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Trace Progress */}
            <AnimatePresence>
              {showTraces && traces.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-xl bg-card border border-border/50 shadow-sm"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                      <div>
                        <h3 className="font-semibold">AI Processing Your Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Multi-agent system analyzing your compensation
                        </p>
                      </div>
                    </div>
                    <TraceProgress traces={traces} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Analyses */}
            <div className="rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Recent Analyses</h3>
                </div>
              </div>
              <div className="p-4">
                {previousAnalyses.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No analyses yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Run your first analysis to start saving
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {previousAnalyses.map((analysis) => {
                      const cost = getOpportunityCost(analysis);
                      return (
                        <button
                          key={analysis.id}
                          onClick={() => router.push("/dashboard/traces")}
                          className="w-full p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(analysis.created_at)}
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                          {cost > 0 && (
                            <div className="flex items-baseline gap-1">
                              <DollarSign className="w-4 h-4 text-primary" />
                              <span className="text-xl font-semibold tabular-nums">
                                {cost.toLocaleString()}
                              </span>
                              <span className="text-xs text-muted-foreground">/year</span>
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {previousAnalyses.length >= 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard/manage")}
                        className="w-full"
                      >
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* How It Works */}
            <div className="rounded-xl bg-card border border-border/50 shadow-sm p-6">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
                How It Works
              </h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                    1
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload your documents or try demo files
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                    2
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI agents extract and analyze your benefits
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                    3
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive personalized action plan to save money
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
