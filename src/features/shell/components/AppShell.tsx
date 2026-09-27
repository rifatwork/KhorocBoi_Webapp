"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { syncController } from "@/features/cloud-sync/hooks/syncController";
import { FeedbackProvider } from "@/shared/components/Feedback";
import { Sidebar } from "./Sidebar";

const ShellContext = createContext<{ openDrawer: () => void }>({ openDrawer: () => {} });

export const useShell = () => useContext(ShellContext);

const REFOCUS_SYNC_AFTER_MS = 60_000;
// Keep full syncs under the per-IP /api/restore limit (30 per 10 min).
const POLL_INTERVAL_MS = 30_000;
const POLL_SYNC_AFTER_MS = 90_000;

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);

  if (pathname !== lastPath) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    void syncController.maybeAutoSync();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncController.maybeAutoSync(REFOCUS_SYNC_AFTER_MS);
      }
    };
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncController.maybeAutoSync(POLL_SYNC_AFTER_MS);
      }
    }, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <FeedbackProvider>
      <ShellContext.Provider value={{ openDrawer: () => setDrawerOpen(true) }}>
        <div className="flex min-h-dvh">
          <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 border-r border-line/60 bg-drawer lg:block">
            <Sidebar />
          </aside>

          {drawerOpen && (
            <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
              <div className="animate-fade-in absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
              <aside className="animate-slide-in-left absolute inset-y-0 left-0 w-[86%] max-w-80 bg-drawer shadow-float">
                <Sidebar onNavigate={() => setDrawerOpen(false)} />
              </aside>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </ShellContext.Provider>
    </FeedbackProvider>
  );
}
