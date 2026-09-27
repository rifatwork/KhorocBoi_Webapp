"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Tailwind max-width class for desktop, e.g. `sm:max-w-md`. */
  widthClass?: string;
}

/** Bottom sheet on phones, centered dialog on larger screens. */
export function Modal({ open, onClose, title, children, widthClass = "sm:max-w-md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-slide-up pb-safe max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-background shadow-float sm:rounded-3xl ${widthClass}`}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line sm:hidden" />
        {title && (
          <div className="flex items-center justify-between gap-4 px-5 pt-4 sm:px-6 sm:pt-6">
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-container"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="px-5 pb-5 pt-3 sm:px-6 sm:pb-6">{children}</div>
      </div>
    </div>
  );
}
