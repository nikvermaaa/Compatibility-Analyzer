"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChemistryMeter } from "@/components/ChemistryMeter";
import {
  Sparkles,
  Heart,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  Loader2,
  Ticket,
  Flame,
  Award,
  FastForward,
  ChevronRight,
} from "lucide-react";

export default function DateRoomPage() {
  const { id } = useParams() as { id: string };

  const [date, setDate] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stepping, setStepping] = useState(false);
  const [showThoughts, setShowThoughts] = useState(true);

  // Replay state
  const [replaySpeed, setReplaySpeed] = useState<1 | 2 | 4>(1);
  const [replayIdx, setReplayIdx] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchDate = async () => {
    try {
      const res = await fetch(`/api/dates/${id}`);
      const data = await res.json();
      if (res.ok) {
        setDate(data.date);
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Error fetching date:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDate();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, replayIdx]);

  // Stepping forward by 1 LLM turn
  const handleStep = async () => {
    if (stepping || (date && date.status === "done")) return;
    setStepping(true);
    try {
      const res = await fetch(`/api/dates/${id}/step`, { method: "POST" });
      const data = await res.json();
      await fetchDate();
    } catch (e) {
      console.error("Failed to step date:", e);
    } finally {
      setStepping(false);
    }
  };

  // Auto-play through uncompleted date
  const handleAutoPlay = async () => {
    if (stepping) return;
    setStepping(true);
    let done = date?.status === "done";
    while (!done) {
      try {
        const res = await fetch(`/api/dates/${id}/step`, { method: "POST" });
        const data = await res.json();
        await fetchDate();
        if (data.done) break;
        await new Promise((r) => setTimeout(r, 1200));
      } catch (e) {
        break;
      }
    }
    setStepping(false);
  };

  // Replay finished date
  const startReplay = () => {
    setReplayIdx(0);
  };

  useEffect(() => {
    if (replayIdx === null || replayIdx >= messages.length) return;
    const delay = (1600 / replaySpeed);
    const timer = setTimeout(() => {
      setReplayIdx((prev) => (prev !== null ? prev + 1 : null));
    }, delay);
    return () => clearTimeout(timer);
  }, [replayIdx, replaySpeed, messages.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
        <span className="text-muted text-sm font-mono">Entering Date Room...</span>
      </div>
    );
  }

  if (!date) {
    return (
      <div className="text-center py-20">
        <p className="text-muted text-sm">Date session not found.</p>
      </div>
    );
  }

  const personA = date.person_a;
  const personB = date.person_b;
  const card = date.date_card;
  const chemistryScore = date.chemistry || 75;

  const displayMessages =
    replayIdx !== null ? messages.slice(0, replayIdx + 1) : messages;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Header with Avatars & Chemistry Meter */}
      <div className="bg-surface border border-surfaceBorder rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Person A */}
        <Link
          href={`/p/${personA.slug}`}
          className="flex items-center gap-3 group text-center md:text-left"
        >
          <img
            src={personA.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
            alt={personA.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-surfaceBorder group-hover:border-gold transition-colors shadow-md"
          />
          <div>
            <h2 className="font-serif font-bold text-foreground text-base group-hover:text-gold transition-colors">
              {personA.name}
            </h2>
            <span className="text-[11px] text-muted block max-w-[150px] truncate">
              {personA.profiles?.analysis?.oneLiner || "Digital Twin"}
            </span>
          </div>
        </Link>

        {/* Center: Chemistry Meter */}
        <div className="flex-1 flex justify-center">
          <ChemistryMeter score={chemistryScore} />
        </div>

        {/* Person B */}
        <Link
          href={`/p/${personB.slug}`}
          className="flex items-center gap-3 group text-center md:text-right flex-row-reverse md:flex-row"
        >
          <div className="text-right">
            <h2 className="font-serif font-bold text-foreground text-base group-hover:text-gold transition-colors">
              {personB.name}
            </h2>
            <span className="text-[11px] text-muted block max-w-[150px] truncate">
              {personB.profiles?.analysis?.oneLiner || "Digital Twin"}
            </span>
          </div>
          <img
            src={personB.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"}
            alt={personB.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-surfaceBorder group-hover:border-gold transition-colors shadow-md"
          />
        </Link>
      </div>

      {/* 2. Controls & Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface/50 border border-surfaceBorder p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowThoughts(!showThoughts)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              showThoughts
                ? "bg-gold/10 border-gold/40 text-gold"
                : "bg-background border-surfaceBorder text-muted hover:text-foreground"
            }`}
          >
            {showThoughts ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Show Agent Private Thoughts</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {date.status !== "done" ? (
            <>
              <button
                onClick={handleStep}
                disabled={stepping}
                className="bg-gold hover:bg-gold-light text-background font-semibold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {stepping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>Step Next Turn</span>
              </button>

              <button
                onClick={handleAutoPlay}
                disabled={stepping}
                className="bg-surface hover:bg-surfaceHover border border-surfaceBorder text-foreground font-medium px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <FastForward className="w-3.5 h-3.5 text-gold" />
                <span>Simulate Full Date</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={startReplay}
                className="bg-surface hover:bg-surfaceHover border border-surfaceBorder text-foreground font-medium px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gold" />
                <span>Replay Date</span>
              </button>

              {/* Speed Buttons */}
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setReplaySpeed(spd as 1 | 2 | 4)}
                  className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                    replaySpeed === spd
                      ? "bg-gold text-background border-gold"
                      : "bg-surface border-surfaceBorder text-muted hover:text-foreground"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. The Date Chat Room Transcript */}
      <div className="space-y-6 min-h-[400px]">
        {displayMessages.length === 0 ? (
          <div className="text-center py-16 text-muted text-xs">
            The agents are preparing for their date. Click &quot;Step Next Turn&quot; to begin!
          </div>
        ) : (
          displayMessages.map((msg, idx) => {
            if (msg.speaker === "narrator") {
              return (
                <div
                  key={msg.id || idx}
                  className="my-8 p-6 rounded-2xl bg-gradient-to-r from-amber-950/20 via-surface to-amber-950/20 border border-gold/30 text-center animate-fade-in shadow-lg"
                >
                  <div className="inline-flex items-center gap-1.5 text-gold text-[11px] font-semibold uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Atmospheric Scene &amp; Twist</span>
                  </div>
                  <p className="text-sm font-serif italic text-foreground leading-relaxed max-w-2xl mx-auto">
                    &ldquo;{msg.message}&rdquo;
                  </p>
                </div>
              );
            }

            const isA = msg.speaker === "a";
            const speakerPerson = isA ? personA : personB;

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 max-w-xl animate-fade-in ${
                  isA ? "mr-auto flex-row" : "ml-auto flex-row-reverse"
                }`}
              >
                <img
                  src={speakerPerson.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                  alt={speakerPerson.name}
                  className="w-9 h-9 rounded-full object-cover border border-surfaceBorder shrink-0 mt-1"
                />

                <div className={`space-y-1.5 ${isA ? "text-left" : "text-right"}`}>
                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <span className="font-semibold text-foreground">{speakerPerson.name}</span>
                    <span className="font-mono text-[10px]">Turn {msg.seq}</span>
                    {msg.vibe && (
                      <span className="text-gold font-mono font-semibold">· vibe {msg.vibe}/10</span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                      isA
                        ? "bg-surface border border-surfaceBorder text-foreground rounded-tl-sm"
                        : "bg-surfaceHover border border-gold/30 text-foreground rounded-tr-sm"
                    }`}
                  >
                    <p>{msg.message}</p>

                    {/* Proposal Ticket view inside planning phase */}
                    {msg.proposal && (
                      <div className="mt-3 p-3 rounded-xl bg-background border border-gold/40 text-left text-xs space-y-1 text-gold">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Proposed Outing</span>
                        </div>
                        <p className="font-semibold text-foreground">{msg.proposal.activity}</p>
                        <p className="text-muted text-[11px]">
                          {msg.proposal.place} · {msg.proposal.timeOfDay}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Private Thought Display */}
                  {showThoughts && msg.thought && (
                    <div
                      className={`text-[11px] text-muted font-mono italic px-3 py-1.5 rounded-lg bg-background/60 border border-surfaceBorder/40 max-w-sm inline-block ${
                        isA ? "text-left" : "text-left"
                      }`}
                    >
                      <span className="text-gold font-semibold not-italic font-sans mr-1">
                        Private Thought:
                      </span>
                      {msg.thought}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 4. Date Card (Ticket Style) when agreed */}
      {card && (
        <div className="bg-gradient-to-r from-surface via-surfaceHover to-surface border border-gold/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-gold flex items-center gap-1.5 mb-1">
                <Ticket className="w-4 h-4 text-gold" />
                <span>The Agreed Outing</span>
              </span>
              <h3 className="font-serif text-xl font-bold text-foreground">{card.activity}</h3>
              <p className="text-muted text-xs mt-0.5">
                {card.place} · {card.timeOfDay}
              </p>
            </div>
            <div className="text-right text-xs text-muted max-w-xs">
              <span className="text-gold font-semibold block">Why it fits both:</span>
              <p className="text-[11px] leading-relaxed mt-0.5">{card.why}</p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Debrief Panel & Final Outcome Badge */}
      {date.status === "done" && (
        <div className="bg-surface border border-surfaceBorder rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-surfaceBorder">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-gold block">
                Post-Date Debrief
              </span>
              <h3 className="font-serif text-2xl font-bold text-foreground">
                Autonomous Evaluations
              </h3>
            </div>

            <div
              className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border shadow-lg ${
                date.outcome === "match"
                  ? "bg-rose-950/80 border-rose-500 text-rose-300"
                  : date.outcome === "one_sided"
                  ? "bg-amber-950/80 border-amber-500 text-amber-300"
                  : "bg-surfaceHover border-surfaceBorder text-muted"
              }`}
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>
                {date.outcome === "match"
                  ? "It's A Match!"
                  : date.outcome === "one_sided"
                  ? "One-Sided Connection"
                  : "Friendly Pass"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Debrief A */}
            <div className="p-4 rounded-2xl bg-background border border-surfaceBorder text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{personA.name}&apos;s Verdict</span>
                <span className="font-mono text-gold font-bold">
                  {date.a_debrief?.overall ?? 75}/100 Fit
                </span>
              </div>
              <p className="italic text-muted leading-relaxed">
                &ldquo;{date.a_debrief?.verdict || "Shared wonderful chemistry."}&rdquo;
              </p>
              {date.a_debrief?.highlights && (
                <div className="space-y-1 text-[11px] text-emerald-400">
                  <span className="font-semibold block">Highlights:</span>
                  {date.a_debrief.highlights.map((h: string, i: number) => (
                    <p key={i}>• {h}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Debrief B */}
            <div className="p-4 rounded-2xl bg-background border border-surfaceBorder text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{personB.name}&apos;s Verdict</span>
                <span className="font-mono text-gold font-bold">
                  {date.b_debrief?.overall ?? 75}/100 Fit
                </span>
              </div>
              <p className="italic text-muted leading-relaxed">
                &ldquo;{date.b_debrief?.verdict || "Appreciated the thoughtful conversation."}&rdquo;
              </p>
              {date.b_debrief?.highlights && (
                <div className="space-y-1 text-[11px] text-emerald-400">
                  <span className="font-semibold block">Highlights:</span>
                  {date.b_debrief.highlights.map((h: string, i: number) => (
                    <p key={i}>• {h}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
