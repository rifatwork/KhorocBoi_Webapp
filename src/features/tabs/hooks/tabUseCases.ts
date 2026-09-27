import { syncController } from "@/features/cloud-sync/hooks/syncController";
import { parseNotes, parseNotesSync } from "@/features/parser/services/expenseParser";
import type { ParsedExpense } from "@/features/parser/types";
import { newId } from "@/shared/lib/id";
import { tabStore } from "../services/tabStore";
import type { DailyTab, ExpenseEntry } from "../types";

let enrichEpoch = 0;

const toEntries = (parsed: ParsedExpense[]): ExpenseEntry[] =>
  parsed.map((p) => ({
    id: newId(),
    rawText: p.originalText,
    cleanedItem: p.item,
    amount: p.amount,
    category: p.category,
    timestamp: p.timestamp,
  }));

export const todayTabs = () => tabStore.tabsForDate(new Date());

export function createToday(): DailyTab {
  const tab = tabStore.createTabForDate(new Date());
  syncController.scheduleUpload();
  return tab;
}

export function createAnotherToday(): DailyTab {
  const tab = tabStore.createAdditionalTabForDate(new Date());
  syncController.scheduleUpload();
  return tab;
}

export function deleteTab(tabId: string) {
  tabStore.deleteTab(tabId);
  syncController.scheduleUpload();
}

export function restoreTab(tabId: string): DailyTab | undefined {
  const restored = tabStore.restoreRecycled(tabId);
  syncController.scheduleUpload();
  return restored;
}

export function permanentlyDeleteTab(tabId: string) {
  tabStore.permanentlyDeleteRecycled(tabId);
}

/** Renames without re-parsing. Returns the title actually saved (made unique). */
export function saveTabTitle(tabId: string, customTitle: string): string {
  const existing = tabStore.getTab(tabId);
  if (!existing) return customTitle.trim();
  const resolved = tabStore.ensureUniqueTitle(customTitle, tabId);
  if (existing.customTitle === resolved) return resolved;
  tabStore.updateTab(tabId, {
    notesText: existing.notesText,
    entries: existing.entries,
    customTitle: resolved,
  });
  syncController.scheduleUpload();
  return resolved;
}

/** Instant dictionary-only save, then AI enrichment of unknown words in the background. */
export function autoSaveTab(tabId: string, notesText: string, customTitle?: string) {
  const existing = tabStore.getTab(tabId);
  if (!existing) return;
  const title = customTitle ?? existing.customTitle;
  if (existing.notesText === notesText && existing.customTitle === title) return;

  tabStore.updateTab(tabId, {
    notesText,
    entries: toEntries(parseNotesSync(notesText)),
    customTitle,
  });
  syncController.scheduleUpload();
  void enrichInBackground(tabId, notesText, customTitle);
}

async function enrichInBackground(tabId: string, notesText: string, customTitle?: string) {
  const epoch = ++enrichEpoch;
  try {
    const enriched = await parseNotes(notesText);
    if (epoch !== enrichEpoch) return;
    const current = tabStore.getTab(tabId);
    if (!current || current.notesText !== notesText) return;
    const changed = enriched.some((p, i) => p.item !== current.entries[i]?.cleanedItem);
    if (!changed) return;
    tabStore.updateTab(tabId, { notesText, entries: toEntries(enriched), customTitle });
    syncController.scheduleUpload();
  } catch (error) {
    console.error("Background AI enrichment failed", error);
  }
}
