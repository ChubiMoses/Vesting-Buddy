"use client";

import {
  Archive,
  BookOpen,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Loader2,
  MoreVertical,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AnalysisRow } from "@/actions/backend";
import {
  extractPaystubFromPath,
  extractPolicyFromPath,
  extractRsuFromPath,
} from "@/actions/backend";
import {
  deleteDocument,
  type StoredDocument,
} from "@/actions/storage";
import { ExtractionSidebar } from "@/components/dashboard/extraction-sidebar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ManageContentProps {
  documents: StoredDocument[];
  analyses: AnalysisRow[];
}

export function ManageContent({ documents, analyses }: ManageContentProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [extractionData, setExtractionData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [extractionType, setExtractionType] = useState<
    "paystub" | "rsu" | "policy" | null
  >(null);
  const [extractionSidebarOpen, setExtractionSidebarOpen] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);

  const handleExtract = async (
    path: string,
    type: "paystub" | "rsu" | "policy",
  ) => {
    setExtracting(path);
    setShowActionsMenu(null);

    let result: { data?: Record<string, unknown>; error?: string };
    if (type === "paystub") {
      result = await extractPaystubFromPath(path);
    } else if (type === "rsu") {
      result = await extractRsuFromPath(path);
    } else {
      result = await extractPolicyFromPath(path);
    }

    setExtracting(null);

    if (result.error) {
      alert(`Extraction failed: ${result.error}`);
    } else if (result.data) {
      setExtractionData(result.data);
      setExtractionType(type);
      setExtractionSidebarOpen(true);
    }
  };

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowActionsMenu(null);
    if (showActionsMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showActionsMenu]);

  const handleDelete = async (path: string) => {
    setDeleting(path);
    const { error } = await deleteDocument(path);
    setDeleting(null);
    if (!error) router.refresh();
  };

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    for (const file of files) {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      await supabase.storage.from("documents").upload(path, file);
    }

    setUploading(false);
    router.refresh();
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
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf",
    );
    if (files.length > 0) handleUpload(files);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso.slice(0, 10);
    }
  };

  return (
    <>
      <ExtractionSidebar
        data={extractionData}
        type={extractionType}
        isOpen={extractionSidebarOpen}
        onClose={() => {
          setExtractionSidebarOpen(false);
          setExtractionData(null);
          setExtractionType(null);
        }}
      />

      <div className="p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold">Manage</h1>
            <p className="text-muted-foreground">
              Manage your documents and view past analyses
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Document Management Card */}
            <div className="rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Documents</h2>
                    <p className="text-sm text-muted-foreground">
                      Upload and manage your files
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Upload Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-6 text-center transition-colors",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <input
                    type="file"
                    id="quick-upload"
                    multiple
                    accept=".pdf"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) handleUpload(files);
                    }}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="quick-upload" className="cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <p className="font-medium text-sm">
                      {uploading ? "Uploading..." : "Upload Documents"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Drag & drop or click to browse
                    </p>
                  </label>
                </div>

                {/* Document List */}
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No documents uploaded yet
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {documents.map((doc) => (
                      <div
                        key={doc.path}
                        className="relative flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(doc.created_at ?? "")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Extract Actions Dropdown */}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionsMenu(
                                  showActionsMenu === doc.path
                                    ? null
                                    : doc.path,
                                );
                              }}
                              disabled={extracting === doc.path}
                            >
                              {extracting === doc.path ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreVertical className="w-4 h-4" />
                              )}
                            </Button>

                            {showActionsMenu === doc.path && (
                              <div className="absolute right-0 top-full mt-1 w-48 p-1 rounded-lg bg-card border border-border shadow-lg z-10">
                                <button
                                  onClick={() =>
                                    handleExtract(doc.path, "paystub")
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left text-sm"
                                >
                                  <FileBarChart className="w-4 h-4 text-primary" />
                                  Extract Paystub
                                </button>
                                <button
                                  onClick={() =>
                                    handleExtract(doc.path, "rsu")
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left text-sm"
                                >
                                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                                  Extract RSU Grant
                                </button>
                                <button
                                  onClick={() =>
                                    handleExtract(doc.path, "policy")
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-left text-sm"
                                >
                                  <BookOpen className="w-4 h-4 text-primary" />
                                  Extract Policy
                                </button>
                              </div>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deleting === doc.path}
                            onClick={() => handleDelete(doc.path)}
                          >
                            {deleting === doc.path ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Previous Analyses Card */}
            <div className="rounded-xl bg-card border border-border/50 shadow-sm">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Archive className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Previous Analyses</h2>
                    <p className="text-sm text-muted-foreground">
                      View your past reports
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {analyses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No analyses yet
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {analyses.map((a) => {
                      const lv = (a.leaked_value ?? {}) as Record<
                        string,
                        unknown
                      >;
                      const cost =
                        typeof lv.annual_opportunity_cost === "number"
                          ? lv.annual_opportunity_cost
                          : 0;
                      const plan = (a.action_plan ?? []) as unknown[];
                      return (
                        <div
                          key={a.id}
                          className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(a.created_at)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              {plan.length} actions
                            </span>
                          </div>
                          <p className="text-lg font-semibold text-primary">
                            ${Math.round(Number(cost)).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {a.recommendation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
