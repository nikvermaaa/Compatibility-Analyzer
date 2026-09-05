import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { analyzePerson } from "@/lib/analysis";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch existing dossier
    const { data: profileRow, error: pErr } = await supabase
      .from("profiles")
      .select("dossier, analysis")
      .eq("person_id", id)
      .single();

    if (pErr || !profileRow || !profileRow.dossier) {
      return NextResponse.json({ error: "Profile dossier not found. Please scrape first." }, { status: 404 });
    }

    // Run analysis
    const { analysis, agentCard, readingLog } = await analyzePerson(profileRow.dossier as any);

    // Save profile
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        analysis,
        agent_card: agentCard,
        reading_log: readingLog,
        model: process.env.GEMINI_MODEL || "gemini-flash-latest",
      })
      .eq("person_id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Set person status to ready
    await supabase.from("people").update({ status: "ready" }).eq("id", id);

    return NextResponse.json({ ok: true, status: "ready" });
  } catch (err: any) {
    console.error("POST /api/people/[id]/analyze error:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze profile" }, { status: 500 });
  }
}
