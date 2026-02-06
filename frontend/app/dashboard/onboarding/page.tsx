"use client";

import { CheckCircle2, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveAnalysis, saveTraces, type TraceEvent } from "@/actions/backend";
import { createSignedUrl } from "@/actions/storage";
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

const SLOT_CONFIG: Record<Slot, { label: string; description: string; required: boolean }> = {
  paystub: {
    label: "Monthly Paystub",
    description: "PDF, DOC up to 10MB",
    required: true,
  },
  handbook: {
    label: "Benefits Handbook",
    description: "PDF, DOC up to 10MB",
    required: true,
  },
  rsu: {
    label: "RSU / Equity Grant",
    description: "PDF, DOC up to 10MB (optional)",
    required: false,
  },
};

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
  const [traces, setTraces] = useState<TraceEvent[]>([]);
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        {/* Clean Centered Card - PayU Login Style */}
        <div className="rounded-2xl bg-card border border-border/50 shadow-sm p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-center">
            Welcome to Vesting Buddy
          </h1>
          <p className="text-muted-foreground text-center mt-2 mb-8">
            Upload your documents to get started
          </p>

          {/* Demo Toggle */}
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
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {useDemo ? "Using Demo Files" : "Try with Demo Files"}
            </Button>
            {useDemo && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Demo files loaded - click "Get Started" below
              </p>
            )}
          </div>

          {/* Upload Slots */}
          <div className="space-y-4">
            {(["paystub", "handbook", "rsu"] as Slot[]).map((slot) => (
              <div key={slot}>
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
                  className={`block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                    paths[slot]
                      ? "border-success bg-success/5"
                      : useDemo
                        ? "border-border bg-muted/30 opacity-50"
                        : "border-border hover:border-primary/50"
                  }`}
                >
                  {paths[slot] ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <span className="font-medium text-sm truncate">
                        {paths[slot]!.split("/").pop()}
                      </span>
                    </div>
                  ) : uploading === slot ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <FileText className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                      <p className="font-medium text-sm">{SLOT_CONFIG[slot].label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {SLOT_CONFIG[slot].description}
                      </p>
                    </>
                  )}
                </label>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Trace Progress */}
          {showTraces && traces.length > 0 && (
            <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-sm font-medium mb-3">Analysis Progress</p>
              <TraceProgress traces={traces} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <Button
              onClick={handleAnalyzeAndContinue}
              disabled={!canAnalyze || isAnalyzing}
              className="w-full h-12"
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
              className="w-full"
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
