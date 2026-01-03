import { Transaction } from "../types/finance";

export function totalIncome(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function totalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function averageMonthly(
  transactions: Transaction[],
  type: "INCOME" | "EXPENSE"
): number {
  const filtered = transactions.filter(t => t.type === type);
  if (filtered.length === 0) return 0;

  const months = new Set(
    filtered.map(t => t.date.slice(0, 7)) // YYYY-MM
  ).size;

  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  return total / months;
}
