"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HeroProps {
  user?: { email?: string } | null;
}

export function Hero({ user }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-purple-500/5" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[128px]" />

      <div className="container px-6 sm:px-8 py-24 mx-auto max-w-7xl relative z-10">
        {/* Vesting Buddy logo / brand */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-10 md:top-24 left-6 md:left-8 flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
            VB
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-700">
            Vesting Buddy
          </span>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 text-left mt-14"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]"
            >
              Stop Leaving{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-home-green to-purple-500">
                Free Money
              </span>{" "}
              on the Table
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-lg text-muted-foreground  max-w-xl"
            >
              Most employees lose{" "}
              <span className="text-foreground font-semibold">
                $3,000+ every year
              </span>{" "}
              in unclaimed employer matches and underutilized benefits. Let Vesting Buddy
              find every dollar you're missing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {user ? (
                <Link href="/dashboard" className="group">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-lg px-8 py-4 h-auto rounded-2xl shadow-lg shadow-home-green/20 hover:shadow-2xl hover:shadow-home-green/30 transition-all duration-300 bg-linear-to-r from-home-green to-navy-blue hover:from-home-green/90 hover:to-navy-blue/90"
                  >
                    <span className="flex items-center gap-3">
                      Go to Dashboard
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="group">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-lg px-8 py-4 h-auto rounded-2xl shadow-lg shadow-home-green/20 hover:shadow-2xl hover:shadow-home-green/30 transition-all duration-300 bg-linear-to-r from-home-green to-navy-blue hover:from-home-green/90 hover:to-navy-blue/90"
                    >
                      <span className="flex items-center gap-3">
                        Get Started
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>

                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto text-lg px-8 py-4 h-auto rounded-2xl border"
                    >
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col gap-4"
            >
              {[
                { icon: CheckCircle, text: "2-minute setup, zero risk" },
                { icon: Shield, text: "Secured and private" },
                { icon: Zap, text: "Instant AI-powered insights" },
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-home-green/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-home-green" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-linear-to-r from-home-green to-purple-500 rounded-3xl blur-3xl opacity-20" />

            <div className="relative bg-card/80 backdrop-blur-xl rounded-3xl border border-border p-8 shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Average Savings Found
                    </div>
                    <div className="text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-home-green to-navy-blue">
                      $3,768
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">
                      Per Year
                    </div>
                    <div className="text-2xl font-semibold text-green-500">
                      +100%
                    </div>
                  </div>
                </div>

                <div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />

                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: "401(k) Match",
                      value: "$1,336",
                      color: "from-home-green to-home-green",
                    },
                    {
                      label: "HSA Savings",
                      value: "$892",
                      color: "from-home-green to-home-green",
                    },
                    {
                      label: "Tax Optimization",
                      value: "$1,540",
                      color: "from-home-green to-home-green",
                    },
                    {
                      label: "Time Saved",
                      value: "12hrs",
                      color: "from-home-green to-home-green",
                    },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                      className="bg-card/50 rounded-2xl p-4 border border-home-green/10"
                    >
                      <div className="text-xs text-muted-foreground mb-2">
                        {stat.label}
                      </div>
                      <div
                        className={`text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r ${stat.color}`}
                      >
                        {stat.value}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="bg-linear-to-r from-primary/10 to-navy-blue/10 rounded-2xl p-4 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-navy-blue flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        AI Analysis Ready
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Upload your paystub to get started
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
          repeatDelay: 0.5,
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
        onClick={() =>
          window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
        }
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Scroll to explore
        </span>
        <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
          <ChevronDown className="w-5 h-5 text-primary animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
