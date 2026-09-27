"use client";

import { useMemo, useSyncExternalStore } from "react";
import { tabTotal } from "@/features/tabs/services/tabModel";
import { tabsForSelection } from "@/features/tabs/services/tabStore";
import { useTabStore } from "@/features/tabs/hooks/useTabs";
import { CATEGORIES, type DailyTab } from "@/features/tabs/types";
import { dateKey, parseIso, startOfDay } from "@/shared/lib/dates";
import { thisMonthRange, type CategoryTotal, type DailyTotal, type DateRange } from "../types";

/** Selected range survives navigation within the session. */
let currentRange: DateRange = thisMonthRange();
const listeners = new Set<() => void>();

function setRange(range: DateRange) {
  currentRange = range;
  for (const l of listeners) l();
}

function useRange() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => currentRange,
    () => currentRange,
  );
}

export interface AnalyticsResult {
  range: DateRange;
  setRange: (range: DateRange) => void;
  hydrated: boolean;
  tabs: DailyTab[];
  total: number;
  daily: DailyTotal[];
  highestDay: { day: Date; total: number; tab: DailyTab; dayTabs: DailyTab[] } | null;
  categories: CategoryTotal[];
}

export function useAnalytics(): AnalyticsResult {
  const range = useRange();
  const { hydrated, tabs: allTabs } = useTabStore();

  return useMemo(() => {
    const tabs = tabsForSelection(allTabs, range.start, range.end, range.selectedDays);
    const total = tabs.reduce((sum, t) => sum + tabTotal(t), 0);

    const byDay = new Map<string, number>();
    for (const tab of tabs) {
      const key = dateKey(tab.date);
      byDay.set(key, (byDay.get(key) ?? 0) + tabTotal(tab));
    }
    const daily = [...byDay.entries()]
      .map(([key, value]) => ({ day: parseIso(key), total: value }))
      .sort((a, b) => a.day.getTime() - b.day.getTime());

    let highestDay: AnalyticsResult["highestDay"] = null;
    if (daily.length > 0) {
      const best = daily.reduce((a, b) => (a.total >= b.total ? a : b));
      const bestKey = dateKey(best.day);
      const dayTabs = tabs.filter((t) => dateKey(t.date) === bestKey);
      const tab = dayTabs.reduce((a, b) => (tabTotal(a) >= tabTotal(b) ? a : b));
      highestDay = { day: startOfDay(best.day), total: best.total, tab, dayTabs };
    }

    const sums = new Map<string, number>(CATEGORIES.map((c) => [c, 0]));
    for (const tab of tabs) {
      for (const e of tab.entries) {
        const cat = e.category ?? "other";
        sums.set(cat, (sums.get(cat) ?? 0) + e.amount);
      }
    }
    const categories = [...sums.entries()].map(([category, value]) => ({
      category,
      total: value,
      share: total === 0 ? 0 : value / total,
    }));

    return { range, setRange, hydrated, tabs, total, daily, highestDay, categories };
  }, [allTabs, range, hydrated]);
}

export function useMonthTotal() {
  const { tabs } = useTabStore();
  return useMemo(() => {
    const now = new Date();
    return tabs
      .filter((t) => t.date.getFullYear() === now.getFullYear() && t.date.getMonth() === now.getMonth())
      .reduce((sum, t) => sum + tabTotal(t), 0);
  }, [tabs]);
}
