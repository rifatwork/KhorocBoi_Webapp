import "server-only";
import { rateLimit } from "./rateLimit";

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/** Browsers always label cross-site requests; reject them so other sites can't drive these endpoints. */
function isSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type GuardOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
  maxBytes: number;
};

/**
 * Runs the checks every API route needs before touching its body:
 * same-origin, JSON content type, body size, and per-IP rate limit.
 * Returns the parsed body, or a ready-to-send error response.
 */
export async function guardJsonPost(
  request: Request,
  options: GuardOptions,
): Promise<{ body: unknown } | { error: Response }> {
  if (!isSameOrigin(request)) return { error: json({ error: "Forbidden" }, 403) };

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return { error: json({ error: "Content-Type must be application/json" }, 415) };
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > options.maxBytes) return { error: json({ error: "Request too large" }, 413) };

  const { allowed, retryAfterSec } = await rateLimit(
    options.bucket,
    clientIp(request),
    options.limit,
    options.windowMs,
  );
  if (!allowed) {
    return {
      error: json({ error: "Too many requests. Try again later." }, 429, {
        "Retry-After": String(retryAfterSec),
      }),
    };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { error: json({ error: "Could not read request body" }, 400) };
  }
  if (new TextEncoder().encode(text).length > options.maxBytes) {
    return { error: json({ error: "Request too large" }, 413) };
  }

  try {
    return { body: JSON.parse(text) };
  } catch {
    return { error: json({ error: "Invalid JSON body" }, 400) };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^\d{4,64}$/;

/** Email + digit passcode, same rules the mobile app already enforces. */
export function readCredentials(
  body: unknown,
): { email: string; code: string } | { error: string } {
  if (!body || typeof body !== "object") return { error: "email and code are required" };
  const { email, code } = body as { email?: unknown; code?: unknown };
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  if (normalizedEmail.length > 254 || !EMAIL_RE.test(normalizedEmail)) {
    return { error: "A valid email is required" };
  }
  const codeStr = String(code ?? "");
  if (!CODE_RE.test(codeStr)) return { error: "Passcode must be at least 4 digits" };
  return { email: normalizedEmail, code: codeStr };
}
