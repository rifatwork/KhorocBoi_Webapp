import { formatDate, parseIso, startOfDay, toLocalIso } from "@/shared/lib/dates";
import { newId } from "@/shared/lib/id";
import type {
  DailyTab,
  DailyTabJson,
  ExpenseEntry,
  ExpenseEntryJson,
  RecycledTab,
  RecycledTabJson,
} from "../types";

export const tabTotal = (tab: DailyTab) =>
  tab.entries.reduce((sum, e) => sum + e.amount, 0);

export const hasCustomTitle = (tab: DailyTab) => tab.customTitle.trim().length > 0;

export const tabLabel = (tab: DailyTab) => `Tab ${tab.slot}`;

const isNumbered = (tab: DailyTab, sameDayCount: number) =>
  sameDayCount > 1 || tab.slot > 1;

/** Date, plus `Tab 1` / `Tab 2` when there are multiple tabs that day. */
export function displayTitle(
  tab: DailyTab,
  sameDayCount = 1,
  pattern = "MMMM d, yyyy",
): string {
  const base = formatDate(tab.date, pattern);
  return isNumbered(tab, sameDayCount) ? `${base} ${tabLabel(tab)}` : base;
}

export function headline(
  tab: DailyTab,
  sameDayCount = 1,
  pattern = "MMMM d, yyyy",
): string {
  return hasCustomTitle(tab)
    ? tab.customTitle.trim()
    : displayTitle(tab, sameDayCount, pattern);
}

export const updatedAtLabel = (tab: DailyTab) =>
  `Updated at: ${formatDate(tab.updatedAt, "d MMM. h:mm a")}`;

export function createTab(date: Date, slot: number): DailyTab {
  const now = new Date();
  return {
    id: newId(),
    date: startOfDay(date),
    entries: [],
    notesText: "",
    slot,
    customTitle: "",
    updatedAt: now,
    createdAt: now,
  };
}

/** Newest created first; same-day ties prefer higher slot. */
export function compareCreatedDesc(a: DailyTab, b: DailyTab): number {
  const byCreated = b.createdAt.getTime() - a.createdAt.getTime();
  if (byCreated !== 0) return byCreated;
  const bySlot = b.slot - a.slot;
  if (bySlot !== 0) return bySlot;
  return b.id.localeCompare(a.id);
}

/** Newest calendar day first, then higher slot. */
export function compareDateDesc(a: DailyTab, b: DailyTab): number {
  const byDate = startOfDay(b.date).getTime() - startOfDay(a.date).getTime();
  if (byDate !== 0) return byDate;
  return b.slot - a.slot;
}

export function entryToJson(e: ExpenseEntry): ExpenseEntryJson {
  return {
    id: e.id,
    rawText: e.rawText,
    cleanedItem: e.cleanedItem,
    amount: e.amount,
    category: e.category,
    timestamp: toLocalIso(e.timestamp),
  };
}

export function entryFromJson(json: ExpenseEntryJson): ExpenseEntry {
  return {
    id: json.id ?? newId(),
    rawText: json.rawText,
    cleanedItem: json.cleanedItem,
    amount: Number(json.amount),
    category: json.category ?? null,
    timestamp: parseIso(json.timestamp),
  };
}

export function tabToJson(tab: DailyTab): DailyTabJson {
  return {
    id: tab.id,
    date: toLocalIso(tab.date),
    entries: tab.entries.map(entryToJson),
    notesText: tab.notesText,
    slot: tab.slot,
    customTitle: tab.customTitle,
    updatedAt: toLocalIso(tab.updatedAt),
    createdAt: toLocalIso(tab.createdAt),
  };
}

export function tabFromJson(json: DailyTabJson): DailyTab {
  const entries = (json.entries ?? []).map(entryFromJson);
  const date = parseIso(json.date);
  const updatedAt = json.updatedAt ? parseIso(json.updatedAt) : inferUpdatedAt(entries, date);
  return {
    id: json.id ?? newId(),
    date,
    entries,
    notesText: json.notesText ?? "",
    slot: typeof json.slot === "number" ? json.slot : 1,
    customTitle: json.customTitle ?? "",
    updatedAt,
    createdAt: json.createdAt ? parseIso(json.createdAt) : inferCreatedAt(date, updatedAt),
  };
}

export const recycledToJson = (r: RecycledTab): RecycledTabJson => ({
  id: r.id,
  tab: tabToJson(r.tab),
  deletedAt: toLocalIso(r.deletedAt),
});

export const recycledFromJson = (json: RecycledTabJson): RecycledTab => ({
  id: json.id,
  tab: tabFromJson(json.tab),
  deletedAt: parseIso(json.deletedAt),
});

/** Legacy tabs without `createdAt`: prefer the expense date, else updatedAt. */
function inferCreatedAt(date: Date, updatedAt: Date): Date {
  const day = startOfDay(date);
  return day < updatedAt ? day : updatedAt;
}

/** Best-effort last-modified for tabs saved before `updatedAt` existed. */
function inferUpdatedAt(entries: ExpenseEntry[], date: Date): Date {
  if (entries.length === 0) return date;
  return entries
    .map((e) => e.timestamp)
    .reduce((a, b) => (a > b ? a : b));
}
