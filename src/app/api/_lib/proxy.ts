import "server-only";
import { syncServerUrl } from "./env";
import { json } from "./guard";

const PASSTHROUGH_ERRORS = new Set([400, 401, 404, 413, 429]);

/** Forwards an already-validated JSON payload to khorocboi-server. */
export async function forwardToSyncServer(path: string, payload: unknown): Promise<Response> {
  let base: string;
  try {
    base = syncServerUrl();
  } catch (error) {
    console.error("Sync proxy misconfigured:", error);
    return json({ error: "Backup is not configured on this server." }, 500);
  }

  try {
    const upstream = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
      redirect: "error",
    });

    if (upstream.ok || PASSTHROUGH_ERRORS.has(upstream.status)) {
      const text = await upstream.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = { error: "Unexpected reply from backup server" };
      }
      return json(body, upstream.status);
    }

    console.error(`Sync server ${path} responded ${upstream.status}`);
    return json({ error: "Backup server error. Try again later." }, 502);
  } catch {
    return json({ error: "Backup server is unreachable. Try again later." }, 502);
  }
}
