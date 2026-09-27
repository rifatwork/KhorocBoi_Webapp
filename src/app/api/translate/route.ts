import { guardJsonPost, json } from "../_lib/guard";
import { isGroqConfigured, translateWithGroq } from "../_lib/groq";

export const maxDuration = 15;

const MAX_TERM_LENGTH = 40;

export async function POST(request: Request) {
  if (!isGroqConfigured()) return json({ translation: null });

  const guarded = await guardJsonPost(request, {
    bucket: "translate",
    limit: 30,
    windowMs: 60_000,
    maxBytes: 512,
  });
  if ("error" in guarded) return guarded.error;

  const raw = (guarded.body as { term?: unknown } | null)?.term;
  const term = typeof raw === "string" ? raw.replace(/\p{Cc}/gu, " ").trim() : "";
  if (!term || term.length > MAX_TERM_LENGTH) return json({ translation: null });

  return json({ translation: await translateWithGroq(term) });
}
