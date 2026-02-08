"use client";

import { CheckCircle2, CloudUpload, Loader2 } from "lucide-react";

export type UploadSlotId = "paystub" | "handbook" | "rsu";

export const UPLOAD_SLOT_CONFIG: Record<
  UploadSlotId,
  { label: string; description: string; hint: string; required: boolean }
> = {
  paystub: {
    label: "Monthly Paystub",
    description: "Your latest pay statement with gross pay, deductions, and 401(k) contributions.",
    hint: "PDF, up to 10MB",
    required: true,
  },
  handbook: {
    label: "Benefits Handbook",
    description: "Company policy doc covering 401(k) match, HSA, and other benefits.",
    hint: "PDF, up to 10MB",
    required: true,
  },
  rsu: {
    label: "Equity / RSU Grant",
    description: "Stock or RSU grant details for vesting and tax planning (optional).",
    hint: "PDF, optional",
    required: false,
  },
};

interface UploadSlotCardProps {
  slot: UploadSlotId;
  path: string | null;
  uploading: boolean;
  disabled?: boolean;
  onSelectFile: (file: File) => void;
  extraAction?: React.ReactNode;
  children?: React.ReactNode;
}

export function UploadSlotCard({
  slot,
  path,
  uploading,
  disabled,
  onSelectFile,
  extraAction,
  children,
}: UploadSlotCardProps) {
  const config = UPLOAD_SLOT_CONFIG[slot];
  const inputId = `file-${slot}`;
  const isIndigo = slot === "handbook";

  return (
    <div
      className={`flex flex-col rounded-2xl border-2 border-dashed overflow-hidden transition-all duration-200 ${
        isIndigo
          ? "border-indigo-200 bg-indigo-50/50 hover:border-indigo-300 hover:shadow-md"
          : "border-border bg-card hover:border-primary/40 hover:shadow-md"
      }`}
    >
      <input
        type="file"
        id={inputId}
        accept=".pdf"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelectFile(f);
          e.target.value = "";
        }}
      />
      <label
        htmlFor={inputId}
        className={`flex-1 flex flex-col cursor-pointer min-h-[220px] ${
          disabled ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          {path ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <p className="font-semibold text-sm text-foreground truncate w-full px-2">
                {path.split("/").pop() ?? "Uploaded"}
              </p>
              <p className="text-xs text-success mt-1">Ready for analysis</p>
            </>
          ) : uploading ? (
            <>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                  isIndigo ? "bg-indigo-100" : "bg-primary/10"
                }`}
              >
                <Loader2
                  className={`w-7 h-7 animate-spin ${
                    isIndigo ? "text-indigo-600" : "text-primary"
                  }`}
                />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Uploading...
              </p>
            </>
          ) : (
            <>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                  isIndigo ? "bg-indigo-100" : "bg-primary/10"
                }`}
              >
                <CloudUpload
                  className={isIndigo ? "w-7 h-7 text-indigo-600" : "w-7 h-7 text-primary"}
                />
              </div>
              <p className="font-semibold text-foreground">{config.label}</p>
              <p className="text-xs text-muted-foreground mt-1.5 px-1 line-clamp-2">
                {config.description}
              </p>
              <p className="text-xs text-muted-foreground/80 mt-2">{config.hint}</p>
            </>
          )}
        </div>
      </label>
      {extraAction ? (
        <div
          className="p-3 border-t border-border/50 flex justify-center"
          onClick={(e) => e.preventDefault()}
        >
          {extraAction}
        </div>
      ) : null}
      {children}
    </div>
  );
}
