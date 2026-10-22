import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/db";
import { EvidenceChip } from "@/components/EvidenceChip";
import { AskAgentChat } from "@/components/AskAgentChat";
import { ReadingLogViewer } from "@/components/ReadingLogViewer";
import { RemoveProfileButton } from "@/components/RemoveProfileButton";
import {
  ExternalLink,
  Sparkles,
  Heart,
  Briefcase,
  Compass,
  Flame,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Calendar,
  MessageCircle,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch person and profile
  const { data: person, error: pErr } = await supabase
    .from("people")
    .select(`
      id, name, slug, photo_url, linkedin_url, instagram_url, open_to, gender, status,
      profiles(*),
      rankings(*)
    `)
    .eq("slug", slug)
    .single();

  if (pErr || !person) return notFound();

  const profile = person.profiles as any;
  const analysis = profile?.analysis || {};
  const agentCard = profile?.agent_card || {};
  const dossier = profile?.dossier || {};
  const readingLog = profile?.reading_log || [];
  const rankings = (person.rankings as any)?.ranked || [];

  // Fetch dates for this person
  const { data: rawDates } = await supabase
    .from("dates")
    .select(`
      id, status, outcome, chemistry, date_card,
      person_a:people!dates_a_id_fkey(id, name, slug, photo_url),
      person_b:people!dates_b_id_fkey(id, name, slug, photo_url)
    `)
    .or(`a_id.eq.${person.id},b_id.eq.${person.id}`)
    .order("created_at", { ascending: false });
  const dates = rawDates || [];

  const photo = person.photo_url || dossier.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* 1. Header Card */}
      <section className="bg-surface border border-surfaceBorder rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="relative group shrink-0">
            <img
              src={photo}
              alt={person.name}
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl object-cover border-2 border-gold/40 shadow-xl"
            />
            <div className="absolute -bottom-2 -right-2 bg-background border border-gold/40 text-gold px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold shadow-md">
              Digital Twin Active
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">{person.name}</h1>
              {analysis?.dataQuality?.linkedin === "rich" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified 2 Sources</span>
                </span>
              )}
            </div>

            <p className="text-gold font-medium text-base sm:text-lg">
              {analysis.oneLiner || "Professional seeking genuine, aligned connections."}
            </p>

            {analysis.summary && (
              <p className="text-muted text-sm leading-relaxed max-w-3xl pt-1">
                {analysis.summary}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-3">
              <a
                href={person.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 text-blue-300 text-xs font-medium transition-colors"
              >
                <span>LinkedIn Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href={person.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-950/40 hover:bg-pink-900/50 border border-pink-800/40 text-pink-300 text-xs font-medium transition-colors"
              >
                <span>Instagram (@{dossier.instagram?.username || "profile"})</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <Link
                href={`/rankings?person=${person.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-xs font-semibold transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                <span>View Full Compatibility Ranking</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "Watch the Agent Read" Animated Log Panel */}
      {readingLog && readingLog.length > 0 && (
        <section className="bg-surface/60 border border-surfaceBorder rounded-2xl p-6">
          <ReadingLogViewer logs={readingLog} />
        </section>
      )}

      {/* 3. Deep Analysis Matrix */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Needs & Values */}
        <div className="bg-surface border border-surfaceBorder rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Relationship Needs</span>
            </h2>
            <div className="space-y-2.5">
              {analysis.needs?.map((need: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-background border border-surfaceBorder/60 text-xs flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-foreground leading-relaxed">{need.text}</span>
                    <span className={`text-[10px] uppercase font-bold shrink-0 px-1.5 py-0.5 rounded ${
                      need.confidence === "high" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
                    }`}>
                      {need.confidence}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {need.evidence?.map((ev: string) => (
                      <EvidenceChip key={ev} evidenceId={ev} dossier={dossier} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-gold" />
              <span>Core Values</span>
            </h2>
            <div className="space-y-2">
              {analysis.values?.map((val: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-background border border-surfaceBorder/60 text-xs flex flex-col gap-1.5">
                  <span className="text-foreground font-medium">{val.text}</span>
                  <div className="flex flex-wrap gap-1">
                    {val.evidence?.map((ev: string) => (
                      <EvidenceChip key={ev} evidenceId={ev} dossier={dossier} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hobbies & Interests */}
        <div className="bg-surface border border-surfaceBorder rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Concrete Hobbies & Activities</span>
            </h2>
            <div className="space-y-2.5">
              {analysis.hobbies?.map((hobby: any, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-background border border-surfaceBorder/60 text-xs flex flex-col gap-1.5">
                  <span className="text-foreground font-medium leading-relaxed">{hobby.text}</span>
                  <div className="flex flex-wrap gap-1">
                    {hobby.evidence?.map((ev: string) => (
                      <EvidenceChip key={ev} evidenceId={ev} dossier={dossier} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              <span>Career Snapshot & Ambition</span>
            </h2>
            {analysis.careerSnapshot && (
              <div className="p-3 rounded-xl bg-background border border-surfaceBorder/60 text-xs space-y-1.5">
                <p className="text-foreground leading-relaxed">{analysis.careerSnapshot.text}</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.careerSnapshot.evidence?.map((ev: string) => (
                    <EvidenceChip key={ev} evidenceId={ev} dossier={dossier} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Personality Big-Five & Lifestyle */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Big Five Traits */}
        <div className="bg-surface border border-surfaceBorder rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-4">
            Big-Five Personality Traits
          </h2>
          <div className="space-y-4">
            {analysis.personality?.map((trait: any, i: number) => (
              <div key={i} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">{trait.trait}</span>
                  <span className="font-mono text-gold font-bold">{trait.score}/100</span>
                </div>
                <div className="w-full h-2 rounded-full bg-background overflow-hidden border border-surfaceBorder/60">
                  <div
                    className="h-full bg-gradient-to-r from-gold-dark to-gold rounded-full"
                    style={{ width: `${trait.score}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {trait.evidence?.map((ev: string) => (
                    <EvidenceChip key={ev} evidenceId={ev} dossier={dossier} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lifestyle Cadence */}
        <div className="bg-surface border border-surfaceBorder rounded-2xl p-6 space-y-4 text-xs">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-2">
            Lifestyle & Cadence
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-background border border-surfaceBorder/60">
              <span className="text-[10px] uppercase font-bold text-muted block mb-1">Pace</span>
              <span className="text-foreground font-medium">{analysis.lifestyle?.pace || "Balanced"}</span>
            </div>
            <div className="p-3 rounded-xl bg-background border border-surfaceBorder/60">
              <span className="text-[10px] uppercase font-bold text-muted block mb-1">Social Battery</span>
              <span className="text-foreground font-medium">{analysis.lifestyle?.social || "Flexible"}</span>
            </div>
            <div className="p-3 rounded-xl bg-background border border-surfaceBorder/60">
              <span className="text-[10px] uppercase font-bold text-muted block mb-1">Schedule</span>
              <span className="text-foreground font-medium">{analysis.lifestyle?.schedule || "Structured"}</span>
            </div>
            <div className="p-3 rounded-xl bg-background border border-surfaceBorder/60">
              <span className="text-[10px] uppercase font-bold text-muted block mb-1">Travel</span>
              <span className="text-foreground font-medium">{analysis.lifestyle?.travel || "Occasional"}</span>
            </div>
          </div>

          {/* Green Flags & Friction */}
          <div className="pt-2 space-y-3">
            <div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Relationship Green Flags</span>
              </span>
              <div className="space-y-1.5">
                {analysis.greenFlags?.map((flag: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-muted text-[11px] flex justify-between gap-2">
                    <span>{flag.text}</span>
                    <div className="flex gap-1 shrink-0">
                      {flag.evidence?.map((ev: string) => (
                        <EvidenceChip key={ev} evidenceId={ev} dossier={dossier} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Possible Friction Points (Constructive)</span>
              </span>
              <div className="space-y-1.5">
                {analysis.possibleFriction?.map((fric: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30 text-muted text-[11px] flex justify-between gap-2">
                    <span>{fric.text}</span>
                    <div className="flex gap-1 shrink-0">
                      {fric.evidence?.map((ev: string) => (
                        <EvidenceChip key={ev} evidenceId={ev} dossier={dossier} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Ideal Dates Designed by Agent */}
      <section className="bg-surface border border-surfaceBorder rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold" />
          <span>Curated Ideal Dates (Tailored by Agent)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.idealDates?.map((d: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-background border border-surfaceBorder/60 flex flex-col justify-between text-xs space-y-2">
              <div>
                <span className="font-semibold text-foreground text-sm block mb-1">{d.idea}</span>
                <p className="text-muted text-xs leading-relaxed">{d.why}</p>
              </div>
              <div className="flex flex-wrap gap-1 pt-2 border-t border-surfaceBorder/40">
                {d.evidence?.map((ev: string) => (
                  <EvidenceChip key={ev} evidenceId={ev} dossier={dossier} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. The Agent Card */}
      <section className="bg-gradient-to-r from-surface via-surfaceHover to-surface border border-gold/30 rounded-2xl p-6 text-xs space-y-4">
        <div className="flex items-center justify-between border-b border-surfaceBorder/60 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">The Agent Card</h2>
          </div>
          <span className="text-[11px] font-mono text-muted">Configured for {person.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted uppercase">Voice & Tone</span>
            <p className="text-foreground">{agentCard.voice || "Warm, engaging, authentic."}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted uppercase">Opener Style</span>
            <p className="text-foreground">{agentCard.openerStyle || "Observant, curiosity-led question."}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted uppercase">Relationship Goals</span>
            <p className="text-foreground">{agentCard.goals?.join(", ") || "Mutual respect and growth."}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted uppercase">Non-Negotiable Boundaries</span>
            <p className="text-foreground">{agentCard.boundaries?.join(", ") || "Respects privacy, honest representation."}</p>
          </div>
        </div>
      </section>

      {/* 7. Dates Log for This Person */}
      <section className="bg-surface border border-surfaceBorder rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-400" />
          <span>Simulated Dates ({dates.length})</span>
        </h2>

        {dates.length === 0 ? (
          <p className="text-xs text-muted">No dates scheduled yet. Swiping in progress...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dates.map((d: any) => {
              const other = d.person_a.id === person.id ? d.person_b : d.person_a;
              return (
                <Link
                  key={d.id}
                  href={`/dates/${d.id}`}
                  className="p-4 rounded-xl bg-background border border-surfaceBorder hover:border-gold/50 transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={other.photo_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                      alt={other.name}
                      className="w-12 h-12 rounded-xl object-cover border border-surfaceBorder"
                    />
                    <div>
                      <span className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors block">
                        {other.name}
                      </span>
                      <span className="text-[11px] text-muted block">
                        {d.date_card?.activity || "Simulated date"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        d.outcome === "match"
                          ? "bg-rose-950 text-rose-300 border border-rose-800/40"
                          : d.outcome === "one_sided"
                          ? "bg-amber-950 text-amber-300 border border-amber-800/40"
                          : "bg-surface text-muted border border-surfaceBorder"
                      }`}
                    >
                      {d.outcome || d.status}
                    </span>
                    {d.chemistry && (
                      <span className="text-[11px] font-mono text-gold block mt-1">{d.chemistry}% vibe</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 8. Ask the Agent Chatbot Widget */}
      <section className="bg-surface border border-surfaceBorder rounded-2xl p-6">
        <AskAgentChat personId={person.id} personName={person.name} />
      </section>

      {/* 9. Privacy Opt-Out (Section 18.1 Requirement) */}
      <div className="text-center pt-6">
        <RemoveProfileButton />
      </div>
    </div>
  );
}
