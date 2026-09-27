import { ChevronRight, Folder, FolderArchive } from "lucide-react";
import Link from "next/link";

interface FolderTileProps {
  href: string;
  title: string;
  subtitle: string;
  variant?: "month" | "year";
}

export function FolderTile({ href, title, subtitle, variant = "month" }: FolderTileProps) {
  const Icon = variant === "year" ? FolderArchive : Folder;
  return (
    <Link
      href={href}
      className="flex min-w-0 items-center gap-4 rounded-2xl border border-line/50 bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary-strong/40 sm:p-5"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-strong/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block truncate text-sm text-muted">{subtitle}</span>
      </span>
      <ChevronRight className="size-5 text-muted" />
    </Link>
  );
}
