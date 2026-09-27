"use client";

import { LineChart } from "lucide-react";
import Link from "next/link";
import { formatTaka } from "@/shared/lib/money";
import { useMonthTotal } from "../hooks/useAnalytics";

export function MonthlyInsightCard() {
  const monthTotal = useMonthTotal();
  return (
    <Link
      href="/analytics"
      className="relative block overflow-hidden rounded-3xl border-t-4 border-primary bg-primary-strong p-6 text-on-primary shadow-card transition hover:shadow-float sm:p-8"
    >
      <span className="absolute -right-10 -top-10 size-40 rounded-full bg-[#0050cb]/40" />
      <span className="absolute -bottom-10 -left-10 size-32 rounded-full bg-[#3b6566]/30" />
      <span className="relative flex items-start justify-between gap-4">
        <span>
          <span className="block font-mono text-xs uppercase tracking-widest opacity-80">Monthly insights</span>
          <span className="mt-1 block font-display text-2xl font-semibold">Total Spent this Month</span>
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-[#0050cb]/40">
          <LineChart className="size-5" />
        </span>
      </span>
      <span className="relative mt-8 block font-display text-4xl font-bold tracking-tight sm:text-5xl">
        {formatTaka(monthTotal)}
      </span>
      <span className="relative mt-3 block text-sm opacity-85">Tap for full analytics →</span>
    </Link>
  );
}
