"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AirplayIcon, Bot, BrainCircuit, MessageCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getChatContext, sendChatMessage } from "@/actions/backend";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<string>("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatContext().then(setContext);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isOpen]);

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

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-shadow z-50 flex items-center justify-center"
          >
            <BrainCircuit className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex-none px-4 py-3 border-b border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">
                      Ask me anything
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Area */}
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto p-4 bg-background"
              >
                <AnimatePresence mode="popLayout">
                  {messages.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full text-center"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold mb-1">
                        How can I help?
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-[280px]">
                        Ask me about your finances, benefits, or savings
                        strategy.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex gap-2",
                            m.role === "user" ? "justify-end" : "justify-start",
                          )}
                        >
                          {m.role === "assistant" && (
                            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shrink-0">
                              <Bot className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                              m.role === "user"
                                ? "bg-primary text-white"
                                : "bg-card border border-border/50 shadow-sm",
                            )}
                          >
                            {m.role === "assistant" ? (
                              <div className="prose prose-xs max-w-none prose-p:leading-relaxed prose-p:text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {m.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="leading-relaxed whitespace-pre-wrap">
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
                          className="flex gap-2 justify-start"
                        >
                          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shrink-0">
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                          <div className="rounded-lg px-3 py-2 bg-card border border-border/50 shadow-sm">
                            <div className="flex gap-1">
                              <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 1,
                                  delay: 0,
                                }}
                                className="w-1.5 h-1.5 rounded-full bg-primary"
                              />
                              <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 1,
                                  delay: 0.2,
                                }}
                                className="w-1.5 h-1.5 rounded-full bg-primary"
                              />
                              <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 1,
                                  delay: 0.4,
                                }}
                                className="w-1.5 h-1.5 rounded-full bg-primary"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="flex-none p-3 border-t border-border bg-card">
                <form onSubmit={handleSubmit}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      disabled={loading || !input.trim()}
                      size="sm"
                      className="px-3"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
