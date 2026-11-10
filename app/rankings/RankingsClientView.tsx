"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Heart,
  Grid,
  Users,
  Search,
  Flame,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface RankingsClientViewProps {
  initialPeople: any[];
  dates: any[];
  swipes: any[];
  selectedPersonId?: string;
}

export function RankingsClientView({
  initialPeople,
  dates,
  swipes,
  selectedPersonId: propPersonId,
}: RankingsClientViewProps) {
  const [activeTab, setActiveTab] = useState<"rankings" | "heatmap" | "couples">("rankings");
  const [search, setSearch] = useState("");

  const defaultPerson =
    (propPersonId ? initialPeople.find((p) => p.id === propPersonId) : null) ||
    initialPeople[0] ||
    null;

  const [selectedPerson, setSelectedPerson] = useState<any>(defaultPerson);

  const filteredPeople = initialPeople.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const currentRankings = selectedPerson?.rankings?.ranked || [];
  const top3 = currentRankings.slice(0, 3);
  const remaining = currentRankings.slice(3);

  // Heatmap matrix calculation
  const swipeMap = new Map<string, number>();
  swipes.forEach((s) => swipeMap.set(`${s.from_id}:${s.to_id}`, s.score));

  // Top couples: dates with match outcome or highest chemistry
  const topCouples = dates.filter((d) => d.outcome === "match" || (d.chemistry && d.chemistry >= 70));

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-surfaceBorder">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Compatibility & Matching Engine</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">
            Rankings &amp; Chemistry
          </h1>
          <p className="text-muted text-sm mt-1">
            Blended rankings computed from simulated dates, mutual debriefs, and candidate screening.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-surface border border-surfaceBorder p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("rankings")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "rankings"
                ? "bg-gold text-background shadow-md"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Per-Person Rankings</span>
          </button>

          <button
            onClick={() => setActiveTab("heatmap")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "heatmap"
                ? "bg-gold text-background shadow-md"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Pool Heatmap</span>
          </button>

          <button
            onClick={() => setActiveTab("couples")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "couples"
                ? "bg-gold text-background shadow-md"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Top Couples</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PER-PERSON RANKINGS */}
      {activeTab === "rankings" && (
        <div className="space-y-8">
          {/* Person Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface border border-surfaceBorder rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-gold"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-1">
              {filteredPeople.map((p) => {
                const isSelected = selectedPerson?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPerson(p)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 border transition-all ${
                      isSelected
                        ? "bg-gold text-background border-gold shadow-md font-bold"
                        : "bg-surface hover:bg-surfaceHover border-surfaceBorder text-muted hover:text-foreground"
                    }`}
                  >
                    <img
                      src={p.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                      alt={p.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPerson ? (
            <div className="space-y-8">
              {/* Person Summary Header */}
              <div className="p-6 rounded-3xl bg-surface border border-surfaceBorder flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="flex items-center gap-4 text-center md:text-left">
                  <img
                    src={selectedPerson.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                    alt={selectedPerson.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-surfaceBorder"
                  />
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">
                      Ranked Matches for {selectedPerson.name}
                    </h2>
                    <p className="text-gold text-xs font-medium">
                      {selectedPerson.profiles?.analysis?.oneLiner || "Digital Twin"}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/p/${selectedPerson.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surfaceHover border border-surfaceBorder text-xs text-foreground hover:text-gold transition-colors"
                >
                  <span>Open Profile &amp; Evidence</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Agent Closing Note */}
              {selectedPerson.rankings?.closing_note && (
                <div className="p-4 rounded-2xl bg-gold/5 border border-gold/30 text-xs text-gold/90 leading-relaxed font-sans italic">
                  <span className="font-bold not-italic font-mono uppercase text-[10px] tracking-wider block mb-1 text-gold">
                    Agent&apos;s Match Synthesis Note:
                  </span>
                  &ldquo;{selectedPerson.rankings.closing_note}&rdquo;
                </div>
              )}

              {/* Top 3 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {top3.map((cand: any, idx: number) => (
                  <div
                    key={cand.candidateId}
                    className="bg-surface border border-surfaceBorder hover:border-gold/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4 group transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-7 h-7 rounded-full bg-gold/20 text-gold border border-gold/40 flex items-center justify-center font-bold text-xs">
                          #{idx + 1}
                        </span>
                        <span className="font-mono font-bold text-gold text-sm">
                          {cand.fit}% Fit
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={cand.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                          alt={cand.name}
                          className="w-12 h-12 rounded-xl object-cover border border-surfaceBorder"
                        />
                        <div>
                          <h3 className="font-serif font-bold text-base text-foreground group-hover:text-gold transition-colors">
                            {cand.name}
                          </h3>
                          <span className="text-[11px] text-muted block max-w-[140px] truncate">
                            {cand.oneLiner || "Candidate"}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted leading-relaxed line-clamp-3">
                        {cand.reason}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-surfaceBorder/60 flex items-center justify-between text-[11px]">
                      {cand.dated ? (
                        <Link
                          href={`/dates/${cand.dateId}`}
                          className="text-rose-400 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Flame className="w-3 h-3" />
                          <span>Watch Date Replay</span>
                        </Link>
                      ) : (
                        <span className="text-muted">Screened via Profile</span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          cand.outcome === "match"
                            ? "bg-rose-950 text-rose-300"
                            : "bg-surfaceHover text-muted"
                        }`}
                      >
                        {cand.outcome || (cand.dated ? "Dated" : "Screened")}
