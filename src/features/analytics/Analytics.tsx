import { useState, useEffect } from "react";
import { Layout } from "@/shared/components/Layout";
import { firebaseAuthService } from "@/services/firebase/auth.service";
import { firestoreService } from "@/services/firebase/firestore.service";
import { formatCurrency } from "@/shared/utils/currency";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export function Analytics() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const user = firebaseAuthService.getCurrentUser();

    if (user) {
      const txns = await firestoreService.transactions.getAll(user.uid);
      setTransactions(txns);
    }

    setLoading(false);
  };

  // Get spending by category
  const getCategoryBreakdown = () => {
    const categories: Record<string, number> = {};

    transactions.forEach((txn) => {
      if (txn.category.startsWith("expense_")) {
        const category = txn.category.replace("expense_", "");
        categories[category] = (categories[category] || 0) + txn.amount;
      }
    });

    return Object.entries(categories)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "),
        value
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Get daily spending trend
  const getDailySpending = () => {
    const days: Record<string, number> = {};
    const now = new Date();

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString("en-US", { weekday: "short" });
      days[key] = 0;
    }

    transactions.forEach((txn) => {
      const txnDate = new Date(txn.date);
      const key = txnDate.toLocaleDateString("en-US", { weekday: "short" });

      if (days.hasOwnProperty(key) && txn.category.startsWith("expense_")) {
        days[key] += txn.amount;
      }
    });

    return Object.entries(days).map(([day, amount]) => ({ day, amount }));
  };

  // Get monthly comparison (last 6 months)
  const getMonthlyComparison = () => {
    const months: Record<string, { income: number; expenses: number }> = {};

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = date.toLocaleDateString("en-US", { month: "short" });
      months[key] = { income: 0, expenses: 0 };
    }

    transactions.forEach((txn) => {
      const date = new Date(txn.date);
      const key = date.toLocaleDateString("en-US", { month: "short" });

      if (months[key]) {
        if (txn.category.startsWith("income_")) {
          months[key].income += txn.amount;
        } else {
          months[key].expenses += txn.amount;
        }
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      savings: data.income - data.expenses
    }));
  };

  // Get top expenses
  const getTopExpenses = () => {
    return transactions
      .filter((txn) => txn.category.startsWith("expense_"))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  // Calculate stats
  const calculateStats = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const thisMonthTxns = transactions.filter((txn) => {
      const date = new Date(txn.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);
    const lastMonthTxns = transactions.filter((txn) => {
      const date = new Date(txn.date);
      return (
        date.getMonth() === lastMonth.getMonth() &&
        date.getFullYear() === lastMonth.getFullYear()
      );
    });

    const thisMonthSpending = thisMonthTxns
      .filter((txn) => txn.category.startsWith("expense_"))
      .reduce((sum, txn) => sum + txn.amount, 0);

    const lastMonthSpending = lastMonthTxns
      .filter((txn) => txn.category.startsWith("expense_"))
      .reduce((sum, txn) => sum + txn.amount, 0);

    const changePercent =
      lastMonthSpending > 0
        ? ((thisMonthSpending - lastMonthSpending) / lastMonthSpending) * 100
        : 0;

    const avgTransaction =
      transactions.length > 0
        ? transactions.reduce((sum, txn) => sum + txn.amount, 0) /
          transactions.length
        : 0;

    return {
      thisMonthSpending,
      lastMonthSpending,
      changePercent,
      avgTransaction,
      totalTransactions: transactions.length
    };
  };

  const categoryData = getCategoryBreakdown();
  const dailyData = getDailySpending();
  const monthlyData = getMonthlyComparison();
  const topExpenses = getTopExpenses();
  const stats = calculateStats();

  const COLORS = [
    "#646cff",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899"
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-500 dark:text-neutral-400">
              Loading analytics...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (transactions.length === 0) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            No Data Yet
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Start adding transactions to see your analytics
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Analytics
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Deep insights into your spending patterns
            </p>
          </div>

          <div className="flex gap-2">
            {(["week", "month", "year"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              This Month Spending
            </h3>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {formatCurrency(stats.thisMonthSpending, "USD")}
            </p>
            <p
              className={`text-sm mt-2 flex items-center gap-1 ${
                stats.changePercent > 0 ? "text-danger" : "text-success"
              }`}
            >
              {stats.changePercent > 0 ? "↑" : "↓"}
              {Math.abs(stats.changePercent).toFixed(1)}% from last month
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Average Transaction
            </h3>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {formatCurrency(stats.avgTransaction, "USD")}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              Across all transactions
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Total Transactions
            </h3>
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {stats.totalTransactions}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              All time
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              Biggest Category
            </h3>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {categoryData[0]?.name || "N/A"}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
              {categoryData[0]
                ? formatCurrency(categoryData[0].value, "USD")
                : "$0"}
            </p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Spending */}
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Daily Spending (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                  formatter={(value: any) => formatCurrency(value, "USD")}
                />
                <Bar dataKey="amount" fill="#646cff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Spending by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatCurrency(value, "USD")}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            6-Month Comparison
          </h3>
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
                formatter={(value: any) => formatCurrency(value, "USD")}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                name="Income"
                dot={{ fill: "#10b981", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                name="Expenses"
                dot={{ fill: "#ef4444", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="savings"
                stroke="#646cff"
                strokeWidth={3}
                strokeDasharray="5 5"
                name="Savings"
                dot={{ fill: "#646cff", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Expenses */}
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Top 5 Expenses
          </h3>
          <div className="space-y-3">
            {topExpenses.map((txn, index) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {txn.description}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {new Date(txn.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-danger">
                  {formatCurrency(txn.amount, txn.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
