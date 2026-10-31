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
