"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Settings, Archive, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listUserDocuments, deleteDocument, type StoredDocument } from "@/actions/storage";
import type { AnalysisRow } from "@/actions/backend";

interface ManageContentProps {
  documents: StoredDocument[];
  analyses: AnalysisRow[];
}

export function ManageContent({ documents, analyses }: ManageContentProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (path: string) => {
    setDeleting(path);
    const { error } = await deleteDocument(path);
    setDeleting(null);
    if (!error) router.refresh();
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
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Manage</h1>
          <p className="text-muted-foreground">
            Manage your documents, settings, and preferences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-card/50 backdrop-blur-xl border-2 border-primary/20 md:col-span-2">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                View and delete your uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {documents.map((doc) => (
                    <li
                      key={doc.path}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm truncate">{doc.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deleting === doc.path}
                        onClick={() => handleDelete(doc.path)}
                      >
                        {deleting === doc.path ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border-2 border-primary/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border-2 border-primary/20 md:col-span-3">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Archive className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Archived Analyses</CardTitle>
              <CardDescription>
                View your past analyses and saved reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No analyses yet.</p>
              ) : (
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {analyses.map((a) => {
                    const lv = (a.leaked_value ?? {}) as Record<string, unknown>;
                    const cost = typeof lv.annual_opportunity_cost === "number"
                      ? lv.annual_opportunity_cost
                      : 0;
                    const plan = (a.action_plan ?? []) as unknown[];
                    return (
                      <li
                        key={a.id}
                        className="p-4 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5"
                      >
                        <p className="text-sm text-muted-foreground mb-1">
                          {formatDate(a.created_at)}
                        </p>
                        <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                          ${Math.round(Number(cost)).toLocaleString()} opportunity
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {plan.length} action items · {(a.recommendation ?? "").slice(0, 120)}
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
  );
}
