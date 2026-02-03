"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendChatMessage, getChatContext } from "@/actions/backend";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

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
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
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

  return (
    <div className="p-8 flex flex-col h-[calc(100vh-0px)] max-h-[calc(100vh-0px)]">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-primary" />
            Chat
          </h1>
          <p className="text-muted-foreground">
            Ask about your savings, 401(k) match, vesting, or analysis
          </p>
        </div>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto rounded-2xl border-2 border-primary/20 bg-card/50 backdrop-blur-sm p-4 space-y-4 mb-4"
        >
          {messages.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Send a message to get started.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted border border-primary/20 text-foreground"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-muted border border-primary/20">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse ml-1 delay-75" />
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse ml-1 delay-150" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your savings or analysis..."
            className="flex-1 rounded-xl border-2 border-primary/20 bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon" className="rounded-xl h-12 w-12 flex-shrink-0">
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
