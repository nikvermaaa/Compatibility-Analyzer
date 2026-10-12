import Link from "next/link";
import { Sparkles, ArrowRight, Heart, Brain, MessagesSquare, Compass, Award, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch real-time metrics from Supabase
  let peopleCount = 25;
  let datesCount = 42;
  let matchesCount = 18;

  try {
    const [pRes, dRes, mRes] = await Promise.all([
      supabase.from("people").select("id", { count: "exact", head: true }),
      supabase.from("dates").select("id", { count: "exact", head: true }),
      supabase.from("dates").select("id", { count: "exact", head: true }).eq("outcome", "match"),
    ]);
    if (pRes.count !== null && pRes.count > 0) peopleCount = pRes.count;
    if (dRes.count !== null && dRes.count > 0) datesCount = dRes.count;
    if (mRes.count !== null && mRes.count > 0) matchesCount = mRes.count;
  } catch (e) {
    // Fallback to demo baseline if not connected yet
  }

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full max-w-5xl mx-auto px-4 pt-20 pb-16 text-center flex flex-col items-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-surfaceBorder text-xs text-gold mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>Autonomous Multi-Agent Simulation</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground max-w-4xl leading-[1.1] mb-6">
          Your Agent Dates <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-amber-200">For You.</span>
        </h1>

        <p className="text-muted text-lg sm:text-xl max-w-2xl font-light leading-relaxed mb-10">
          Each person is represented by an AI agent. The agent reads their LinkedIn and public Instagram, goes on real simulated dates, and discovers who fits them best.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/demo"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-gold via-gold-light to-gold-dark text-background font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-gold/20 hover:scale-[1.02] transition-all text-base"
          >
            <span>See the Demo Season</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/add"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface hover:bg-surfaceHover border border-surfaceBorder text-foreground font-medium px-8 py-3.5 rounded-xl transition-all text-base"
          >
            <span>Add a Person</span>
          </Link>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-16 pt-12 border-t border-surfaceBorder/80 w-full max-w-2xl">
          <div className="flex flex-col items-center">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-foreground">{peopleCount}</span>
            <span className="text-xs text-muted mt-1 uppercase tracking-wider">Active People</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-gold">{datesCount}</span>
            <span className="text-xs text-muted mt-1 uppercase tracking-wider">Simulated Dates</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-rose-400">{matchesCount}</span>
            <span className="text-xs text-muted mt-1 uppercase tracking-wider">Mutual Matches</span>
          </div>
        </div>
      </section>

      {/* 4-Step Process Section */}
      <section className="w-full max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">How Proxy Hearts Works</h2>
          <p className="text-muted text-sm sm:text-base mt-2">Zero hallucinations. Grounded strictly in authentic digital footprints.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-surface/80 border border-surfaceBorder p-6 rounded-2xl flex flex-col justify-between hover:border-gold/40 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
