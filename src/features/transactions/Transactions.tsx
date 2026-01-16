import { useState, FormEvent } from "react";
import { Layout } from "@/shared/components/Layout";
import { createTransaction, loadTransactions } from "./transactionStore";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import type {
  Transaction,
  TransactionCategory,
  PaymentMethod,
  CurrencyCode
} from "@/shared/types/financial.types";

export function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(
    loadTransactions()
  );

  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense"
  );
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    currency: "USD" as CurrencyCode,
    category: "expense_food" as TransactionCategory,
    paymentMethod: "cash" as PaymentMethod,
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const newTransaction = createTransaction({
      date: new Date(formData.date),
      description: formData.description,
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      category: formData.category,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || undefined
    });

    setTransactions([newTransaction, ...transactions]);

    setFormData({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      currency: "USD",
      category:
        transactionType === "income"
          ? ("income_salary" as TransactionCategory)
          : ("expense_food" as TransactionCategory),
      paymentMethod: "cash",
      notes: ""
    });

    setShowForm(false);
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
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value as PaymentMethod
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
                <button type="submit" className="btn btn-primary flex-1">
                  Add Transaction
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-outline"
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

          {transactions.length === 0 ? (
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
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">
                      {txn.description}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formatDate(txn.date)} ·{" "}
                      {CATEGORY_LABELS[txn.category] || txn.category}
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
      </div>
    </Layout>
  );
}
