"use client";

import { Bus, ChevronDown, Coffee, Utensils, Wallet } from "lucide-react";
import { formatTakaExact } from "@/shared/lib/money";
import type { ExpenseEntry } from "../types";

export function CategoryIcon({ category, className = "size-5" }: { category: string | null; className?: string }) {
  switch (category) {
    case "transport":
      return <Bus className={className} />;
    case "food":
      return <Utensils className={className} />;
    case "snacks":
      return <Coffee className={className} />;
    default:
      return <Wallet className={className} />;
  }
}

export function EntryList({ entries }: { entries: ExpenseEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-2 text-sm text-muted">No parsed expenses yet. Try: bus vara 20 tk</p>;
  }
  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center gap-3 rounded-xl border border-line/40 bg-surface p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary-soft text-primary">
            <CategoryIcon category={e.category} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{e.cleanedItem}</span>
            <span className="block font-mono text-[11px] uppercase tracking-wider text-muted">
              {e.category ?? "other"}
            </span>
            <span className="block truncate text-sm italic text-muted">{e.rawText}</span>
          </span>
          <span className="shrink-0 font-semibold">{formatTakaExact(e.amount)}</span>
        </li>
      ))}
    </ul>
  );
}

interface SpendingSummaryProps {
  total: number;
  entries: ExpenseEntry[];
  label: string;
  expanded: boolean;
  onToggle: () => void;
}

/** Phone bottom bar: tap the total to reveal parsed expenses. */
export function SpendingSummaryBar({ total, entries, label, expanded, onToggle }: SpendingSummaryProps) {
  return (
    <div className="pb-safe rounded-t-2xl border-t border-line/40 bg-surface shadow-[0_-8px_24px_rgb(0_0_0/0.06)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-4"
      >
        <span className="flex-1 text-left font-display text-lg font-semibold">{label}</span>
        <span className="font-display text-lg font-bold text-primary">{formatTakaExact(total)}</span>
        <ChevronDown className={`size-5 text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="scrollbar-thin max-h-[40dvh] overflow-y-auto px-4 pb-4">
          <EntryList entries={entries} />
        </div>
      )}
    </div>
  );
}

/** Desktop side panel: always expanded. */
export function SpendingSummaryPanel({ total, entries, label }: Omit<SpendingSummaryProps, "expanded" | "onToggle">) {
  return (
    <div className="flex max-h-full flex-col rounded-2xl border border-line/50 bg-surface-low shadow-card">
      <div className="border-b border-line/40 p-5">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold text-primary">{formatTakaExact(total)}</p>
        <p className="mt-1 text-sm text-muted">
          {entries.length} expense{entries.length === 1 ? "" : "s"} parsed
        </p>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
        <EntryList entries={entries} />
      </div>
    </div>
  );
}
