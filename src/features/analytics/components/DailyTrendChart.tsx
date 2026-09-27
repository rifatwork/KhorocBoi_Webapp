"use client";

import { formatDate } from "@/shared/lib/dates";
import { formatCompact, formatTaka } from "@/shared/lib/money";
import type { DailyTotal } from "../types";

/** Bar chart of spending per day; scrolls horizontally when there are many days. */
export function DailyTrendChart({ daily }: { daily: DailyTotal[] }) {
  if (daily.length === 0) {
    return <div className="grid h-60 place-items-center text-sm text-muted">No data in this range</div>;
  }

  const max = Math.max(...daily.map((d) => d.total), 1) * 1.15;
  const ticks = [max, max / 2, 0];
  const labelEvery = daily.length > 10 ? 3 : 1;

  return (
    <div className="flex h-64 gap-2">
      <div className="flex w-10 shrink-0 flex-col justify-between pb-6 text-right font-mono text-[10px] text-muted">
        {ticks.map((t, i) => <span key={i}>{formatCompact(t)}</span>)}
      </div>
      <div className="scrollbar-thin min-w-0 flex-1 overflow-x-auto">
        <div className="flex h-full gap-1" style={{ minWidth: `${Math.max(daily.length * 18, 100)}px` }}>
          {daily.map((d, i) => {
            const pct = (d.total / max) * 100;
            return (
              <div key={d.day.getTime()} className="group flex h-full min-w-3 flex-1 flex-col">
                <div className="relative flex-1 border-b border-line/60">
                  <div
                    className="absolute inset-x-0 bottom-0 mx-auto max-w-7 rounded-t-md bg-primary-strong transition group-hover:brightness-125"
                    style={{ height: `${pct}%` }}
                  />
                  <span
                    className="pointer-events-none absolute left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#2d3133] px-2 py-1 text-xs text-white group-hover:block"
                    style={{ bottom: `${pct}%` }}
                  >
                    {formatDate(d.day, "d MMM")}: {formatTaka(d.total)}
                  </span>
                </div>
                <span className="h-6 pt-1 text-center font-mono text-[10px] text-muted">
                  {i % labelEvery === 0 ? formatDate(d.day, "d/M") : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
