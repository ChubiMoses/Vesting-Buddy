"use client";

import { motion } from "framer-motion";
import { FileText, Upload } from "lucide-react";
import { useState } from "react";
import type { Document, ReasoningStep } from "@/lib/data/dashboard";
import { exampleFiles } from "@/lib/data/dashboard";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  documents: Document[];
  onUpload: (files: File[]) => void;
}

export function DocumentUpload({ documents, onUpload }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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
    handleUpload(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleUpload(files);
    }
  };

  const handleUpload = (files: File[]) => {
    setUploadProgress(0);
    onUpload(files);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return null;
        }
        return prev + 10;
      });
    }, 200);
  };

  const processingDoc = documents.find((doc) => doc.status === "processing");

  return (
    <div className="space-y-6">
      <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border p-8 ">
        <h3 className="text-xl font-bold mb-6">Document Vault</h3>

        {documents.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Your documents
            </p>
            <ul className="flex flex-wrap gap-2">
              {documents.slice(0, 8).map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-border text-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[180px]">{doc.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploadProgress !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Uploading documents... {uploadProgress}%
              </span>
            </div>
            <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${uploadProgress}%` }}
                className="h-full bg-linear-to-r from-primary to-purple-500"
              />
            </div>
          </motion.div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border border-dashed rounded-2xl p-12 text-center transition-all duration-300",
            isDragging
              ? "border-primary bg-primary/10 scale-105 shadow-2xl shadow-primary/20"
              : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10",
          )}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <motion.div
              animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold mb-2">
                  Drag & drop your files & Generate HR here
                </p>
                <p className="text-sm text-muted-foreground">
                  or <span className="text-primary font-medium">browse</span> to
                  upload
                </p>
              </div>
            </motion.div>
          </label>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Example files (download samples):
          </p>
          <div className="flex flex-wrap gap-3">
            {exampleFiles.map((file, index) => {
              const href =
                "href" in file ? (file as { href?: string }).href : undefined;
              const Wrapper = href ? "a" : "div";
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Wrapper
                    {...(href
                      ? { href, target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-border hover:bg-primary/20 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </Wrapper>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {processingDoc && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{processingDoc.name}</p>
                <p className="text-sm text-muted-foreground">Processing...</p>
              </div>
            </div>
            <div className="text-sm font-medium text-primary">
              {processingDoc.progress}%
            </div>
          </div>
          <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${processingDoc.progress}%` }}
              className="h-full bg-linear-to-r from-primary to-purple-500"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
