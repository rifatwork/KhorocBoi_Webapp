import { tabStore } from "@/features/tabs/services/tabStore";
import type { BackupSnapshot } from "@/features/tabs/types";
import { readString, writeString } from "@/shared/lib/storage";
import { pushBackup, restoreBackup, SyncHttpError } from "../services/syncApi";
import type { SyncState } from "../types";

const EMAIL_KEY = "khorocboi.sync.email";
const CODE_KEY = "khorocboi.sync.code";
const LAST_SYNC_KEY = "khorocboi.sync.lastSync";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const CODE_PATTERN = /^\d{4,}$/;

const SERVER_STATE: SyncState = {
  email: null,
  lastSyncedAt: null,
  status: "idle",
  message: null,
  dataRevision: 0,
};

type Listener = () => void;

/** Email + passcode backup, same flow and data shape as the mobile app. */
class SyncController {
  private state: SyncState = SERVER_STATE;
  private code: string | null = null;
  private listeners = new Set<Listener>();
  private initialized = false;
  private inFlight = false;
  private debounce: ReturnType<typeof setTimeout> | null = null;

  subscribe = (listener: Listener) => {
    this.init();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => {
    this.init();
    return this.state;
  };

  getServerSnapshot = () => SERVER_STATE;

  private init() {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;
    const lastRaw = readString(LAST_SYNC_KEY);
    this.code = readString(CODE_KEY);
    this.state = {
      ...this.state,
      email: readString(EMAIL_KEY),
      lastSyncedAt: lastRaw ? new Date(lastRaw) : null,
    };
  }

  private emit(next: Partial<SyncState>) {
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener();
  }

  get isConnected() {
    this.init();
    return !!this.state.email && !!this.code;
  }

  validateCredentials(email: string, code: string): string | null {
    if (!EMAIL_PATTERN.test(email.trim().toLowerCase())) return "Enter a valid email address.";
    if (!CODE_PATTERN.test(code)) return "Passcode must be at least 4 digits.";
    return null;
  }

  /** Saves credentials, restores any existing backup, then uploads local data. */
  async connect(email: string, code: string) {
    this.init();
    const error = this.validateCredentials(email, code);
    if (error) return this.emit({ status: "error", message: error });

    this.emit({ status: "connecting", message: null });
    if (!navigator.onLine) return this.emit({ status: "error", message: "No internet connection." });

    const normalizedEmail = email.trim().toLowerCase();
    try {
      const remote = await restoreBackup(normalizedEmail, code);
      this.code = code;
      writeString(EMAIL_KEY, normalizedEmail);
      writeString(CODE_KEY, code);
      this.emit({ email: normalizedEmail });
      await this.syncNow({ prefetchedRemote: remote, remoteChecked: true });
    } catch (e) {
      this.emit({
        status: "error",
        message: e instanceof SyncHttpError ? e.message : "Could not connect. Please try again.",
      });
    }
  }

  disconnect() {
    if (this.debounce) clearTimeout(this.debounce);
    this.code = null;
    writeString(EMAIL_KEY, null);
    writeString(CODE_KEY, null);
    this.emit({ email: null, status: "idle", message: null });
  }

  /**
   * `pushOnly` uploads the local snapshot (after edits). A full sync pulls first:
   * empty local → exact restore; otherwise merge, then push.
   */
  async syncNow(
    options: {
      pushOnly?: boolean;
      prefetchedRemote?: BackupSnapshot | null;
      remoteChecked?: boolean;
    } = {},
  ) {
    this.init();
    const { pushOnly = false, remoteChecked = false } = options;
    const email = this.state.email;
    const code = this.code;
    if (!email || !code) {
      return this.emit({ status: "error", message: "Set your email and passcode to sync history." });
    }
    if (!navigator.onLine) return this.emit({ status: "error", message: "No internet connection." });
    if (this.inFlight) return;
    this.inFlight = true;
    this.emit({ status: "syncing", message: null });

    try {
      let dataChanged = false;
      let remote = options.prefetchedRemote ?? null;
      if (!pushOnly && remote == null && !remoteChecked) {
        remote = await restoreBackup(email, code);
      }
      if (!pushOnly && remote) {
        if (!tabStore.hasAnyTabs) {
          tabStore.replaceAllFromBackup(remote);
          dataChanged = true;
        } else {
          dataChanged = tabStore.mergeFromBackup(remote) > 0;
        }
      }

      await pushBackup(email, code, tabStore.exportBackup());

      const now = new Date();
      writeString(LAST_SYNC_KEY, now.toISOString());
      this.emit({
        status: "success",
        lastSyncedAt: now,
        message: dataChanged ? "History restored from your account." : "Backup saved to your account.",
        dataRevision: dataChanged ? this.state.dataRevision + 1 : this.state.dataRevision,
      });
    } catch (e) {
      this.emit({
        status: "error",
        message: e instanceof SyncHttpError ? e.message : "Sync failed. Please try again.",
      });
    } finally {
      this.inFlight = false;
    }
  }

  /** Debounced upload after every local change. */
  scheduleUpload() {
    if (!this.isConnected) return;
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => void this.syncNow({ pushOnly: true }), 3000);
  }

  /** Full sync if the last one is older than `staleAfterMs` (app start / tab refocus). */
  async maybeAutoSync(staleAfterMs = 0) {
    if (!this.isConnected || !navigator.onLine) return;
    const last = this.state.lastSyncedAt?.getTime() ?? 0;
    if (Date.now() - last < staleAfterMs) return;
    await this.syncNow();
  }
}

export const syncController = new SyncController();
