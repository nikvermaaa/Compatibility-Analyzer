import fs from "fs";
import path from "path";

// Ensure .env.local is loaded
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  });
}

import pLimit from "p-limit";
import { supabase } from "../lib/db";
import { analyzePerson } from "../lib/analysis";
import { runSwipesForPerson, scheduleDatesForPerson, stepDate } from "../lib/dating";
import { computeAndSaveRankings } from "../lib/ranking";
import { PersonDossier } from "../lib/schemas";

// High quality fallback dossiers for seeding demo season reliably
const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
];

function buildFallbackDossier(name: string, liUrl: string, igUrl: string, idx: number): PersonDossier {
  const igHandle = igUrl.split("/").filter(Boolean).pop() || "user";
  const photoUrl = DEMO_PHOTOS[idx % DEMO_PHOTOS.length];

  return {
    name,
    photoUrl,
    location: "San Francisco, CA",
    linkedin: {
      headline: `Lead Engineer & Product Strategist | Building the future of human connection`,
      about: `Passionate about building intuitive software, long weekend trail runs, and specialty filter coffee. Deep focus on design systems and thoughtful craftsmanship.`,
      experience: [
        {
          id: "LI-exp-1",
          title: "Senior Product Engineer",
          company: "Nexus Labs",
          duration: "2022 - Present",
          description: "Leading frontend architecture and autonomous AI agent workflows.",
        },
        {
          id: "LI-exp-2",
          title: "Full Stack Developer",
          company: "Venture Studio",
          duration: "2019 - 2022",
          description: "Built scalable web apps and developer tooling.",
        },
      ],
      education: [
        {
          id: "LI-edu-1",
          school: "University of Washington",
          degree: "B.S. Computer Science",
          field: "Human Computer Interaction",
        },
      ],
      skills: ["TypeScript", "System Design", "UI/UX", "Product Strategy"],
    },
    instagram: {
      username: igHandle,
      fullName: name,
      bio: `Half marathons, mountain trails & film photography 📷☕`,
      followers: 1420,
      following: 680,
      postsCount: 54,
      isPrivate: false,
      posts: [
        {
          id: "IG-post-1",
          caption: "Morning sunrise over Mt. Tamalpais. Cold breeze, hot thermos of Geisha.",
          hashtags: ["trailrun", "morningmiles", "california"],
          location: "Marin Headlands",
          type: "image",
          likes: 215,
        },
        {
          id: "IG-post-2",
          caption: "Pottery wheel session #4. The vase actually held its shape this time!",
          hashtags: ["ceramics", "weekendcraft", "clay"],
          location: "Mission Clay Studio",
          type: "image",
          likes: 184,
        },
        {
          id: "IG-post-3",
          caption: "Sunday jazz records and slow pour-over brew.",
          hashtags: ["vinyl", "pourover", "slowliving"],
          location: "Home",
          type: "image",
          likes: 260,
        },
      ],
    },
  };
}

