"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  runAnalysisFromPaths,
  runAnalysisFromUrls,
  DEMO_PAYSTUB_PATH,
  DEMO_HANDBOOK_PATH,
  DEMO_RSU_PATH,
} from "@/actions/backend";
import { listUserDocuments, type StoredDocument } from "@/actions/storage";
import { createClient } from "@/lib/supabase/client";
import { exampleFiles } from "@/lib/data/dashboard";

type Slot = "paystub" | "handbook" | "rsu";

const SLOT_LABELS: Record<Slot, string> = {
  paystub: "Paystub PDF (required)",
  handbook: "Benefits handbook PDF (required)",
  rsu: "RSU / equity PDF (optional)",
};

export default function UploadPage() {
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

  useEffect(() => {
    listUserDocuments().then(setRecentDocs);
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
    const { error: uploadError } = await supabase.storage.from("documents").upload(path, file);
    setUploading(null);
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    setPaths((prev) => ({ ...prev, [slot]: path }));
    setUseDemo(false);
    listUserDocuments().then(setRecentDocs);
  };

  const canRunAnalysis = useDemo || (paths.paystub && paths.handbook);

  const handleRunAnalysis = async () => {
    if (!canRunAnalysis) return;
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
    setIsAnalyzing(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Upload Documents</h1>
          <p className="text-muted-foreground">
            Upload paystub and handbook (required), and RSU PDF (optional). Then run analysis.
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-xl rounded-3xl border-2 border-primary/20 p-8 shadow-xl space-y-6">
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
                Demo files selected — click &quot;Run analysis&quot; below
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

          <Button
            onClick={handleRunAnalysis}
            disabled={!canRunAnalysis || isAnalyzing}
            className="w-full bg-gradient-to-r from-primary to-purple-500"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running analysis...
              </>
            ) : (
              "Run analysis"
            )}
          </Button>
        </div>

        {recentDocs.length > 0 && (
          <div className="bg-card/50 backdrop-blur-xl rounded-2xl border-2 border-primary/20 p-6">
            <h3 className="text-lg font-bold mb-4">Recently uploaded</h3>
            <ul className="space-y-2">
              {recentDocs.slice(0, 10).map((doc) => (
                <li
                  key={doc.path}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  {doc.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-card/50 backdrop-blur-xl rounded-2xl border-2 border-primary/20 p-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">Example files (what to upload)</p>
          <div className="flex flex-wrap gap-3">
            {exampleFiles.map((file, index) => (
              <a
                key={index}
                href={file.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
