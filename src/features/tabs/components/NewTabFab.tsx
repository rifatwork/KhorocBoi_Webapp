"use client";

import { FilePlus2, FolderOpen, History, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { hasCustomTitle, tabLabel } from "../services/tabModel";
import { useNewTabFlow } from "../hooks/useNewTabFlow";

type Menu = "closed" | "choose" | "existing";

export function NewTabFab() {
  const { todayTabs, hasToday, openTab, createFirstToday, createNewToday } = useNewTabFlow();
  const [menu, setMenu] = useState<Menu>("closed");

  useEffect(() => {
    if (menu === "closed") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu("closed");
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const onMain = () => {
    if (!hasToday) return createFirstToday();
    setMenu((m) => (m === "closed" ? "choose" : "closed"));
  };

  const onExisting = () => {
    if (todayTabs.length <= 1) {
      if (todayTabs.length === 0) createFirstToday();
      else openTab(todayTabs[0]);
      return;
    }
    setMenu("existing");
  };

  const option = "flex items-center gap-2 rounded-full bg-primary-strong px-4 py-2 text-sm font-semibold text-on-primary shadow-float transition hover:brightness-110";

  return (
    <>
      {menu !== "closed" && (
        <div className="fixed inset-0 z-30" onClick={() => setMenu("closed")} aria-hidden />
      )}
      <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-30 flex flex-col items-end gap-2 lg:bottom-8 lg:right-10">
        {menu === "choose" && (
          <div className="animate-slide-up flex flex-col items-end gap-2">
            <button type="button" className={option} onClick={createNewToday}>
              <FilePlus2 className="size-4" /> New
            </button>
            <button type="button" className={option} onClick={onExisting}>
              <History className="size-4" /> Existing
            </button>
          </div>
        )}
        {menu === "existing" && (
          <div className="animate-slide-up flex max-h-[50dvh] flex-col items-end gap-2 overflow-y-auto">
            {todayTabs.map((tab) => (
              <button key={tab.id} type="button" className={option} onClick={() => openTab(tab)}>
                <FolderOpen className="size-4" />
                {hasCustomTitle(tab) ? tab.customTitle.trim() : tabLabel(tab)}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={onMain}
          aria-label={menu === "closed" ? "Add expense tab" : "Close menu"}
          className="grid size-16 place-items-center rounded-2xl bg-primary-strong text-on-primary shadow-float transition hover:brightness-110 active:scale-95"
        >
          {menu === "closed" ? <Plus className="size-7" /> : <X className="size-7" />}
        </button>
      </div>
    </>
  );
}
