import "server-only";
import { upstashConfig } from "./env";

type Bucket = { count: number; resetAt: number };

const memory = new Map<string, Bucket>();
const MEMORY_MAX_KEYS = 10_000;

function memoryHit(key: string, windowMs: number): number {
  const now = Date.now();
  const bucket = memory.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (memory.size >= MEMORY_MAX_KEYS) {
      for (const [k, b] of memory) if (b.resetAt <= now) memory.delete(k);
      if (memory.size >= MEMORY_MAX_KEYS) memory.clear();
    }
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }
  bucket.count++;
  return bucket.count;
}

async function upstashHit(
  config: { url: string; token: string },
  key: string,
  windowMs: number,
): Promise<number> {
  const res = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, String(windowMs), "NX"],
    ]),
    signal: AbortSignal.timeout(3_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const [incr] = (await res.json()) as [{ result?: number }];
  if (typeof incr?.result !== "number") throw new Error("Upstash bad reply");
  return incr.result;
}

/**
 * Fixed-window limiter. Shared across serverless instances when Upstash is configured;
 * otherwise per-instance memory (still stops bursts, but resets on cold starts).
 */
export async function rateLimit(
  bucket: string,
  id: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const key = `khorocboi:web:rl:${bucket}:${id}`;
  const config = upstashConfig();
  let count: number;
  try {
    count = config ? await upstashHit(config, key, windowMs) : memoryHit(key, windowMs);
  } catch {
    count = memoryHit(key, windowMs);
  }
  return { allowed: count <= limit, retryAfterSec: Math.ceil(windowMs / 1000) };
}
