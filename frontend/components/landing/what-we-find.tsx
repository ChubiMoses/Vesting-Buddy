"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { DollarSign, PiggyBank, TrendingDown } from "lucide-react";

const findings = [
  {
    icon: DollarSign,
    title: "Missed 401(k) Match",
    description: "Not contributing enough to capture your full employer match? That's free money left behind every paycheck.",
    stat: "$1,336",
    period: "per year",
  },
  {
    icon: PiggyBank,
    title: "Underused HSA/FSA",
    description: "Tax-advantaged accounts can save you 30%+ on healthcare costs. Most employees don't max these out.",
    stat: "$892",
    period: "per year",
  },
  {
    icon: TrendingDown,
    title: "Tax Leakage",
    description: "Improper contribution timing and account usage can cost you thousands in unnecessary taxes annually.",
    stat: "$1,540",
    period: "per year",
  },
];

export function WhatWeFind() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24">
      <div className="container px-4 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            What We Find
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Common ways employees lose money—and how we help you recover it
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {findings.map((finding, index) => (
            <motion.div
              key={finding.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="relative group"
            >
              <div className="h-full p-6 rounded-2xl border-2 border-primary/20 bg-card/80 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <finding.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{finding.stat}</div>
                    <div className="text-xs text-muted-foreground">{finding.period}</div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-3">{finding.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{finding.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
