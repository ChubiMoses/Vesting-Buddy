import { redirect } from "next/navigation";
import { getAnalyses } from "@/actions/backend";
import { listUserDocuments } from "@/actions/storage";
import { createClient } from "@/lib/supabase/server";
import { ManageContent } from "./manage-content";

export default async function ManagePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [analyses, documents] = await Promise.all([
    getAnalyses(50),
    listUserDocuments(),
  ]);

  return <ManageContent documents={documents} analyses={analyses} />;
}
