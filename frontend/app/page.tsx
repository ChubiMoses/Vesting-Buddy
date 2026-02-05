import { Hero } from "@/components/landing/hero";
import { DemoShowcase } from "@/components/landing/demo-showcase";
import { HowItWorks } from "@/components/landing/how-it-works";
import { WhatWeFind } from "@/components/landing/what-we-find";
import { Trust } from "@/components/landing/trust";
import { CTASection } from "@/components/landing/cta-section";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen">
      <DarkModeToggle />
      <Hero user={user} />
      <DemoShowcase />
      <HowItWorks />
      <WhatWeFind />
      <Trust />
      <CTASection />
    </main>
  );
}
