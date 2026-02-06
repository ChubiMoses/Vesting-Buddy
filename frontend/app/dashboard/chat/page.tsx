"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getChatContext, sendChatMessage } from "@/actions/backend";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const suggestedQuestions = [
  {
    icon: TrendingUp,
    text: "How can I maximize my 401(k) match?",
  },
  {
    icon: Target,
    text: "What's my current opportunity cost?",
  },
  {
    icon: Sparkles,
    text: "Explain my RSU vesting schedule",
  },
  {
    icon: Zap,
    text: "Show me my savings breakdown",
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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Ask questions about your finances
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-6 bg-background"
      >
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2 text-center">
                  How can I help you today?
                </h2>
                <p className="text-muted-foreground text-center mb-8 max-w-md text-sm">
                  Ask me anything about your savings, investments, benefits,
                  or financial strategy.
                </p>

                {/* Suggested Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {suggestedQuestions.map((suggestion, i) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSuggestedQuestion(suggestion.text)}
                        className="p-4 rounded-xl border border-border bg-card hover:bg-muted/50 text-left transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {suggestion.text}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {m.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-3",
                        m.role === "user"
                          ? "bg-primary text-white"
                          : "bg-card border border-border/50 shadow-sm",
                      )}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground">
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="rounded-xl px-4 py-3 bg-card border border-border/50 shadow-sm">
                      <div className="flex gap-1.5">
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                          className="w-2 h-2 rounded-full bg-primary"
                        />
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                          className="w-2 h-2 rounded-full bg-primary"
                        />
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
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
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 border-t border-border bg-card">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            AI responses are based on your uploaded documents and analysis history
          </p>
        </form>
      </div>
    </div>
  );
}
