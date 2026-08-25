import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { validateLinkedInUrl, validateInstagramUrl, startApifyRun } from "@/lib/apify";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { linkedinUrl, instagramUrl, name, openTo, gender, pool = "live" } = body;

    // 1. Validation
    const liVal = validateLinkedInUrl(linkedinUrl);
    if (!liVal.valid || !liVal.normalized) {
      return NextResponse.json({ error: liVal.error || "Invalid LinkedIn URL" }, { status: 400 });
    }

    const igVal = validateInstagramUrl(instagramUrl);
    if (!igVal.valid || !igVal.username) {
      return NextResponse.json({ error: igVal.error || "Invalid Instagram URL" }, { status: 400 });
    }

    const cleanLi = liVal.normalized;
    const cleanIg = `https://www.instagram.com/${igVal.username}/`;

    // 2. Check if already exists in DB (Cache hit)
    const { data: existing } = await supabase
      .from("people")
      .select("id, slug, status")
      .eq("linkedin_url", cleanLi)
      .eq("instagram_url", cleanIg)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        id: existing.id,
        slug: existing.slug,
        status: existing.status,
        cached: true,
      });
    }

    // 3. Rate limiting / Daily limit check for live additions
    if (pool === "live") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("people")
        .select("id", { count: "exact", head: true })
        .eq("pool", "live")
        .gte("created_at", today.toISOString());

      const limit = parseInt(process.env.LIVE_DAILY_LIMIT || "30", 10);
      if ((count || 0) >= limit) {
        return NextResponse.json(
          { error: "Daily limit reached for new public profile submissions. Please explore the Demo season!" },
          { status: 429 }
        );
      }
    }

    // 4. Generate Slug
    const slugBase = (name || igVal.username).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${slugBase}-${randomSuffix}`;

    // 5. Start Apify Scrapes
    const igActorId = process.env.APIFY_IG_ACTOR || "apify/instagram-profile-scraper";
    const liActorId = process.env.APIFY_LI_ACTOR || "dev_fusion/linkedin-profile-scraper";

    let igRunId: string | undefined;
    let liRunId: string | undefined;

    try {
      [igRunId, liRunId] = await Promise.all([
        startApifyRun(igActorId, { usernames: [igVal.username] }),
        startApifyRun(liActorId, { profileUrls: [cleanLi] }),
      ]);
    } catch (apifyErr: any) {
      console.error("Apify actor run dispatch failed:", apifyErr);
      return NextResponse.json(
        { error: `Scraping service initiation failed: ${apifyErr.message || apifyErr}` },
        { status: 502 }
      );
    }

    // 6. Insert Person into DB
    const { data: newPerson, error: insertErr } = await supabase
      .from("people")
      .insert({
        slug,
        name: name || igVal.username,
        linkedin_url: cleanLi,
        instagram_url: cleanIg,
        instagram_username: igVal.username,
        open_to: openTo || "anyone",
        gender: gender || null,
        pool,
        status: "scraping",
        li_run_id: liRunId,
        ig_run_id: igRunId,
      })
      .select("id, slug")
      .single();

    if (insertErr || !newPerson) {
      return NextResponse.json({ error: insertErr?.message || "Failed to create person record" }, { status: 500 });
    }

    return NextResponse.json({ id: newPerson.id, slug: newPerson.slug, status: "scraping" });
  } catch (err: any) {
    console.error("POST /api/people error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
