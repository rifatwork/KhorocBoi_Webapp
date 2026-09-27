import { endOfDay, startOfDay } from "@/shared/lib/dates";

export type DateRangePreset = "thisMonth" | "last3Months" | "last6Months" | "custom" | "month" | "year";

export interface DateRange {
  start: Date;
  end: Date;
  preset: DateRangePreset;
  /** Custom multi-day pick: analytics uses only these days. */
  selectedDays?: Date[];
}

export function thisMonthRange(now = new Date()): DateRange {
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    preset: "thisMonth",
  };
}

export function lastMonthsRange(months: 3 | 6, now = new Date()): DateRange {
  return {
    start: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    preset: months === 3 ? "last3Months" : "last6Months",
  };
}

/** `month` is 1-12. */
export function monthRange(year: number, month: number): DateRange {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0, 23, 59, 59),
    preset: "month",
  };
}

export function yearRange(year: number): DateRange {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59),
    preset: "year",
  };
}

export function customDaysRange(days: Date[]): DateRange {
  const sorted = [...new Map(days.map((d) => [startOfDay(d).getTime(), startOfDay(d)])).values()]
    .sort((a, b) => a.getTime() - b.getTime());
  if (sorted.length === 0) {
    const now = new Date();
    return { start: now, end: now, preset: "custom", selectedDays: [] };
  }
  return {
    start: sorted[0],
    end: endOfDay(sorted[sorted.length - 1]),
    preset: "custom",
    selectedDays: sorted,
  };
}

export function customRange(a: Date, b: Date): DateRange {
  const [from, to] = a <= b ? [a, b] : [b, a];
  return { start: startOfDay(from), end: endOfDay(to), preset: "custom" };
}

export interface CategoryTotal {
  category: string;
  total: number;
  share: number;
}

export interface DailyTotal {
  day: Date;
  total: number;
}
