"use client";

import { ArrowLeft, Menu } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useShell } from "./AppShell";

interface PageHeaderProps {
  title?: ReactNode;
  /** Shows a back arrow on phones instead of the menu button. */
  backHref?: string;
  onBack?: () => void;
  actions?: ReactNode;
  /** Replaces the default title block (e.g. editable title). */
  children?: ReactNode;
}

export function PageHeader({ title, backHref, onBack, actions, children }: PageHeaderProps) {
  const { openDrawer } = useShell();
  const hasBack = Boolean(backHref || onBack);

  const backClass =
    "grid size-10 shrink-0 place-items-center rounded-full text-primary hover:bg-surface-container";

  return (
    <header className="sticky top-0 z-30 border-b border-line/40 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-2 px-3 sm:px-6 lg:px-10">
        {hasBack ? (
          onBack ? (
            <button type="button" onClick={onBack} aria-label="Back" className={backClass}>
              <ArrowLeft className="size-5" />
            </button>
          ) : (
            <Link href={backHref!} aria-label="Back" className={backClass}>
              <ArrowLeft className="size-5" />
            </Link>
          )
        ) : (
          <button type="button" onClick={openDrawer} aria-label="Open menu" className={`${backClass} lg:hidden`}>
            <Menu className="size-5" />
          </button>
        )}

        <div className="min-w-0 flex-1 py-2">
          {children ?? (
            <h1 className="truncate font-display text-xl font-bold text-primary sm:text-2xl">{title}</h1>
          )}
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Centered page body with the design system's max width. */
export function PageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main className={`mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-10 lg:pb-12 ${className}`}>
      {children}
    </main>
  );
}
