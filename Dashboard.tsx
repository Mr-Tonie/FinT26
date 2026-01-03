import { FinancialSnapshot } from "../../types/finance";
import {
  totalIncome,
  totalExpenses,
} from "../../lib/calculations";

interface Props {
  snapshot: FinancialSnapshot;
}

export function Dashboard({ snapshot }: Props) {
  const income = totalIncome(snapshot.transactions);
  const expenses = totalExpenses(snapshot.transactions);
  const balance = income - expenses;

  return (
    <section>
      <h2>Dashboard</h2>

      <ul>
        <li>Total Income: ${income.toFixed(2)}</li>
        <li>Total Expenses: ${expenses.toFixed(2)}</li>
        <li>Net Balance: ${balance.toFixed(2)}</li>
      </ul>
    </section>
  );
}
