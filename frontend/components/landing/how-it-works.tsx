"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Upload, Brain, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Documents",
    description: "Drag and drop your paystub or benefits summary. 256-bit encrypted.",
    color: "from-primary to-cyan-500",
    number: "01"
  },
  {
    icon: Brain,
    title: "AI Analyzes Everything",
    description: "Advanced algorithms scan for missed 401(k) matches, HSA opportunities, and tax savings.",
    color: "from-purple-500 to-pink-500",
    number: "02"
  },
  {
    icon: CheckCircle,
    title: "Get Your Action Plan",
    description: "Receive a personalized roadmap with exact steps to claim every dollar.",
    color: "from-pink-500 to-rose-500",
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

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden md:block -translate-y-1/2" />
          
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative"
            >
              <Card className="h-full border-2 hover:border-primary/40 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8 space-y-6 relative">
                  <div className="absolute -top-6 left-8">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="pt-8 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${step.color} opacity-20`}>
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
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
