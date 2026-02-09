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
  AreaChart,
  Area
} from "recharts";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import type { CurrencyCode } from "@/shared/types/financial.types";
import { firebaseAuthService } from "@/services/firebase/auth.service";
import { firestoreService } from "@/services/firebase/firestore.service";

type ChartType = "trends" | "line" | "comparison" | "monthly";

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

    const user = firebaseAuthService.getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const txns = await firestoreService.transactions.getAll(user.uid);
      setTransactions(txns);

      const stats = await firestoreService.transactions.getStatistics(user.uid);
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get last 6 months data for trends
  const getMonthlyTrendsData = () => {
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
        monthlyData[monthKey].netCashflow =
          monthlyData[monthKey].income - monthlyData[monthKey].expenses;
      }
    });

    return months.map((month) => ({
      month,
      income: monthlyData[month].income,
      expenses: monthlyData[month].expenses,
      netCashflow: monthlyData[month].netCashflow
    }));
  };

  // Get category breakdown
  const getCategoryData = () => {
    const totals: Record<string, number> = {};

    transactions.forEach((txn) => {
      if (txn.category.startsWith("expense_")) {
        const key = txn.category.replace("expense_", "");
        totals[key] = (totals[key] || 0) + txn.amount;
      }
    });

    return Object.entries(totals)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
        value,
        percentage: 0
      }))
      .sort((a, b) => b.value - a.value)
      .map((item, index, array) => {
        const total = array.reduce((sum, i) => sum + i.value, 0);
        return {
          ...item,
          percentage: total > 0 ? (item.value / total) * 100 : 0
        };
      });
  };

  // Get daily spending trend for current month
  const getSpendingTrendData = () => {
    const dailyData: Record<string, number> = {};

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
      dailyData[key] = 0;
    }

    transactions.forEach((txn) => {
      const txnDate = new Date(txn.date);
      const key = txnDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });

      if (
        dailyData.hasOwnProperty(key) &&
        txn.category.startsWith("expense_")
      ) {
        dailyData[key] += txn.amount;
      }
    });

    return Object.entries(dailyData).map(([date, amount]) => ({
      date,
      amount
    }));
  };

  const monthlyData = getMonthlyTrendsData();
  const categoryData = getCategoryData();
  const spendingTrendData = getSpendingTrendData();

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
    "#ef4444", // Red
    "#f59e0b", // Orange
    "#10b981", // Green
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16" // Lime
  ];

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-500">Loading chart data...</p>
          </div>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-80">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-neutral-500 mb-4">No transaction data yet</p>
          <Link to="/transactions" className="btn btn-primary">
            Add Your First Transaction
          </Link>
        </div>
      );
    }

    switch (selectedChart) {
      case "trends":
        return (
          <div>
            <h4 className="text-sm font-medium text-neutral-600 mb-4">
              Daily Spending Trend (Last 30 Days)
            </h4>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={spendingTrendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                  formatter={(value: any) => formatCurrency(value, currency)}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                  name="Spending"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case "line":
        return (
          <div>
            <h4 className="text-sm font-medium text-neutral-600 mb-4">
              Income, Expenses & Net Cashflow Trends
            </h4>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                  formatter={(value: any) => formatCurrency(value, currency)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Income"
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Expenses"
                  dot={{ fill: "#ef4444", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="netCashflow"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  name="Net Cashflow"
                  dot={{ fill: "#3b82f6", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case "comparison":
        return (
          <div>
            <h4 className="text-sm font-medium text-neutral-600 mb-4">
              Income vs Expenses Comparison
            </h4>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="colorExpenses"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                  formatter={(value: any) => formatCurrency(value, currency)}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpenses)"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case "monthly":
        return (
          <div>
            <h4 className="text-sm font-medium text-neutral-600 mb-4">
              Monthly Financial Summary
            </h4>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                  formatter={(value: any) => formatCurrency(value, currency)}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  fill="#10b981"
                  name="Income"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  fill="#ef4444"
                  name="Expenses"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="netCashflow"
                  fill="#3b82f6"
                  name="Net Cashflow"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
              Net Cashflow
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
              Total Income
            </h3>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(statistics.totalIncome, currency)}
            </p>
            <p className="text-sm text-neutral-500 mt-1">All time</p>
          </div>

          <div className="card bg-danger/5 border-danger/20">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Total Expenses
            </h3>
            <p className="text-3xl font-bold text-danger">
              {formatCurrency(statistics.totalExpenses, currency)}
            </p>
            <p className="text-sm text-neutral-500 mt-1">All time</p>
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
              + Add Transaction
            </button>
            <button
              onClick={() => navigate("/savings")}
              className="btn btn-secondary"
            >
              + Create Savings Goal
            </button>
            <button
              onClick={() => navigate("/investments")}
              className="btn btn-outline"
            >
              + Record Investment
            </button>
          </div>
        </div>

        {/* Advanced Charts */}
        <div className="card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold">Financial Analytics</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "line", label: "Line Chart" },
                { key: "trends", label: "Spending Trends" },
                { key: "comparison", label: "Income vs Expenses" },
                { key: "monthly", label: "Monthly Summary" }
              ].map((chart) => (
                <button
                  key={chart.key}
                  onClick={() => setSelectedChart(chart.key as ChartType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedChart === chart.key
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {chart.label}
                </button>
              ))}
            </div>
          </div>

          {renderChart()}
        </div>

        {/* Two-column layout for transactions and top categories */}
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

          {/* Top spending categories */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Top Spending Categories
              </h3>
            </div>

            {categoryData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 mb-4">No expense data yet.</p>
                <button
                  onClick={() => navigate("/transactions")}
                  className="btn btn-secondary text-sm"
                >
                  Add Expense
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryData.slice(0, 5).map((cat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-700">
                        {cat.name}
                      </span>
                      <span className="text-sm font-bold text-neutral-900">
                        {formatCurrency(cat.value, currency)}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                    <p className="text-xs text-neutral-500">
                      {cat.percentage.toFixed(1)}% of total expenses
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
