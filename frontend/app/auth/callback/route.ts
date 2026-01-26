import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email,
            onboarding_complete: false,
          });
        return NextResponse.redirect(`${origin}/dashboard/onboarding`);
      }

      if (!profile.onboarding_complete) {
        return NextResponse.redirect(`${origin}/dashboard/onboarding`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
