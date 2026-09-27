"use client";

import { useMemo, useSyncExternalStore } from "react";
import { tabTotal } from "@/features/tabs/services/tabModel";
import { tabsForSelection } from "@/features/tabs/services/tabStore";
import { useTabStore } from "@/features/tabs/hooks/useTabs";
import { CATEGORIES, type DailyTab } from "@/features/tabs/types";
import { dateKey, parseIso, startOfDay } from "@/shared/lib/dates";
import {
  monthRange,
  thisMonthRange,
  yearRange,
  type CategoryTotal,
  type DailyTotal,
  type DateRange,
} from "../types";

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

export interface PeriodInsight {
  total: number;
  tabCount: number;
  itemCount: number;
  activeDays: number;
  averagePerDay: number;
  topCategory: { category: string; total: number } | null;
  previousTotal: number;
}

function sumTabs(tabs: DailyTab[]) {
  return tabs.reduce((sum, t) => sum + tabTotal(t), 0);
}

/** Spending for a whole month (`month` 1-12) or, when `month` is omitted, a whole year. */
export function usePeriodInsight(year: number, month?: number): PeriodInsight {
  const { tabs: allTabs } = useTabStore();

  return useMemo(() => {
    const range = month ? monthRange(year, month) : yearRange(year);
    const previous = month
      ? monthRange(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1)
      : yearRange(year - 1);
    const tabs = tabsForSelection(allTabs, range.start, range.end);
    const total = sumTabs(tabs);
    const activeDays = new Set(tabs.filter((t) => tabTotal(t) > 0).map((t) => dateKey(t.date))).size;

    const sums = new Map<string, number>();
    for (const tab of tabs) {
      for (const e of tab.entries) {
        const cat = e.category ?? "other";
        sums.set(cat, (sums.get(cat) ?? 0) + e.amount);
      }
    }
    const top = [...sums.entries()].reduce<[string, number] | null>(
      (best, cur) => (best === null || cur[1] > best[1] ? cur : best),
      null,
    );

    return {
      total,
      tabCount: tabs.length,
      itemCount: tabs.reduce((sum, t) => sum + t.entries.length, 0),
      activeDays,
      averagePerDay: activeDays ? total / activeDays : 0,
      topCategory: top && top[1] > 0 ? { category: top[0], total: top[1] } : null,
      previousTotal: sumTabs(tabsForSelection(allTabs, previous.start, previous.end)),
    };
  }, [allTabs, year, month]);
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
