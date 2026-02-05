"use server";

/**
 * Backend API server actions. Set NEXT_PUBLIC_BACKEND_URL or BACKEND_URL (server-only).
 * For private Supabase storage, use createSignedUrl(path, expirySeconds) and pass that URL.
 */

const getBaseUrl = (): string => {
  const url =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.BACKEND_URL ||
    "http://localhost:8000";
  return url.replace(/\/$/, "");
};

async function fetchBackend<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const base = getBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Backend request failed: ${msg}. Check NEXT_PUBLIC_BACKEND_URL (or BACKEND_URL) and that the backend is running and reachable.`
    );
  }
  if (!res.ok) {
    const text = await res.text();
    let detail: string;
    try {
      const json = JSON.parse(text) as { detail?: string };
      detail = json.detail ?? text;
    } catch {
      detail = text || `HTTP ${res.status}`;
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export interface AnalyzeResult {
  question: string;
  paystub: Record<string, unknown>;
  policy: Record<string, unknown>;
  leaked_value: Record<string, unknown> | null;
  reasoning: unknown[] | null;
  action_plan: unknown[] | null;
  recommendation: string;
  guardrail_status: string;
}

export async function extractPaystub(
  fileUrl: string
): Promise<Record<string, unknown>> {
  return fetchBackend("/extract/paystub", { file_url: fileUrl });
}

export async function extractRsu(
  fileUrl: string
): Promise<Record<string, unknown>> {
  return fetchBackend("/extract/rsu", { file_url: fileUrl });
}

/**
 * Extract paystub data from a Supabase storage path
 */
export async function extractPaystubFromPath(
  storagePath: string
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  try {
    const { createSignedUrl } = await import("@/actions/storage");
    const { url, error } = await createSignedUrl(storagePath, 3600);
    if (error || !url) {
      return { error: error || "Failed to create signed URL" };
    }
    const data = await extractPaystub(url);
    return { data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

/**
 * Extract RSU data from a Supabase storage path
 */
export async function extractRsuFromPath(
  storagePath: string
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  try {
    const { createSignedUrl } = await import("@/actions/storage");
    const { url, error } = await createSignedUrl(storagePath, 3600);
    if (error || !url) {
      return { error: error || "Failed to create signed URL" };
    }
    const data = await extractRsu(url);
    return { data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

/**
 * Extract policy answer from a handbook stored in Supabase
 */
export async function extractPolicyFromPath(
  storagePath: string,
  question?: string
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  try {
    const { createSignedUrl } = await import("@/actions/storage");
    const { url, error } = await createSignedUrl(storagePath, 3600);
    if (error || !url) {
      return { error: error || "Failed to create signed URL" };
    }
    const data = await policyAnswer(url, question);
    return { data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg };
  }
}

const DEFAULT_POLICY_QUESTION =
  "Find sections with match formulas, HSA contributions, and vesting schedules.";

export async function policyAnswer(
  handbookUrl: string,
  question?: string
): Promise<Record<string, unknown>> {
  return fetchBackend("/policy/answer", {
    handbook_url: handbookUrl,
    question: question ?? DEFAULT_POLICY_QUESTION,
  });
}

export async function analyze(
  paystubUrl: string,
  handbookUrl: string,
  rsuUrl?: string | null,
  policyQuestion?: string | null
): Promise<AnalyzeResult> {
  const body: Record<string, unknown> = {
    paystub_url: paystubUrl,
    handbook_url: handbookUrl,
  };
  if (rsuUrl != null && rsuUrl !== "") body.rsu_url = rsuUrl;
  if (policyQuestion != null && policyQuestion !== "")
    body.policy_question = policyQuestion;
  return fetchBackend<AnalyzeResult>("/analyze", body);
}

export async function sendChatMessage(
  message: string,
  context?: string | null
): Promise<{ reply: string }> {
  const body: Record<string, unknown> = { message };
  if (context != null && context !== "") body.context = context;
  return fetchBackend<{ reply: string }>("/chat", body);
}

export async function saveAnalysis(
  userId: string,
  result: AnalyzeResult,
  urls?: { paystub_url?: string; handbook_url?: string; rsu_url?: string },
  analysisId?: string
): Promise<{ error?: string; id?: string }> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  
  const row = {
    ...(analysisId && { id: analysisId }), // Use stream's ID if provided
    user_id: userId,
    paystub_url: urls?.paystub_url ?? null,
    handbook_url: urls?.handbook_url ?? null,
    rsu_url: urls?.rsu_url ?? null,
    recommendation: result.recommendation,
    leaked_value: result.leaked_value,
    action_plan: result.action_plan,
    paystub_data: result.paystub,
    policy_answer: result.policy,
    guardrail_status: result.guardrail_status,
    status: "completed",
  };
  
  const { data, error } = await supabase
    .from("analyses")
    .insert(row)
    .select("id")
    .single();
    
  if (error) return { error: error.message };
  return { id: data?.id };
}

export async function getChatContext(): Promise<string> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "";
  const { data: rows } = await supabase
    .from("analyses")
    .select("recommendation, leaked_value, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);
  if (!rows?.length) return "";
  const parts = rows.map((r, i) => {
    const rec = (r.recommendation || "").slice(0, 500);
    const lv = r.leaked_value as Record<string, unknown> | null;
    const cost = lv?.annual_opportunity_cost ?? lv?.annual_opportunity_cost;
    return `[Analysis ${i + 1}] ${rec}${cost != null ? ` Annual opportunity: $${cost}` : ""}`;
  });
  return "Last analyses:\n" + parts.join("\n\n");
}

export interface AnalysisRow {
  id: string;
  user_id: string;
  paystub_url: string | null;
  handbook_url: string | null;
  rsu_url: string | null;
  recommendation: string | null;
  leaked_value: Record<string, unknown> | null;
  action_plan: unknown[] | null;
  paystub_data: Record<string, unknown> | null;
  policy_answer: Record<string, unknown> | null;
  guardrail_status: string | null;
  created_at: string;
}

export async function getAnalyses(limit = 20): Promise<AnalysisRow[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: rows } = await supabase
    .from("analyses")
    .select(
      "id, user_id, paystub_url, handbook_url, rsu_url, recommendation, leaked_value, action_plan, paystub_data, policy_answer, guardrail_status, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (rows ?? []) as AnalysisRow[];
}

/**
 * Run analyze using storage paths: creates signed URLs, calls backend /analyze, saves to analyses.
 * Paths are storage paths (e.g. userId/timestamp_name.pdf). Stores paths in analyses table.
 */
export async function runAnalysisFromPaths(
  paystubPath: string,
  handbookPath: string,
  rsuPath?: string | null
): Promise<{ error?: string }> {
  const { createClient } = await import("@/lib/supabase/server");
  const { createSignedUrl } = await import("@/actions/storage");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { url: paystubUrl, error: e1 } = await createSignedUrl(paystubPath, 3600);
  const { url: handbookUrl, error: e2 } = await createSignedUrl(handbookPath, 3600);
  if (e1 || !paystubUrl) return { error: e1 ?? "Failed to get paystub URL" };
  if (e2 || !handbookUrl) return { error: e2 ?? "Failed to get handbook URL" };

  let rsuUrl: string | null = null;
  if (rsuPath && rsuPath.trim()) {
    const { url, error: e3 } = await createSignedUrl(rsuPath, 3600);
    if (!e3 && url) rsuUrl = url;
  }

  let result: AnalyzeResult;
  try {
    result = await analyze(paystubUrl, handbookUrl, rsuUrl);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Analysis failed" };
  }

  return saveAnalysis(user.id, result, {
    paystub_url: paystubPath,
    handbook_url: handbookPath,
    rsu_url: rsuPath && rsuPath.trim() ? rsuPath : undefined,
  });
}

/**
 * Run analyze using public URLs (e.g. demo PDFs: baseUrl + /demo/paystub-sample.pdf).
 * Use this when the user selects "Use demo files" so the backend can fetch from your frontend origin.
 */
export async function runAnalysisFromUrls(
  paystubUrl: string,
  handbookUrl: string,
  rsuUrl?: string | null
): Promise<{ error?: string }> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  let result: AnalyzeResult;
  try {
    result = await analyze(paystubUrl, handbookUrl, rsuUrl ?? null);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Analysis failed",
    };
  }

  return saveAnalysis(user.id, result, {
    paystub_url: paystubUrl,
    handbook_url: handbookUrl,
    rsu_url: rsuUrl && rsuUrl.trim() ? rsuUrl : undefined,
  });
}

export interface TraceEvent {
  step: number;
  name: string;
  status: "processing" | "completed" | "failed";
  payload?: Record<string, unknown>;
  timestamp: string;
}

// NOTE: SSE streaming moved to client-side lib/analysis-stream.ts
// Server Actions cannot handle ReadableStream/SSE consumption

export interface AnalysisTrace {
  id: string;
  analysis_id: string;
  step_number: number;
  step_name: string;
  step_status: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export async function getAnalysisTraces(analysisId: string): Promise<AnalysisTrace[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("analysis_traces")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("step_number", { ascending: true });
  return (rows ?? []) as AnalysisTrace[];
}

export async function saveTraces(
  analysisId: string,
  traces: TraceEvent[]
): Promise<{ error?: string }> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const tracesToSave = traces.map((t) => ({
    analysis_id: analysisId,
    step_number: t.step,
    step_name: t.name,
    step_status: t.status,
    payload: t.payload,
  }));
  const { error } = await supabase.from("analysis_traces").insert(tracesToSave);
  if (error) return { error: error.message };
  return {};
}
