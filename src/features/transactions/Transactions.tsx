import { useState, useEffect, FormEvent } from "react";
import { Layout } from "@/shared/components/Layout";
import { transactionsAPI } from "@/shared/services/api";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import type {
  TransactionCategory,
  PaymentMethod,
  CurrencyCode
} from "@/shared/types/financial.types";

export function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense"
  );
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    currency: "USD" as CurrencyCode,
    category: "expense_food" as TransactionCategory,
    payment_method: "cash" as PaymentMethod,
    notes: ""
  });

  const incomeCategories = [
    { value: "income_salary" as TransactionCategory, label: "Salary" },
    {
      value: "income_business" as TransactionCategory,
      label: "Business Income"
    },
    {
      value: "income_investment" as TransactionCategory,
      label: "Investment Returns"
    },
    { value: "income_other" as TransactionCategory, label: "Other Income" }
  ];

  const expenseCategories = [
    { value: "expense_food" as TransactionCategory, label: "Food & Groceries" },
    { value: "expense_transport" as TransactionCategory, label: "Transport" },
    {
      value: "expense_housing" as TransactionCategory,
      label: "Housing & Rent"
    },
    { value: "expense_utilities" as TransactionCategory, label: "Utilities" },
    { value: "expense_healthcare" as TransactionCategory, label: "Healthcare" },
    { value: "expense_education" as TransactionCategory, label: "Education" },
    {
      value: "expense_entertainment" as TransactionCategory,
      label: "Entertainment"
    },
    { value: "expense_other" as TransactionCategory, label: "Other Expenses" }
  ];

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    setError("");

    const result = await transactionsAPI.getAll();

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.data?.transactions) {
      setTransactions(result.data.transactions);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await transactionsAPI.create({
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      category: formData.category,
      payment_method: formData.payment_method,
      notes: formData.notes || undefined
    });

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    if (result.data?.transaction) {
      setTransactions([result.data.transaction, ...transactions]);

      setFormData({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        currency: "USD",
        category:
          transactionType === "income"
            ? ("income_salary" as TransactionCategory)
            : ("expense_food" as TransactionCategory),
        payment_method: "cash",
        notes: ""
      });

      setShowForm(false);
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    const result = await transactionsAPI.delete(id);

    if (result.error) {
      setError(result.error);
      return;
    }

    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const categories =
    transactionType === "income" ? incomeCategories : expenseCategories;

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">
              Transactions
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Track your income and expenses
            </p>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              + Add Transaction
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-md">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {showForm && (
          <div className="card">
            <h3 className="text-xl font-semibold text-neutral-900 mb-6">
              Add New Transaction
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Transaction Type</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType("income");
                      setFormData((prev) => ({
                        ...prev,
                        category: "income_salary" as TransactionCategory
                      }));
                    }}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      transactionType === "income"
                        ? "bg-success text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType("expense");
                      setFormData((prev) => ({
                        ...prev,
                        category: "expense_food" as TransactionCategory
                      }));
                    }}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      transactionType === "expense"
                        ? "bg-danger text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="date">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="description">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value
                    }))
                  }
                  className="input"
                  placeholder="e.g., Monthly salary, Grocery shopping"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="amount">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value
                      }))
                    }
                    className="input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="label" htmlFor="currency">
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currency: e.target.value as CurrencyCode
                      }))
                    }
                    className="input"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ZWL">ZWL</option>
                    <option value="ZIG">ZIG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value as TransactionCategory
                    }))
                  }
                  className="input"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="paymentMethod">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      payment_method: e.target.value as PaymentMethod
                    }))
                  }
                  className="input"
                >
                  <option value="cash">Cash</option>
                  <option value="ecocash">EcoCash</option>
                  <option value="onamii">Onamii</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="notes">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="input"
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? "Adding..." : "Add Transaction"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-outline"
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <h3 className="text-xl font-semibold text-neutral-900 mb-6">
            All Transactions
          </h3>

          {loading && (
            <div className="text-center py-12">
              <p className="text-neutral-500">Loading transactions...</p>
            </div>
          )}

          {!loading && transactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">
                No transactions yet. Add your first transaction to get started.
              </p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary"
                >
                  Add Your First Transaction
                </button>
              )}
            </div>
          )}

          {!loading && transactions.length > 0 && (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-3 px-4 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">
                      {txn.description}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formatDate(new Date(txn.date))} ·{" "}
                      {CATEGORY_LABELS[txn.category] || txn.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
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
                    <button
                      onClick={() => handleDelete(txn.id)}
                      className="text-danger hover:text-red-700 p-2"
                      title="Delete transaction"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
