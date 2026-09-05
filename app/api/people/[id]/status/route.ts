import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getApifyRun, getApifyDatasetItems, startApifyRun } from "@/lib/apify";
import { normalizeDossier } from "@/lib/normalize";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: person, error: pErr } = await supabase
      .from("people")
      .select("id, status, error, li_run_id, ig_run_id, name, linkedin_url, instagram_url")
      .eq("id", id)
      .single();

    if (pErr || !person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    if (person.status !== "scraping") {
      return NextResponse.json({
        status: person.status,
        error: person.error,
      });
    }

    // Check runs
    const [igRun, liRun] = await Promise.all([
      person.ig_run_id ? getApifyRun(person.ig_run_id) : Promise.resolve(null),
      person.li_run_id ? getApifyRun(person.li_run_id) : Promise.resolve(null),
    ]);

    const igDone = igRun?.status === "SUCCEEDED";
    const liDone = liRun?.status === "SUCCEEDED";
    const igFailed = igRun?.status === "FAILED" || igRun?.status === "ABORTED" || igRun?.status === "TIMED-OUT";
    const liFailed = liRun?.status === "FAILED" || liRun?.status === "ABORTED" || liRun?.status === "TIMED-OUT";

    // Handle fallback if primary LinkedIn failed
    if (liFailed && !person.error?.includes("fallback_attempted")) {
      const fallbackActor = process.env.APIFY_LI_ACTOR_FALLBACK || "supreme_coder/linkedin-profile-scraper";
      try {
        const newLiRunId = await startApifyRun(fallbackActor, {
          profileUrls: [person.linkedin_url],
        });
        await supabase
          .from("people")
          .update({ li_run_id: newLiRunId, error: "fallback_attempted" })
          .eq("id", id);
        return NextResponse.json({ status: "scraping", retrying: "linkedin" });
      } catch (fbErr) {
        console.warn("LinkedIn fallback run launch failed:", fbErr);
      }
    }

    if (igFailed || (liFailed && person.error?.includes("fallback_attempted"))) {
      const errMessage = igFailed
        ? "Instagram scraping run failed or was blocked."
        : "LinkedIn scraping failed on both primary and fallback actors.";
      await supabase.from("people").update({ status: "failed", error: errMessage }).eq("id", id);
      return NextResponse.json({ status: "failed", error: errMessage });
    }

    if (!igDone || !liDone) {
      return NextResponse.json({
        status: "scraping",
        igStatus: igRun?.status || "PENDING",
        liStatus: liRun?.status || "PENDING",
      });
    }

    // Both succeeded! Fetch dataset items
    const [igItems = [], liItems = []] = await Promise.all([
      igRun?.defaultDatasetId ? getApifyDatasetItems(igRun.defaultDatasetId) : Promise.resolve([]),
      liRun?.defaultDatasetId ? getApifyDatasetItems(liRun.defaultDatasetId) : Promise.resolve([]),
    ]);

    const rawIg = igItems[0] || {};
    const rawLi = liItems[0] || {};

    // Check if Instagram is private (Section 7.4)
    if (rawIg.isPrivate || rawIg.private) {
      const privateErrMsg = "This Instagram account is private. Only public profiles are supported.";
      await supabase.from("people").update({ status: "failed", error: privateErrMsg }).eq("id", id);
      return NextResponse.json({ status: "failed", error: privateErrMsg });
    }

    // Save raw scrapes cache
    await supabase.from("raw_scrapes").insert([
      { person_id: id, source: "instagram", url: person.instagram_url, data: rawIg },
      { person_id: id, source: "linkedin", url: person.linkedin_url, data: rawLi },
    ]);

    // Normalize dossier
    const dossier = normalizeDossier(rawLi, rawIg, person.name);

    // Try photo persistence into Supabase Storage
    let storedPhotoUrl = dossier.photoUrl;
    if (dossier.photoUrl) {
      try {
        const photoRes = await fetch(dossier.photoUrl);
        if (photoRes.ok) {
          const buffer = await photoRes.arrayBuffer();
          const contentType = photoRes.headers.get("content-type") || "image/jpeg";
          const ext = contentType.includes("png") ? "png" : "jpg";
          const filename = `${id}.${ext}`;

          const { data: uploadData, error: upErr } = await supabase.storage
            .from("photos")
            .upload(filename, Buffer.from(buffer), { contentType, upsert: true });

          if (!upErr && uploadData) {
            const { data: publicUrlData } = supabase.storage.from("photos").getPublicUrl(filename);
            storedPhotoUrl = publicUrlData.publicUrl;
          }
        }
      } catch (imgErr) {
        console.warn("Could not cache profile photo to Supabase storage, using fallback proxy:", imgErr);
        storedPhotoUrl = `/api/img?url=${encodeURIComponent(dossier.photoUrl)}`;
      }
    }

    // Update people status to scraped
    await supabase
      .from("people")
      .update({
        status: "scraped",
        name: dossier.name || person.name,
        photo_url: storedPhotoUrl,
        error: null,
      })
      .eq("id", id);

    // Create profile placeholder with dossier
    await supabase.from("profiles").upsert(
      {
        person_id: id,
        dossier,
        analysis: {},
        agent_card: {},
      },
      { onConflict: "person_id" }
    );

    return NextResponse.json({ status: "scraped", name: dossier.name });
  } catch (err: any) {
    console.error("GET /api/people/[id]/status error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
