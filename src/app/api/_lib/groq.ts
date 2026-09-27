import "server-only";
import { groqApiKey } from "./env";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";
const MAX_REPLY_LENGTH = 60;

const SYSTEM_PROMPT =
  "You translate Bangla or Banglish expense-related words into clean short " +
  "English product/service names. Reply with ONLY the English translation, " +
  "no quotes, no punctuation, no explanation.";

export function isGroqConfigured(): boolean {
  return groqApiKey() !== null;
}

/** Keeps only a short plain-text label, whatever the model returns. */
function cleanReply(content: unknown): string | null {
  if (typeof content !== "string") return null;
  const firstLine = content.split("\n")[0] ?? "";
  const cleaned = firstLine
    .replace(/[^\p{L}\p{N} &'().,/-]/gu, "")
    .replace(/^["'\s]+|["'\s.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned && cleaned.length <= MAX_REPLY_LENGTH ? cleaned : null;
}

export async function translateWithGroq(term: string): Promise<string | null> {
  const apiKey = groqApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 32,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: term },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 401) console.error("GROQ_API_KEY was rejected by Groq");
      return null;
    }
    const data = await res.json();
    return cleanReply(data?.choices?.[0]?.message?.content);
  } catch {
    return null;
  }
}
