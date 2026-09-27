import type { BackupSnapshot } from "@/features/tabs/types";

export class SyncHttpError extends Error {}

async function errorFrom(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // Non-JSON error body.
  }
  return `Request failed (${res.status}).`;
}

/** Returns the stored snapshot, or null when this email has no backup yet. */
export async function restoreBackup(email: string, code: string): Promise<BackupSnapshot | null> {
  const res = await fetch("/api/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new SyncHttpError(await errorFrom(res));
  const body = await res.json();
  const data = body?.data;
  return data && typeof data === "object" ? (data as BackupSnapshot) : null;
}

export async function pushBackup(email: string, code: string, data: BackupSnapshot): Promise<void> {
  const res = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, data }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new SyncHttpError(await errorFrom(res));
}
