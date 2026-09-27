import "server-only";

export function groqApiKey(): string | null {
  return process.env.GROQ_API_KEY?.trim() || null;
}

export function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}
