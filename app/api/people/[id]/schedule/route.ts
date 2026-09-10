import { NextRequest, NextResponse } from "next/server";
import { scheduleDatesForPerson } from "@/lib/dating";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const minDates = parseInt(process.env.MIN_DATES || "3", 10);
    const maxDates = parseInt(process.env.MAX_DATES || "4", 10);
    const dateIds = await scheduleDatesForPerson(id, minDates, maxDates);
    return NextResponse.json({ ok: true, dateIds });
  } catch (err: any) {
    console.error("POST /api/people/[id]/schedule error:", err);
    return NextResponse.json({ error: err.message || "Failed to schedule dates" }, { status: 500 });
  }
}
