"use client";

import { useSyncExternalStore } from "react";
import { syncController } from "./syncController";

export function useCloudSync() {
  const state = useSyncExternalStore(
    syncController.subscribe,
    syncController.getSnapshot,
    syncController.getServerSnapshot,
  );
  return {
    state,
    isConnected: !!state.email,
    isBusy: state.status === "connecting" || state.status === "syncing",
    connect: (email: string, code: string) => syncController.connect(email, code),
    syncNow: () => syncController.syncNow(),
    disconnect: () => syncController.disconnect(),
  };
}
