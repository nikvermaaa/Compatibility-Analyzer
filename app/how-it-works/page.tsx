import Link from "next/link";
import { Sparkles, Shield, Cpu, Database, Flame, Trophy, ExternalLink, CheckCircle } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Technical Whitepaper &amp; System Architecture</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground">
          How Proxy Hearts Operates
        </h1>
        <p className="text-muted text-sm sm:text-base mt-3 leading-relaxed">
          A fully autonomous, multi-agent dating system built with zero hallucinations, strict evidence grounding, and resilient free-tier LLM routing.
        </p>
      </div>

      {/* 1. The Two-Source Grounding Rule */}
      <section className="bg-surface border border-surfaceBorder rounded-3xl p-6 sm:p-10 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider">
          <Shield className="w-4 h-4 text-gold" />
          <span>The Two-Sources Only Mandate</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Zero Web Search. Strictly Auditable Grounding.
        </h2>
        <p className="text-muted text-sm leading-relaxed">
          Every psychological insight, relationship need, and conversational reference comes exclusively from two digital footprints: a candidate&apos;s <strong>LinkedIn profile</strong> and their <strong>public Instagram account</strong>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-background border border-surfaceBorder text-xs space-y-1">
            <span className="font-bold text-blue-400 block">LinkedIn Normalization</span>
            <p className="text-muted">
              Extracts headline, career milestones, educational degrees, and endorsed skills. Every bullet receives a unique identifier (<code className="text-gold">LI-exp-1</code>, <code className="text-gold">LI-about</code>).
            </p>
          </div>
          <div className="p-4 rounded-xl bg-background border border-surfaceBorder text-xs space-y-1">
            <span className="font-bold text-pink-400 block">Instagram Normalization</span>
            <p className="text-muted">
              Pulls bio, locations, and the latest 12 posts with captions and hashtags. Identifiers (<code className="text-gold">IG-bio</code>, <code className="text-gold">IG-post-3</code>) link directly to source snippets.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Architecture & Pipeline Diagram */}
      <section className="bg-surface border border-surfaceBorder rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider">
          <Cpu className="w-4 h-4" />
          <span>System Pipeline</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Step-by-Step Autonomous Lifecycle
        </h2>

        <div className="bg-background border border-surfaceBorder rounded-2xl p-6 font-mono text-xs text-muted leading-loose overflow-x-auto">
          <pre className="text-foreground/90 font-mono">
{`LinkedIn URL ────> [Apify LinkedIn Actor] ────┐
                                             ├──> raw_scrapes (cached in Supabase)
Instagram URL ───> [Apify Instagram Actor] ───┘
                                             │
                                             ▼
                               normalize.ts ───> PersonDossier (with Evidence IDs)
                                             │
                                             ▼
                       [Gemini 2.5 Flash] ───> Profile Analysis + Agent Card
                                             │
                                             ▼
                            [Stage 0] Swiping ───> Baseline fit scores (0-100)
                                             │
                                             ▼
                          [Stage 1] Scheduler ───> Greedy mutual pairing (>=3 dates)
                                             │
                                             ▼
                       [Stage 2] Date Engine ───> 16-18 turn simulated date
                                                  (Opener -> Plan -> Twist -> Debrief)
                                             │
                                             ▼
                            Ranking Algorithm ───> Dual-perspective blended score`}
          </pre>
        </div>
      </section>

      {/* 3. The Multi-Phase Dating Engine */}
      <section className="bg-surface border border-surfaceBorder rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider">
          <Flame className="w-4 h-4 text-rose-400" />
          <span>The Dating Engine (Creative Core)</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Conversations That Feel Real
        </h2>
        <div className="space-y-3 text-xs">
          {[
            { phase: "Phase 1: First Messages (4 turns)", desc: "A opens using a specific conversation hook from B's profile; natural dating app banter." },
            { phase: "Phase 2: Outing Planning (4 turns)", desc: "Agents collaborate on an activity fitting both interests; outputs a structured Date Card." },
            { phase: "Phase 3: Narrator Scene Setting (1 turn)", desc: "Atmospheric venue description introducing an unexpected compatibility twist (e.g. rain, packed cafe)." },
            { phase: "Phase 4: The Date (6 turns)", desc: "Deeper conversation covering values, ambitions, lifestyle, and how they handle the situational twist." },
            { phase: "Phase 5: Goodbye (2 turns)", desc: "Honest in-character parting messages signaling whether they desire a second date." },
            { phase: "Phase 6: Private Debriefs (2 turns)", desc: "Each agent independently scores shared interests, lifestyle fit, values, and provides a private verdict." },
            { phase: "Phase 7: Outcome Evaluation", desc: "System determines match status: It's a match, One-sided connection, or Friendly pass." },
          ].map((item, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-background border border-surfaceBorder/60 flex items-start gap-3">
              <span className="font-mono text-gold font-bold shrink-0">{i + 1}.</span>
              <div>
                <span className="font-semibold text-foreground block">{item.phase}</span>
                <span className="text-muted mt-0.5 block">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. The Mathematical Ranking Formula */}
      <section className="bg-surface border border-surfaceBorder rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-gold" />
          <span>Ranking Mathematics</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Dual-Perspective Blended Fit Score
        </h2>
        <div className="p-5 rounded-2xl bg-background border border-surfaceBorder font-mono text-xs space-y-4 text-muted">
          <div>
            <span className="text-gold font-bold block mb-1">If Person P and Candidate C dated:</span>
            <p className="text-foreground">
              fit = 0.55 &times; debrief[P &rarr; C].overall + 0.25 &times; debrief[C &rarr; P].overall + 0.20 &times; swipe[P &rarr; C]
            </p>
            <p className="text-[11px] text-muted mt-1">
              + 5 bonus points if both agents answered <code className="text-emerald-400">wouldSeeAgain = true</code>.
            </p>
          </div>

          <div className="pt-3 border-t border-surfaceBorder/60">
            <span className="text-gold font-bold block mb-1">If Undated (Fallback screening):</span>
            <p className="text-foreground">
              fit = 0.85 &times; (0.70 &times; swipe[P &rarr; C] + 0.30 &times; swipe[C &rarr; P])
            </p>
            <p className="text-[11px] text-muted mt-1">
              Undated pairs receive a 15% discount because chemistry remains unverified by a live date.
            </p>
          </div>
        </div>
      </section>

      {/* 5. 100% Free Tech Stack */}
      <section className="bg-surface border border-surfaceBorder rounded-3xl p-6 sm:p-10 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider">
          <Database className="w-4 h-4 text-gold" />
          <span>Zero-Cost Infrastructure</span>
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          100% Free Tiers. No Paid Credits.
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-background border border-surfaceBorder">
            <span className="font-bold text-foreground block mb-0.5">Apify</span>
            <span className="text-muted text-[11px]">$5 monthly free credit for scrapers</span>
          </div>
          <div className="p-3.5 rounded-xl bg-background border border-surfaceBorder">
            <span className="font-bold text-foreground block mb-0.5">Google Gemini</span>
            <span className="text-muted text-[11px]">Free tier Gemini 2.5 Flash for analysis</span>
          </div>
          <div className="p-3.5 rounded-xl bg-background border border-surfaceBorder">
            <span className="font-bold text-foreground block mb-0.5">Groq Cloud</span>
            <span className="text-muted text-[11px]">Free Llama 3.3 70B &amp; 3.1 8B for fast date turns</span>
          </div>
          <div className="p-3.5 rounded-xl bg-background border border-surfaceBorder">
            <span className="font-bold text-foreground block mb-0.5">Supabase &amp; Vercel</span>
            <span className="text-muted text-[11px]">Free Postgres DB, photo storage, &amp; hosting</span>
          </div>
        </div>
      </section>
    </div>
  );
}
