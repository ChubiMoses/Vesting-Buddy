"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Sparkles,
  TrendingUp,
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

import {
  UploadSlotCard,
  type UploadSlotId,
} from "@/components/dashboard/upload-slot-card";

type Slot = UploadSlotId;

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

  const showUploadArea = !showTraces;

  return (
    <div className="min-h-screen p-6 lg:p-8 bg-background">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Financial Analysis
            </h1>
            <p className="text-muted-foreground mt-1">
              Upload documents to analyze your compensation package
            </p>
          </div>
          <Button
            variant={useDemo ? "default" : "outline"}
            size="sm"
            onClick={toggleDemo}
            className="shrink-0 rounded-xl"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {useDemo ? "Using Demo" : "Try Demo"}
          </Button>
        </div>

        {/* Main content: Upload cards OR Traces (traces replace upload when analyzing) */}
        <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {showUploadArea ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <p className="text-sm font-medium text-muted-foreground">
                  Upload your documents — we use these to find unclaimed benefits and match gaps
                </p>
                <div className="relative">
                  {useDemo && (
                    <div className="absolute inset-0 z-10 rounded-2xl bg-white/60 pointer-events-auto" />
                  )}
                  <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${useDemo ? "pointer-events-none select-none" : ""}`}>
                    {(["paystub", "handbook", "rsu"] as Slot[]).map((slot) => (
                      <div key={slot} className="relative">
                        <UploadSlotCard
                          slot={slot}
                          path={paths[slot]}
                          uploading={uploading === slot}
                          disabled={useDemo}
                          onSelectFile={(file) => {
                            setUseDemo(false);
                            uploadFile(slot, file);
                          }}
                          extraAction={
                            recentDocs.length > 0 && !useDemo ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDocPicker(showDocPicker === slot ? null : slot);
                                }}
                                disabled={!!uploading}
                              >
                                From library
                              </Button>
                            ) : undefined
                          }
                        />
                        <AnimatePresence>
                          {showDocPicker === slot && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 rounded-xl border border-border bg-card overflow-hidden shadow-sm"
                            >
                              <div className="p-2 bg-muted/50 border-b border-border">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Your documents
                                </p>
                              </div>
                              <div className="max-h-40 overflow-y-auto">
                                {recentDocs.map((doc) => (
                                  <button
                                    key={doc.path}
                                    type="button"
                                    onClick={() => selectExistingDocument(slot, doc.path)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 border-b border-border last:border-0 transition-colors text-left text-sm"
                                  >
                                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <span className="font-medium truncate flex-1">
                                      {doc.name}
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

                {useDemo && (
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-sm font-medium text-primary">
                      Demo files loaded — Click &quot;Run Analysis&quot; below
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleRunAnalysis}
                  disabled={!canRunAnalysis || isAnalyzing}
                  size="lg"
                  className="w-full h-12 rounded-xl"
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
              </motion.div>
            ) : (
              <motion.div
                key="traces"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI processing your data</h3>
                    <p className="text-sm text-muted-foreground">
                      Multi-agent system analyzing your compensation — watch the steps below
                    </p>
                  </div>
                </div>
                <TraceProgress traces={traces} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Bottom: Recent Analyses + How It Works */}
        <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-border">
          <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold">Recent Analyses</h3>
              </div>
            </div>
            <div className="p-4">
              {previousAnalyses.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No analyses yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Run your first analysis to start saving
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {previousAnalyses.slice(0, 3).map((analysis) => {
                    const cost = getOpportunityCost(analysis);
                    return (
                      <button
                        key={analysis.id}
                        onClick={() => router.push("/dashboard/traces")}
                        className="w-full p-3 rounded-xl border border-border hover:border-indigo-200 hover:bg-indigo-50/50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(analysis.created_at)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                        {cost > 0 && (
                          <div className="flex items-baseline gap-1">
                            <DollarSign className="w-4 h-4 text-indigo-600" />
                            <span className="text-lg font-semibold tabular-nums text-foreground">
                              {cost.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">/year</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {previousAnalyses.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/dashboard/manage")}
                      className="w-full mt-2 rounded-xl"
                    >
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/50 shadow-sm p-6">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-indigo-600 mb-4">
              How it works
            </h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-semibold text-indigo-600">
                  1
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your documents or try demo files
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-semibold text-indigo-600">
                  2
                </div>
                <p className="text-sm text-muted-foreground">
                  AI agents extract and analyze your benefits
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-semibold text-indigo-600">
                  3
                </div>
                <p className="text-sm text-muted-foreground">
                  Receive a personalized action plan to save money
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
