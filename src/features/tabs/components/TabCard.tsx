"use client";

import { CalendarCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatTaka } from "@/shared/lib/money";
import { displayTitle, hasCustomTitle, headline, tabTotal, updatedAtLabel } from "../services/tabModel";
import type { DailyTab } from "../types";

interface TabCardProps {
  tab: DailyTab;
  sameDayCount: number;
  onDelete?: () => void;
}

export function TabCard({ tab, sameDayCount, onDelete }: TabCardProps) {
  return (
    <div className="group relative rounded-2xl border border-line/50 bg-surface shadow-card transition hover:-translate-y-0.5 hover:border-primary-strong/40 hover:shadow-float">
      <Link href={`/tab/${tab.id}`} className="flex items-start gap-4 p-4 pr-14 sm:p-5 sm:pr-14">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary-soft/60 text-primary">
          <CalendarCheck className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate font-semibold">{headline(tab, sameDayCount)}</span>
              {hasCustomTitle(tab) && (
                <span className="block truncate text-xs font-medium text-muted">
                  {displayTitle(tab, sameDayCount)}
                </span>
              )}
            </span>
            <span className="shrink-0 font-display text-lg font-semibold">{formatTaka(tabTotal(tab))}</span>
          </span>
          <span className="mt-1 block text-xs text-muted">
            {updatedAtLabel(tab)} · {tab.entries.length} item{tab.entries.length === 1 ? "" : "s"}
          </span>
        </span>
      </Link>
      {onDelete && (
        <button
          type="button"
          title="Delete"
          aria-label={`Delete ${headline(tab, sameDayCount)}`}
          onClick={onDelete}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-danger/80 transition hover:bg-danger/10 sm:top-4"
        >
          <Trash2 className="size-[18px]" />
        </button>
      )}
    </div>
  );
}
