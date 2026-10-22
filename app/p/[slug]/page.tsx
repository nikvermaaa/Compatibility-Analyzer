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
