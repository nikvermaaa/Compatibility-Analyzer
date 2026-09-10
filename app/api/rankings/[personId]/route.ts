import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { computeAndSaveRankings } from "@/lib/ranking";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ personId: string }> }) {
  try {
    const { personId } = await params;

    const { data: rankingRow } = await supabase
      .from("rankings")
      .select("*")
      .eq("person_id", personId)
      .maybeSingle();

    if (rankingRow) {
      return NextResponse.json(rankingRow);
    }

    // If not computed yet, compute now
    const ranked = await computeAndSaveRankings(personId);
    return NextResponse.json({ person_id: personId, ranked });
  } catch (err: any) {
    console.error("GET /api/rankings/[personId] error:", err);
    return NextResponse.json({ error: err.message || "Failed to get rankings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ personId: string }> }) {
  try {
    const { personId } = await params;
    const ranked = await computeAndSaveRankings(personId);
    return NextResponse.json({ ok: true, ranked });
  } catch (err: any) {
    console.error("POST /api/rankings/[personId] error:", err);
    return NextResponse.json({ error: err.message || "Failed to recompute rankings" }, { status: 500 });
  }
}
