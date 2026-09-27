export type SyncStatus = "idle" | "connecting" | "syncing" | "success" | "error";

export interface SyncState {
  email: string | null;
  lastSyncedAt: Date | null;
  status: SyncStatus;
  message: string | null;
  /** Bumped whenever a sync changed local data. */
  dataRevision: number;
}
