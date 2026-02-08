"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TraceEvent } from "@/actions/backend";

const PLACEHOLDER_STEP_NAMES = [
  "download_files",
  "load_agents",
  "extract_paystub",
  "extract_rsu",
  "policy_scout",
  "strategist",
  "guardrail",
] as const;

const PLACEHOLDER_INTERVAL_MS = 1000;

function makePlaceholderEvent(step: number, name: string, status: TraceEvent["status"]): TraceEvent {
  return {
    step,
    name,
    status,
    timestamp: new Date().toISOString(),
  };
}

export function useAnalysisTraces() {
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const hasReceivedRealTrace = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPlaceholderInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPlaceholder = useCallback(() => {
    clearPlaceholderInterval();
    hasReceivedRealTrace.current = false;
    setTraces([]);

    let stepNumber = 0;
    intervalRef.current = setInterval(() => {
      if (stepNumber >= PLACEHOLDER_STEP_NAMES.length) {
        clearPlaceholderInterval();
        return;
      }
      stepNumber += 1;
      const name = PLACEHOLDER_STEP_NAMES[stepNumber - 1];
      setTraces((prev) => [
        ...prev,
        makePlaceholderEvent(stepNumber, name, "completed"),
      ]);
    }, PLACEHOLDER_INTERVAL_MS);
  }, [clearPlaceholderInterval]);

  const addTrace = useCallback(
    (trace: TraceEvent) => {
      if (hasReceivedRealTrace.current) {
        setTraces((prev) => [...prev, trace]);
        return;
      }
      hasReceivedRealTrace.current = true;
      clearPlaceholderInterval();
      setTraces([trace]);
    },
    [clearPlaceholderInterval],
  );

  const reset = useCallback(() => {
    clearPlaceholderInterval();
    hasReceivedRealTrace.current = false;
    setTraces([]);
  }, [clearPlaceholderInterval]);

  useEffect(() => {
    return () => clearPlaceholderInterval();
  }, [clearPlaceholderInterval]);

  return { traces, addTrace, startPlaceholder, reset };
}
