import { z } from "zod";
import { PersonDossier, Analysis, AgentCard, AnalysisSchema, AgentCardSchema } from "./schemas";
import { ANALYZER_SYSTEM_PROMPT } from "./prompts";
import { completeJson } from "./llm";

const CombinedAnalysisSchema = z.object({
  analysis: AnalysisSchema,
  agentCard: AgentCardSchema,
});

export interface ReadingLogEntry {
  step: number;
  text: string;
  source?: string;
  timestampOffsetMs: number;
}

export function generateReadingLog(dossier: PersonDossier, analysis: Analysis): ReadingLogEntry[] {
  const log: ReadingLogEntry[] = [];
  let step = 1;
  let offset = 0;

  const push = (text: string, source?: string) => {
    log.push({ step: step++, text, source, timestampOffsetMs: offset });
    offset += 750;
  };

  push(`Initiating agent profile generation for ${dossier.name}...`);

  if (dossier.linkedin.headline) {
    push(`Reading LinkedIn headline: "${dossier.linkedin.headline.slice(0, 70)}..."`, "LI-headline");
  }

  const expCount = dossier.linkedin.experience.length;
  if (expCount > 0) {
    push(`Reading ${expCount} career milestones on LinkedIn...`, "LI-experience");
    dossier.linkedin.experience.slice(0, 2).forEach((exp) => {
      push(`Identified role: ${exp.title} at ${exp.company}`, exp.id);
    });
  }

  if (dossier.instagram.bio) {
    push(`Parsing Instagram bio: "${dossier.instagram.bio.slice(0, 60)}..."`, "IG-bio");
  }

  const postCount = dossier.instagram.posts.length;
  if (postCount > 0) {
    push(`Reviewing ${postCount} recent Instagram posts and captions...`, "IG-posts");
  }

  // Key hobbies/interests extracted
  if (analysis.hobbies.length > 0) {
    const topHobby = analysis.hobbies[0];
    push(`Found concrete passion: "${topHobby.text}"`, topHobby.evidence[0]);
  }

  if (analysis.values.length > 0) {
    const topVal = analysis.values[0];
    push(`Discovered core value: "${topVal.text}"`, topVal.evidence[0]);
  }

  push(`Inferring relationship needs and lifestyle cadence...`);
  push(`Calibrating digital twin voice and conversation style...`);
  push(`Profile analysis complete. Ready for candidate screening.`);

  return log;
}

export async function analyzePerson(dossier: PersonDossier): Promise<{
  analysis: Analysis;
  agentCard: AgentCard;
  readingLog: ReadingLogEntry[];
}> {
  // Format dossier for LLM prompt
  const liDetails = [
    `Name: ${dossier.name}`,
    `Location: ${dossier.location || "Unknown"}`,
    dossier.linkedin.headline ? `LI Headline: ${dossier.linkedin.headline}` : null,
    dossier.linkedin.about ? `LI About [id: LI-about]: ${dossier.linkedin.about}` : null,
    dossier.linkedin.experience.length > 0
      ? `LI Experience:\n` +
        dossier.linkedin.experience
          .map((e) => `  - [id: ${e.id}] ${e.title} at ${e.company} (${e.duration || ""}): ${e.description || ""}`)
          .join("\n")
      : null,
    dossier.linkedin.education.length > 0
      ? `LI Education:\n` +
        dossier.linkedin.education
          .map((e) => `  - [id: ${e.id}] ${e.school} (${e.degree || ""} ${e.field || ""})`)
          .join("\n")
      : null,
    dossier.linkedin.skills.length > 0 ? `LI Skills: ${dossier.linkedin.skills.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const igDetails = [
    `IG Handle: @${dossier.instagram.username}`,
    dossier.instagram.bio ? `IG Bio [id: IG-bio]: ${dossier.instagram.bio}` : null,
    `IG Followers: ${dossier.instagram.followers || 0}, Posts: ${dossier.instagram.postsCount || 0}`,
    dossier.instagram.posts.length > 0
      ? `IG Recent Posts:\n` +
        dossier.instagram.posts
          .map(
            (p) =>
              `  - [id: ${p.id}] (${p.type}${p.location ? " at " + p.location : ""}): "${p.caption || ""}" [tags: ${p.hashtags.join(", ")}]`
          )
          .join("\n")
      : null,
  ]
