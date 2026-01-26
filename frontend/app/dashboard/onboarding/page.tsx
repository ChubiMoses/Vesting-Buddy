"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (files: File[]) => {
    setIsUploading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    for (const file of files) {
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (!uploadError) {
        setUploadedFiles((prev) => [...prev, file.name]);
      }
    }

    setIsUploading(false);

    if (uploadedFiles.length + files.length > 0) {
      const { error: updateError } = await supabase
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

      if (!updateError) {
        router.push("/dashboard");
        router.refresh();
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
    }
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
            Let's get started by uploading your first paystub or benefits document
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging
                ? "border-primary bg-primary/10 scale-105"
                : "border-primary/30 bg-primary/5 hover:border-primary/50"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              disabled={isUploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold mb-2">
                    Drag & drop your files here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or <span className="text-primary font-medium">browse</span> to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported: PDF files (Paystubs, Benefits Handbook)
                  </p>
                </div>
              </div>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Uploaded files:</p>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex-1">{file}</span>
                </div>
              ))}
            </div>
          )}

          {isUploading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={skipOnboarding}
              variant="outline"
              className="flex-1"
              disabled={isUploading}
            >
              Skip for now
            </Button>
            {uploadedFiles.length > 0 && (
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-gradient-to-r from-primary to-purple-500"
              >
                Continue to Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
