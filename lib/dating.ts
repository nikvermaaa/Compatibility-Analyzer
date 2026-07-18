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

  const { error: upsertErr } = await supabase.from("swipes").upsert(swipeRows, {
    onConflict: "from_id,to_id",
  });
  if (upsertErr) console.warn("Failed to upsert swipes:", upsertErr);

  // Update person status
  await supabase.from("people").update({ status: "swiped" }).eq("id", personId);

  return swipeRows.length;
}

export async function scheduleDatesForPerson(personId: string, minDates = 3, maxDates = 4): Promise<string[]> {
  // Find top mutual swipe pairs for this person
  const { data: swipesFrom, error: sfErr } = await supabase
    .from("swipes")
    .select("to_id, score")
    .eq("from_id", personId);

  if (sfErr || !swipesFrom || swipesFrom.length === 0) return [];

  const { data: swipesTo, error: stErr } = await supabase
    .from("swipes")
    .select("from_id, score")
    .eq("to_id", personId);

  const reverseScores = new Map<string, number>();
  (swipesTo || []).forEach((s) => reverseScores.set(s.from_id, s.score));

  // Calculate mutual scores
  const pairs = swipesFrom
    .map((s) => {
      const rev = reverseScores.get(s.to_id) ?? s.score; // symmetric fallback
      return {
        candidateId: s.to_id,
        score: (s.score + rev) / 2,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Check existing dates for this person
  const { data: existingDates } = await supabase
    .from("dates")
    .select("a_id, b_id")
    .or(`a_id.eq.${personId},b_id.eq.${personId}`);

  const alreadyDated = new Set<string>();
  (existingDates || []).forEach((d) => {
    alreadyDated.add(d.a_id === personId ? d.b_id : d.a_id);
  });

  const createdDateIds: string[] = [];
  const targetCount = Math.min(pairs.length, maxDates);

  for (const p of pairs) {
    if (alreadyDated.has(p.candidateId)) continue;
    if (createdDateIds.length >= targetCount) break;

    const { data: newDate, error: insertErr } = await supabase
      .from("dates")
      .insert({
        a_id: personId,
        b_id: p.candidateId,
        status: "scheduled",
        phase: "first_messages",
        step: 0,
        pool: "live",
      })
      .select("id")
      .single();

    if (!insertErr && newDate) {
      createdDateIds.push(newDate.id);
      alreadyDated.add(p.candidateId);
    }
  }

  return createdDateIds;
}

export async function stepDate(dateId: string): Promise<{
  done: boolean;
  phase: string;
  step: number;
  message?: any;
  outcome?: string;
}> {
  // 1. Fetch date info + people + profiles
  const { data: date, error: dateErr } = await supabase
    .from("dates")
    .select(`
      id, a_id, b_id, status, phase, step, date_card, twist,
      a_debrief, b_debrief, outcome, chemistry,
      person_a:people!dates_a_id_fkey(id, name, profiles(*)),
      person_b:people!dates_b_id_fkey(id, name, profiles(*))
    `)
    .eq("id", dateId)
    .single();

  if (dateErr || !date) throw new Error(`Date ${dateId} not found`);
