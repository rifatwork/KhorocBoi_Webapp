"use client";

import { PeriodInsightCard } from "@/features/analytics/components/PeriodInsightCard";
import { PageBody, PageHeader } from "@/features/shell/components/PageHeader";
import { monthName } from "@/shared/lib/dates";
import { findMonthArchive, useDashboardArchive } from "../hooks/useDashboardArchive";
import { useDeleteTab } from "../hooks/useDeleteTab";
import { useSameDayCounter, useTabStore } from "../hooks/useTabs";
import { headline } from "../services/tabModel";
import { FolderTile } from "./FolderTile";
import { TabCard } from "./TabCard";

function EmptyMessage({ children }: { children: string }) {
  return <p className="py-16 text-center text-muted">{children}</p>;
}

export function YearArchiveView({ year }: { year: number }) {
  const { hydrated, tabs } = useTabStore();
  const archive = useDashboardArchive(tabs);
  const months = archive.pastYears.find((y) => y.year === year)?.months ?? [];

  return (
    <>
      <PageHeader title={String(year)} backHref="/" />
      <PageBody>
        <PeriodInsightCard year={year} />
        {hydrated && months.length === 0 ? (
          <EmptyMessage>{`No archived tabs for ${year}`}</EmptyMessage>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {months.map((m) => (
              <FolderTile
                key={m.month}
                href={`/archive/${m.year}/${m.month}`}
                title={`${monthName(m.month - 1)} ${m.year}`}
                subtitle={`${m.tabs.length} tab${m.tabs.length === 1 ? "" : "s"}`}
              />
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}

export function MonthArchiveView({ year, month }: { year: number; month: number }) {
  const { hydrated, tabs } = useTabStore();
  const archive = useDashboardArchive(tabs);
  const sameDayCount = useSameDayCounter(tabs);
  const deleteTab = useDeleteTab();
  const monthTabs = findMonthArchive(archive, year, month)?.tabs ?? [];
  const title = `${monthName(month - 1)} ${year}`;
  const isPastYear = year !== new Date().getFullYear();

  return (
    <>
      <PageHeader title={title} backHref={isPastYear ? `/archive/${year}` : "/"} />
      <PageBody>
        <PeriodInsightCard year={year} month={month} />
        {hydrated && monthTabs.length === 0 ? (
          <EmptyMessage>{`No archived tabs in ${title}`}</EmptyMessage>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {monthTabs.map((tab) => {
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
        )}
      </PageBody>
    </>
  );
}
