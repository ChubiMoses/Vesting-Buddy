"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Lock, TrendingUp, CheckCircle } from "lucide-react";

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
            We're not here to sell you risky investments. We help you claim what's already yours.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustPoints.map((point, index) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative p-6 rounded-2xl border-2 border-primary/10 hover:border-primary/30 transition-all duration-300 bg-card/30 backdrop-blur-sm text-center space-y-4 hover:shadow-xl">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <point.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20" />
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 backdrop-blur-sm">
              <p className="text-2xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                Built for Encode AI Agents Hackathon
              </p>
              <p className="text-muted-foreground text-lg">
                Financial Health Track • Powered by Opik for LLM Observability
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
