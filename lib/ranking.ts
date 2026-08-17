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
