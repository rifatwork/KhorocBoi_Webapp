import { forwardToSyncServer } from "../_lib/proxy";

export async function POST(request: Request) {
  return forwardToSyncServer(request, "/api/restore");
}
