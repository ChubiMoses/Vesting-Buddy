"use client";

import { useState } from "react";
import { DocumentUpload } from "@/components/dashboard/document-upload";
import { mockDocuments, mockReasoningTrace } from "@/lib/data/dashboard";

export default function UploadPage() {
  const [documents, setDocuments] = useState(mockDocuments);

  const handleUpload = async (files: File[]) => {
    console.log("Uploading files:", files);
    
    const newDocs = files.map((file, index) => ({
      id: String(Date.now() + index),
      name: file.name,
      type: file.name.toLowerCase().includes("paystub") ? "paystub" as const : "benefits" as const,
      uploadedAt: new Date().toISOString(),
      status: "processing" as const,
      progress: 0,
    }));

    setDocuments([...documents, ...newDocs]);

    newDocs.forEach((doc, index) => {
      const interval = setInterval(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? { ...d, progress: Math.min((d.progress || 0) + 10, 100) }
              : d
          )
        );
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, status: "completed" as const, progress: 100 } : d
          )
        );
      }, 2000);
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Upload Documents</h1>
          <p className="text-muted-foreground">
            Upload your paystubs and benefits documents to get started
          </p>
        </div>

        <DocumentUpload
          documents={documents}
          reasoningTrace={mockReasoningTrace}
          onUpload={handleUpload}
        />
      </div>
    </div>
  );
}
