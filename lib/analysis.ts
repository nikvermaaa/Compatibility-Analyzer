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
