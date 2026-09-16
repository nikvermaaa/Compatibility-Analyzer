import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { complete } from "@/lib/llm";

export const maxDuration = 45;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ personId: string }> }) {
  try {
    const { personId } = await params;
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const { data: person } = await supabase
      .from("people")
      .select("name, profiles(*), rankings(*)")
      .eq("id", personId)
      .single();

    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    const card = (person.profiles as any)?.agent_card;
    const analysis = (person.profiles as any)?.analysis;
    const rankings = (person.rankings as any)?.ranked || [];

    const systemPrompt = `You are ${person.name}'s personal dating agent. You speak in this voice: ${card?.voice || "candid, warm, insightful"}.
You have read their LinkedIn and Instagram thoroughly, conducted their dates, and ranked their matches.
Answer the user's question about ${person.name}, their dating preferences, dates, or why someone was ranked high/low.
Use ONLY facts from their analysis, debriefs, and rankings. Never invent. Keep your answer concise (2-4 sentences).`;

    const answer = await complete({
      tier: "smart",
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Person summary: ${analysis?.oneLiner || ""}
Top rankings: ${JSON.stringify(rankings.slice(0, 3))}
User Question: "${question}"`,
        },
      ],
    });

    return NextResponse.json({ answer: answer.trim() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
