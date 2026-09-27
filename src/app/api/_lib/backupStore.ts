import "server-only";
import bcrypt from "bcryptjs";
import { upstashConfig } from "./env";

const USER_PREFIX = "khorocboi:user:";

export type BackupRecord = {
  codeHash: string;
  data: unknown;
  updatedAt: string;
};

export function backupConfigured(): boolean {
  return upstashConfig() !== null;
}

function userKey(email: string): string {
  return `${USER_PREFIX}${email}`;
}

async function redisCommand(args: string[]): Promise<unknown> {
  const config = upstashConfig();
  if (!config) throw new Error("Upstash is not configured");

  const res = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);

  const body = (await res.json()) as { result?: unknown; error?: string };
  if (body.error) throw new Error("Upstash command failed");
  return body.result;
}

function parseRecord(raw: unknown): BackupRecord | null {
  if (typeof raw !== "string" || !raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Partial<BackupRecord>;
  if (typeof record.codeHash !== "string" || !record.codeHash) return null;
  return {
    codeHash: record.codeHash,
    data: record.data,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
  };
}

export async function readBackup(email: string): Promise<BackupRecord | null> {
  const raw = await redisCommand(["GET", userKey(email)]);
  if (raw == null) return null;
  return parseRecord(raw);
}

export async function writeBackup(email: string, record: BackupRecord): Promise<void> {
  const result = await redisCommand(["SET", userKey(email), JSON.stringify(record)]);
  if (result !== "OK") throw new Error("Upstash did not store the backup");
}

export function hashPasscode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export function passcodeMatches(code: string, codeHash: string): Promise<boolean> {
  return bcrypt.compare(code, codeHash);
}
