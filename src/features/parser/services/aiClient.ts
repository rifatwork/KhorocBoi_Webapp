/** Asks the web app's own `/api/translate` route (Groq key stays on the server). */
export async function translateTerm(term: string): Promise<string | null> {
  const cleaned = term.trim();
  if (!cleaned) return null;
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: cleaned }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { translation?: string | null };
    return body.translation?.trim() || null;
  } catch {
    return null;
  }
}
