"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  runAnalysisFromPaths,
  runAnalysisFromUrls,
  DEMO_PAYSTUB_PATH,
  DEMO_HANDBOOK_PATH,
  DEMO_RSU_PATH,
} from "@/actions/backend";

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
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
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
    let result: { error?: string };
    if (useDemo) {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      if (!origin) {
        setError("Could not determine site URL. Try uploading files instead.");
        setIsAnalyzing(false);
        return;
      }
      result = await runAnalysisFromUrls(
        origin + DEMO_PAYSTUB_PATH,
        origin + DEMO_HANDBOOK_PATH,
        origin + DEMO_RSU_PATH
      );
    } else {
      result = await runAnalysisFromPaths(
        paths.paystub!,
        paths.handbook!,
        paths.rsu ?? null
      );
    }
    if (result.error) {
      setError(result.error);
      setIsAnalyzing(false);
      return;
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
    await supabase
      .from("users")
      .upsert(
        {
          id: user.id,
          email: user.email,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
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
      await supabase
        .from("users")
        .upsert(
          {
            id: user.id,
            email: user.email,
            onboarding_complete: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-background flex items-center justify-center p-8">
      <Card className="w-full max-w-2xl bg-card/50 backdrop-blur-xl border-2 border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to Vesting Buddy</CardTitle>
          <CardDescription className="text-lg">
            Upload your paystub and benefits handbook to get started. Add RSU docs optionally.
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
                Demo files selected — click &quot;Analyze and continue&quot; below
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
                  className="flex-1 flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/50 cursor-pointer"
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
                      <span className="text-sm text-muted-foreground">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-sm text-muted-foreground">Choose PDF</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          ))}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
          )}

          <div className="flex flex-col gap-3">
            {canAnalyze && (
              <Button
                onClick={handleAnalyzeAndContinue}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-primary to-purple-500"
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
