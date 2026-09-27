import { addDays, dateKey, startOfDay, toLocalIso } from "@/shared/lib/dates";
import { readJson, writeJson } from "@/shared/lib/storage";
import type {
  BackupSnapshot,
  DailyTab,
  DailyTabJson,
  ExpenseEntry,
  RecycledTab,
  RecycledTabJson,
} from "../types";
import {
  compareDateDesc,
  createTab,
  recycledFromJson,
  recycledToJson,
  tabFromJson,
  tabToJson,
  tabTotal,
} from "./tabModel";

const TABS_KEY = "khorocboi.tabs.v1";
const RECYCLED_KEY = "khorocboi.recycled.v1";

/** Same retention as the Android app's recycle bin. */
export const RECYCLE_RETENTION_DAYS = 90;

export interface TabStoreSnapshot {
  hydrated: boolean;
  /** Sorted newest day first, then higher slot. */
  tabs: DailyTab[];
  /** Sorted most recently deleted first; expired items excluded. */
  recycled: RecycledTab[];
}

const SERVER_SNAPSHOT: TabStoreSnapshot = { hydrated: false, tabs: [], recycled: [] };

type Listener = () => void;

class TabStore {
  private tabs = new Map<string, DailyTab>();
  private recycled = new Map<string, RecycledTab>();
  private snapshot: TabStoreSnapshot = SERVER_SNAPSHOT;
  private listeners = new Set<Listener>();
  private hydrated = false;

  subscribe = (listener: Listener) => {
    this.ensureHydrated();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => {
    this.ensureHydrated();
    return this.snapshot;
  };

  getServerSnapshot = () => SERVER_SNAPSHOT;

  private ensureHydrated() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    this.loadFromStorage();
    this.purgeExpiredRecycled();
    window.addEventListener("storage", (event) => {
      if (event.key === TABS_KEY || event.key === RECYCLED_KEY) {
        this.loadFromStorage();
        this.emit();
      }
    });
  }

  private loadFromStorage() {
    const rawTabs = readJson<DailyTabJson[]>(TABS_KEY, []);
    const rawRecycled = readJson<RecycledTabJson[]>(RECYCLED_KEY, []);
    this.tabs = new Map(rawTabs.map((json) => {
      const tab = tabFromJson(json);
      return [tab.id, tab];
    }));
    this.recycled = new Map(rawRecycled.map((json) => {
      const item = recycledFromJson(json);
      return [item.id, item];
    }));
    this.rebuildSnapshot();
  }

  private persist() {
    writeJson(TABS_KEY, [...this.tabs.values()].map(tabToJson));
    writeJson(RECYCLED_KEY, [...this.recycled.values()].map(recycledToJson));
  }

