"use client";

import { useMemo, useSyncExternalStore } from "react";
import { dateKey } from "@/shared/lib/dates";
import { tabStore } from "../services/tabStore";
import type { DailyTab } from "../types";

export function useTabStore() {
  return useSyncExternalStore(
    tabStore.subscribe,
    tabStore.getSnapshot,
    tabStore.getServerSnapshot,
  );
}

export function useTab(tabId: string) {
  const { hydrated, tabs } = useTabStore();
  const tab = useMemo(() => tabs.find((t) => t.id === tabId), [tabs, tabId]);
  return { hydrated, tab };
}

/** How many tabs share each calendar day — drives `Tab 1` / `Tab 2` labels. */
export function useSameDayCounter(tabs: DailyTab[]) {
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const tab of tabs) {
      const key = dateKey(tab.date);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return (tab: DailyTab) => counts.get(dateKey(tab.date)) ?? 1;
  }, [tabs]);
}
