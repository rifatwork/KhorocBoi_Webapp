export type Category = "transport" | "food" | "snacks" | "other";

export const CATEGORIES: Category[] = ["transport", "food", "snacks", "other"];

export interface ExpenseEntry {
  id: string;
  rawText: string;
  cleanedItem: string;
  amount: number;
  category: string | null;
  timestamp: Date;
}

export interface DailyTab {
  id: string;
  /** Calendar day the tab belongs to (local midnight). */
  date: Date;
  entries: ExpenseEntry[];
  notesText: string;
  /** Same-day index: 1, 2, 3… when multiple tabs exist for one date. */
  slot: number;
  /** User-editable name; unique across active tabs (case-insensitive). */
  customTitle: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface RecycledTab {
  id: string;
  tab: DailyTab;
  deletedAt: Date;
}

/** JSON shapes shared with the Flutter app and khorocboi-server. */
export interface ExpenseEntryJson {
  id?: string;
  rawText: string;
  cleanedItem: string;
  amount: number;
  category?: string | null;
  timestamp: string;
}

export interface DailyTabJson {
  id?: string;
  date: string;
  entries?: ExpenseEntryJson[];
  notesText?: string;
  slot?: number;
  customTitle?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface BackupSnapshot {
  version: number;
  exportedAt: string;
  tabs: DailyTabJson[];
}

export interface RecycledTabJson {
  id: string;
  tab: DailyTabJson;
  deletedAt: string;
}
