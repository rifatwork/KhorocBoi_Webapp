import {
  hashPasscode,
  passcodeMatches,
  readBackup,
  writeBackup,
  backupConfigured,
} from "../_lib/backupStore";
import { guardJsonPost, json, readCredentials } from "../_lib/guard";
import { limitReached, rateLimit } from "../_lib/rateLimit";

export const maxDuration = 30;

const PASSCODE_WINDOW_MS = 15 * 60_000;
const PASSCODE_LIMIT = 10;

export async function POST(request: Request) {
  const guarded = await guardJsonPost(request, {
    bucket: "sync",
    limit: 60,
    windowMs: 60_000,
    maxBytes: 4 * 1024 * 1024,
  });
  if ("error" in guarded) return guarded.error;

  const credentials = readCredentials(guarded.body);
  if ("error" in credentials) return json({ error: credentials.error }, 400);

  const data = (guarded.body as { data?: unknown }).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json({ error: "Backup data is missing or malformed" }, 400);
  }

  if (!backupConfigured()) {
    return json({ error: "Backup is not configured on this server." }, 500);
  }

  const lockout = await limitReached("passcode-fail", credentials.email, PASSCODE_LIMIT);
  if (lockout.blocked) {
    return json({ error: "Too many wrong passcodes. Try again later." }, 429, {
      "Retry-After": String(lockout.retryAfterSec),
    });
  }

  try {
    const existing = await readBackup(credentials.email);
    if (existing) {
      const valid = await passcodeMatches(credentials.code, existing.codeHash);
      if (!valid) {
        await rateLimit("passcode-fail", credentials.email, PASSCODE_LIMIT, PASSCODE_WINDOW_MS);
        return json({ error: "Invalid code for this email" }, 401);
      }

      await writeBackup(credentials.email, {
        codeHash: existing.codeHash,
        data,
        updatedAt: new Date().toISOString(),
      });
      return json({ status: "updated" });
    }

    await writeBackup(credentials.email, {
      codeHash: await hashPasscode(credentials.code),
      data,
      updatedAt: new Date().toISOString(),
    });
    return json({ status: "created" });
  } catch (error) {
    console.error("Sync failed:", error instanceof Error ? error.message : "unknown");
    return json({ error: "Backup server error. Try again later." }, 500);
  }
}
