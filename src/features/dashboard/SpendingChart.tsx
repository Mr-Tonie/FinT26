import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { loadTransactions } from "@/features/transactions/transactionStore";
import { formatCurrency } from "@/shared/utils/currency";
import { getMonthName } from "@/shared/utils/date";
import type { CurrencyCode } from "@/shared/types/financial.types";

interface SpendingChartProps {
  currency: CurrencyCode;
}

type ChartType = "bar" | "line" | "doughnut" | "category";

const COLORS = {
  income: "#10b981",
  expenses: "#ef4444",
  categories: [
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#f59e0b", // Amber
    "#10b981", // Green
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#6366f1" // Indigo
  ]
};

export function SpendingChart({ currency }: SpendingChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  const timeSeriesData = useMemo(() => {
    const transactions = loadTransactions();
    const now = new Date();
    const currentYear = now.getFullYear();

    // Get last 6 months
    const monthsData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentYear, now.getMonth() - i, 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const monthTransactions = transactions.filter((txn) => {
        const txnDate = new Date(txn.date);
        return (
          txnDate >= startDate &&
          txnDate <= endDate &&
          txn.currency === currency
        );
      });

      const income = monthTransactions
        .filter((txn) => txn.category.startsWith("income_"))
        .reduce((sum, txn) => sum + txn.amount, 0);

      const expenses = monthTransactions
        .filter((txn) => txn.category.startsWith("expense_"))
        .reduce((sum, txn) => sum + txn.amount, 0);

      monthsData.push({
        month: getMonthName(month).substring(0, 3),
        income,
        expenses,
        net: income - expenses
      });
    }

    return monthsData;
  }, [currency]);

  const categoryData = useMemo(() => {
    const transactions = loadTransactions();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    const monthTransactions = transactions.filter((txn) => {
      const txnDate = new Date(txn.date);
      return (
        txnDate >= startDate &&
        txnDate <= endDate &&
        txn.currency === currency &&
        txn.category.startsWith("expense_")
      );
    });

    const categoryMap: Record<string, number> = {};
    const categoryLabels: Record<string, string> = {
      expense_food: "Food & Groceries",
      expense_transport: "Transport",
      expense_housing: "Housing",
      expense_utilities: "Utilities",
      expense_healthcare: "Healthcare",
      expense_education: "Education",
      expense_entertainment: "Entertainment",
      expense_other: "Other"
    };

    monthTransactions.forEach((txn) => {
      categoryMap[txn.category] = (categoryMap[txn.category] || 0) + txn.amount;
    });

    return Object.entries(categoryMap)
      .map(([category, value]) => ({
        name: categoryLabels[category] || category,
        value
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [currency]);

  const doughnutData = useMemo(() => {
    const totalIncome = timeSeriesData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = timeSeriesData.reduce(
      (sum, d) => sum + d.expenses,
      0
    );

    return [
      { name: "Income", value: totalIncome },
      { name: "Expenses", value: totalExpenses }
    ].filter((item) => item.value > 0);
  }, [timeSeriesData]);

  const hasData = timeSeriesData.some((d) => d.income > 0 || d.expenses > 0);

  if (!hasData) {
    return null;
  }

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#737373", fontSize: 12 }}
                axisLine={{ stroke: "#d4d4d4" }}
              />
              <YAxis
                tick={{ fill: "#737373", fontSize: 12 }}
                axisLine={{ stroke: "#d4d4d4" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value, currency)}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #d4d4d4",
                  borderRadius: "8px",
                  padding: "8px 12px"
                }}
              />
              <Legend />
              <Bar
                dataKey="income"
                fill={COLORS.income}
                name="Income"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                fill={COLORS.expenses}
                name="Expenses"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#737373", fontSize: 12 }}
                axisLine={{ stroke: "#d4d4d4" }}
              />
              <YAxis
                tick={{ fill: "#737373", fontSize: 12 }}
                axisLine={{ stroke: "#d4d4d4" }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value, currency)}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #d4d4d4",
                  borderRadius: "8px",
                  padding: "8px 12px"
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke={COLORS.income}
                strokeWidth={3}
                name="Income"
                dot={{ fill: COLORS.income, r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke={COLORS.expenses}
                strokeWidth={3}
                name="Expenses"
                dot={{ fill: COLORS.expenses, r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Net Cashflow"
                dot={{ fill: "#3b82f6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "doughnut":
        return (
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={doughnutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={5}
                  dataKey="value"
                  label={(entry) =>
                    `${entry.name}: ${formatCurrency(entry.value, currency)}`
                  }
                  labelLine={{ stroke: "#737373" }}
                >
                  {doughnutData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === "Income"
                          ? COLORS.income
                          : COLORS.expenses
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #d4d4d4",
                    borderRadius: "8px",
                    padding: "8px 12px"
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case "category":
        return categoryData.length > 0 ? (
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={5}
                  dataKey="value"
                  label={(entry) =>
                    `${entry.name}: ${formatCurrency(entry.value, currency)}`
                  }
                  labelLine={{ stroke: "#737373" }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS.categories[index % COLORS.categories.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #d4d4d4",
                    borderRadius: "8px",
                    padding: "8px 12px"
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            No expense data for current month
          </div>
        );

      default:
        return null;
    }
  };

  const getChartTitle = () => {
    switch (chartType) {
      case "bar":
        return "Income vs Expenses (Last 6 Months)";
      case "line":
        return "Financial Trend Analysis (Last 6 Months)";
      case "doughnut":
        return "Total Income vs Expenses (Last 6 Months)";
      case "category":
        return "Expense Breakdown by Category (Current Month)";
      default:
        return "Financial Chart";
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">
          {getChartTitle()}
        </h3>

        {/* Chart Type Selector */}
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              chartType === "bar"
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
            title="Bar Chart"
          >
            Bar
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              chartType === "line"
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
            title="Line Chart"
          >
            Line
          </button>
          <button
            onClick={() => setChartType("doughnut")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              chartType === "doughnut"
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
            title="Doughnut Chart"
          >
            Doughnut
          </button>
          <button
            onClick={() => setChartType("category")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              chartType === "category"
                ? "bg-primary-600 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
            title="Category Breakdown"
          >
            Categories
          </button>
        </div>
      </div>

      {renderChart()}

      {/* Chart Legend/Description */}
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {chartType === "bar" && (
            <>
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: COLORS.income }}
                ></div>
                <span className="text-neutral-600">Green = Income</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: COLORS.expenses }}
                ></div>
                <span className="text-neutral-600">Red = Expenses</span>
              </div>
            </>
          )}
          {chartType === "line" && (
            <>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-0.5"
                  style={{ backgroundColor: COLORS.income }}
                ></div>
                <span className="text-neutral-600">Income trend</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-0.5"
                  style={{ backgroundColor: COLORS.expenses }}
                ></div>
                <span className="text-neutral-600">Expense trend</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-primary-600"></div>
                <span className="text-neutral-600">Net cashflow</span>
              </div>
            </>
          )}
          {chartType === "doughnut" && (
            <div className="col-span-2 text-neutral-600">
              Proportional view of total income vs total expenses over the last
              6 months
            </div>
          )}
          {chartType === "category" && (
            <div className="col-span-2 text-neutral-600">
              Current month's spending breakdown by category
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
