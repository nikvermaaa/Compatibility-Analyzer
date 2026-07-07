import { supabase } from "./db";
import { completeJson, complete } from "./llm";
import {
  DateTurnSchema,
  DebriefSchema,
  SwipeEvaluationResponseSchema,
  Proposal,
} from "./schemas";
import {
  getDateTurnPrompt,
  getNarratorScenePrompt,
  getDebriefPrompt,
  SWIPE_PROMPT,
} from "./prompts";
import { computeAndSaveRankings } from "./ranking";

export async function runSwipesForPerson(personId: string): Promise<number> {
  // 1. Fetch person profile & agent card
  const { data: personData, error: personErr } = await supabase
    .from("people")
    .select("id, name, open_to, gender, profiles(*)")
    .eq("id", personId)
    .single();

  if (personErr || !personData) throw new Error("Person not found for swiping");

  const personProfile = (personData.profiles as any)?.analysis;
  const agentCard = (personData.profiles as any)?.agent_card;

  // 2. Fetch all other candidate profiles
  const { data: candidates, error: candErr } = await supabase
    .from("people")
    .select("id, name, open_to, gender, profiles(*)")
    .neq("id", personId)
    .in("status", ["ready", "swiped", "dating", "ranked"]);

  if (candErr || !candidates || candidates.length === 0) return 0;

  const normGender = (g?: string | null) => {
    if (!g) return "anyone";
    const s = g.toLowerCase().trim();
    if (s.startsWith("wom") || s.startsWith("fem")) return "women";
    if (s.startsWith("men") || s === "man" || s.startsWith("mal")) return "men";
    return "anyone";
  };

  const pOpenTo = normGender(personData.open_to);
  const pGender = normGender(personData.gender);

  // Filter candidates respecting open_to preferences if defined
  const eligibleCandidates = candidates.filter((c) => {
    const cOpenTo = normGender(c.open_to);
    const cGender = normGender(c.gender);

    if (pOpenTo === "women" && cGender === "men") return false;
    if (pOpenTo === "men" && cGender === "women") return false;
    if (cOpenTo === "women" && pGender === "men") return false;
    if (cOpenTo === "men" && pGender === "women") return false;
    return true;
  });

  if (eligibleCandidates.length === 0) return 0;

  // Format compact candidate cards
  const candidateCards = eligibleCandidates.map((c) => {
    const a = (c.profiles as any)?.analysis || {};
    return {
      candidateId: c.id,
      name: c.name,
      oneLiner: a.oneLiner || "Professional looking for genuine connection",
      hobbies: a.hobbies?.map((h: any) => h.text).slice(0, 3) || [],
      interests: a.interests?.map((i: any) => i.text).slice(0, 3) || [],
      values: a.values?.map((v: any) => v.text).slice(0, 2) || [],
      idealDates: a.idealDates?.map((d: any) => d.idea).slice(0, 2) || [],
    };
  });

  const prompt = `My person: ${personData.name}
One-liner: ${personProfile?.oneLiner || ""}
Core Values: ${personProfile?.values?.map((v: any) => v.text).join(", ") || ""}
Lifestyle Pace: ${personProfile?.lifestyle?.pace || "balanced"}
Agent Must-Haves: ${agentCard?.mustHaves?.join(", ") || "kindness, authenticity"}

Evaluate these ${candidateCards.length} candidates:
${JSON.stringify(candidateCards, null, 2)}`;

  const evaluation = await completeJson({
    tier: "smart",
    system: SWIPE_PROMPT,
    messages: [{ role: "user", content: prompt }],
    schema: SwipeEvaluationResponseSchema,
  });

  // Save swipes
  const swipeRows = evaluation.evaluations.map((ev) => ({
    from_id: personId,
    to_id: ev.candidateId,
    score: Math.min(100, Math.max(0, ev.score)),
    reason: ev.reason,
  }));
