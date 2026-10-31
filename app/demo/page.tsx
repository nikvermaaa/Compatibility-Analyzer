import Link from "next/link";
import { supabase } from "@/lib/db";
import { Sparkles, Heart, Users, Flame, Trophy, ExternalLink, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  // Fetch demo pool people
  const { data: rawPeople } = await supabase
    .from("people")
    .select(`
      id, name, slug, photo_url, open_to, gender,
      profiles(*)
    `)
    .order("name", { ascending: true });
  const people = rawPeople || [];

  // Fetch all completed or scheduled dates for the Date Night Board
  const { data: rawDates } = await supabase
    .from("dates")
    .select(`
      id, status, outcome, chemistry, date_card, twist,
      person_a:people!dates_a_id_fkey(id, name, slug, photo_url),
      person_b:people!dates_b_id_fkey(id, name, slug, photo_url)
    `)
    .order("created_at", { ascending: false });
  const dates = rawDates || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Requirement R10 · Evaluator Demo Season</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground">
          Season 1: 25 Autonomous Agents
        </h1>
        <p className="text-muted text-sm sm:text-base mt-3 leading-relaxed">
          Pre-simulated season of 25 real people. Every agent read its person’s LinkedIn and public Instagram, screened candidate profiles, and dated autonomously.
        </p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link
            href="/rankings"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-background font-semibold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md"
          >
            <Trophy className="w-4 h-4" />
            <span>Explore Compatibility Heatmap &amp; Rankings</span>
          </Link>
        </div>
      </div>

      {/* Date Night Board (Priority 1 Extra Feature) */}
      <section className="bg-surface border border-surfaceBorder rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surfaceBorder pb-6">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-gold block">
              Multi-Agent Simulation Grid
            </span>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              Date Night Board ({dates.length} Dates)
            </h2>
          </div>
          <span className="text-xs text-muted font-mono">
            Click any date card to replay live transcript
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {dates.map((d: any) => (
            <Link
              key={d.id}
              href={`/dates/${d.id}`}
              className="p-4 rounded-2xl bg-background border border-surfaceBorder hover:border-gold/50 transition-all flex flex-col justify-between space-y-3 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    d.outcome === "match"
                      ? "bg-rose-950 text-rose-300 border border-rose-800/40"
                      : d.outcome === "one_sided"
                      ? "bg-amber-950 text-amber-300 border border-amber-800/40"
                      : "bg-surface text-muted border border-surfaceBorder"
                  }`}
                >
                  {d.outcome === "match"
                    ? "Match!"
                    : d.outcome === "one_sided"
                    ? "One-Sided"
                    : d.status === "done"
                    ? "Friendly Pass"
                    : "Scheduled"}
                </span>
                {d.chemistry && (
