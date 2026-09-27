const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

/**
 * Dart-style `DateFormat` subset: yyyy, MMMM, MMM, MM, M, dd, d, EEEE, EEE, h, mm, a.
 * Text wrapped in single quotes is emitted literally.
 */
export function formatDate(date: Date, pattern: string): string {
  return pattern.replace(
    /'([^']*)'|yyyy|MMMM|MMM|MM|M|dd|d|EEEE|EEE|h|mm|a/g,
    (token, literal: string | undefined) => {
      if (literal !== undefined) return literal;
      switch (token) {
        case "yyyy":
          return String(date.getFullYear());
        case "MMMM":
          return MONTHS[date.getMonth()];
        case "MMM":
          return MONTHS[date.getMonth()].slice(0, 3);
        case "MM":
          return pad(date.getMonth() + 1);
        case "M":
          return String(date.getMonth() + 1);
        case "dd":
          return pad(date.getDate());
        case "d":
          return String(date.getDate());
        case "EEEE":
          return WEEKDAYS[date.getDay()];
        case "EEE":
          return WEEKDAYS[date.getDay()].slice(0, 3);
        case "h": {
          const h = date.getHours() % 12;
          return String(h === 0 ? 12 : h);
        }
        case "mm":
          return pad(date.getMinutes());
        case "a":
          return date.getHours() < 12 ? "AM" : "PM";
        default:
          return token;
      }
    },
  );
}

/**
 * Local wall-clock ISO string without a timezone suffix — the same shape Dart's
 * `DateTime.toIso8601String()` produces for local times. A `Z` suffix would make
 * the Flutter app treat the value as UTC and shift dates across midnight.
 */
export function toLocalIso(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `.${pad(date.getMilliseconds(), 3)}`
  );
}

const ISO_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i;

/** Parses Dart ISO strings (local, UTC, or with microseconds). */
export function parseIso(value: string): Date {
  const match = ISO_PATTERN.exec(value.trim());
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? new Date(0) : fallback;
  }
  const [, y, mo, d, hh = "0", mi = "0", ss = "0", frac = "0", zone] = match;
  const ms = Number(frac.padEnd(3, "0").slice(0, 3));
  if (!zone) {
    return new Date(+y, +mo - 1, +d, +hh, +mi, +ss, ms);
  }
  const offset =
    zone.toUpperCase() === "Z" ? "Z" : zone.replace(/^([+-]\d{2})(\d{2})$/, "$1:$2");
  return new Date(`${y}-${mo}-${d}T${hh.padStart(2, "0")}:${mi}:${ss}.${pad(ms, 3)}${offset}`);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export const monthName = (monthIndex: number) => MONTHS[monthIndex];
