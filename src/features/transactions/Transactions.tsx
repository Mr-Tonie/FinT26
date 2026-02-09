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

export function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("all");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    currency: "USD" as CurrencyCode,
    category: "" as TransactionCategory,
    payment_method: "" as PaymentMethod,
    notes: ""
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    transactions,
    searchQuery,
    selectedCategory,
    selectedPaymentMethod,
    selectedCurrency,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount
  ]);

  const loadTransactions = async () => {
    setLoading(true);
    const user = firebaseAuthService.getCurrentUser();

    if (user) {
      const txns = await firestoreService.transactions.getAll(user.uid);
      setTransactions(txns);
    }

    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (txn) =>
          txn.description.toLowerCase().includes(query) ||
          txn.notes?.toLowerCase().includes(query) ||
          txn.amount.toString().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((txn) => txn.category === selectedCategory);
    }

    // Payment method filter
    if (selectedPaymentMethod !== "all") {
      filtered = filtered.filter(
        (txn) => txn.payment_method === selectedPaymentMethod
      );
    }

    // Currency filter
    if (selectedCurrency !== "all") {
      filtered = filtered.filter((txn) => txn.currency === selectedCurrency);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(
        (txn) => new Date(txn.date) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (txn) => new Date(txn.date) <= new Date(dateTo)
      );
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter((txn) => txn.amount >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter((txn) => txn.amount <= parseFloat(maxAmount));
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPaymentMethod("all");
    setSelectedCurrency("all");
    setDateFrom("");
    setDateTo("");
    setMinAmount("");
    setMaxAmount("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = firebaseAuthService.getCurrentUser();
    if (!user) return;

    try {
      await firestoreService.transactions.create(user.uid, formData);

      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        currency: "USD",
        category: "" as TransactionCategory,
        payment_method: "" as PaymentMethod,
        notes: ""
      });

      loadTransactions();
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Failed to create transaction");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;

    try {
      await firestoreService.transactions.delete(id);
      loadTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction");
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

  const activeFilterCount = [
    searchQuery,
    selectedCategory !== "all",
    selectedPaymentMethod !== "all",
    selectedCurrency !== "all",
    dateFrom,
    dateTo,
    minAmount,
    maxAmount
  ].filter(Boolean).length;

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

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + Add Transaction
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="card">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions by description, notes, or amount..."
                  className="input pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${showFilters ? "btn-primary" : "btn-outline"} relative`}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="btn btn-outline text-danger border-danger hover:bg-danger/10"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="label">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="input"
                    >
                      <option value="all">All Categories</option>
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
                        <option value="expense_entertainment">
                          Entertainment
                        </option>
                        <option value="expense_other">Other Expenses</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Payment Method Filter */}
                  <div>
                    <label className="label">Payment Method</label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="input"
                    >
                      <option value="all">All Methods</option>
                      <option value="Cash">Cash</option>
                      <option value="EcoCash">EcoCash</option>
                      <option value="Onamii">Onamii</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>

                  {/* Currency Filter */}
                  <div>
                    <label className="label">Currency</label>
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value)}
                      className="input"
                    >
                      <option value="all">All Currencies</option>
                      <option value="USD">USD</option>
                      <option value="ZWL">ZWL</option>
                      <option value="ZIG">ZIG</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Range */}
                  <div>
                    <label className="label">Date Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="input"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="input"
                        placeholder="To"
                      />
                    </div>
                  </div>

                  {/* Amount Range */}
                  <div>
                    <label className="label">Amount Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="input"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="input"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Summary */}
            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm text-primary-700">
                  Showing{" "}
                  <span className="font-bold">
                    {filteredTransactions.length}
                  </span>{" "}
                  of <span className="font-bold">{transactions.length}</span>{" "}
                  transactions
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="card">
            <p className="text-center py-12 text-neutral-500">
              Loading transactions...
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              {transactions.length === 0 ? (
                <>
                  <p className="text-neutral-500 mb-4">No transactions yet</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary"
                  >
                    Add Your First Transaction
                  </button>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-neutral-500 mb-4">
                    No transactions match your filters
                  </p>
                  <button onClick={clearFilters} className="btn btn-outline">
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        {formatDate(new Date(txn.date))}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        <div>
                          <p className="font-medium">{txn.description}</p>
                          {txn.notes && (
                            <p className="text-xs text-neutral-500 mt-1">
                              {txn.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {CATEGORY_LABELS[txn.category]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {txn.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span
                          className={`font-semibold ${
                            txn.category.startsWith("income_")
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {txn.category.startsWith("income_") ? "+" : "-"}
                          {formatCurrency(txn.amount, txn.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <button
                          onClick={() => handleDelete(txn.id)}
                          className="text-danger hover:text-danger/80"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Modal (same as before) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">
                Add Transaction
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input"
                  placeholder="e.g., Grocery shopping"
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
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_method: e.target.value as PaymentMethod
                    })
                  }
                  className="input"
                  required
                >
                  <option value="">Select method</option>
                  <option value="Cash">Cash</option>
                  <option value="EcoCash">EcoCash</option>
                  <option value="Onamii">Onamii</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
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
                  placeholder="Additional details..."
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
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
