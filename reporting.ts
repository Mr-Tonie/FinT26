import { Transaction } from "../types/finance";

export interface MonthlyReport {
  month: string; // format YYYY-MM
  income: number;
  expense: number;
}

export function generateMonthlyReport(transactions: Transaction[]): MonthlyReport[] {
  const reportMap = new Map<string, MonthlyReport>();

  transactions.forEach(({ date, type, amount }) => {
    if (!date || typeof date !== "string") return;

    const month = date.slice(0, 7); // YYYY-MM

    const entry = reportMap.get(month) ?? { month, income: 0, expense: 0 };

    if (type === "INCOME") {
      entry.income += amount;
    } else if (type === "EXPENSE") {
      entry.expense += amount;
    }

    reportMap.set(month, entry);
  });

  return Array.from(reportMap.values()).sort((a, b) => (a.month > b.month ? 1 : -1));
}
