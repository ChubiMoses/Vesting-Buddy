"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  DollarSign,
  PiggyBank,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

const findings = [
  {
    icon: DollarSign,
    title: "Missed 401(k) Match",
    description:
      "Not contributing enough to capture your full employer match? That's free money left behind every paycheck.",
    stat: "$1,336",
    period: "per year",
    color: "from-primary to-navy-blue",
    percentage: "87%",
    percentageLabel: "of employees miss this",
  },
  {
    icon: PiggyBank,
    title: "Underused HSA/FSA",
    description:
      "Tax-advantaged accounts can save you 30%+ on healthcare costs. Most employees don't max these out.",
    stat: "$892",
    period: "per year",
    color: "from-primary to-navy-blue",
    percentage: "73%",
    percentageLabel: "don't optimize HSA",
  },
  {
    icon: TrendingDown,
    title: "Tax Leakage",
    description:
      "Improper contribution timing and account usage can cost you thousands in unnecessary taxes annually.",
    stat: "$1,540",
    period: "per year",
    color: "from-primary to-navy-blue",
    percentage: "91%",
    percentageLabel: "overpay on taxes",
  },
];

export function WhatWeFind() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 relative">
      <div className="container px-4 mx-auto max-w-7xl">
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
            we help you recover every dollar
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {findings.map((finding, index) => (
            <motion.div
              key={finding.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div
                className={`absolute inset-0 rounded-2xl bg-linear-to-br ${finding.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`}
              />

              <div className="relative h-full p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-300 shadow-lg hover:shadow-xl">
                {/* Icon & Stats Header */}
                <div className="flex items-start justify-between mb-6">
                  <div
                    className={`w-14 h-14 rounded-xl bg-linear-to-br ${finding.color} flex items-center justify-center shadow-lg`}
                  >
                    <finding.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold bg-linear-to-r ${finding.color} bg-clip-text text-transparent`}
                    >
                      {finding.stat}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {finding.period}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {finding.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {finding.description}
                </p>

                {/* Stat badge */}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-2.5 py-1 rounded-lg bg-linear-to-r ${finding.color} bg-opacity-10`}
                    >
                      <span
                        className={`text-sm font-bold bg-linear-to-r ${finding.color} bg-clip-text text-transparent`}
                      >
                        {finding.percentage}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {finding.percentageLabel}
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-block p-6 rounded-2xl bg-card border border-border shadow-xl">
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
