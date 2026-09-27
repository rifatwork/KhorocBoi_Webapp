const DEFAULT_SYNC_SERVER = "https://khorocboi-server.vercel.app";

function syncServerUrl(): string {
  return (process.env.SYNC_SERVER_URL ?? DEFAULT_SYNC_SERVER).trim().replace(/\/+$/, "");
}

/** Forwards a JSON POST to khorocboi-server, passing status and body through. */
export async function forwardToSyncServer(request: Request, path: string): Promise<Response> {
  let body: string;
  try {
    body = JSON.stringify(await request.json());
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${syncServerUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return Response.json({ error: "Backup server is unreachable. Try again later." }, { status: 502 });
  }
}
