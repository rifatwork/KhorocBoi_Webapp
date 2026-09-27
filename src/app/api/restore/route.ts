import { backupConfigured, passcodeMatches, readBackup } from "../_lib/backupStore";
import { guardJsonPost, json, readCredentials } from "../_lib/guard";
import { rateLimit } from "../_lib/rateLimit";

export const maxDuration = 30;

const PASSCODE_WINDOW_MS = 15 * 60_000;
const PASSCODE_LIMIT = 10;

export async function POST(request: Request) {
  const guarded = await guardJsonPost(request, {
    bucket: "restore",
    limit: 30,
    windowMs: 10 * 60_000,
    maxBytes: 2 * 1024,
  });
  if ("error" in guarded) return guarded.error;

  const credentials = readCredentials(guarded.body);
  if ("error" in credentials) return json({ error: credentials.error }, 400);

  if (!backupConfigured()) {
    return json({ error: "Backup is not configured on this server." }, 500);
  }

  const attempt = await rateLimit("passcode", credentials.email, PASSCODE_LIMIT, PASSCODE_WINDOW_MS);
  if (!attempt.allowed) {
    return json({ error: "Too many attempts. Try again later." }, 429, {
      "Retry-After": String(attempt.retryAfterSec),
    });
  }

  try {
    const record = await readBackup(credentials.email);
    if (!record) return json({ error: "No account found for this email" }, 404);

    const valid = await passcodeMatches(credentials.code, record.codeHash);
    if (!valid) return json({ error: "Invalid code" }, 401);

    return json({ data: record.data, updatedAt: record.updatedAt });
  } catch (error) {
    console.error("Restore failed:", error instanceof Error ? error.message : "unknown");
    return json({ error: "Backup server error. Try again later." }, 500);
  }
}
