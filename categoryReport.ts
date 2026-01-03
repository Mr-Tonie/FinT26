import { Transaction } from "../types/finance";

export interface CategorySummary {
  category: string;
  total: number;
}

export function summarizeByCategory(
  transactions: Transaction[],
  type: "INCOME" | "EXPENSE"
): CategorySummary[] {
  const map = new Map<string, number>();

  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      const current = map.get(t.category) ?? 0;
      map.set(t.category, current + t.amount);
    });

  return Array.from(map.entries()).map(([category, total]) => ({
    category,
    total,
  }));
}
