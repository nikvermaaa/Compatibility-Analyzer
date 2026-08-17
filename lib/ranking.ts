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
