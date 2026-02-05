"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { saveAnalysis, saveTraces, type TraceEvent } from "@/actions/backend";
import { consumeAnalysisStream } from "@/lib/analysis-stream";
import { createSignedUrl } from "@/actions/storage";
import {
  DEMO_PAYSTUB_PATH,
  DEMO_RSU_PATH,
  DEMO_HANDBOOK_PATH,
} from "@/lib/demo-paths";
import { TraceProgress } from "@/components/dashboard/trace-progress";

type Slot = "paystub" | "handbook" | "rsu";

const SLOT_LABELS: Record<Slot, string> = {
  paystub: "Paystub PDF (required)",
  handbook: "Benefits handbook PDF (required)",
  rsu: "RSU / equity PDF (optional)",
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
  const canContinue = useDemo || (paths.paystub && paths.handbook);

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
    console.log("[Onboarding] Starting analysis stream...");
    const result = await consumeAnalysisStream(
      paystubUrl,
      handbookUrl,
      rsuUrl,
      (trace) => {
        collectedTraces.push(trace);
        setTraces((prev) => [...prev, trace]);
      },
    );

    console.log("[Onboarding] Stream finished. Result:", result);

    if (result.error) {
      console.error("[Onboarding] Analysis error:", result.error);
      setError(result.error);
      setIsAnalyzing(false);
      return;
    }

    if (!result.result) {
      console.error("[Onboarding] No result received from analysis");
      setError("Analysis completed but no result was received");
      setIsAnalyzing(false);
      return;
    }

    if (result.analysisId) {
      console.log(
        "[Onboarding] Saving analysis with stream ID:",
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
        console.error(
          "[Onboarding] Failed to save analysis:",
          saveResult.error,
        );
      } else {
        console.log(
          "[Onboarding] Analysis saved successfully with ID:",
          saveResult.id,
        );
      }

      if (collectedTraces.length > 0) {
        console.log(
          "[Onboarding] Saving",
          collectedTraces.length,
          "traces for analysis ID:",
          result.analysisId,
        );
        const traceResult = await saveTraces(
          result.analysisId,
          collectedTraces,
        );
        if (traceResult.error) {
          console.error(
            "[Onboarding] Failed to save traces:",
            traceResult.error,
          );
        } else {
          console.log("[Onboarding] Traces saved successfully!");
        }
      } else {
        console.warn("[Onboarding] No traces to save!");
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

  const handleContinueWithoutAnalysis = async () => {
    if (!canContinue) return;
    setError(null);
    await markOnboardingComplete();
    router.push("/dashboard");
    router.refresh();
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
    <div className="min-h-screen bg-linear-to-br from-background via-background/50 to-background flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl bg-card/50 backdrop-blur-xl border border-border">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">
            Welcome to Vesting Buddy
          </CardTitle>
          <CardDescription className="text-lg">
            Upload your paystub and benefits handbook to get started. Add RSU
            docs optionally.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={useDemo ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setUseDemo(true);
                setPaths({ paystub: null, handbook: null, rsu: null });
              }}
              className={useDemo ? "bg-primary" : ""}
            >
              Use demo PDFs (try the platform)
            </Button>
            {useDemo && (
              <span className="text-sm text-muted-foreground">
                Demo files selected — click &quot;Analyze and continue&quot;
                below
              </span>
            )}
          </div>
          {(["paystub", "handbook", "rsu"] as Slot[]).map((slot) => (
            <div key={slot} className="space-y-2">
              <p className="text-sm font-medium">{SLOT_LABELS[slot]}</p>
              <div className="flex items-center gap-3">
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
                  className="flex-1 flex items-center gap-2 p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:border-primary/50 cursor-pointer"
                >
                  {paths[slot] ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {paths[slot]!.split("/").pop() ?? "Uploaded"}
                      </span>
                    </>
                  ) : uploading === slot ? (
                    <>
                      <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        Uploading...
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        Choose PDF
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>
          ))}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </p>
          )}

          {showTraces && traces.length > 0 && (
            <div className="p-4 rounded-xl bg-card/30 border border-border">
              <p className="text-sm font-medium mb-3">Analysis Progress</p>
              <TraceProgress traces={traces} />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {canAnalyze && (
              <Button
                onClick={handleAnalyzeAndContinue}
                disabled={isAnalyzing}
                className="w-full bg-linear-to-r from-primary to-purple-500"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze and continue to Dashboard"
                )}
              </Button>
            )}
            {canContinue && (
              <Button
                onClick={handleContinueWithoutAnalysis}
                variant="secondary"
                className="w-full"
                disabled={isAnalyzing}
              >
                Continue to Dashboard without analysis
              </Button>
            )}
            <Button
              onClick={skipOnboarding}
              variant="outline"
              className="w-full"
              disabled={!!uploading || isAnalyzing}
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
