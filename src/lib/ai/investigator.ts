import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { anthropicConfigured, geminiConfigured } from "@/lib/env";

const OutputSchema = z.object({
  explanation: z.string().min(1),
  counterpoint: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
});

export type ExplainResult = {
  explanation: string;
  counterpoint: string;
  confidence: number | null;
};

const SYSTEM = `You explain access-governance findings for operators.
Rules:
- Findings are deterministic; you cannot create, remove, or re-rank findings.
- Describe observed grants, roles, resources, and dates only.
- Never judge a person's intent, character, or trustworthiness.
- Always include a legitimate-business counterpoint for why the access may be appropriate.
- Never invent file contents, message bodies, or tokens.
Return JSON only: {"explanation":"...","counterpoint":"...","confidence":0.0-1.0}`;

/**
 * Explain a finding. Malformed output → null (missing annotation, not failure).
 * Prefers Gemini when GEMINI_API_KEY is set; else Anthropic.
 */
export async function explainFinding(input: {
  ruleId: string;
  severity: string;
  title: string;
  evidence: Record<string, unknown>;
}): Promise<ExplainResult | null> {
  const payload = {
    ruleId: input.ruleId,
    severity: input.severity,
    title: input.title,
    evidence: input.evidence,
  };
  const user = `Explain this finding as JSON only:\n${JSON.stringify(payload)}`;

  if (geminiConfigured()) {
    const out = await explainWithGemini(user);
    if (out) return out;
  }
  if (anthropicConfigured()) {
    const out = await explainWithAnthropic(user);
    if (out) return out;
  }
  return null;
}

async function explainWithGemini(user: string): Promise<ExplainResult | null> {
  try {
    const key = process.env.GEMINI_API_KEY!.trim();
    const model =
      process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("\n") ?? "";
    return parseExplainJson(text);
  } catch {
    return null;
  }
}

async function explainWithAnthropic(
  user: string,
): Promise<ExplainResult | null> {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return parseExplainJson(text);
  } catch {
    return null;
  }
}

function parseExplainJson(text: string): ExplainResult | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
  const parsed = OutputSchema.safeParse(raw);
  if (!parsed.success) return null;

  const confidence =
    parsed.data.confidence === undefined
      ? null
      : Math.min(1, Math.max(0, parsed.data.confidence));

  return {
    explanation: parsed.data.explanation,
    counterpoint: parsed.data.counterpoint,
    confidence,
  };
}

/** Deterministic fallback when LLM unavailable. */
export function templateExplain(input: {
  title: string;
  evidence: { details?: string[] };
}): ExplainResult {
  const details = input.evidence.details ?? [];
  return {
    explanation:
      details.length > 0
        ? `${input.title}. Evidence: ${details.join(" ")}`
        : input.title,
    counterpoint:
      "This access may be legitimate for the person's current role or a temporary project. Confirm with the resource owner before changing permissions.",
    confidence: null,
  };
}
