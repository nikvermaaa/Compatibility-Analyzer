import { NextRequest, NextResponse } from "next/server";
import { stepDate } from "@/lib/dating";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await stepDate(id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`POST /api/dates/${params}/step error:`, err);
    return NextResponse.json({ error: err.message || "Failed to step date" }, { status: 500 });
  }
}
