import { useState, useEffect } from "react";
import { Layout } from "@/shared/components/Layout";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import type {
  CurrencyCode,
  TransactionCategory,
  PaymentMethod
} from "@/shared/types/financial.types";
import { firebaseAuthService } from "@/services/firebase/auth.service";
import { firestoreService } from "@/services/firebase/firestore.service";

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  category: TransactionCategory;
  paymentMethod: PaymentMethod;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  startDate: Date;
  endDate: Date | null;
  nextDate: Date;
  lastProcessed: Date | null;
  active: boolean;
  notes: string | null;
}

export function RecurringTransactions() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    currency: "USD" as CurrencyCode,
    category: "" as TransactionCategory,
    paymentMethod: "" as PaymentMethod,
    frequency: "monthly" as "daily" | "weekly" | "monthly" | "yearly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: ""
  });

  useEffect(() => {
    loadRecurring();
  }, []);

  const loadRecurring = async () => {
    setLoading(true);
    const user = firebaseAuthService.getCurrentUser();

    if (user) {
      const recurringList = await firestoreService.recurring.getAll(user.uid);
      setRecurring(recurringList as RecurringTransaction[]);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = firebaseAuthService.getCurrentUser();
    if (!user) return;

    try {
      await firestoreService.recurring.create(user.uid, {
        description: formData.description,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        notes: formData.notes || null
      });

      setShowModal(false);
      setFormData({
        description: "",
        amount: "",
        currency: "USD",
        category: "" as TransactionCategory,
        paymentMethod: "" as PaymentMethod,
        frequency: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        notes: ""
      });

      loadRecurring();
    } catch (error) {
      console.error("Error creating recurring transaction:", error);
      alert("Failed to create recurring transaction");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this recurring transaction?"
      )
    )
      return;

    try {
      await firestoreService.recurring.delete(id);
      loadRecurring();
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      alert("Failed to delete recurring transaction");
    }
  };

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
              Recurring Transactions
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Automate your regular income and expenses
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + Add Recurring
          </button>
        </div>

        {loading ? (
          <div className="card">
            <p className="text-center py-12 text-neutral-500">
              Loading recurring transactions...
            </p>
          </div>
        ) : recurring.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">
                No recurring transactions yet
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                Add Your First Recurring Transaction
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recurring.map((txn) => (
              <div key={txn.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {txn.description}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {CATEGORY_LABELS[txn.category]} · {txn.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${
                        txn.category.startsWith("income_")
                          ? "text-success"
                          : "text-danger"
                      }`}
                    >
                      {txn.category.startsWith("income_") ? "+" : "-"}
                      {formatCurrency(txn.amount, txn.currency)}
                    </p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {txn.frequency}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-xs text-neutral-600 mb-1">Next Date</p>
                    <p className="font-semibold text-neutral-900">
                      {formatDate(new Date(txn.nextDate))}
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-xs text-neutral-600 mb-1">Started</p>
                    <p className="font-semibold text-neutral-900">
                      {formatDate(new Date(txn.startDate))}
                    </p>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg">
                    <p className="text-xs text-neutral-600 mb-1">
                      Last Processed
                    </p>
                    <p className="font-semibold text-neutral-900">
                      {txn.lastProcessed
                        ? formatDate(new Date(txn.lastProcessed))
                        : "Never"}
                    </p>
                  </div>
                </div>

                {txn.notes && (
                  <p className="text-sm text-neutral-600 mb-4">{txn.notes}</p>
                )}

                <button
                  onClick={() => handleDelete(txn.id)}
                  className="btn btn-outline text-sm text-danger border-danger hover:bg-danger/10"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">
                Add Recurring Transaction
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input"
                  placeholder="e.g., Monthly Rent, Netflix Subscription"
                  required
                />
              </div>

              <div>
                <label className="label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as TransactionCategory
                    })
                  }
                  className="input"
                  required
                >
                  <option value="">Select category</option>
                  <optgroup label="Income">
                    <option value="income_salary">Salary</option>
                    <option value="income_business">Business Income</option>
                    <option value="income_investment">
                      Investment Returns
                    </option>
                    <option value="income_other">Other Income</option>
                  </optgroup>
                  <optgroup label="Expenses">
                    <option value="expense_food">Food & Groceries</option>
                    <option value="expense_transport">Transport</option>
                    <option value="expense_housing">Housing & Rent</option>
                    <option value="expense_utilities">Utilities</option>
                    <option value="expense_healthcare">Healthcare</option>
                    <option value="expense_education">Education</option>
                    <option value="expense_entertainment">Entertainment</option>
                    <option value="expense_other">Other Expenses</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="input"
                    placeholder="0.00"
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
                    required
                  >
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                    <option value="ZIG">ZIG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentMethod: e.target.value as PaymentMethod
                    })
                  }
                  className="input"
                  required
                >
                  <option value="">Select method</option>
                  <option value="Cash">Cash</option>
                  <option value="EcoCash">EcoCash</option>
                  <option value="Onamii">Omari</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="label">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      frequency: e.target.value as any
                    })
                  }
                  className="input"
                  required
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="input"
                  rows={3}
                  placeholder="Additional information..."
                />
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
                  Add Recurring Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
