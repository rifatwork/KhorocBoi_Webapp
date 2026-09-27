export interface DictionaryEntry {
  english: string;
  category: string;
}

export interface ParsedExpense {
  item: string;
  amount: number;
  originalText: string;
  timestamp: Date;
  category: string;
  usedAiFallback: boolean;
}
