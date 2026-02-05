"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, Sparkles, Zap, TrendingUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendChatMessage, getChatContext } from "@/actions/backend";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = { role: "user" | "assistant"; content: string };

const suggestedQuestions = [
  {
    icon: TrendingUp,
    text: "How can I maximize my 401(k) match?",
    gradient: "from-primary to-cyan-500",
  },
  {
    icon: Target,
    text: "What's my current opportunity cost?",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Sparkles,
    text: "Explain my RSU vesting schedule",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Zap,
    text: "Show me my savings breakdown",
    gradient: "from-green-500 to-emerald-500",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<string>("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatContext().then(setContext);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const { reply } = await sendChatMessage(text, context || undefined);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    if (loading) return;
    setInput(question);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-linear-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative p-6 md:p-8 flex flex-col h-screen max-h-screen">
        <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-primary to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-linear-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg">
                  <Bot className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  AI Assistant
                </h1>
              </div>
            </div>
          </motion.div>

          {/* Messages Container */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-xl p-6 mb-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary/40"
          >
            <AnimatePresence mode="popLayout">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center h-full py-12"
                >
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-linear-to-r from-primary/30 to-purple-500/30 rounded-full blur-2xl animate-pulse" />
                    <div className="relative w-20 h-20 rounded-full bg-linear-to-br from-primary to-purple-500 flex items-center justify-center shadow-xl">
                      <Bot className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-center">
                    How can I help you today?
                  </h2>
                  <p className="text-muted-foreground text-center mb-8 max-w-md">
                    Ask me anything about your savings, investments, benefits,
                    or financial strategy.
                  </p>

                  {/* Suggested Questions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                    {suggestedQuestions.map((suggestion, i) => {
                      const Icon = suggestion.icon;
                      return (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() =>
                            handleSuggestedQuestion(suggestion.text)
                          }
                          className="group relative p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 text-left transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden"
                        >
                          <div
                            className={`absolute inset-0 bg-linear-to-r ${suggestion.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
                          />
                          <div className="relative flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg bg-linear-to-br ${suggestion.gradient} flex items-center justify-center shrink-0 shadow-lg`}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <p className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                              {suggestion.text}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "flex gap-3",
                        m.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      {m.role === "assistant" && (
                        <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-purple-500 flex items-center justify-center shrink-0 shadow-lg">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-5 py-4 shadow-lg",
                          m.role === "user"
                            ? "bg-linear-to-br from-primary to-primary/90 text-primary-foreground"
                            : "bg-card/80 backdrop-blur-sm border border-border/50 text-foreground",
                        )}
                      >
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:text-foreground/90 prose-headings:text-foreground prose-strong:text-foreground prose-ul:text-foreground/90 prose-li:text-foreground/90">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {m.content}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 justify-start"
                    >
                      <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-purple-500 flex items-center justify-center shrink-0 shadow-lg">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="rounded-2xl px-5 py-4 bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
                        <div className="flex gap-1.5">
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              delay: 0,
                            }}
                            className="w-2 h-2 rounded-full bg-primary"
                          />
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              delay: 0.2,
                            }}
                            className="w-2 h-2 rounded-full bg-primary"
                          />
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              delay: 0.4,
                            }}
                            className="w-2 h-2 rounded-full bg-primary"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="relative"
          >
            <div className="relative flex gap-3 p-2 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your finances, benefits, or savings strategy..."
                className="flex-1 bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="icon"
                className="rounded-xl h-12 w-12 shrink-0 bg-linear-to-br from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              <Sparkles className="w-3 h-3 inline mr-1" />
              AI responses are based on your uploaded documents and analysis
              history
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
