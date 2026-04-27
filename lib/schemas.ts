import { z } from "zod";

export const InsightSchema = z.object({
  text: z.string(),
  evidence: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
});
export type Insight = z.infer<typeof InsightSchema>;

export const PersonalityTraitSchema = z.object({
  trait: z.string(),
  score: z.number().min(0).max(100),
  evidence: z.array(z.string()),
});
export type PersonalityTrait = z.infer<typeof PersonalityTraitSchema>;

export const LifestyleSchema = z.object({
  pace: z.string(),
  social: z.string(),
  schedule: z.string(),
  travel: z.string(),
  evidence: z.array(z.string()),
});
export type Lifestyle = z.infer<typeof LifestyleSchema>;

export const IdealDateSchema = z.object({
  idea: z.string(),
  why: z.string(),
  evidence: z.array(z.string()),
});
export type IdealDate = z.infer<typeof IdealDateSchema>;

export const DataQualitySchema = z.object({
  linkedin: z.enum(["rich", "ok", "thin"]),
  instagram: z.enum(["rich", "ok", "thin"]),
  notes: z.string(),
});
export type DataQuality = z.infer<typeof DataQualitySchema>;

export const AnalysisSchema = z.object({
  oneLiner: z.string(),
  summary: z.string(),
  needs: z.array(InsightSchema),
  hobbies: z.array(InsightSchema),
  interests: z.array(InsightSchema),
  values: z.array(InsightSchema),
  personality: z.array(PersonalityTraitSchema),
  lifestyle: LifestyleSchema,
  communicationStyle: InsightSchema,
  careerSnapshot: InsightSchema,
  greenFlags: z.array(InsightSchema),
  possibleFriction: z.array(InsightSchema),
  idealDates: z.array(IdealDateSchema),
  conversationHooks: z.array(z.string()),
  dealbreakerGuesses: z.array(InsightSchema),
  dataQuality: DataQualitySchema,
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const AgentCardSchema = z.object({
  voice: z.string(),
  goals: z.array(z.string()),
  mustHaves: z.array(z.string()),
  boundaries: z.array(z.string()),
  openerStyle: z.string(),
});
export type AgentCard = z.infer<typeof AgentCardSchema>;

export const ProposalSchema = z.object({
  activity: z.string(),
  place: z.string(),
  timeOfDay: z.string(),
  why: z.string(),
}).nullable().optional();
export type Proposal = z.infer<typeof ProposalSchema>;

export const DateTurnSchema = z.object({
  thought: z.string(),
  message: z.string(),
  vibe: z.number().min(1).max(10),
  proposal: ProposalSchema,
  accepts: z.boolean().nullable().optional(),
});
export type DateTurn = z.infer<typeof DateTurnSchema>;

