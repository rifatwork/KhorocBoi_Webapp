"use client";

import { RotateCcw, Trash, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageBody, PageHeader } from "@/features/shell/components/PageHeader";
import { permanentlyDeleteTab, restoreTab } from "@/features/tabs/hooks/tabUseCases";
import { useTabStore } from "@/features/tabs/hooks/useTabs";
import { displayTitle, hasCustomTitle, tabTotal } from "@/features/tabs/services/tabModel";
import { RECYCLE_RETENTION_DAYS } from "@/features/tabs/services/tabStore";
import type { RecycledTab } from "@/features/tabs/types";
import { useFeedback } from "@/shared/components/Feedback";
import { addDays, formatDate } from "@/shared/lib/dates";
import { formatTaka } from "@/shared/lib/money";

function daysLeft(item: RecycledTab): number {
  const ms = addDays(item.deletedAt, RECYCLE_RETENTION_DAYS).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function RecycleBinView() {
  const router = useRouter();
  const { hydrated, recycled } = useTabStore();
  const { confirm, toast } = useFeedback();

  const onRestore = (item: RecycledTab) => {
    const restored = restoreTab(item.id);
    if (!restored) return;
    toast(
      restored.customTitle && restored.customTitle !== item.tab.customTitle
        ? `Restored as “${restored.customTitle}”`
        : "Tab restored",
    );
    router.push(`/tab/${restored.id}`);
  };

  const onDelete = async (item: RecycledTab) => {
    const ok = await confirm({
      title: "Delete permanently?",
      message: "This removes the tab from the recycle bin forever. It cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    permanentlyDeleteTab(item.id);
    toast("Deleted permanently");
  };

  return (
    <>
      <PageHeader title="Recycle Bin" />
      <PageBody>
        <p className="mb-5 text-sm text-muted">
          Deleted tabs stay here for {RECYCLE_RETENTION_DAYS} days. Restore them or delete them forever.
          If a restored tab&apos;s title is already taken, it comes back as “Title (restored)”.
        </p>

        {!hydrated ? (
          <div className="h-24 animate-pulse rounded-2xl bg-surface-container" />
        ) : recycled.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center text-muted">
            <Trash className="size-12 opacity-40" />
            <p className="mt-3 text-lg">No deleted tabs</p>
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {recycled.map((item) => {
              const tab = item.tab;
              const title = hasCustomTitle(tab) ? tab.customTitle.trim() : displayTitle(tab, 1, "d MMM yyyy");
              const left = daysLeft(item);
              return (
                <li key={item.id} className="flex flex-col gap-3 rounded-2xl border border-line/50 bg-surface p-4 shadow-card sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
                      <Trash2 className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{title}</p>
                      <p className="text-sm text-muted">
                        {tab.entries.length} items · {formatTaka(tabTotal(tab))}
                      </p>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                        Deleted {formatDate(item.deletedAt, "d MMM yyyy")} · {left} day{left === 1 ? "" : "s"} left
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onRestore(item)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-strong px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:brightness-110"
                    >
                      <RotateCcw className="size-4" /> Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-danger/40 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/10"
                    >
                      <Trash2 className="size-4" /> Delete forever
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </>
  );
}
