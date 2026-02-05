"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Brain, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Documents",
    description:
      "Drag and drop your paystub, benefits summary, or RSU grant. We support PDF, and all data is 256-bit encrypted.",
    number: "01",
    color: "from-primary to-navy-blue",
  },
  {
    icon: Brain,
    title: "AI Analyzes Everything",
    description:
      "Advanced multi-agent AI system scans for missed 401(k) matches, HSA opportunities, RSU optimization, and hidden tax savings in real-time.",
    number: "02",
    color: "from-primary to-navy-blue",
  },
  {
    icon: CheckCircle,
    title: "Get Your Action Plan",
    description:
      "Receive a personalized roadmap with exact steps, dollar amounts, and priority rankings to claim every dollar you're entitled to.",
    number: "03",
    color: "from-primary to-navy-blue",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="py-24 bg-muted/30 dark:bg-muted/10 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl" />

      <div className="container px-4 mx-auto max-w-6xl relative z-10">
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

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative group"
            >
              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 -translate-x-1/2 z-0">
                  <div
                    className={`h-full bg-linear-to-r ${step.color} opacity-20`}
                  />
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.15 }}
                    className={`h-full bg-linear-to-r ${step.color} origin-left`}
                  />
                </div>
              )}

              <div className="relative bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 h-full">
                {/* Number badge */}
                <div className="absolute -top-3 -left-3 w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shadow-lg">
                  <span
                    className={`text-lg font-bold bg-linear-to-r ${step.color} bg-clip-text text-transparent`}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl bg-linear-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300`}
                >
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Hover indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
