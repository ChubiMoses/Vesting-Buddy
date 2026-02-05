"use client";

import { motion, useInView } from "framer-motion";
import { CheckCircle, Lock, Shield, TrendingUp } from "lucide-react";
import { useRef } from "react";

const trustPoints = [
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your financial data is encrypted and never shared.",
  },
  {
    icon: Lock,
    title: "Bank-Level Security",
    description: "Enterprise-grade protection for your sensitive information.",
  },
  {
    icon: TrendingUp,
    title: "No Speculation",
    description: "We focus on guaranteed returns, not risky investments.",
  },
  {
    icon: CheckCircle,
    title: "Evidence-Based",
    description: "Every recommendation is grounded in your actual documents.",
  },
];

export function Trust() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Why Trust Vesting Buddy?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're not here to sell you risky investments. We help you claim
            what's already yours.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
              }
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-xs hover:border-primary/40 transition-all duration-300 text-center space-y-4 hover:shadow-lg">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-border mx-auto group-hover:bg-primary/20 transition-colors">
                  <point.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="inline-block p-8 rounded-3xl bg-card/80 backdrop-blur-xs border border-border">
            <p className="text-2xl font-bold mb-3 text-primary">
              Built for Encode AI Agents Hackathon
            </p>
            <p className="text-muted-foreground text-lg">
              Financial Health Track • Powered by Opik for LLM Observability
            </p>
          </div>
        </motion.div> */}
      </div>
    </section>
  );
}
