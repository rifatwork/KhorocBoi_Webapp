"use client";

import { useMemo } from "react";
import { compareCreatedDesc } from "../services/tabModel";
import type { DailyTab } from "../types";

/** How many newest tabs stay on the home dashboard. */
export const DASHBOARD_RECENT_LIMIT = 5;

export interface MonthArchive {
  year: number;
  month: number; // 1-12
  tabs: DailyTab[];
}

export interface YearArchive {
  year: number;
  months: MonthArchive[];
  tabCount: number;
}

export interface DashboardArchive {
  recentTabs: DailyTab[];
  currentYearMonths: MonthArchive[];
  pastYears: YearArchive[];
}

/** Latest tabs plus month folders (this year) and year folders (older), by creation date. */
export function buildDashboardArchive(tabs: DailyTab[], now = new Date()): DashboardArchive {
  const sorted = [...tabs].sort(compareCreatedDesc);
  const recentTabs = sorted.slice(0, DASHBOARD_RECENT_LIMIT);
  const archived = sorted.slice(DASHBOARD_RECENT_LIMIT);

  const byMonth = new Map<string, DailyTab[]>();
  for (const tab of archived) {
    const key = `${tab.createdAt.getFullYear()}-${String(tab.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const list = byMonth.get(key) ?? [];
    list.push(tab);
    byMonth.set(key, list);
  }

  const currentYearMonths: MonthArchive[] = [];
  const pastByYear = new Map<number, MonthArchive[]>();
  for (const key of [...byMonth.keys()].sort().reverse()) {
    const [year, month] = key.split("-").map(Number);
    const bucket: MonthArchive = { year, month, tabs: byMonth.get(key)!.sort(compareCreatedDesc) };
    if (year === now.getFullYear()) currentYearMonths.push(bucket);
    else pastByYear.set(year, [...(pastByYear.get(year) ?? []), bucket]);
  }

  const pastYears = [...pastByYear.entries()]
    .map(([year, months]) => ({
      year,
      months,
      tabCount: months.reduce((sum, m) => sum + m.tabs.length, 0),
    }))
    .sort((a, b) => b.year - a.year);

  return { recentTabs, currentYearMonths, pastYears };
}

export function useDashboardArchive(tabs: DailyTab[]) {
  return useMemo(() => buildDashboardArchive(tabs), [tabs]);
}

export function findMonthArchive(archive: DashboardArchive, year: number, month: number) {
  const inCurrent = archive.currentYearMonths.find((m) => m.year === year && m.month === month);
  if (inCurrent) return inCurrent;
  return archive.pastYears
    .find((y) => y.year === year)
    ?.months.find((m) => m.month === month);
}
