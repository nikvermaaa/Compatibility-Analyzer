import { NextRequest, NextResponse } from "next/server";
import { runSwipesForPerson } from "@/lib/dating";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const count = await runSwipesForPerson(id);
    return NextResponse.json({ ok: true, count });
  } catch (err: any) {
    console.error("POST /api/people/[id]/swipe error:", err);
    return NextResponse.json({ error: err.message || "Failed to run swipes" }, { status: 500 });
  }
}
