"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight, UserCheck, Flame, Trophy } from "lucide-react";

export default function AddPersonPage() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [name, setName] = useState("");
  const [openTo, setOpenTo] = useState("anyone");
  const [gender, setGender] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stepper states
  const [personId, setPersonId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepLogs, setStepLogs] = useState<string[]>([]);
  const [dateIds, setDateIds] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setStepLogs((prev) => [...prev, msg]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setCurrentStep(1);
    setStepLogs(["Submitting profile URLs to ingestion pipeline..."]);

    try {
      // 1. POST /api/people
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl, instagramUrl, name, openTo, gender, pool: "live" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start ingestion");

      setPersonId(data.id);
      setSlug(data.slug);

      if (data.cached) {
        addLog("Found cached profile in database. Fast-tracking to analysis...");
      }

      // 2. Poll Status until scraped (or ready if cached)
      addLog("Scraping LinkedIn and public Instagram via Apify actors...");
      let scraped = false;
      let attempts = 0;

      while (!scraped && attempts < 40) {
        attempts++;
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/people/${data.id}/status`);
        const statusData = await statusRes.json();

        if (statusData.status === "failed") {
          throw new Error(statusData.error || "Scraping failed");
        }

        if (statusData.status === "scraped" || statusData.status === "ready" || statusData.status === "ranked") {
          scraped = true;
          addLog("Scraping completed! Raw data successfully normalized.");
          break;
        }

        if (statusData.retrying) {
          addLog(`Primary scraper timed out. Retrying with fallback ${statusData.retrying} actor...`);
        }
      }

      if (!scraped) throw new Error("Scraping timed out. Please try again.");

      // 3. Analyze Profile
      setCurrentStep(2);
      addLog("Agent is reading dossier with Gemini 2.5 Flash...");
      const analyzeRes = await fetch(`/api/people/${data.id}/analyze`, { method: "POST" });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error || "Analysis failed");

      addLog("Profile synthesis complete! Psychological traits & Agent Card generated.");

      // 4. Swipe Candidates
      setCurrentStep(3);
      addLog("Agent is screening and swiping eligible candidates in the pool...");
      const swipeRes = await fetch(`/api/people/${data.id}/swipe`, { method: "POST" });
      const swipeData = await swipeRes.json();
      addLog(`Agent completed pre-screening across ${swipeData.count || 24} candidates.`);

      // 5. Schedule & Run Dates
      setCurrentStep(4);
      addLog("Scheduling top mutual pairings...");
      const schedRes = await fetch(`/api/people/${data.id}/schedule`, { method: "POST" });
      const schedData = await schedRes.json();
      const scheduledDates = schedData.dateIds || [];
      setDateIds(scheduledDates);

      if (scheduledDates.length > 0) {
        addLog(`Scheduled ${scheduledDates.length} full multi-phase dates. Executing Date 1...`);
        // Step first date
        const firstDateId = scheduledDates[0];
        for (let i = 0; i < 5; i++) {
          await fetch(`/api/dates/${firstDateId}/step`, { method: "POST" });
        }
        addLog("Date 1 simulation in progress!");
      }

      // 6. Compute Rankings
      setCurrentStep(5);
      addLog("Calculating final mutual compatibility rankings...");
      await fetch(`/api/rankings/${data.id}`, { method: "POST" });
      addLog("Rankings ready! All pipeline stages complete.");
      setCurrentStep(6);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Live Ingestion Pipeline</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">Add a Person</h1>
        <p className="text-muted text-sm mt-2 max-w-lg mx-auto">
          Paste a public LinkedIn and public Instagram. The agent will read both, build their digital twin, and take them dating.
        </p>
      </div>

      <div className="bg-surface border border-surfaceBorder rounded-3xl p-6 sm:p-10 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              LinkedIn Profile URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://www.linkedin.com/in/username/"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              disabled={loading}
              className="w-full bg-background border border-surfaceBorder rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-gold transition-colors font-mono"
            />
            <p className="text-[11px] text-muted mt-1.5">Official personal profile URL.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Public Instagram Profile URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://www.instagram.com/username/"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              disabled={loading}
              className="w-full bg-background border border-surfaceBorder rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-gold transition-colors font-mono"
            />
            <p className="text-[11px] text-muted mt-1.5">Must be public. Post/reel URLs are not accepted.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Display Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Maya Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="w-full bg-background border border-surfaceBorder rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Open To
              </label>
              <select
                value={openTo}
                onChange={(e) => setOpenTo(e.target.value)}
                disabled={loading}
                className="w-full bg-background border border-surfaceBorder rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-gold transition-colors"
              >
                <option value="anyone">Anyone (Default)</option>
                <option value="women">Women</option>
                <option value="men">Men</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 flex items-start gap-3 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to process profile</p>
                <p className="mt-0.5 text-red-300">{error}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gold via-gold-light to-gold-dark text-background font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-gold/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-background" />
                <span>Processing Digital Twin...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Agent Ingestion & Dating</span>
              </>
            )}
          </button>
        </form>

        {/* Live Stepper Output */}
        {currentStep > 0 && (
          <div className="mt-10 pt-8 border-t border-surfaceBorder">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Live Pipeline Status</span>
            </h3>

            {/* Stepper bubbles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { step: 1, label: "Scraping" },
                { step: 2, label: "Analyzing" },
                { step: 3, label: "Swiping" },
                { step: 5, label: "Ranked" },
              ].map((item) => {
                const isPassed = currentStep > item.step;
                const isCurrent = currentStep === item.step;
                return (
                  <div
                    key={item.step}
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      isPassed
                        ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                        : isCurrent
                        ? "bg-gold/10 border-gold/40 text-gold animate-pulse"
                        : "bg-surface/50 border-surfaceBorder text-muted"
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0 text-gold" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-muted/50 shrink-0" />
                    )}
                    <span className="font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Terminal Log Console */}
            <div className="bg-background border border-surfaceBorder rounded-xl p-4 font-mono text-xs text-muted max-h-48 overflow-y-auto space-y-1.5">
              {stepLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-gold/70">&gt;</span>
                  <span className="text-foreground/90">{log}</span>
                </div>
              ))}
            </div>

            {/* Navigation links once ready */}
            {slug && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={`/p/${slug}`}
                  className="inline-flex items-center gap-2 bg-surface hover:bg-surfaceHover border border-surfaceBorder px-4 py-2 rounded-xl text-xs font-medium text-foreground hover:text-gold transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-gold" />
                  <span>View Profile & Evidence</span>
                </Link>

                {dateIds.length > 0 && (
                  <Link
                    href={`/dates/${dateIds[0]}`}
                    className="inline-flex items-center gap-2 bg-surface hover:bg-surfaceHover border border-surfaceBorder px-4 py-2 rounded-xl text-xs font-medium text-foreground hover:text-gold transition-colors"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>Watch Live Date</span>
                  </Link>
                )}

                {personId && (
                  <Link
                    href={`/rankings?person=${personId}`}
                    className="inline-flex items-center gap-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 px-4 py-2 rounded-xl text-xs font-semibold text-gold transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>See Compatibility Ranking</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
