"use client";

import { CalendarDays, CloudCog, Home, LineChart, Search, Trash2, Trash } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useCloudSync } from "@/features/cloud-sync/hooks/useCloudSync";
import { useDeleteTab } from "@/features/tabs/hooks/useDeleteTab";
import { useSameDayCounter, useTabStore } from "@/features/tabs/hooks/useTabs";
import {
  displayTitle,
  hasCustomTitle,
  headline,
  tabLabel,
  tabTotal,
} from "@/features/tabs/services/tabModel";
import type { DailyTab } from "@/features/tabs/types";
import { Logo } from "@/shared/components/Logo";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { formatDate } from "@/shared/lib/dates";
import { formatTaka } from "@/shared/lib/money";

function matchesQuery(tab: DailyTab, q: string): boolean {
  return (
    formatDate(tab.date, "yyyy-MM-dd").includes(q) ||
    formatDate(tab.date, "d MMM yyyy").toLowerCase().includes(q) ||
    formatDate(tab.date, "MMMM").toLowerCase().includes(q) ||
    tab.customTitle.toLowerCase().includes(q) ||
    tabLabel(tab).toLowerCase().includes(q) ||
    tab.notesText.toLowerCase().includes(q)
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { tabs, recycled } = useTabStore();
  const { isConnected } = useCloudSync();
  const sameDayCount = useSameDayCounter(tabs);
  const deleteTab = useDeleteTab();
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const groups = new Map<string, DailyTab[]>();
    for (const tab of tabs) {
      if (q && !matchesQuery(tab, q)) continue;
      const label = formatDate(tab.date, "MMMM yyyy");
      groups.set(label, [...(groups.get(label) ?? []), tab]);
    }
    return [...groups.entries()];
  }, [tabs, query]);

  const nav = [
    { href: "/", label: "Dashboard", sub: undefined, Icon: Home },
    { href: "/sync", label: "Cloud Sync", sub: isConnected ? "Connected · sync history" : "Set email to sync history", Icon: CloudCog },
    { href: "/recycle-bin", label: "Recycle Bin", sub: `${recycled.length} deleted tab${recycled.length === 1 ? "" : "s"}`, Icon: Trash },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-3 pt-5">
        <Logo size={40} />
        <span className="flex-1 truncate font-display text-xl font-semibold text-lush">KhorocBoi</span>
        <ThemeToggle />
      </div>
      <div className="border-t border-line/60" />

      <nav className="space-y-1 px-3 pt-3">
        <Link
          href="/analytics"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl bg-primary-strong px-4 py-3 font-bold text-on-primary shadow-card transition hover:brightness-110"
        >
          <LineChart className="size-5" />
          Analytics &amp; Insights
        </Link>
        {nav.map(({ href, label, sub, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-2.5 transition-colors ${
                active ? "bg-primary-strong/10 font-semibold text-primary" : "hover:bg-surface-container"
              }`}
            >
              {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary-strong" />}
              <Icon className="size-5 shrink-0 text-muted" />
              <span className="min-w-0">
                <span className="block truncate">{label}</span>
                {sub && <span className="block truncate text-xs text-muted">{sub}</span>}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2 pt-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by date or name…"
            className="w-full rounded-xl border border-lush-border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary-strong focus:ring-2 focus:ring-primary-strong/20"
          />
        </label>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-4">
        {grouped.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">{query ? "No matching tabs" : "No tabs yet"}</p>
        ) : (
          grouped.map(([month, monthTabs]) => (
            <section key={month}>
              <h3 className="px-5 pb-1.5 pt-4 font-mono text-xs font-semibold uppercase tracking-wider text-lush">
                {month}
              </h3>
              <ul>
                {monthTabs.map((tab) => {
                  const count = sameDayCount(tab);
                  const active = pathname === `/tab/${tab.id}`;
                  const meta = `${tab.entries.length} items · ${formatTaka(tabTotal(tab))}`;
                  return (
                    <li key={tab.id} className="group relative">
                      <Link
                        href={`/tab/${tab.id}`}
                        onClick={onNavigate}
                        className={`flex items-center gap-3 py-2 pl-5 pr-12 transition-colors ${
                          active ? "bg-primary-strong/10" : "hover:bg-surface-container"
                        }`}
                      >
                        <CalendarDays className="size-[18px] shrink-0 text-muted" />
                        <span className="min-w-0">
                          <span className={`block truncate text-sm ${active ? "font-semibold text-primary" : ""}`}>
                            {headline(tab, count, "d MMM")}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {hasCustomTitle(tab) ? `${displayTitle(tab, count, "d MMM")} · ${meta}` : meta}
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        title="Delete"
                        aria-label={`Delete ${headline(tab, count)}`}
                        onClick={() => deleteTab(tab.id, headline(tab, count, "d MMM yyyy"))}
                        className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-danger/80 transition hover:bg-danger/10 lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      <p className="border-t border-line/60 px-5 py-3 text-center font-mono text-[11px] text-muted">
        Developed by Rifat Mahmud
      </p>
    </div>
  );
}
