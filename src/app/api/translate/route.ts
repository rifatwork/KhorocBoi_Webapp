const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";
const MAX_TERM_LENGTH = 40;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

/** Best-effort per-instance limiter so the endpoint can't burn the Groq quota. */
const hits = new Map<string, { count: number; resetAt: number }>();

function allow(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5000) hits.clear();
    return true;
  }
  entry.count++;
  return entry.count <= MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return Response.json({ translation: null });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(ip)) return Response.json({ translation: null }, { status: 429 });

  let term = "";
  try {
    const body = await request.json();
    term = typeof body?.term === "string" ? body.term.trim() : "";
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!term || term.length > MAX_TERM_LENGTH) return Response.json({ translation: null });

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 32,
        messages: [
          {
            role: "system",
            content:
              "You translate Bangla or Banglish expense-related words into clean short " +
              "English product/service names. Reply with ONLY the English translation, " +
              "no quotes, no punctuation, no explanation.",
          },
          { role: "user", content: term },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) return Response.json({ translation: null });

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content?.trim();
    const firstLine = content?.split("\n")[0]?.trim().replace(/^["']+|["']+$/g, "").trim();
    if (!firstLine || firstLine.length > 60) return Response.json({ translation: null });
    return Response.json({ translation: firstLine });
  } catch {
    return Response.json({ translation: null });
  }
}
