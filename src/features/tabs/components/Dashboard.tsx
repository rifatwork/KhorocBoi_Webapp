"use client";

import { Plus } from "lucide-react";
import { MonthlyInsightCard } from "@/features/analytics/components/MonthlyInsightCard";
import { PageBody, PageHeader } from "@/features/shell/components/PageHeader";
import { Logo } from "@/shared/components/Logo";
import { monthName } from "@/shared/lib/dates";
import { useDashboardArchive } from "../hooks/useDashboardArchive";
import { useDeleteTab } from "../hooks/useDeleteTab";
import { useNewTabFlow } from "../hooks/useNewTabFlow";
import { useSameDayCounter, useTabStore } from "../hooks/useTabs";
import { headline } from "../services/tabModel";
import { FolderTile } from "./FolderTile";
import { NewTabFab } from "./NewTabFab";
import { TabCard } from "./TabCard";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function Dashboard() {
  const { hydrated, tabs } = useTabStore();
  const archive = useDashboardArchive(tabs);
  const sameDayCount = useSameDayCounter(tabs);
  const deleteTab = useDeleteTab();
  const { createFirstToday } = useNewTabFlow();

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-2.5 lg:hidden">
          <Logo size={30} />
          <span className="font-display text-xl font-bold text-primary">KhorocBoi</span>
        </div>
        <h1 className="hidden font-display text-2xl font-bold text-primary lg:block">Dashboard</h1>
      </PageHeader>

      <PageBody>
        <MonthlyInsightCard />

        {!hydrated ? (
          <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-container" />
            ))}
          </div>
        ) : tabs.length === 0 ? (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <Logo size={96} />
            <h2 className="mt-6 font-display text-2xl font-semibold">Ready to track your first expense?</h2>
            <p className="mt-2 text-muted">
              Start building your financial workspace by adding your daily spending.
            </p>
            <button
              type="button"
              onClick={createFirstToday}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-strong px-7 py-3.5 font-semibold text-on-primary shadow-card transition hover:brightness-110"
            >
              <Plus className="size-5" /> Create New Tab
            </button>
          </div>
        ) : (
          <>
            <h2 className="mb-3 mt-8 font-display text-xl font-semibold">Recent History</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {archive.recentTabs.map((tab) => {
                const count = sameDayCount(tab);
                return (
                  <TabCard
                    key={tab.id}
                    tab={tab}
                    sameDayCount={count}
                    onDelete={() => deleteTab(tab.id, headline(tab, count))}
                  />
                );
              })}
            </div>

            {(archive.currentYearMonths.length > 0 || archive.pastYears.length > 0) && (
              <>
                <h2 className="mb-3 mt-8 font-display text-xl font-semibold">Archive</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {archive.currentYearMonths.map((m) => (
                    <FolderTile
                      key={`${m.year}-${m.month}`}
                      href={`/archive/${m.year}/${m.month}`}
                      title={`${monthName(m.month - 1)} ${m.year}`}
                      subtitle={plural(m.tabs.length, "tab")}
                    />
                  ))}
                  {archive.pastYears.map((y) => (
                    <FolderTile
                      key={y.year}
                      variant="year"
                      href={`/archive/${y.year}`}
                      title={String(y.year)}
                      subtitle={`${plural(y.tabCount, "tab")} · ${plural(y.months.length, "month")}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </PageBody>

      <NewTabFab />
    </>
  );
}
