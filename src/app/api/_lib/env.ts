import "server-only";

const DEFAULT_SYNC_SERVER = "https://khorocboi-server.vercel.app";

function isAllowedServerUrl(url: URL): boolean {
  if (url.protocol === "https:") return true;
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return process.env.NODE_ENV !== "production" && url.protocol === "http:" && local;
}

/** Backup server base URL. Must be https in production so passcodes never travel in clear text. */
export function syncServerUrl(): string {
  const raw = (process.env.SYNC_SERVER_URL || DEFAULT_SYNC_SERVER).trim().replace(/\/+$/, "");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("SYNC_SERVER_URL is not a valid URL");
  }
  if (!isAllowedServerUrl(url)) throw new Error("SYNC_SERVER_URL must use https");
  return url.origin + url.pathname.replace(/\/+$/, "");
}

export function groqApiKey(): string | null {
  return process.env.GROQ_API_KEY?.trim() || null;
}

export function upstashConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}
