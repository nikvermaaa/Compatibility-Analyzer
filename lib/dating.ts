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
