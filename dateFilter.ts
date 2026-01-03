import { Transaction } from "../types/finance";

interface DateRange {
  from: string;
  to: string;
}

export function filterTransactionsByDate(
  transactions: Transaction[],
  range: DateRange
): Transaction[] {
  const fromDate = new Date(range.from);
  const toDate = new Date(range.to);

  return transactions.filter((t) => {
    const txDate = new Date(t.date);
    return txDate >= fromDate && txDate <= toDate;
  });
}
