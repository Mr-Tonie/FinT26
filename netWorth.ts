import { Transaction, SavingsGoal, Investment } from "../types/finance";

export interface NetWorthPoint {
  month: string; // YYYY-MM
  value: number;
}

export function calculateNetWorthTimeline(
  transactions: Transaction[],
  savings: SavingsGoal[],
  investments: Investment[]
): NetWorthPoint[] {
  const map = new Map<string, number>();

  transactions.forEach((t) => {
    const month = t.date.slice(0, 7);
    const current = map.get(month) ?? 0;

    const delta = t.type === "INCOME" ? t.amount : -t.amount;
    map.set(month, current + delta);
  });

  const savingsTotal = savings.reduce(
    (sum, s) => sum + s.currentAmount,
    0
  );

  const investmentsTotal = investments.reduce(
    (sum, i) => sum + i.currentValue,
    0
  );

  return Array.from(map.entries())
    .map(([month, value]) => ({
      month,
      value: value + savingsTotal + investmentsTotal,
    }))
    .sort((a, b) => (a.month > b.month ? 1 : -1));
}
