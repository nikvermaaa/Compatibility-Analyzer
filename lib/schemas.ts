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

