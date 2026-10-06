"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Loader2, Bot } from "lucide-react";

interface AskAgentChatProps {
  personId: string;
  personName: string;
}

export function AskAgentChat({ personId, personName }: AskAgentChatProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<{ q: string; a: string }[]>([]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const currentQ = question.trim();
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch(`/api/agent/${personId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQ }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ask agent");

      setConversation((prev) => [...prev, { q: currentQ, a: data.answer }]);
    } catch (err: any) {
      setConversation((prev) => [
        ...prev,
        { q: currentQ, a: `Sorry, I couldn't process that: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
          <Bot className="w-4 h-4 text-gold" />
          <span>Ask {personName}&apos;s Digital Twin</span>
        </h3>
        <span className="text-[11px] text-muted">Answers grounded in authentic data</span>
      </div>

      {conversation.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto p-4 rounded-xl bg-background border border-surfaceBorder/60 text-xs">
          {conversation.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-start gap-2 text-foreground font-medium">
                <span className="text-gold font-bold">You:</span>
                <span>{item.q}</span>
              </div>
              <div className="flex items-start gap-2 text-muted pl-4 border-l border-gold/30">
                <span className="text-gold font-bold">Agent:</span>
                <span className="leading-relaxed">{item.a}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          type="text"
          placeholder={`Ask about ${personName}'s dating preferences or who they fit with...`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          className="flex-1 bg-background border border-surfaceBorder rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-gold transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="bg-gold hover:bg-gold-light text-background font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
