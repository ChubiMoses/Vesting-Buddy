import type { AnalyzeResult, TraceEvent } from "@/actions/backend";

export interface StreamResult {
  analysisId: string;
  result?: AnalyzeResult;
  error?: string;
}

/**
 * Client-side SSE stream consumer for real-time analysis traces.
 * This MUST run on the client (not in a Server Action).
 */
export async function consumeAnalysisStream(
  paystubUrl: string,
  handbookUrl: string,
  rsuUrl: string | null,
  onTrace: (event: TraceEvent) => void,
): Promise<StreamResult> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    return {
      analysisId: "",
      error: "NEXT_PUBLIC_BACKEND_URL is not configured",
    };
  }

  const body = {
    paystub_url: paystubUrl,
    handbook_url: handbookUrl,
    ...(rsuUrl && { rsu_url: rsuUrl }),
  };

  try {
    const response = await fetch(`${backendUrl}/analyze/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });


    if (!response.ok) {
      const text = await response.text();
      console.error("[SSE] Error response:", text);
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let analysisId = "";
    let result: AnalyzeResult | undefined;
    let traceCount = 0;


    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "start") {
              analysisId = data.analysis_id;
            } else if (data.type === "trace") {
              traceCount++;
              onTrace(data as TraceEvent);
            } else if (data.type === "complete") {
              result = data.result as AnalyzeResult;
            } else if (data.type === "error") {
              console.error("[SSE] Analysis error:", data.error);
              return { analysisId, error: data.error };
            }
          } catch (parseErr) {
            console.warn("[SSE] Failed to parse line:", line, parseErr);
          }
        }
      }
    }

    if (!result) {
      return {
        analysisId,
        error: "Analysis completed but result was not received from server",
      };
    }

    return { analysisId, result };
  } catch (err) {
    return {
      analysisId: "",
      error: err instanceof Error ? err.message : "Analysis failed",
    };
  }
}
