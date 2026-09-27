import { readJson, writeJson } from "@/shared/lib/storage";
import seed from "../data/dictionary.json";
import type { DictionaryEntry } from "../types";

const LEARNED_KEY = "khorocboi.learnedDictionary.v1";

type RawEntry = { en: string; category?: string };

const TRANSPORT = ["bus", "cng", "rickshaw", "uber", "pathao", "train", "metro", "taxi", "fare", "auto"];
const FOOD = [
  "rice", "egg", "chicken", "fish", "lunch", "dinner", "breakfast", "meal",
  "grocery", "vegetable", "guava", "biryani", "milk",
];
const SNACKS = ["tea", "coffee", "fritter", "samosa", "fuchka", "biscuit", "chips", "water", "snack", "chocolate"];

/** Bangla/Banglish → English dictionary with a learned cache from AI translations. */
class Dictionary {
  private words = new Map<string, DictionaryEntry>();
  private learnedLoaded = false;

  constructor() {
    for (const [key, value] of Object.entries(seed.words as Record<string, RawEntry>)) {
      this.words.set(key.toLowerCase().trim(), {
        english: value.en,
        category: value.category ?? "other",
      });
    }
  }

  private ensureLearned() {
    if (this.learnedLoaded || typeof window === "undefined") return;
    this.learnedLoaded = true;
    const learned = readJson<Record<string, RawEntry>>(LEARNED_KEY, {});
    for (const [key, value] of Object.entries(learned)) {
      if (!value?.en) continue;
      this.words.set(key.toLowerCase(), {
        english: value.en,
        category: value.category ?? "other",
      });
    }
  }

  lookup(term: string): DictionaryEntry | undefined {
    this.ensureLearned();
    const key = term.toLowerCase().trim();
    return key ? this.words.get(key) : undefined;
  }

  cacheTranslation(term: string, english: string, category = "other") {
    const key = term.toLowerCase().trim();
    if (!key || !english.trim()) return;
    this.ensureLearned();
    this.words.set(key, { english: english.trim(), category });
    const learned = readJson<Record<string, RawEntry>>(LEARNED_KEY, {});
    learned[key] = { en: english.trim(), category };
    writeJson(LEARNED_KEY, learned);
  }

  inferCategory(cleanedItem: string): string {
    const lower = cleanedItem.toLowerCase();
    const entry = this.lookup(lower);
    if (entry) return entry.category;
    if (TRANSPORT.some((w) => lower.includes(w))) return "transport";
    if (FOOD.some((w) => lower.includes(w))) return "food";
    if (SNACKS.some((w) => lower.includes(w))) return "snacks";
    return "other";
  }
}

export const dictionary = new Dictionary();
