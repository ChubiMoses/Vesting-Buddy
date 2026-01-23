import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          You're logged in as {user.email}
        </p>
        <div className="rounded-lg border bg-card text-card-foreground p-8">
          <h2 className="text-2xl font-semibold mb-4">Coming Soon</h2>
          <p className="text-muted-foreground">
            Your personalized benefits optimization dashboard is under construction.
            Here you'll be able to:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
            <li>Upload your paystubs and benefits documents</li>
            <li>View your AI-generated optimization plan</li>
            <li>Track your potential savings</li>
            <li>Get step-by-step action items</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
