"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Brain, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Documents",
    description: "Drag and drop your paystub or benefits summary. 256-bit encrypted.",
    number: "01"
  },
  {
    icon: Brain,
    title: "AI Analyzes Everything",
    description: "Advanced algorithms scan for missed 401(k) matches, HSA opportunities, and tax savings.",
    number: "02"
  },
  {
    icon: CheckCircle,
    title: "Get Your Action Plan",
    description: "Receive a personalized roadmap with exact steps to claim every dollar.",
    number: "03"
  },
];

export function HowItWorks() {
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
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to stop leaving money on the table
          </p>
        </motion.div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="flex items-start gap-6 group"
            >
              <div className="flex-shrink-0 relative">
                <div className="w-16 h-16 rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-border hidden md:block" />
                )}
              </div>
              
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {step.number}
                  </span>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
