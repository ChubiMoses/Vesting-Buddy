"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2, TrendingUp, Zap } from "lucide-react";

const features = [
  {
    icon: Zap,
    text: "Instant analysis in seconds",
  },
  {
    icon: CheckCircle2,
    text: "Guaranteed benefit capture",
  },
  {
    icon: TrendingUp,
    text: "Track savings over time",
  },
];

export function DemoShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container px-4 mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-16"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            See It In Action
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Your Money,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">
              Optimized
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your documents, get instant insights, and start capturing every dollar you deserve
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10" />
          
          <div className="relative rounded-2xl border bg-card/50 backdrop-blur-sm p-8 shadow-2xl">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden border border-slate-700/50">
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>

              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-full space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="bg-slate-800/80 rounded-lg p-6 border border-primary/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-slate-400">401(k) Match Opportunity</div>
                        <div className="text-2xl font-bold text-white">$1,336/year</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={isInView ? { width: "65%" } : { width: "0%" }}
                          transition={{ duration: 1, delay: 0.8 }}
                          className="h-full bg-gradient-to-r from-primary to-purple-500"
                        />
                      </div>
                      <div className="text-xs text-slate-400">You're capturing 65% of potential match</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="bg-slate-800/80 rounded-lg p-6 border border-purple-500/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-slate-300">HSA Optimization</div>
                      <div className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                        Action Required
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-white mb-2">$892 in tax savings available</div>
                    <div className="text-xs text-slate-400">Increase contributions by $75/month</div>
                  </motion.div>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none" />
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-sm font-medium">{feature.text}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
