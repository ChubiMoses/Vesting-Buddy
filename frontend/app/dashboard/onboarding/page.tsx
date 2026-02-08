"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveAnalysis, saveTraces, type TraceEvent } from "@/actions/backend";
import { createSignedUrl } from "@/actions/storage";
import { TraceProgress } from "@/components/dashboard/trace-progress";
import {
  UploadSlotCard,
  type UploadSlotId,
} from "@/components/dashboard/upload-slot-card";
import { Button } from "@/components/ui/button";
import { useAnalysisTraces } from "@/hooks/use-analysis-traces";
import { consumeAnalysisStream } from "@/lib/analysis-stream";
import {
  DEMO_HANDBOOK_PATH,
  DEMO_PAYSTUB_PATH,
  DEMO_RSU_PATH,
} from "@/lib/demo-paths";
import { createClient } from "@/lib/supabase/client";

type Slot = UploadSlotId;

export default function OnboardingPage() {
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
  const { traces, addTrace, startPlaceholder, reset: resetTraces } = useAnalysisTraces();
  const [showTraces, setShowTraces] = useState(false);

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
  };

  const canAnalyze = useDemo || (paths.paystub && paths.handbook);

  const handleAnalyzeAndContinue = async () => {
    if (!canAnalyze) return;
    setError(null);
    setIsAnalyzing(true);
    resetTraces();
    startPlaceholder();
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
        addTrace(trace);
      },
    );

    if (result.error) {
      setError(result.error);
      setIsAnalyzing(false);
      return;
    }

    if (!result.result) {
      setError("Analysis completed but no result was received");
      setIsAnalyzing(false);
      return;
    }

    if (result.analysisId) {
      const saveResult = await saveAnalysis(
        user.id,
        result.result,
        storagePaths,
        result.analysisId,
      );
      if (!saveResult.error && collectedTraces.length > 0) {
        await saveTraces(result.analysisId, collectedTraces);
      }
    }

    await markOnboardingComplete();
    setIsAnalyzing(false);
    router.push("/dashboard");
    router.refresh();
  };

  const markOnboardingComplete = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  };

  const skipOnboarding = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    }
    router.push("/dashboard");
    router.refresh();
  };

  const showUploadArea = !showTraces;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-4xl">
        <div className="rounded-2xl bg-card border border-border/50 shadow-sm p-8">
          {/* Logo + Title */}
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
              VB
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-center">
            Welcome to Vesting Buddy
          </h1>
          <p className="text-muted-foreground text-center mt-1 mb-6">
            Upload your documents so we can find your missing benefits
          </p>

          {/* Demo Toggle - only when showing upload area */}
          {showUploadArea && (
            <div className="mb-6">
              <Button
                type="button"
                variant={useDemo ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setUseDemo(!useDemo);
                  if (!useDemo) {
                    setPaths({ paystub: null, handbook: null, rsu: null });
                  }
                }}
                className="w-full rounded-xl"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {useDemo ? "Using Demo Files" : "Try with Demo Files"}
              </Button>
              <div className="mt-2 space-y-0.5 text-center">
                {useDemo && (
                  <p className="text-xs text-muted-foreground">
                    Demo files loaded — click &quot;Get Started&quot; below
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {useDemo ? "View sample documents: " : "See what's needed: "}
                  <a
                    href={DEMO_PAYSTUB_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    Paystub
                  </a>
                  {" · "}
                  <a
                    href={DEMO_HANDBOOK_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    Handbook
                  </a>
                  {" · "}
                  <a
                    href={DEMO_RSU_PATH}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    RSU
                  </a>
                </p>
              </div>
            </div>
          )}

          {/* Upload cards OR Traces (traces replace upload when analyzing) */}
          <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-6">
            <AnimatePresence mode="wait">
              {showUploadArea ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  {useDemo && (
                    <div className="absolute inset-0 z-10 rounded-2xl bg-white/60 pointer-events-auto" />
                  )}
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${
                      useDemo ? "pointer-events-none select-none" : ""
                    }`}
                  >
                    {(["paystub", "handbook", "rsu"] as Slot[]).map((slot) => (
                      <UploadSlotCard
                        key={slot}
                        slot={slot}
                        path={paths[slot]}
                        uploading={uploading === slot}
                        disabled={useDemo}
                        onSelectFile={(file) => {
                          setUseDemo(false);
                          uploadFile(slot, file);
                        }}
                      />
                    ))}
                  </div>
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
                      <h3 className="font-semibold text-foreground">
                        AI processing your data
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Watch the analysis steps below
                      </p>
                    </div>
                  </div>
                  <TraceProgress traces={traces} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleAnalyzeAndContinue}
              disabled={!canAnalyze || isAnalyzing}
              className="w-full h-12 rounded-xl"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Get Started"
              )}
            </Button>
            <Button
              onClick={skipOnboarding}
              variant="ghost"
              className="w-full rounded-xl"
              disabled={!!uploading || isAnalyzing}
            >
              Skip for now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
