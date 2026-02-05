"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validations/auth";

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validation = signupSchema.safeParse({
    email,
    password,
    confirmPassword,
  });

  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message,
    };
  }

  const supabase = await createClient();

  const headersList = await headers();
  const origin = headersList.get("origin") || headersList.get("host");
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (origin
      ? origin.startsWith("http")
        ? origin
        : `https://${origin}`
      : "http://localhost:3000");

  const { error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Check your email to confirm your account",
  };
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validation = loginSchema.safeParse({ email, password });

  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_complete")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        onboarding_complete: false,
      });
      redirect("/dashboard/onboarding");
      return;
    }

    if (!profile.onboarding_complete) {
      redirect("/dashboard/onboarding");
      return;
    }
  }

  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || headersList.get("host");

  // Use environment variable if available, otherwise construct from headers
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (origin
      ? origin.startsWith("http")
        ? origin
        : `https://${origin}`
      : "http://localhost:3000");

  const redirectTo = `${siteUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
