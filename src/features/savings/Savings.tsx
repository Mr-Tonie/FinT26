import { useState, useEffect } from "react";
import { Layout } from "@/shared/components/Layout";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import type { CurrencyCode } from "@/shared/types/financial.types";
import { firebaseAuthService } from "@/services/firebase/auth.service";
import { firestoreService } from "@/services/firebase/firestore.service";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  deadline: string | null;
  description: string | null;
  createdAt: any;
}

export function Savings() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [addAmount, setAddAmount] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    currency: "USD" as CurrencyCode,
    deadline: "",
    description: ""
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    const user = firebaseAuthService.getCurrentUser();

    if (user) {
      const savingsGoals = await firestoreService.savingsGoals.getAll(user.uid);
      setGoals(savingsGoals as SavingsGoal[]);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = firebaseAuthService.getCurrentUser();
    if (!user) return;

    try {
      await firestoreService.savingsGoals.create(user.uid, {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        currency: formData.currency,
        deadline: formData.deadline || null,
        description: formData.description || null
      });

      setShowModal(false);
      setFormData({
        name: "",
        targetAmount: "",
        currentAmount: "",
        currency: "USD",
        deadline: "",
        description: ""
      });

      loadGoals();
    } catch (error) {
      console.error("Error creating savings goal:", error);
      alert("Failed to create savings goal");
    }
  };

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGoal) return;

    try {
      const newAmount = selectedGoal.currentAmount + parseFloat(addAmount);
      await firestoreService.savingsGoals.update(selectedGoal.id, newAmount);

      setShowAddMoneyModal(false);
      setSelectedGoal(null);
      setAddAmount("");
      loadGoals();
    } catch (error) {
      console.error("Error updating savings goal:", error);
      alert("Failed to update savings goal");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this savings goal?"))
      return;

    try {
      await firestoreService.savingsGoals.delete(id);
      loadGoals();
    } catch (error) {
      console.error("Error deleting savings goal:", error);
      alert("Failed to delete savings goal");
    }
  };

  const getProgress = (goal: SavingsGoal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;

    const today = new Date();
    const end = new Date(deadline);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">
              Savings Goals
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Track your progress towards your financial goals
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + Create Goal
          </button>
        </div>

        {loading ? (
          <div className="card">
            <p className="text-center py-12 text-neutral-500">
              Loading goals...
            </p>
          </div>
        ) : goals.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-neutral-500 mb-4">No savings goals yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                Create Your First Goal
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const progress = getProgress(goal);
              const daysRemaining = getDaysRemaining(goal.deadline);
              const isCompleted = progress >= 100;

              return (
                <div
                  key={goal.id}
                  className={`card ${isCompleted ? "border-2 border-success" : ""}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {goal.name}
                      </h3>
                      {goal.description && (
                        <p className="text-sm text-neutral-600 mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                    {isCompleted && <span className="text-2xl">🎉</span>}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-neutral-600">Progress</span>
                      <span className="font-semibold text-neutral-900">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          isCompleted ? "bg-success" : "bg-primary-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <p className="text-2xl font-bold text-neutral-900">
                          {formatCurrency(goal.currentAmount, goal.currency)}
                        </p>
                        <p className="text-sm text-neutral-600">
                          of {formatCurrency(goal.targetAmount, goal.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-neutral-700">
                          {formatCurrency(
                            goal.targetAmount - goal.currentAmount,
                            goal.currency
                          )}
                        </p>
                        <p className="text-xs text-neutral-500">remaining</p>
                      </div>
                    </div>
                  </div>

                  {/* Deadline */}
                  {goal.deadline && (
                    <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">Deadline</span>
                        <span className="font-medium text-neutral-900">
                          {formatDate(new Date(goal.deadline))}
                        </span>
                      </div>
                      {daysRemaining !== null && (
                        <p
                          className={`text-xs mt-1 ${
                            daysRemaining < 0
                              ? "text-danger"
                              : daysRemaining < 30
                                ? "text-warning"
                                : "text-neutral-600"
                          }`}
                        >
                          {daysRemaining < 0
                            ? `${Math.abs(daysRemaining)} days overdue`
                            : daysRemaining === 0
                              ? "Due today!"
                              : `${daysRemaining} days remaining`}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowAddMoneyModal(true);
                      }}
                      className="btn btn-primary flex-1 text-sm"
                    >
                      Add Money
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="btn btn-outline text-sm text-danger border-danger hover:bg-danger/10"
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

      {/* Create Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">
                Create Savings Goal
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Goal Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input"
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Target Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAmount: e.target.value })
                    }
                    className="input"
                    placeholder="5000"
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
                <label className="label">Starting Amount (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, currentAmount: e.target.value })
                  }
                  className="input"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="label">Deadline (Optional)</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="input"
                />
              </div>

              <div>
                <label className="label">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input"
                  rows={3}
                  placeholder="What are you saving for?"
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
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {showAddMoneyModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">
                Add Money to {selectedGoal.name}
              </h3>
            </div>

            <form onSubmit={handleAddMoney} className="p-6 space-y-4">
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-neutral-600">Current Amount</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(
                    selectedGoal.currentAmount,
                    selectedGoal.currency
                  )}
                </p>
              </div>

              <div>
                <label className="label">Amount to Add</label>
                <input
                  type="number"
                  step="0.01"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="input"
                  placeholder="0.00"
                  required
                  min="0.01"
                />
              </div>

              {addAmount && (
                <div className="p-4 bg-success/10 rounded-lg">
                  <p className="text-sm text-neutral-600">New Amount</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(
                      selectedGoal.currentAmount + parseFloat(addAmount),
                      selectedGoal.currency
                    )}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMoneyModal(false);
                    setSelectedGoal(null);
                    setAddAmount("");
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Add Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
