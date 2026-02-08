"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const COOKIE_NAME = "vb_walkthrough_done";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const steps = [
  {
    id: "overview",
    title: "Dashboard Overview",
    description:
      "See your total unlocked value, recent analyses, and key savings metrics.",
    path: "/dashboard",
  },
  {
    id: "analyze",
    title: "Analyze",
    description:
      "Upload paystubs and policy docs to uncover missed employer benefits.",
    path: "/dashboard/upload",
  },
  {
    id: "history",
    title: "History",
    description:
      "Review the AI reasoning steps and audit every recommendation.",
    path: "/dashboard/traces",
  },
  {
    id: "manage",
    title: "Manage",
    description:
      "Keep your documents organized and revisit past analyses anytime.",
    path: "/dashboard/manage",
  },
  {
    id: "chat",
    title: "AI Chat",
    description:
      "Ask questions and get personalized guidance based on your data.",
    path: "/dashboard/chat",
  },
];

const getCookieValue = (name: string) => {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
};

const setCookieValue = (name: string, value: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; max-age=${ONE_YEAR_SECONDS}; path=/`;
};

export function WalkthroughOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const done = getCookieValue(COOKIE_NAME) === "1";
    if (!done) setActive(true);
  }, []);

  useEffect(() => {
    if (!active || !pathname) return;
    const index = steps.reduce(
      (best, step, i) =>
        pathname.startsWith(step.path) &&
        (best === -1 || step.path.length > steps[best].path.length)
          ? i
          : best,
      -1,
    );
    if (index >= 0) setStepIndex(index);
  }, [pathname, active]);

  const step = useMemo(() => steps[stepIndex], [stepIndex]);

  const finishWalkthrough = () => {
    setCookieValue(COOKIE_NAME, "1");
    setActive(false);
  };

  const goNext = () => {
    if (stepIndex >= steps.length - 1) {
      finishWalkthrough();
      return;
    }
    setStepIndex(stepIndex + 1);
    router.push(steps[stepIndex + 1].path);
  };

  const goBack = () => {
    if (stepIndex <= 0) return;
    setStepIndex(stepIndex - 1);
    router.push(steps[stepIndex - 1].path);
  };

  if (!active) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Step {stepIndex + 1} of {steps.length}
              </p>
              <h2 className="text-xl font-semibold mt-2">{step.title}</h2>
              <p className="text-sm text-muted-foreground mt-2">
                {step.description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={finishWalkthrough}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={finishWalkthrough}>
                Skip
              </Button>
              <Button size="sm" onClick={goNext}>
                {stepIndex === steps.length - 1 ? "Finish" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
