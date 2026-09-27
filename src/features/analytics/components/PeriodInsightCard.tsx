"use client";

import { LineChart, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { monthName } from "@/shared/lib/dates";
import { formatTaka } from "@/shared/lib/money";
import { usePeriodInsight } from "../hooks/useAnalytics";

interface PeriodInsightCardProps {
  year: number;
  /** 1-12; omit for a whole-year insight. */
  month?: number;
}

function Stat({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <span className="block rounded-2xl bg-[#0050cb]/35 px-3 py-2">
      <span className="block font-mono text-[10px] uppercase tracking-widest opacity-75">{label}</span>
      <span className={`block truncate font-semibold ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </span>
  );
}

export function PeriodInsightCard({ year, month }: PeriodInsightCardProps) {
  const insight = usePeriodInsight(year, month);
  const periodLabel = month ? `${monthName(month - 1)} ${year}` : String(year);
  const previousLabel = month ? "last month" : "last year";
  const href = month ? `/analytics?year=${year}&month=${month}` : `/analytics?year=${year}`;

  const change =
    insight.previousTotal > 0 ? (insight.total - insight.previousTotal) / insight.previousTotal : null;
  const ChangeIcon = change !== null && change < 0 ? TrendingDown : TrendingUp;

  return (
    <Link
      href={href}
      className="relative mb-6 block overflow-hidden rounded-3xl border-t-4 border-primary bg-primary-strong p-6 text-on-primary shadow-card transition hover:shadow-float sm:p-8"
    >
      <span className="absolute -right-10 -top-10 size-40 rounded-full bg-[#0050cb]/40" />
      <span className="absolute -bottom-10 -left-10 size-32 rounded-full bg-[#3b6566]/30" />
      <span className="relative flex items-start justify-between gap-4">
        <span>
          <span className="block font-mono text-xs uppercase tracking-widest opacity-80">
            {month ? "Monthly insights" : "Yearly insights"}
          </span>
          <span className="mt-1 block font-display text-2xl font-semibold">Total Spent in {periodLabel}</span>
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#0050cb]/40">
          <LineChart className="size-5" />
        </span>
      </span>

      <span className="relative mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
        <span className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{formatTaka(insight.total)}</span>
        {change !== null && (
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-[#0050cb]/40 px-3 py-1 text-sm">
            <ChangeIcon className="size-4" />
            {Math.abs(Math.round(change * 100))}% {change < 0 ? "less" : "more"} than {previousLabel}
          </span>
        )}
      </span>

      <span className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Tabs" value={`${insight.tabCount} · ${insight.itemCount} items`} />
        <Stat label="Active days" value={String(insight.activeDays)} />
        <Stat label="Avg / day" value={formatTaka(insight.averagePerDay)} />
        <Stat
          label="Top category"
          capitalize
          value={insight.topCategory ? `${insight.topCategory.category} · ${formatTaka(insight.topCategory.total)}` : "—"}
        />
      </span>

      <span className="relative mt-4 block text-sm opacity-85">Tap for full analytics →</span>
    </Link>
  );
}
