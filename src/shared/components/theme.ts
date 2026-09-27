"use client";

import { useSyncExternalStore } from "react";

const THEME_KEY = "khorocboi.theme";

/** Runs before paint so the saved theme never flashes. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export type ThemeMode = "light" | "dark";

const listeners = new Set<() => void>();

function readMode(): ThemeMode {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setThemeMode(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  localStorage.setItem(THEME_KEY, mode);
  for (const l of listeners) l();
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readMode,
    () => "light",
  );
}