async function main() {
  console.log("=== Proxy Hearts: Starting Resumable Seed Runner ===");

  const csvPath = process.argv[2] || "scripts/people.csv";
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const rawLines = fs.readFileSync(csvPath, "utf-8").split("\n").filter(Boolean);
  const rows = rawLines.slice(1).map((line) => {
    const [name, linkedin_url, instagram_url, open_to, gender] = line.split(",").map((s) => s.trim());
    return { name, linkedin_url, instagram_url, open_to, gender };
  });

  console.log(`Loaded ${rows.length} candidates from ${csvPath}.`);

  const limit = pLimit(4);
  const peopleIds: string[] = [];

  // 1. Ingest / Prepare each person
  await Promise.all(
    rows.map((row, idx) =>
      limit(async () => {
        try {
          const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

          // Check if person already exists
          let { data: person } = await supabase
            .from("people")
            .select("id, status, slug")
            .eq("linkedin_url", row.linkedin_url)
            .maybeSingle();

          if (!person) {
            const { data: newP, error: insErr } = await supabase
              .from("people")
              .insert({
                name: row.name,
                slug,
                linkedin_url: row.linkedin_url,
                instagram_url: row.instagram_url,
                open_to: row.open_to || "anyone",
                gender: row.gender || null,
                pool: "demo",
                status: "pending",
                photo_url: DEMO_PHOTOS[idx % DEMO_PHOTOS.length],
              })
              .select("id, status, slug")
              .single();

            if (insErr) {
              console.warn(`Failed to insert ${row.name}:`, insErr.message);
              return;
            }
            person = newP;
          }

          if (!person) return;
          peopleIds.push(person.id);

          // Check if profile analysis already exists
          const { data: profile } = await supabase
            .from("profiles")
            .select("person_id, analysis")
            .eq("person_id", person.id)
            .maybeSingle();

          if (!profile || !profile.analysis || Object.keys(profile.analysis).length === 0) {
            console.log(`[Seed] Synthesizing persona profile for ${row.name}...`);
            const dossier = buildFallbackDossier(row.name, row.linkedin_url, row.instagram_url, idx);
            const { analysis, agentCard, readingLog } = await analyzePerson(dossier);

            await supabase.from("profiles").upsert(
              {
                person_id: person.id,
                dossier,
                analysis,
                agent_card: agentCard,
                reading_log: readingLog,
                model: process.env.GEMINI_MODEL || "gemini-flash-latest",
              },
              { onConflict: "person_id" }
            );

            await supabase.from("people").update({ status: "ready" }).eq("id", person.id);
          }
        } catch (err: any) {
          console.error(`Error processing ${row.name}:`, err.message);
        }
      })
    )
  );

  // Fetch all people from DB to ensure complete coverage
  const { data: allDbPeople = [] } = await supabase.from("people").select("id, name");
  console.log(`All candidates ready. Starting candidate swiping matrix across ${allDbPeople?.length || 0} people...`);

  // 2. Swipes
  for (const p of (allDbPeople || [])) {
    try {
      console.log(`[Swipe] Scoring candidate pool for ${p.name}...`);
      const count = await runSwipesForPerson(p.id);
      console.log(`[Swipe] ${p.name} evaluated ${count} matches.`);
    } catch (sErr: any) {
      console.warn(`Swipe error for ${p.name}:`, sErr.message);
    }
  }

  console.log(`Swipes complete. Scheduling pairings...`);

  // 3. Scheduling
  for (const p of (allDbPeople || [])) {
    try {
      const dateIds = await scheduleDatesForPerson(p.id, 3, 4);
      if (dateIds.length > 0) {
        console.log(`[Schedule] Scheduled ${dateIds.length} dates for ${p.name}`);
      }
    } catch (schedErr: any) {
      console.warn(`Scheduling error for ${p.name}:`, schedErr.message);
    }
  }

  // 4. Run Dates (concurrency 3)
  const { data: datesToRun = [] } = await supabase
    .from("dates")
    .select("id")
    .neq("status", "done");

  console.log(`Found ${datesToRun?.length || 0} dates to simulate.`);
  const dateLimit = pLimit(3);

  await Promise.all(
    (datesToRun || []).map((d) =>
      dateLimit(async () => {
        let done = false;
        while (!done) {
          try {
            const res = await stepDate(d.id);
            done = res.done;
          } catch (stepErr: any) {
            console.warn(`Date step error on ${d.id}:`, stepErr.message);
            break;
          }
        }
      })
    )
  );

  // 5. Compute Rankings
  console.log(`Dates simulated. Finalizing mutual rankings...`);
  for (const pid of peopleIds) {
    try {
      await computeAndSaveRankings(pid);
    } catch (rErr: any) {
      console.warn(`Ranking error for ${pid}:`, rErr.message);
    }
  }

  console.log("=== Seed Runner Finished Successfully! ===");
}

main().catch(console.error);
