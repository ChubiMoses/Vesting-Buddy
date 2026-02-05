import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAnalyses } from "@/actions/backend";
import { listUserDocuments } from "@/actions/storage";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();
  if (!profile?.onboarding_complete) redirect("/dashboard/onboarding");

  const [analyses, documents] = await Promise.all([
    getAnalyses(20),
    listUserDocuments(),
  ]);

  return <DashboardContent analyses={analyses} documents={documents} />;
}
