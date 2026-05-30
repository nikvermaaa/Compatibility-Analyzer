import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ZodSchema } from "zod";

export type Tier = "smart" | "fast";

interface ProviderCooldown {
  [key: string]: number; // timestamp when cooldown expires
}

const cooldowns: ProviderCooldown = {};

function isCoolingDown(provider: string): boolean {
  const expiresAt = cooldowns[provider];
  return !!expiresAt && Date.now() < expiresAt;
}

function setCooldown(provider: string, ms: number = 20_000) {
  console.log(`[LLM Router] Provider ${provider} cooling down for ${ms}ms`);
  cooldowns[provider] = Date.now() + ms;
}

const PROVIDERS: Record<Tier, string[]> = {
  smart: ["gemini", "groq_big"],
  fast: ["groq_small", "groq_big", "gemini"],
};

function getClient(provider: string): { type: "gemini" | "openai"; client: any; model: string } | null {
  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
    return { type: "gemini", client: new GoogleGenerativeAI(key), model };
  }

