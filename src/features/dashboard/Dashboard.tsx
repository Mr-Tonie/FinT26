import { useState, useEffect } from "react";
import { Layout } from "@/shared/components/Layout";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { transactionsAPI } from "@/shared/services/api";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import type { CurrencyCode } from "@/shared/types/financial.types";

type ChartType = "bar" | "line" | "doughnut" | "category";

export function Dashboard() {
  const navigate = useNavigate();
  const [selectedChart, setSelectedChart] = useState<ChartType>("line");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [statistics, setStatistics] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netCashflow: 0,
    transactionCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [currency] = useState<CurrencyCode>("USD");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    const txnResult = await transactionsAPI.getAll();
    if (txnResult.data?.transactions) {
      setTransactions(txnResult.data.transactions);
    }

    const statsResult = await transactionsAPI.getStatistics();
    if (statsResult.data?.statistics) {
      setStatistics(statsResult.data.statistics);
    }

    setLoading(false);
  };

  // Monthly data calculation
  const getMonthlyData = () => {
    const monthlyData: Record<
      string,
      { income: number; expenses: number; netCashflow: number }
    > = {};
    const months: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric"
      });
      months.push(monthKey);
      monthlyData[monthKey] = { income: 0, expenses: 0, netCashflow: 0 };
    }

    transactions.forEach((txn) => {
      const date = new Date(txn.date);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric"
      });

      if (monthlyData[monthKey]) {
        if (txn.category.startsWith("income_")) {
          monthlyData[monthKey].income += txn.amount;
        } else {
          monthlyData[monthKey].expenses += txn.amount;
        }
      }
    });

    return months.map((month) => ({
      month,
      income: monthlyData[month].income,
      expenses: monthlyData[month].expenses,
      netCashflow: monthlyData[month].income - monthlyData[month].expenses
    }));
  };

  /* -------------------- Category Data -------------------- */
  const getCategoryData = () => {
    const totals: Record<string, number> = {};

    transactions.forEach((txn) => {
      if (txn.category.startsWith("expense_")) {
        const key = txn.category.replace("expense_", "");
        totals[key] = (totals[key] || 0) + txn.amount;
      }
    });

    return Object.entries(totals).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();

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

  const COLORS = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16"
  ];

  /* -------------------- Chart Renderer -------------------- */
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-80">
          <p className="text-neutral-500">Loading chart data...</p>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-80">
          <p className="text-neutral-500 mb-4">No transaction data yet</p>
          <Link to="/transactions" className="btn btn-primary">
            Add Your First Transaction
          </Link>
        </div>
      );
    }

    switch (selectedChart) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                name="Income"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="netCashflow"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Net Cashflow"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "doughnut":
        return (
          <div>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v, currency)} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend for doughnut chart */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {categoryData.map((entry, index) => (
                <div
                  key={`legend-${index}`}
                  className="flex items-center gap-2"
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: COLORS[index % COLORS.length],
                      borderRadius: 4
                    }}
                  />
                  <span className="text-sm text-neutral-700">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "category":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={categoryData}
              layout="horizontal"
              margin={{ left: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" />
              <Tooltip formatter={(v: any) => formatCurrency(v, currency)} />
              <Bar dataKey="value">
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900">Dashboard</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Your financial snapshot at a glance
          </p>
        </div>

        {/* Financial snapshot cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className={`card ${
              statistics.netCashflow >= 0
                ? "bg-primary-50 border-primary-200"
                : "bg-warning/5 border-warning/20"
            }`}
          >
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Monthly Net Cashflow
            </h3>
            <p
              className={`text-3xl font-bold ${
                statistics.netCashflow >= 0
                  ? "text-primary-600"
                  : "text-warning"
              }`}
            >
              {formatCurrency(statistics.netCashflow, currency)}
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              {statistics.netCashflow >= 0
                ? "Positive cashflow"
                : "Negative cashflow"}
            </p>
          </div>

          <div className="card bg-success/5 border-success/20">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Monthly Income
            </h3>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(statistics.totalIncome, currency)}
            </p>
            <p className="text-sm text-neutral-500 mt-1">Current month</p>
          </div>

          <div className="card bg-danger/5 border-danger/20">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Monthly Expenses
            </h3>
            <p className="text-3xl font-bold text-danger">
              {formatCurrency(statistics.totalExpenses, currency)}
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

        {/* Charts */}
        <div className="card">
          <div className="flex justify-between mb-6">
            <h3 className="text-lg font-semibold">Financial Trends</h3>
            <div className="flex gap-2">
              {(["bar", "line", "doughnut", "category"] as ChartType[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedChart(t)}
                    className={`px-4 py-2 rounded ${
                      selectedChart === t
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-100"
                    }`}
                  >
                    {t}
                  </button>
                )
              )}
            </div>
          </div>

          {renderChart()}
        </div>

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

            {loading ? (
              <p className="text-center py-8 text-neutral-500">
                Loading transactions...
              </p>
            ) : recentTransactions.length === 0 ? (
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
                        {formatDate(new Date(txn.date))} ·{" "}
                        {CATEGORY_LABELS[txn.category]}
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

          {/* Active savings goals placeholder */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Active Savings Goals
              </h3>
            </div>

            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">No savings goals yet.</p>
              <button
                onClick={() => navigate("/savings")}
                className="btn btn-secondary text-sm"
              >
                Create First Goal
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
