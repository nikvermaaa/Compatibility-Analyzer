import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { count, error } = await supabase.from("people").select("id", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ ok: true, activePeopleCount: count, pingedAt: new Date().toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
