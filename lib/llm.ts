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

  if (provider === "groq_big") {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    return {
      type: "openai",
      client: new OpenAI({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" }),
      model,
    };
  }

  if (provider === "groq_small") {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    const model = process.env.GROQ_SMALL_MODEL || "openai/gpt-oss-20b";
    return {
      type: "openai",
      client: new OpenAI({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" }),
      model,
    };
  }

  if (provider === "cerebras") {
    const key = process.env.CEREBRAS_API_KEY;
    if (!key) return null;
    const model = process.env.CEREBRAS_MODEL || "llama3.3-70b";
    return {
      type: "openai",
      client: new OpenAI({ apiKey: key, baseURL: "https://api.cerebras.ai/v1" }),
      model,
    };
  }

  if (provider === "openrouter") {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return null;
    const model = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
    return {
      type: "openai",
      client: new OpenAI({ apiKey: key, baseURL: "https://openrouter.ai/api/v1" }),
      model,
    };
  }

  return null;
}

export async function complete({
  tier,
  system,
  messages,
  json = false,
  retries = 3,
}: {
  tier: Tier;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  json?: boolean;
  retries?: number;
}): Promise<string> {
  const providerList = PROVIDERS[tier];

  for (const provider of providerList) {
    if (isCoolingDown(provider)) continue;
    const resolved = getClient(provider);
    if (!resolved) continue;

    try {
      console.log(`[LLM Router] Invoking provider: ${provider} (model: ${resolved.model}, tier: ${tier})`);
      if (resolved.type === "gemini") {
        const genAI = resolved.client as GoogleGenerativeAI;
        const geminiModel = genAI.getGenerativeModel({
          model: resolved.model,
          systemInstruction: system,
          generationConfig: json ? { responseMimeType: "application/json" } : undefined,
        });

        const promptText = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
        const res = await geminiModel.generateContent(promptText);
        const text = res.response.text();
        if (text) return text;
      } else {
        const openai = resolved.client as OpenAI;
        const formattedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: "system", content: system },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ];

        const res = await openai.chat.completions.create({
          model: resolved.model,
          messages: formattedMessages,
          response_format: json ? { type: "json_object" } : undefined,
          temperature: 0.7,
        });

        const content = res.choices[0]?.message?.content;
        if (content) return content;
      }
    } catch (err: any) {
      console.warn(`[LLM Router] Provider ${provider} failed:`, err?.message || err);
      const status = err?.status || err?.statusCode || (err?.message?.includes("429") ? 429 : 500);

      if (status === 429) {
        setCooldown(provider, 25_000);
        continue;
      }
      if (status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
    }
  }

  if (retries > 0) {
    console.warn(`[LLM Router] All providers cooling down or unavailable. Waiting 6s before retry...`);
    await new Promise((resolve) => setTimeout(resolve, 6000));
    return complete({ tier, system, messages, json, retries: retries - 1 });
  }

  throw new Error("All configured LLM providers failed or exhausted rate limits.");
}

export function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export async function completeJson<T>({
  tier,
  system,
  messages,
  schema,