  private rebuildSnapshot() {
    const now = new Date();
    this.snapshot = {
      hydrated: true,
      tabs: [...this.tabs.values()].sort(compareDateDesc),
      recycled: [...this.recycled.values()]
        .filter((r) => addDays(r.deletedAt, RECYCLE_RETENTION_DAYS) > now)
        .sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime()),
    };
  }

  private commit() {
    this.persist();
    this.rebuildSnapshot();
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }

  getTab(id: string): DailyTab | undefined {
    this.ensureHydrated();
    return this.tabs.get(id);
  }

  get hasAnyTabs(): boolean {
    this.ensureHydrated();
    return this.tabs.size > 0;
  }

  tabsForDate(date: Date): DailyTab[] {
    this.ensureHydrated();
    const key = dateKey(date);
    return [...this.tabs.values()]
      .filter((tab) => dateKey(tab.date) === key)
      .sort((a, b) => a.slot - b.slot);
  }

  createTabForDate(date: Date): DailyTab {
    const existing = this.tabsForDate(date);
    if (existing.length > 0) return existing[existing.length - 1];
    const tab = createTab(date, 1);
    this.tabs.set(tab.id, tab);
    this.commit();
    return tab;
  }

  /** Always creates another tab for `date`, numbering 1, 2, 3… */
  createAdditionalTabForDate(date: Date): DailyTab {
    const existing = this.tabsForDate(date);
    if (existing.length === 0) return this.createTabForDate(date);

    const first = existing[0];
    if (existing.length === 1 && first.slot !== 1) {
      this.tabs.set(first.id, { ...first, slot: 1 });
    }
    const nextSlot = Math.max(...existing.map((t) => t.slot)) + 1;
    const tab = createTab(date, nextSlot);
    this.tabs.set(tab.id, tab);
    this.commit();
    return tab;
  }

  /** Returns the saved tab (its title may have been made unique). */
  updateTab(
    tabId: string,
    changes: { notesText: string; entries: ExpenseEntry[]; customTitle?: string },
  ): DailyTab | undefined {
    const existing = this.getTab(tabId);
    if (!existing) return undefined;
    const customTitle = this.ensureUniqueTitle(
      changes.customTitle ?? existing.customTitle,
      tabId,
    );
    const updated: DailyTab = {
      ...existing,
      notesText: changes.notesText,
      entries: changes.entries,
      customTitle,
      updatedAt: new Date(),
    };
    this.tabs.set(tabId, updated);
    this.commit();
    return updated;
  }

  /** Moves the tab into the recycle bin. */
  deleteTab(id: string) {
    const existing = this.getTab(id);
    if (!existing) return;
    this.recycled.set(id, { id, tab: existing, deletedAt: new Date() });
    this.tabs.delete(id);
    this.commit();
  }

  permanentlyDeleteRecycled(id: string) {
    this.ensureHydrated();
    if (!this.recycled.delete(id)) return;
    this.commit();
  }

  restoreRecycled(id: string): DailyTab | undefined {
    this.ensureHydrated();
    const item = this.recycled.get(id);
    if (!item) return undefined;
    const title = item.tab.customTitle.trim();
    const restored: DailyTab = {
      ...item.tab,
      customTitle: title ? this.ensureUniqueTitle(`${title} (restored)`) : "",
    };
    this.tabs.set(restored.id, restored);
    this.recycled.delete(id);
    this.commit();
    return restored;
  }

  private purgeExpiredRecycled() {
    const now = new Date();
    let changed = false;
    for (const [id, item] of this.recycled) {
      if (addDays(item.deletedAt, RECYCLE_RETENTION_DAYS) <= now) {
        this.recycled.delete(id);
        changed = true;
      }
    }
    if (changed) this.commit();
  }

  /** Case-insensitive unique title; duplicates become `Title (2)`, `Title (3)`… */
  ensureUniqueTitle(requested: string, excludeTabId?: string): string {
    this.ensureHydrated();
    const base = requested.trim();
    if (!base) return "";
    const taken = new Set(
      [...this.tabs.values()]
        .filter((t) => t.id !== excludeTabId)
        .map((t) => t.customTitle.trim().toLowerCase())
        .filter(Boolean),
    );
    if (!taken.has(base.toLowerCase())) return base;
    for (let i = 2; ; i++) {
      const candidate = `${base} (${i})`;
      if (!taken.has(candidate.toLowerCase())) return candidate;
    }
  }

  exportBackup(): BackupSnapshot {
    this.ensureHydrated();
    return {
      version: 1,
      exportedAt: toLocalIso(new Date()),
      tabs: [...this.tabs.values()].sort(compareDateDesc).map(tabToJson),
    };
  }

  /** Exact restore — clears local tabs and writes the cloud snapshot as-is. */
  replaceAllFromBackup(backup: BackupSnapshot) {
    this.ensureHydrated();
    const cloudTabs = (backup.tabs ?? []).map(tabFromJson);
    this.tabs = new Map(cloudTabs.map((t) => [t.id, t]));
    this.commit();
  }

  /** Merge cloud tabs with local by id, keeping whichever version is richer. */
  mergeFromBackup(backup: BackupSnapshot): number {
    this.ensureHydrated();
    const cloudTabs = (backup.tabs ?? []).map(tabFromJson);
    let changed = 0;
    for (const cloud of cloudTabs) {
      const local = this.tabs.get(cloud.id);
      if (!local) {
        this.tabs.set(cloud.id, cloud);
        changed++;
        continue;
      }
      if (!isRicher(cloud, local)) continue;
      this.tabs.set(local.id, {
        ...local,
        notesText: cloud.notesText,
        entries: cloud.entries,
        slot: cloud.slot,
        customTitle: cloud.customTitle,
        updatedAt: cloud.updatedAt,
        createdAt: cloud.createdAt < local.createdAt ? cloud.createdAt : local.createdAt,
      });
      changed++;
    }
    if (changed > 0) this.commit();
    return changed;
  }
}

function isRicher(a: DailyTab, b: DailyTab): boolean {
  if (a.notesText.length !== b.notesText.length) {
    return a.notesText.length > b.notesText.length;
  }
  if (a.entries.length !== b.entries.length) {
    return a.entries.length > b.entries.length;
  }
  return tabTotal(a) > tabTotal(b);
}

export function tabsForSelection(
  tabs: DailyTab[],
  start: Date,
  end: Date,
  selectedDays?: Date[],
): DailyTab[] {
  if (selectedDays && selectedDays.length > 0) {
    const keys = new Set(selectedDays.map(dateKey));
    return tabs.filter((tab) => keys.has(dateKey(tab.date)));
  }
  const from = startOfDay(start).getTime();
  const to = startOfDay(end).getTime();
  return tabs.filter((tab) => {
    const d = startOfDay(tab.date).getTime();
    return d >= from && d <= to;
  });
}

export const tabStore = new TabStore();
