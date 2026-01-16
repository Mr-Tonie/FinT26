import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { SpendingChart } from "./SpendingChart";
import {
  loadTransactions,
  getTotalIncome,
  getTotalExpenses,
  getNetCashflow
} from "@/features/transactions/transactionStore";
import {
  loadSavingsGoals,
  calculateProgress,
  isGoalCompleted
} from "@/features/savings/savingsStore";
import {
  loadInvestments,
  getTotalCurrentValue,
  getTotalGainLoss
} from "@/features/investments/investmentStore";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDate, getCurrentMonthYear } from "@/shared/utils/date";
import type {
  Transaction,
  SavingsGoal,
  CurrencyCode
} from "@/shared/types/financial.types";

export function Dashboard() {
  const navigate = useNavigate();
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [netCashflow, setNetCashflow] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioGainLoss, setPortfolioGainLoss] = useState(0);
  const [investmentCount, setInvestmentCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    []
  );
  const [activeSavingsGoals, setActiveSavingsGoals] = useState<SavingsGoal[]>(
    []
  );
  const [currency] = useState<CurrencyCode>("USD");

  useEffect(() => {
    // Calculate current month boundaries
    const { month, year } = getCurrentMonthYear();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get monthly totals
    const income = getTotalIncome(startDate, endDate, currency);
    const expenses = getTotalExpenses(startDate, endDate, currency);
    const cashflow = getNetCashflow(startDate, endDate, currency);

    setMonthlyIncome(income);
    setMonthlyExpenses(expenses);
    setNetCashflow(cashflow);

    // Get recent transactions
    const allTransactions = loadTransactions();
    const recent = allTransactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    setRecentTransactions(recent);

    // Get active savings goals
    const allGoals = loadSavingsGoals();
    const active = allGoals
      .filter((goal) => !isGoalCompleted(goal))
      .slice(0, 3);

    setActiveSavingsGoals(active);

    // Get investment portfolio data
    const investments = loadInvestments();
    const portfolioVal = getTotalCurrentValue(currency);
    const gainLoss = getTotalGainLoss(currency);

    setPortfolioValue(portfolioVal);
    setPortfolioGainLoss(gainLoss);
    setInvestmentCount(investments.length);
  }, [currency]);

  const CATEGORY_LABELS: Record<string, string> = {
    income_salary: "Salary",
    income_business: "Business Income",
    income_investment: "Investment Returns",
    income_other: "Other Income",
    expense_food: "Food & Groceries",
    expense_transport: "Transport",
    expense_housing: "Housing & Rent",
    expense_utilities: "Utilities",
    expense_healthcare: "Healthcare",
    expense_education: "Education",
    expense_entertainment: "Entertainment",
    expense_other: "Other Expenses"
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Dashboard</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Your financial snapshot at a glance
          </p>
        </div>

        {/* Financial snapshot cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Net Cashflow Card */}
          <div
            className={`card ${
              netCashflow >= 0
                ? "bg-primary-50 border-primary-200"
                : "bg-warning/5 border-warning/20"
            }`}
          >
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Monthly Net Cashflow
            </h3>
            <p
              className={`text-3xl font-bold ${
                netCashflow >= 0 ? "text-primary-600" : "text-warning"
              }`}
            >
              {formatCurrency(netCashflow, currency)}
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              {netCashflow >= 0 ? "Positive cashflow" : "Negative cashflow"}
            </p>
          </div>

          {/* Monthly Income Card */}
          <div className="card bg-success/5 border-success/20">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Monthly Income
            </h3>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(monthlyIncome, currency)}
            </p>
            <p className="text-sm text-neutral-500 mt-1">Current month</p>
          </div>

          {/* Monthly Expenses Card */}
          <div className="card bg-danger/5 border-danger/20">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Monthly Expenses
            </h3>
            <p className="text-3xl font-bold text-danger">
              {formatCurrency(monthlyExpenses, currency)}
            </p>
            <p className="text-sm text-neutral-500 mt-1">Current month</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/transactions")}
              className="btn btn-primary"
            >
              Add Transaction
            </button>
            <button
              onClick={() => navigate("/savings")}
              className="btn btn-secondary"
            >
              Create Savings Goal
            </button>
            <button
              onClick={() => navigate("/investments")}
              className="btn btn-outline"
            >
              Record Investment
            </button>
          </div>
        </div>

        {/* Spending Chart */}
        <SpendingChart currency={currency} />

        {/* Two-column layout for transactions and savings goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Recent Transactions
              </h3>
              {recentTransactions.length > 0 && (
                <button
                  onClick={() => navigate("/transactions")}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All →
                </button>
              )}
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 mb-4">
                  No transactions recorded yet.
                </p>
                <button
                  onClick={() => navigate("/transactions")}
                  className="btn btn-primary text-sm"
                >
                  Add First Transaction
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">
                        {txn.description}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {formatDate(txn.date)} · {CATEGORY_LABELS[txn.category]}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-bold ${
                        txn.category.startsWith("income_")
                          ? "text-success"
                          : "text-danger"
                      }`}
                    >
                      {txn.category.startsWith("income_") ? "+" : "-"}
                      {formatCurrency(txn.amount, txn.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active savings goals */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Active Savings Goals
              </h3>
              {activeSavingsGoals.length > 0 && (
                <button
                  onClick={() => navigate("/savings")}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All →
                </button>
              )}
            </div>

            {activeSavingsGoals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 mb-4">No savings goals yet.</p>
                <button
                  onClick={() => navigate("/savings")}
                  className="btn btn-secondary text-sm"
                >
                  Create First Goal
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeSavingsGoals.map((goal) => {
                  const progress = calculateProgress(goal);
                  return (
                    <div
                      key={goal.id}
                      className="pb-4 border-b border-neutral-100 last:border-0"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-neutral-900">
                          {goal.name}
                        </p>
                        <p className="text-sm font-semibold text-neutral-900">
                          {progress.toFixed(0)}%
                        </p>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-neutral-600">
                        {formatCurrency(goal.currentAmount, goal.currency)} of{" "}
                        {formatCurrency(goal.targetAmount, goal.currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Investment Portfolio Summary */}
        {investmentCount > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Investment Portfolio
              </h3>
              <button
                onClick={() => navigate("/investments")}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-neutral-600 mb-1">Portfolio Value</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(portfolioValue, currency)}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-600 mb-1">Total Gain/Loss</p>
                <p
                  className={`text-2xl font-bold ${
                    portfolioGainLoss >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {portfolioGainLoss >= 0 ? "+" : ""}
                  {formatCurrency(portfolioGainLoss, currency)}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-600 mb-1">Investments</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {investmentCount} {investmentCount === 1 ? "asset" : "assets"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
