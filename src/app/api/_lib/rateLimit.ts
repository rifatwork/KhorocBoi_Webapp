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

async function upstashPeek(
  config: { url: string; token: string },
  key: string,
): Promise<{ count: number; ttlMs: number }> {
  const res = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["GET", key],
      ["PTTL", key],
    ]),
    signal: AbortSignal.timeout(3_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const [get, ttl] = (await res.json()) as [{ result?: string | null }, { result?: number }];
  return { count: Number(get?.result ?? 0) || 0, ttlMs: Math.max(0, ttl?.result ?? 0) };
}

function memoryPeek(key: string): { count: number; ttlMs: number } {
  const bucket = memory.get(key);
  const now = Date.now();
  if (!bucket || bucket.resetAt <= now) return { count: 0, ttlMs: 0 };
  return { count: bucket.count, ttlMs: bucket.resetAt - now };
}

/** Checks a bucket without counting a hit, e.g. to block after too many recorded failures. */
export async function limitReached(
  bucket: string,
  id: string,
  limit: number,
): Promise<{ blocked: boolean; retryAfterSec: number }> {
  const key = `khorocboi:web:rl:${bucket}:${id}`;
  const config = upstashConfig();
  let state: { count: number; ttlMs: number };
  try {
    state = config ? await upstashPeek(config, key) : memoryPeek(key);
  } catch {
    state = memoryPeek(key);
  }
  return {
    blocked: state.count >= limit,
    retryAfterSec: Math.max(1, Math.ceil(state.ttlMs / 1000)),
  };
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
