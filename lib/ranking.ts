import { supabase } from "./db";
import { complete } from "./llm";

export interface RankedCandidate {
  rank: number;
  candidateId: string;
  name: string;
  photoUrl?: string;
  oneLiner?: string;
  fit: number;
  reason: string;
  dated: boolean;
  dateId?: string;
  outcome?: string;
  pVerdict?: string;
  cVerdict?: string;
  breakdown?: {
    sharedInterests?: number;
    valuesAlignment?: number;
    lifestyleFit?: number;
    conversationFlow?: number;
  };
}

export async function computeAndSaveRankings(personId: string): Promise<RankedCandidate[]> {
  // 1. Fetch person
  const { data: person, error: pErr } = await supabase
    .from("people")
    .select("id, name, profiles(*)")
    .eq("id", personId)
    .single();

  if (pErr || !person) throw new Error("Person not found for ranking");

  // 2. Fetch all other ready or swiped candidates
  const { data: candidates, error: cErr } = await supabase
    .from("people")
    .select("id, name, photo_url, profiles(*)")
    .neq("id", personId);

  if (cErr || !candidates || candidates.length === 0) return [];

  // 3. Fetch swipes from P and to P
  const { data: swipesFrom = [] } = await supabase
    .from("swipes")
    .select("to_id, score, reason")
    .eq("from_id", personId);

  const { data: swipesTo = [] } = await supabase
    .from("swipes")
    .select("from_id, score, reason")
    .eq("to_id", personId);

  const swipeFromMap = new Map<string, { score: number; reason: string }>();
  (swipesFrom || []).forEach((s) => swipeFromMap.set(s.to_id, { score: s.score, reason: s.reason }));

  const swipeToMap = new Map<string, { score: number; reason: string }>();
  (swipesTo || []).forEach((s) => swipeToMap.set(s.from_id, { score: s.score, reason: s.reason }));

  // 4. Fetch all dates involving P
  const { data: dates = [] } = await supabase
    .from("dates")
    .select("*")
    .or(`a_id.eq.${personId},b_id.eq.${personId}`)
    .eq("status", "done");

  const dateMap = new Map<string, any>();
  (dates || []).forEach((d) => {
    const otherId = d.a_id === personId ? d.b_id : d.a_id;
    dateMap.set(otherId, d);
  });

  // 5. Compute fit score for each candidate
  const evaluated: Omit<RankedCandidate, "rank">[] = [];

  for (const c of candidates) {
    const analysis = (c.profiles as any)?.analysis || {};
    const d = dateMap.get(c.id);
    const swP = swipeFromMap.get(c.id) || { score: 65, reason: "Promising profile compatibility" };
    const swC = swipeToMap.get(c.id) || { score: swP.score, reason: swP.reason };

    let fit = 0;
    let reason = swP.reason;
    let dated = false;
    let dateId: string | undefined;
    let outcome: string | undefined;
    let pVerdict: string | undefined;
    let cVerdict: string | undefined;
    let breakdown: any = undefined;

    if (d) {
      dated = true;
      dateId = d.id;
      outcome = d.outcome;

      const isA = d.a_id === personId;
      const debriefP = isA ? d.a_debrief : d.b_debrief;
      const debriefC = isA ? d.b_debrief : d.a_debrief;

      const pOverall = debriefP?.overall ?? 70;
      const cOverall = debriefC?.overall ?? 70;

      fit = 0.55 * pOverall + 0.25 * cOverall + 0.2 * swP.score;

      if (debriefP?.wouldSeeAgain && debriefC?.wouldSeeAgain) {
        fit += 5; // mutual match bonus
      }

      pVerdict = debriefP?.verdict;
      cVerdict = debriefC?.verdict;
      reason = debriefP?.verdict || `Shared high compatibility during the date.`;
      breakdown = debriefP?.scores;
    } else {
      // Undated pair fallback
      fit = 0.85 * (0.7 * swP.score + 0.3 * swC.score);
      reason = swP.reason || "Profile screening indicates mutual potential.";
    }

    const clampedFit = Math.min(100, Math.max(0, Math.round(fit)));

    evaluated.push({
      candidateId: c.id,
      name: c.name,
      photoUrl: c.photo_url || (c.profiles as any)?.dossier?.photoUrl,
      oneLiner: analysis.oneLiner,
      fit: clampedFit,
      reason,
      dated,
      dateId,
      outcome,
      pVerdict,
      cVerdict,
      breakdown,
    });
  }

  // Sort by fit descending
  evaluated.sort((a, b) => b.fit - a.fit);

  // Assign ranks
  const ranked: RankedCandidate[] = evaluated.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  // Generate closing note
  let closingNote = "";
  if (ranked.length > 0) {
    const topPick = ranked[0];
    closingNote = `Based on deep persona analysis and real date simulations, ${topPick.name} emerges as the strongest match with ${topPick.fit}% mutual compatibility. ${topPick.reason}`;
  }

  // Save to database
  await supabase.from("rankings").upsert(
    {
      person_id: personId,
      ranked,
      closing_note: closingNote,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "person_id" }
  );

  await supabase.from("people").update({ status: "ranked" }).eq("id", personId);

  return ranked;
}
