"use client";

import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PageBody, PageHeader } from "@/features/shell/components/PageHeader";
import { CategoryIcon, EntryList } from "@/features/tabs/components/SpendingSummary";
import { Modal } from "@/shared/components/Modal";
import { formatDate } from "@/shared/lib/dates";
import { formatTaka } from "@/shared/lib/money";
import { useAnalytics } from "../hooks/useAnalytics";
import { lastMonthsRange, thisMonthRange, type DateRangePreset } from "../types";
import { CustomDatePicker } from "./CustomDatePicker";
import { DailyTrendChart } from "./DailyTrendChart";

const card = "rounded-3xl border border-line/50 bg-surface p-5 shadow-card sm:p-6";

export function AnalyticsView() {
  const { range, setRange, tabs, total, daily, highestDay, categories } = useAnalytics();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);

  const presets: { label: string; preset: DateRangePreset; onSelect: () => void }[] = [
    { label: "This Month", preset: "thisMonth", onSelect: () => setRange(thisMonthRange()) },
    { label: "Last 3 Months", preset: "last3Months", onSelect: () => setRange(lastMonthsRange(3)) },
    { label: "Last 6 Months", preset: "last6Months", onSelect: () => setRange(lastMonthsRange(6)) },
    { label: "Custom", preset: "custom", onSelect: () => setPickerOpen(true) },
  ];

  const rangeLabel = range.selectedDays?.length
    ? `${range.selectedDays.length} selected day${range.selectedDays.length === 1 ? "" : "s"}`
    : `${formatDate(range.start, "d MMM yyyy")} → ${formatDate(range.end, "d MMM yyyy")}`;

  return (
    <>
      <PageHeader title="Analytics" backHref="/" />
      <PageBody>
        <div className="flex flex-wrap items-center gap-2">
          {presets.map(({ label, preset, onSelect }) => {
            const selected = range.preset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={onSelect}
                aria-pressed={selected}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selected
                    ? "border-primary-strong bg-primary-strong font-semibold text-on-primary"
                    : "border-line bg-surface hover:bg-surface-container"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 font-mono text-xs text-muted">
          {rangeLabel} · {tabs.length} tab{tabs.length === 1 ? "" : "s"}
          {range.preset === "custom" && (
            <button type="button" onClick={() => setPickerOpen(true)} className="ml-3 font-sans font-semibold text-primary hover:underline">
              Change dates
            </button>
          )}
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border-t-4 border-primary bg-primary-strong p-6 text-on-primary shadow-card sm:p-8 lg:col-span-2">
            <p className="font-mono text-xs uppercase tracking-widest opacity-80">Total spending</p>
            <p className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{formatTaka(total)}</p>
            <p className="mt-2 text-sm opacity-85">
              {daily.length} active day{daily.length === 1 ? "" : "s"} · average{" "}
              {formatTaka(daily.length ? total / daily.length : 0)} per day
            </p>
          </div>

          {highestDay ? (
            <button type="button" onClick={() => setDayOpen(true)} className={`${card} flex flex-col text-left transition hover:border-primary-strong/40`}>
              <span className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary-soft text-primary">
                  <TrendingUp className="size-5" />
                </span>
                <span className="font-semibold">Highest Spending Day</span>
              </span>
              <span className="mt-4 text-muted">{formatDate(highestDay.day, "EEEE, MMM d")}</span>
              <span className="font-display text-2xl font-bold text-primary">{formatTaka(highestDay.total)}</span>
              <span className="mt-auto pt-2 text-xs text-muted">Tap to see the expenses</span>
            </button>
          ) : (
            <div className={`${card} grid place-items-center text-sm text-muted`}>No spending in this range</div>
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <section className={`${card} lg:col-span-3`}>
            <h2 className="mb-4 font-display text-xl font-semibold">Daily spending trend</h2>
            <DailyTrendChart daily={daily} />
          </section>

          <section className={`${card} lg:col-span-2`}>
            <h2 className="mb-4 font-display text-xl font-semibold">Category breakdown</h2>
            <ul className="space-y-4">
              {categories.map((c) => (
                <li key={c.category}>
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={c.category} className="size-[18px] text-muted" />
                    <span className="flex-1 capitalize">{c.category}</span>
                    <span className="font-semibold">{formatTaka(c.total)}</span>
                    <span className="w-10 text-right font-mono text-xs text-muted">{Math.round(c.share * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full rounded-full bg-primary-strong transition-all" style={{ width: `${c.share * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PageBody>

      <CustomDatePicker
        open={pickerOpen}
        initial={range.preset === "custom" ? range : undefined}
        onClose={() => setPickerOpen(false)}
        onApply={(r) => {
          setRange(r);
          setPickerOpen(false);
        }}
      />

      {highestDay && (
        <Modal open={dayOpen} onClose={() => setDayOpen(false)} title={formatDate(highestDay.day, "MMMM d, yyyy")} widthClass="sm:max-w-lg">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="font-display text-lg font-semibold">Total</span>
            <span className="font-display text-xl font-bold text-primary">{formatTaka(highestDay.total)}</span>
          </div>
          <EntryList entries={highestDay.dayTabs.flatMap((t) => t.entries)} />
          <Link
            href={`/tab/${highestDay.tab.id}`}
            onClick={() => setDayOpen(false)}
            className="mt-4 block rounded-xl bg-primary-strong px-4 py-3 text-center font-semibold text-on-primary hover:brightness-110"
          >
            Open full day tab
          </Link>
        </Modal>
      )}
    </>
  );
}
