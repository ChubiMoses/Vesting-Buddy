"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Settings,
  Archive,
  Trash2,
  Loader2,
  Upload,
  MoreVertical,
  FileBarChart,
  FileSpreadsheet,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listUserDocuments,
  deleteDocument,
  type StoredDocument,
} from "@/actions/storage";
import type { AnalysisRow } from "@/actions/backend";
import {
  extractPaystubFromPath,
  extractRsuFromPath,
  extractPolicyFromPath,
} from "@/actions/backend";
import { ExtractionSidebar } from "@/components/dashboard/extraction-sidebar";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
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

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage</h1>
            <p className="text-muted-foreground">
              Manage your documents, settings, and preferences
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur-xl border border-border md:col-span-2">
              <CardHeader className="flex flex-row gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className=" flex flex-col justify-center gap-1">
                  <CardTitle>Document Management</CardTitle>
                  <CardDescription>
                    Upload, view, and delete your documents
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Upload Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border border-dashed rounded-xl p-8 text-center transition-all duration-300",
                    isDragging
                      ? "border-primary bg-primary/10 scale-105"
                      : "border-primary/30 bg-primary/5 hover:border-primary/50",
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
                    <motion.div
                      animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-purple-500 flex items-center justify-center mx-auto mb-3">
                        {uploading ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <p className="font-semibold mb-1">
                        {uploading ? "Uploading..." : "Quick Upload"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Drag & drop or{" "}
                        <span className="text-primary font-medium">browse</span>{" "}
                        PDFs
                      </p>
                    </motion.div>
                  </label>
                </div>
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No documents uploaded yet.
                  </p>
                ) : (
                  <ul className="space-y-3 max-h-96 overflow-y-auto">
                    {documents.map((doc) => (
                      <li
                        key={doc.path}
                        className="relative p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {new Date(
                                  doc.created_at ?? "",
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Extract Actions Dropdown */}
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setShowActionsMenu(
                                    showActionsMenu === doc.path
                                      ? null
                                      : doc.path,
                                  )
                                }
                                disabled={extracting === doc.path}
                                className="text-primary hover:bg-primary/10"
                              >
                                {extracting === doc.path ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="w-4 h-4" />
                                )}
                              </Button>

                              {showActionsMenu === doc.path && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute right-0 top-full mt-1 w-56 p-2 rounded-xl bg-card border-2 border-border shadow-2xl z-10"
                                >
                                  <div className="space-y-1">
                                    <button
                                      onClick={() =>
                                        handleExtract(doc.path, "paystub")
                                      }
                                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 text-left transition-colors"
                                    >
                                      <FileBarChart className="w-4 h-4 text-primary" />
                                      <span className="text-sm font-medium">
                                        Extract Paystub
                                      </span>
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleExtract(doc.path, "rsu")
                                      }
                                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 text-left transition-colors"
                                    >
                                      <FileSpreadsheet className="w-4 h-4 text-primary" />
                                      <span className="text-sm font-medium">
                                        Extract RSU Grant
                                      </span>
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleExtract(doc.path, "policy")
                                      }
                                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 text-left transition-colors"
                                    >
                                      <BookOpen className="w-4 h-4 text-primary" />
                                      <span className="text-sm font-medium">
                                        Extract Policy
                                      </span>
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border border-border md:col-span-3">
              <CardHeader className="flex flex-row gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Archive className="w-6 h-6 text-primary" />
                </div>
                <div className=" flex flex-col justify-center gap-1">
                  <CardTitle>Previous Analyses</CardTitle>
                  <CardDescription>
                    View your past analyses and saved reports
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {analyses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No analyses yet.
                  </p>
                ) : (
                  <ul className="space-y-3 max-h-96 overflow-y-auto">
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
                        <li
                          key={a.id}
                          className="p-4 rounded-xl border border-border bg-linear-to-br from-primary/5 to-purple-500/5"
                        >
                          <p className="text-sm text-muted-foreground mb-1">
                            {formatDate(a.created_at)}
                          </p>
                          <p className="text-lg font-bold text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-500">
                            ${Math.round(Number(cost)).toLocaleString()}{" "}
                            opportunity
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {plan.length} action items ·{" "}
                            {(a.recommendation ?? "").slice(0, 120)}
                            {(a.recommendation?.length ?? 0) > 120 ? "…" : ""}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
