"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { isSameDay } from "@/shared/lib/dates";
import type { DailyTab } from "../types";
import { createAnotherToday, createToday } from "./tabUseCases";
import { useTabStore } from "./useTabs";

/** Same flow as the mobile FAB: first tab of the day, or New / Existing. */
export function useNewTabFlow() {
  const router = useRouter();
  const { tabs } = useTabStore();

  const todayTabs = useMemo(() => {
    const now = new Date();
    return tabs.filter((t) => isSameDay(t.date, now)).sort((a, b) => a.slot - b.slot);
  }, [tabs]);

  const open = (tab: DailyTab) => router.push(`/tab/${tab.id}`);

  return {
    todayTabs,
    hasToday: todayTabs.length > 0,
    openTab: open,
    createFirstToday: () => open(createToday()),
    createNewToday: () => open(createAnotherToday()),
  };
}
