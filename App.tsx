import { useEffect, useState } from "react";
import { loadSnapshot, saveSnapshot } from "./services/storage.service";
import {
  FinancialSnapshot,
  Transaction,
  SavingsGoal,
  Investment,
} from "./types/finance";

// Core features
import { Dashboard } from "./features/dashboard/Dashboard";
import { TransactionForm } from "./features/transactions/TransactionForm";
import { SavingsForm } from "./features/savings/SavingsForm";
import { SavingsList } from "./features/savings/SavingsList";
import { InvestmentsForm } from "./features/investments/InvestmentsForm";
import { Investments } from "./features/investments/Investments";

// Reporting utilities
import { filterTransactionsByDate } from "./utils/dateFilter";
import { generateMonthlyReport } from "./utils/reporting";
import { summarizeByCategory } from "./utils/categoryReport";
import { calculateNetWorthTimeline } from "./utils/netWorth";
import { forecastSavingsGoals } from "./utils/savingsForecast";

// Reporting UI
import { DateRangePicker } from "./features/reporting/DateRangePicker";
import { MonthlyReportChart } from "./features/reporting/MonthlyReportChart";
import { CategoryPieChart } from "./features/reporting/CategoryPieChart";
import { NetWorthChart } from "./features/reporting/NetWorthChart";

export default function App() {
  // ===== STATE =====
  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);

  const [dateRange, setDateRange] = useState({
    from: "2026-01-01",
    to: new Date().toISOString().slice(0, 10),
  });

  // ===== INIT =====
  useEffect(() => {
    loadSnapshot().then(setSnapshot);
  }, []);

  // ===== MUTATIONS =====
  async function handleAddTransaction(newTransaction: Transaction) {
    if (!snapshot) return;

    const updated: FinancialSnapshot = {
      ...snapshot,
      transactions: [newTransaction, ...snapshot.transactions],
    };

    setSnapshot(updated);
    await saveSnapshot(updated);
  }

  async function handleAddSavingsGoal(newGoal: SavingsGoal) {
    if (!snapshot) return;

    const updated: FinancialSnapshot = {
      ...snapshot,
      savingsGoals: [newGoal, ...snapshot.savingsGoals],
    };

    setSnapshot(updated);
    await saveSnapshot(updated);
  }

  async function handleAddInvestment(newInvestment: Investment) {
    if (!snapshot) return;

    const updated: FinancialSnapshot = {
      ...snapshot,
      investments: [newInvestment, ...snapshot.investments],
    };

    setSnapshot(updated);
    await saveSnapshot(updated);
  }

  if (!snapshot) {
    return <p>Loading FinT26…</p>;
  }

  // ===== DERIVED DATA =====
  const filteredTransactions = filterTransactionsByDate(
    snapshot.transactions,
    dateRange
  );

  const monthlyReport = generateMonthlyReport(filteredTransactions);

  const expenseByCategory = summarizeByCategory(
    filteredTransactions,
    "EXPENSE"
  );

  const incomeByCategory = summarizeByCategory(
    filteredTransactions,
    "INCOME"
  );

  const netWorthTimeline = calculateNetWorthTimeline(
    filteredTransactions,
    snapshot.savingsGoals,
    snapshot.investments
  );

  const savingsForecasts = forecastSavingsGoals(
    snapshot.savingsGoals,
    filteredTransactions
  );

  // ===== UI =====
  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>FinT26</h1>

      <DateRangePicker
        from={dateRange.from}
        to={dateRange.to}
        onChange={(from, to) => setDateRange({ from, to })}
      />

      <TransactionForm onAddTransaction={handleAddTransaction} />
      <Dashboard snapshot={snapshot} />

      <SavingsForm onAddSavingsGoal={handleAddSavingsGoal} />
      <SavingsList
        savingsGoals={snapshot.savingsGoals}
        forecasts={savingsForecasts}
      />

      <InvestmentsForm onAddInvestment={handleAddInvestment} />
      <Investments investments={snapshot.investments} />

      <section style={{ marginTop: "3rem" }}>
        <h2>Financial Overview</h2>
        <NetWorthChart data={netWorthTimeline} />
        <MonthlyReportChart data={monthlyReport} />
      </section>

      <section style={{ marginTop: "3rem", display: "flex", gap: "2rem" }}>
        <CategoryPieChart
          title="Expenses by Category"
          data={expenseByCategory}
        />
        <CategoryPieChart
          title="Income by Category"
          data={incomeByCategory}
        />
      </section>
    </main>
  );
}
