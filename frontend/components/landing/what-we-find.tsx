"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { DollarSign, PiggyBank, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const findings = [
  {
    icon: DollarSign,
    title: "Missed 401(k) Match",
    description: "Not contributing enough to capture your full employer match? That's free money left behind every paycheck.",
    stat: "Avg. $1,336/year",
  },
  {
    icon: PiggyBank,
    title: "Underused HSA/FSA",
    description: "Tax-advantaged accounts can save you 30%+ on healthcare costs. Most employees don't max these out.",
    stat: "Avg. $892/year",
  },
  {
    icon: TrendingDown,
    title: "Tax Leakage",
    description: "Improper contribution timing and account usage can cost you thousands in unnecessary taxes annually.",
    stat: "Avg. $1,540/year",
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

        <div className="grid md:grid-cols-3 gap-8">
          {findings.map((finding, index) => (
            <motion.div
              key={finding.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              className="h-full"
            >
              <Card className="h-full border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 mb-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-2xl blur opacity-20" />
                    <finding.icon className="h-8 w-8 text-primary relative z-10" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{finding.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed">{finding.description}</p>
                  <div className="pt-6 border-t border-primary/10">
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                        {finding.stat}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">average annual savings</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
