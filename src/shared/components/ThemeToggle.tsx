"use client";

import { Moon, Sun } from "lucide-react";
import { setThemeMode, useThemeMode, type ThemeMode } from "./theme";

const OPTIONS: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "Light mode", Icon: Sun },
  { mode: "dark", label: "Dark mode", Icon: Moon },
];

export function ThemeToggle() {
  const current = useThemeMode();
  return (
    <div className="flex rounded-full border border-lush-border bg-surface p-0.5">
      {OPTIONS.map(({ mode, label, Icon }) => {
        const selected = current === mode;
        return (
          <button
            key={mode}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={selected}
            onClick={() => setThemeMode(mode)}
            className={`grid size-9 place-items-center rounded-full transition-colors ${
              selected
                ? mode === "light"
                  ? "bg-lush/15 text-lush"
                  : "bg-primary/15 text-primary"
                : "text-muted hover:bg-surface-container"
            }`}
          >
            <Icon className="size-[18px]" />
          </button>
        );
      })}
    </div>
  );
}
