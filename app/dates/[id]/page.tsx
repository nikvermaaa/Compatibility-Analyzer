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
