import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAnalyses, getAnalysisTraces } from "@/actions/backend";
import { TracesContent } from "./traces-content";

export default async function TracesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const analyses = await getAnalyses(10);

  const analysesWithTraces = await Promise.all(
    analyses.map(async (analysis) => {
      const traces = await getAnalysisTraces(analysis.id);
      return { analysis, traces };
    }),
  );

  return <TracesContent analysesWithTraces={analysesWithTraces} />;
}
