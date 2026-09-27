import type { ParsedExpense } from "../types";
import { translateTerm } from "./aiClient";
import { dictionary } from "./dictionary";

/**
 * Matches money amounts, not quantity digits.
 * - 2+ digits (`30`, `1500`) count even without `tk`
 * - A single digit (`5`) counts only with currency: `5 tk`, `tk 5`, `৳5`, `5/-`
 */
const AMOUNT_SOURCE =
  "(?:" +
  "৳\\s*(\\d+(?:,\\d{3})*(?:\\.\\d+)?)" +
  "|" +
  "(?:tk|taka)\\s*(\\d+(?:,\\d{3})*(?:\\.\\d+)?)" +
  "|" +
  "(\\d{2,}(?:,\\d{3})*(?:\\.\\d+)?)\\s*(?:tk|taka|৳|\\/\\-)?" +
  "|" +
  "(\\d(?:\\.\\d+)?)\\s*(?:tk|taka|৳|\\/\\-)" +
  ")";

const amountPattern = () => new RegExp(AMOUNT_SOURCE, "gi");

const LEADING_CONNECTOR = /^(?:and|&|plus|then)\s+/i;
const NOISE_TOKENS = new Set(["tk", "taka", "৳", "/-", "tk.", "taka."]);

function amountFromMatch(match: RegExpMatchArray): string | null {
  for (let i = 1; i < match.length; i++) {
    if (match[i]) return match[i];
  }
  return null;
}

/** `banana 20 tk apple 30 tk` → `['banana 20 tk', 'apple 30 tk']` */
export function splitExpenseSegments(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];
  const matches = [...trimmed.matchAll(amountPattern())];
  const segments: string[] = [];
  matches.forEach((match, i) => {
    const start = i === 0 ? 0 : matches[i - 1].index! + matches[i - 1][0].length;
    const end = match.index! + match[0].length;
    const segment = trimmed.slice(start, end).trim().replace(LEADING_CONNECTOR, "").trim();
    if (!segment) return;
    // Skip orphan amounts with no item text (e.g. trailing " 40").
    if (!extractItemPhrase(segment) && i > 0) return;
    segments.push(segment);
  });
  return segments;
}

/** Prefers the last amount within a segment (`bus vara 20 tk`). */
export function extractAmount(line: string): number | null {
  const matches = [...line.matchAll(amountPattern())].reverse();
  for (const match of matches) {
    const raw = amountFromMatch(match);
    if (!raw) continue;
    const value = Number(raw.replace(/,/g, ""));
    if (!Number.isNaN(value)) return value;
  }
  return null;
}

/** Removes amount + currency tokens; returns the remaining item phrase. */
export function extractItemPhrase(line: string): string {
  const text = line.trim();
  if (!text) return "";
  return text
    .replace(amountPattern(), " ")
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t && !NOISE_TOKENS.has(t) && !/^[\d.,]+$/.test(t))
    .join(" ")
    .trim();
}

function titleCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** Greedy longest-phrase-first translation of item tokens. */
function resolveTokens(tokens: string[]) {
  if (tokens.length === 0) return { english: "", category: null as string | null, fullyKnown: true };

  const full = dictionary.lookup(tokens.join(" "));
  if (full) return { english: full.english, category: full.category as string | null, fullyKnown: true };

  const parts: string[] = [];
  let category: string | null = null;
  let fullyKnown = true;
  let i = 0;
  while (i < tokens.length) {
    let matched = false;
    for (let len = tokens.length - i; len >= 1; len--) {
      const hit = dictionary.lookup(tokens.slice(i, i + len).join(" "));
      if (hit) {
        parts.push(hit.english);
        category ??= hit.category;
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      parts.push(tokens[i]);
      fullyKnown = false;
      i += 1;
    }
  }
  return { english: parts.join(" "), category, fullyKnown };
}

function parseSegmentSync(segment: string, timestamp: Date): ParsedExpense | null {
  const trimmed = segment.trim();
  if (!trimmed) return null;
  const amount = extractAmount(trimmed);
  if (amount == null) return null;

  const phrase = extractItemPhrase(trimmed);
  const resolved = resolveTokens(phrase ? phrase.split(" ") : []);
  const item = resolved.english ? titleCase(resolved.english) : "Expense";
  return {
    item,
    amount,
    originalText: trimmed,
    timestamp,
    category: resolved.category ?? dictionary.inferCategory(item),
    usedAiFallback: false,
  };
}

/** Dictionary-only parse of one line (may yield several expenses). */
export function parseLineSync(line: string, timestamp = new Date()): ParsedExpense[] {
  return splitExpenseSegments(line)
    .map((segment) => parseSegmentSync(segment, timestamp))
    .filter((p): p is ParsedExpense => p !== null);
}

/** Instant multi-line parse used while typing. */
export function parseNotesSync(notes: string): ParsedExpense[] {
  const now = new Date();
  return notes
    .split("\n")
    .filter((line) => line.trim())
    .flatMap((line) => parseLineSync(line, now));
}

async function enrichWithAi(sync: ParsedExpense): Promise<ParsedExpense> {
  const phrase = extractItemPhrase(sync.originalText);
  if (!phrase) return sync;
  const tokens = phrase.split(" ");
  if (resolveTokens(tokens).fullyKnown) return sync;

  const parts: string[] = [];
  let category: string | null = resolveTokens(tokens).category;
  let usedAi = false;
  let i = 0;
  while (i < tokens.length) {
    let matched = false;
    for (let len = tokens.length - i; len >= 1; len--) {
      const hit = dictionary.lookup(tokens.slice(i, i + len).join(" "));
      if (hit) {
        parts.push(hit.english);
        category ??= hit.category;
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const unknown = tokens[i];
      const ai = await translateTerm(unknown);
      if (ai) {
        const cat = dictionary.inferCategory(ai);
        dictionary.cacheTranslation(unknown, ai, cat);
        parts.push(ai);
        category ??= cat;
        usedAi = true;
      } else {
        parts.push(unknown);
      }
      i += 1;
    }
  }

  const item = titleCase(parts.join(" "));
  return {
    ...sync,
    item,
    category: category ?? dictionary.inferCategory(item),
    usedAiFallback: usedAi,
  };
}

/** Multi-line parse with AI fallback for unknown words. */
export async function parseNotes(notes: string): Promise<ParsedExpense[]> {
  const results: ParsedExpense[] = [];
  for (const sync of parseNotesSync(notes)) {
    results.push(await enrichWithAi(sync));
  }
  return results;
}
