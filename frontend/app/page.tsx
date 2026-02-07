import { CTASection } from "@/components/landing/cta-section";
import { DemoShowcase } from "@/components/landing/demo-showcase";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { WhatWeFind } from "@/components/landing/what-we-find";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen">
      <Hero user={user} />
      <DemoShowcase />
      <WhatWeFind />
      <HowItWorks />
      <CTASection />
    </main>
  );
}
