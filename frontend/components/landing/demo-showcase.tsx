"use client";

import { motion, useInView } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  PiggyBank,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRef } from "react";

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
      <div className="absolute inset-0 bg-linear-to-b from-background via-primary/5 to-background" />

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
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-purple-500">
              Optimized
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your documents, get instant insights, and start capturing
            every dollar you deserve
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-purple-500/20 blur-3xl -z-10" />

          <div className="relative rounded-2xl border bg-card/50 backdrop-blur-sm p-4 md:p-8 shadow-2xl">
            {/* Dashboard Preview */}
            <div className="relative rounded-xl bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden border border-slate-800/50">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-800/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-slate-800/50 text-xs text-slate-400 font-mono">
                    app.vestingbuddy.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Wealth Pulse Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-slate-800/80 rounded-xl p-6 border border-primary/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                          Wealth Pulse
                        </div>
                        <div className="text-4xl font-bold text-white tabular-nums">
                          $2,704
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          Unlocked this month
                        </div>
                      </div>
                      <div className="relative">
                        {/* Circular progress */}
                        <svg
                          className="w-24 h-24 transform -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-slate-700"
                          />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                            animate={
                              isInView
                                ? {
                                    strokeDashoffset:
                                      2 * Math.PI * 40 * (1 - 0.68),
                                  }
                                : { strokeDashoffset: 2 * Math.PI * 40 }
                            }
                            transition={{
                              duration: 1.2,
                              delay: 0.8,
                              ease: "easeOut",
                            }}
                          />
                          <defs>
                            <linearGradient
                              id="gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">
                              68%
                            </div>
                            <div className="text-[9px] text-slate-400 uppercase">
                              Growth
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Opportunities Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={
                      isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
                    }
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="relative"
                  >
                    {/* Blur overlay for curiosity */}
                    <div className="absolute inset-0 backdrop-blur-[2px] bg-slate-900/40 z-10 rounded-xl flex items-center justify-center">
                      <div className="text-xs text-slate-300 font-medium px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700">
                        Sign up to unlock
                      </div>
                    </div>
                    <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-700/50">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-400">
                            401(k) Match Gap
                          </div>
                          <div className="text-2xl font-bold text-white">
                            $1,336/yr
                          </div>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-linear-to-r from-primary to-purple-500" />
                      </div>
                      <div className="text-xs text-slate-400 mt-2">
                        Contributing 65% of max match
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={
                      isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }
                    }
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="bg-slate-800/60 rounded-xl p-5 border border-purple-500/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <PiggyBank className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="text-sm font-medium text-slate-300">
                          HSA Opportunity
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-400 text-xs font-medium">
                        Action
                      </div>
                    </div>
                    <div className="text-xl font-semibold text-white mb-1">
                      $892 in tax savings
                    </div>
                    <div className="text-xs text-slate-400">
                      Increase by $75/month
                    </div>
                  </motion.div>
                </div>

                {/* Action Items Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="space-y-3"
                >
                  {[
                    {
                      icon: Shield,
                      text: "Update beneficiary designations",
                      impact: "High",
                    },
                    {
                      icon: Clock,
                      text: "Set up automatic contribution increase",
                      impact: "Medium",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                        <item.icon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 text-sm text-slate-300">
                        {item.text}
                      </div>
                      <div
                        className={`text-xs px-2 py-1 rounded ${i === 0 ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}
                      >
                        {item.impact}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ duration: 0.5, delay: 1.0 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
