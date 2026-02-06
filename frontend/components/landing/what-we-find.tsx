"use client";

import { motion, useInView } from "framer-motion";
import { AlertCircle, DollarSign, PiggyBank, TrendingDown } from "lucide-react";
import { useRef } from "react";

const findings = [
  {
    icon: DollarSign,
    title: "Missed 401(k) Match",
    description:
      "Not contributing enough to capture your full employer match? That's free money left behind every paycheck.",
    stat: "$1,336 per year",
    statLabel: "87% of employees miss this",
  },
  {
    icon: PiggyBank,
    title: "Underused HSA/FSA",
    description:
      "Tax-advantaged accounts can save you 30%+ on healthcare costs. Most employees don't max these out.",
    stat: "$892 per year",
    statLabel: "73% don't optimize HSA",
  },
  {
    icon: TrendingDown,
    title: "Tax Leakage",
    description:
      "Improper contribution timing and account usage can cost you thousands in unnecessary taxes annually.",
    stat: "$1,540 per year",
    statLabel: "91% overpay on taxes",
  },
];

export function WhatWeFind() {
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium mb-4">
            <AlertCircle className="w-4 h-4" />
            Common Money Leaks
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            What We Find
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            These are the most common ways employees lose money—and exactly how
            we help you recover every dollar.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {findings.map((finding, index) => (
            <motion.div
              key={finding.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={
                isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }
              }
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 text-center space-y-4 hover:shadow-lg">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-border mx-auto group-hover:bg-primary/20 transition-colors">
                  <finding.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold">{finding.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {finding.description}
                </p>
                <div className="pt-3 border-t border-border/50 space-y-1">
                  <p className="text-sm font-semibold text-primary">
                    {finding.stat}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {finding.statLabel}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-block p-6 rounded-2xl bg-card border border-border shadow-lg">
            <p className="text-lg font-semibold mb-2">
              Don't let another paycheck go by without optimization
            </p>
            <p className="text-sm text-muted-foreground">
              Join to recover your missing benefits
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
