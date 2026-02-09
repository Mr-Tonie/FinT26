import { useState, useEffect } from "react";
import { Layout } from "@/shared/components/Layout";
import { formatCurrency } from "@/shared/utils/currency";
import type { CurrencyCode } from "@/shared/types/financial.types";
import { firebaseAuthService } from "@/services/firebase/auth.service";
import { firestoreService } from "@/services/firebase/firestore.service";

interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  currency: CurrencyCode;
  period: "monthly" | "weekly" | "yearly";
  startDate: Date;
  rollover: boolean;
}

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    category: "",
    limit: "",
    currency: "USD" as CurrencyCode,
    period: "monthly" as "monthly" | "weekly" | "yearly",
    rollover: false
  });

  useEffect(() => {
    loadBudgets();
    loadTransactions();
  }, []);

  const loadBudgets = async () => {
    setLoading(true);
    const user = firebaseAuthService.getCurrentUser();

    if (user) {
      const budgetsList = await firestoreService.budgets.getAll(user.uid);
      setBudgets(budgetsList as Budget[]);
    }

    setLoading(false);
  };

  const loadTransactions = async () => {
    const user = firebaseAuthService.getCurrentUser();

    if (user) {
      const txns = await firestoreService.transactions.getAll(user.uid);
      setTransactions(txns);
    }
  };

  const calculateSpent = (budget: Budget) => {
    const now = new Date();
    let startDate = new Date(budget.startDate);

    // Calculate period start based on budget period
    if (budget.period === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (budget.period === "weekly") {
      const day = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day);
    } else if (budget.period === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const spent = transactions
      .filter((txn) => {
        const txnDate = new Date(txn.date);
        const matchesCategory = txn.category === budget.category;
        const withinPeriod = txnDate >= startDate && txnDate <= now;
        const matchesCurrency = txn.currency === budget.currency;

        return matchesCategory && withinPeriod && matchesCurrency;
      })
      .reduce((sum, txn) => sum + txn.amount, 0);

    return spent;
  };

  const getPercentage = (budget: Budget) => {
    const spent = calculateSpent(budget);
    return Math.min((spent / budget.limit) * 100, 100);
  };

  const getStatus = (percentage: number) => {
    if (percentage >= 100) return { color: "danger", label: "Over Budget" };
    if (percentage >= 80) return { color: "warning", label: "Warning" };
    if (percentage >= 50) return { color: "primary", label: "On Track" };
    return { color: "success", label: "Good" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = firebaseAuthService.getCurrentUser();
    if (!user) return;

    try {
      await firestoreService.budgets.create(user.uid, {
        category: formData.category,
        limit: parseFloat(formData.limit),
        currency: formData.currency,
        period: formData.period,
        rollover: formData.rollover
      });

      setShowModal(false);
      setFormData({
        category: "",
        limit: "",
        currency: "USD",
        period: "monthly",
        rollover: false
      });

      loadBudgets();
    } catch (error) {
      console.error("Error creating budget:", error);
      alert("Failed to create budget");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    try {
      await firestoreService.budgets.delete(id);
      loadBudgets();
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert("Failed to delete budget");
    }
  };

  const CATEGORY_LABELS: Record<string, string> = {
    expense_food: "Food & Groceries",
    expense_transport: "Transport",
    expense_housing: "Housing & Rent",
    expense_utilities: "Utilities",
    expense_healthcare: "Healthcare",
    expense_education: "Education",
    expense_entertainment: "Entertainment",
    expense_other: "Other Expenses"
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + calculateSpent(b), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">
              Budget Management
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Set spending limits and track your progress
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + Create Budget
          </button>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Total Budget
            </h3>
            <p className="text-3xl font-bold text-primary-600">
              {formatCurrency(totalBudget, "USD")}
            </p>
            <p className="text-sm text-neutral-500 mt-1">This month</p>
          </div>

          <div className="card bg-danger/5 border-danger/20">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Total Spent
            </h3>
            <p className="text-3xl font-bold text-danger">
              {formatCurrency(totalSpent, "USD")}
            </p>
            <p className="text-sm text-neutral-500 mt-1">This month</p>
          </div>

          <div
            className={`card ${
              totalSpent <= totalBudget
                ? "bg-success/5 border-success/20"
                : "bg-warning/5 border-warning/20"
            }`}
          >
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Remaining
            </h3>
            <p
              className={`text-3xl font-bold ${
                totalSpent <= totalBudget ? "text-success" : "text-warning"
              }`}
            >
              {formatCurrency(totalBudget - totalSpent, "USD")}
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              {totalBudget > 0
                ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% used`
                : "0% used"}
            </p>
          </div>
        </div>

        {/* Budgets List */}
        {loading ? (
          <div className="card">
            <p className="text-center py-12 text-neutral-500">
              Loading budgets...
            </p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">No budgets created yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                Create Your First Budget
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const spent = calculateSpent(budget);
              const percentage = getPercentage(budget);
              const status = getStatus(percentage);
              const remaining = budget.limit - spent;

              return (
                <div
                  key={budget.id}
                  className={`card border-2 ${
                    percentage >= 100
                      ? "border-danger/50 bg-danger/5"
                      : percentage >= 80
                        ? "border-warning/50 bg-warning/5"
                        : "border-neutral-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {CATEGORY_LABELS[budget.category]}
                      </h3>
                      <p className="text-sm text-neutral-600 capitalize">
                        {budget.period} budget
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full text-${status.color} bg-${status.color}/10`}
                    >
                      {status.label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-neutral-600">Progress</span>
                      <span className="font-semibold text-neutral-900">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          percentage >= 100
                            ? "bg-danger"
                            : percentage >= 80
                              ? "bg-warning"
                              : "bg-success"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Budget Limit</span>
                      <span className="font-semibold text-neutral-900">
                        {formatCurrency(budget.limit, budget.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Spent</span>
                      <span className="font-semibold text-danger">
                        {formatCurrency(spent, budget.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Remaining</span>
                      <span
                        className={`font-semibold ${
                          remaining >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {formatCurrency(Math.abs(remaining), budget.currency)}
                        {remaining < 0 && " over"}
                      </span>
                    </div>
                  </div>

                  {/* Warning Messages */}
                  {percentage >= 100 && (
                    <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                      <p className="text-sm text-danger font-medium">
                        You've exceeded your budget!
                      </p>
                    </div>
                  )}
                  {percentage >= 80 && percentage < 100 && (
                    <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm text-warning font-medium">
                        Approaching budget limit
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="btn btn-outline text-sm text-danger border-danger hover:bg-danger/10 flex-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">
                Create Budget
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">Select category</option>
                  <option value="expense_food">Food & Groceries</option>
                  <option value="expense_transport">Transport</option>
                  <option value="expense_housing">Housing & Rent</option>
                  <option value="expense_utilities">Utilities</option>
                  <option value="expense_healthcare">Healthcare</option>
                  <option value="expense_education">Education</option>
                  <option value="expense_entertainment">Entertainment</option>
                  <option value="expense_other">Other Expenses</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Budget Limit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.limit}
                    onChange={(e) =>
                      setFormData({ ...formData, limit: e.target.value })
                    }
                    className="input"
                    placeholder="500"
                    required
                  />
                </div>

                <div>
                  <label className="label">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currency: e.target.value as CurrencyCode
                      })
                    }
                    className="input"
                  >
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                    <option value="ZIG">ZIG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Budget Period</label>
                <select
                  value={formData.period}
                  onChange={(e) =>
                    setFormData({ ...formData, period: e.target.value as any })
                  }
                  className="input"
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rollover"
                  checked={formData.rollover}
                  onChange={(e) =>
                    setFormData({ ...formData, rollover: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="rollover" className="text-sm text-neutral-700">
                  Rollover unused budget to next period
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
