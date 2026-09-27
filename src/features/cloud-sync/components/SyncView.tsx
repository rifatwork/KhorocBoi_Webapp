"use client";

import { Cloud, CloudCheck, Eye, EyeOff, Link2Off, Loader2, Lock, Mail, RefreshCw } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageBody, PageHeader } from "@/features/shell/components/PageHeader";
import { formatDate } from "@/shared/lib/dates";
import { useCloudSync } from "../hooks/useCloudSync";

const inputClass =
  "w-full rounded-xl border border-lush-border bg-surface py-3 pl-11 pr-3 outline-none transition focus:border-primary-strong focus:ring-2 focus:ring-primary-strong/20 disabled:opacity-60";

export function SyncView() {
  const { state, isConnected, isBusy, connect, syncNow, disconnect } = useCloudSync();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isBusy) void connect(email, code);
  };

  return (
    <>
      <PageHeader title="Cloud Sync" />
      <PageBody className="max-w-2xl lg:max-w-2xl">
        <h2 className="font-display text-xl font-semibold">Keep your expense history safe</h2>
        <p className="mt-2 text-muted">
          Use the same email and passcode as the KhorocBoi mobile app. Your history is restored here, and
          every change you make on the web is backed up automatically, so the phone and web stay in step.
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line/50 bg-surface p-4">
          <span className="grid size-11 place-items-center rounded-full bg-secondary-soft text-primary">
            {isConnected ? <CloudCheck className="size-5" /> : <Cloud className="size-5" />}
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{isConnected ? "Sync enabled" : "Not connected"}</p>
            <p className="truncate text-sm text-muted">
              {isConnected ? state.email : "Save email and passcode to enable backup"}
            </p>
          </div>
        </div>

        <p className="mt-3 font-mono text-xs text-muted">
          Last sync: {state.lastSyncedAt ? formatDate(state.lastSyncedAt, "d MMM yyyy, h:mm a") : "never"}
        </p>
        {state.message && (
          <p
            role="status"
            className={`mt-3 text-sm font-medium ${state.status === "error" ? "text-danger" : "text-lush"}`}
          >
            {state.message}
          </p>
        )}

        {!isConnected ? (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <label className="relative block">
              <span className="sr-only">Email</span>
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                disabled={isBusy}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="relative block">
              <span className="sr-only">Passcode</span>
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
              <input
                type={showCode ? "text" : "password"}
                inputMode="numeric"
                autoComplete="current-password"
                placeholder="Passcode (at least 4 digits)"
                value={code}
                disabled={isBusy}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={`${inputClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowCode((v) => !v)}
                aria-label={showCode ? "Hide passcode" : "Show passcode"}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-container"
              >
                {showCode ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </label>
            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-strong px-5 py-3.5 font-semibold text-on-primary transition hover:brightness-110 disabled:opacity-70"
            >
              {isBusy ? <Loader2 className="size-5 animate-spin" /> : <RefreshCw className="size-5" />}
              {isBusy ? "Saving…" : "Save & sync"}
            </button>
          </form>
        ) : (
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void syncNow()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-strong px-5 py-3.5 font-semibold text-on-primary transition hover:brightness-110 disabled:opacity-70"
            >
              {isBusy ? <Loader2 className="size-5 animate-spin" /> : <RefreshCw className="size-5" />}
              {isBusy ? "Syncing…" : "Sync now"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={disconnect}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-secondary px-5 py-3.5 font-semibold text-secondary transition hover:bg-surface-container disabled:opacity-70"
            >
              <Link2Off className="size-5" /> Disconnect
            </button>
          </div>
        )}

        <p className="mt-8 rounded-xl bg-surface-container p-4 text-sm text-muted">
          Your data is also kept in this browser. On a shared or public computer, tap Disconnect when
          you are done.
        </p>
      </PageBody>
    </>
  );
}
