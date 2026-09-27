"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/features/shell/components/PageHeader";
import { useFeedback } from "@/shared/components/Feedback";
import { isSameDay } from "@/shared/lib/dates";
import { useDeleteTab } from "../hooks/useDeleteTab";
import { useTabEditor } from "../hooks/useTabEditor";
import { useSameDayCounter, useTab, useTabStore } from "../hooks/useTabs";
import { displayTitle, headline, tabTotal } from "../services/tabModel";
import type { DailyTab } from "../types";
import { SpendingSummaryBar, SpendingSummaryPanel } from "./SpendingSummary";

function SavedIndicator({ tick }: { tick: number }) {
  const [visible, setVisible] = useState(false);
  const [lastTick, setLastTick] = useState(tick);
  if (tick !== lastTick) {
    setLastTick(tick);
    if (tick > 0) setVisible(true);
  }
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(t);
  }, [visible, tick]);

  return (
    <span
      aria-live="polite"
      className={`flex items-center gap-2 font-mono text-xs text-muted transition-opacity ${visible ? "opacity-100" : "opacity-0"}`}
    >
      Saved <span className="size-2 rounded-full bg-primary-strong" />
    </span>
  );
}

function useGoBack() {
  const router = useRouter();
  return () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };
}

export function TabEditor({ tabId }: { tabId: string }) {
  const { hydrated, tab } = useTab(tabId);
  const goBack = useGoBack();

  if (hydrated && !tab) {
    return (
      <>
        <PageHeader title="Tab" backHref="/" />
        <div className="grid flex-1 place-items-center p-8 text-center">
          <div>
            <p className="text-lg font-semibold">Tab not found</p>
            <p className="mt-1 text-muted">It may have been moved to the recycle bin.</p>
            <Link href="/recycle-bin" className="mt-4 inline-block font-semibold text-primary hover:underline">
              Open Recycle Bin
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!tab) {
    return (
      <>
        <PageHeader title=" " onBack={goBack} />
        <div className="mx-auto w-full max-w-6xl flex-1 p-6">
          <div className="h-64 animate-pulse rounded-2xl bg-surface-container" />
        </div>
      </>
    );
  }

  return <EditorBody tab={tab} />;
}

function EditorBody({ tab }: { tab: DailyTab }) {
  const router = useRouter();
  const goBack = useGoBack();
  const { tabs } = useTabStore();
  const sameDayCount = useSameDayCounter(tabs);
  const editor = useTabEditor(tab);
  const deleteTab = useDeleteTab();
  const { toast } = useFeedback();
  const [expanded, setExpanded] = useState(false);

  const count = sameDayCount(tab);
  const dateLabel = displayTitle(tab, count, "MMM d, yyyy");
  const total = tabTotal(tab);
  const label = isSameDay(tab.date, new Date()) ? "Today's Total" : "Total";

  const onTitleBlur = () => {
    const adjusted = editor.commitTitle();
    if (adjusted) toast(`That title is already used. Saved as “${adjusted}”.`);
  };

  const onDelete = async () => {
    if (await deleteTab(tab.id, headline(tab, count))) router.push("/");
  };

  return (
    <div className="flex h-dvh flex-col lg:h-auto lg:min-h-dvh">
      <PageHeader
        onBack={() => {
          editor.flush();
          goBack();
        }}
        actions={
          <>
            <SavedIndicator tick={editor.savedTick} />
            <button
              type="button"
              onClick={onDelete}
              title="Move to recycle bin"
              aria-label="Move to recycle bin"
              className="grid size-10 place-items-center rounded-full text-danger/80 hover:bg-danger/10"
            >
              <Trash2 className="size-5" />
            </button>
          </>
        }
      >
        <input
          value={editor.title}
          onChange={(e) => editor.setTitle(e.target.value)}
          onBlur={onTitleBlur}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          placeholder={dateLabel}
          aria-label="Tab title"
          maxLength={80}
          className="w-full truncate bg-transparent font-display text-lg font-bold text-primary outline-none placeholder:text-primary sm:text-xl"
        />
        {editor.titleConflict ? (
          <p className="truncate text-xs font-medium text-danger">
            Title already used — will be saved as “{editor.titleConflict}”
          </p>
        ) : (
          editor.title.trim() && <p className="truncate text-xs font-medium text-muted">{dateLabel}</p>
        )}
      </PageHeader>

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 lg:px-10 lg:py-6">
        <div className="flex min-h-0 flex-1 flex-col lg:rounded-2xl lg:border lg:border-line/50 lg:bg-surface lg:shadow-card">
          <textarea
            value={editor.notes}
            onChange={(e) => editor.setNotes(e.target.value)}
            autoFocus={!editor.notes}
            spellCheck={false}
            aria-label="Expense notes"
            placeholder={"Try 'bus vara 20 tk' or 'banana 20 tk apple 30 tk'…"}
            className="scrollbar-thin min-h-0 w-full flex-1 resize-none bg-transparent px-4 py-4 text-base leading-7 outline-none placeholder:text-muted/50 sm:px-6 lg:min-h-[calc(100dvh-9rem)] lg:p-6"
          />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 h-[calc(100dvh-8rem)]">
            <SpendingSummaryPanel total={total} entries={tab.entries} label={label} />
          </div>
        </aside>

        <div className="lg:hidden">
          <SpendingSummaryBar
            total={total}
            entries={tab.entries}
            label={label}
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
          />
        </div>
      </div>
    </div>
  );
}
