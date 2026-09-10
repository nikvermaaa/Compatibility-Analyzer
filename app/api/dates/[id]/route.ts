import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: date, error: dErr } = await supabase
      .from("dates")
      .select(`
        id, a_id, b_id, status, phase, step, date_card, twist,
        a_debrief, b_debrief, outcome, chemistry, created_at,
        person_a:people!dates_a_id_fkey(id, name, slug, photo_url, profiles(*)),
        person_b:people!dates_b_id_fkey(id, name, slug, photo_url, profiles(*))
      `)
      .eq("id", id)
      .single();

    if (dErr || !date) {
      return NextResponse.json({ error: "Date not found" }, { status: 404 });
    }

    const { data: messages = [] } = await supabase
      .from("date_messages")
      .select("*")
      .eq("date_id", id)
      .order("seq", { ascending: true });

    return NextResponse.json({
      date,
      messages,
    });
  } catch (err: any) {
    console.error("GET /api/dates/[id] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
