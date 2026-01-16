import { useState, FormEvent } from "react";
import { Layout } from "@/shared/components/Layout";
import {
  loadSavingsGoals,
  calculateProgress,
  isGoalCompleted
} from "./savingsStore";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import type { SavingsGoal, CurrencyCode } from "@/shared/types/financial.types";

export function Savings() {
  const [showForm, setShowForm] = useState(false);
  const [goals, setGoals] = useState<SavingsGoal[]>(loadSavingsGoals());

  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    currency: "USD" as CurrencyCode,
    deadline: "",
    description: ""
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const newGoal: SavingsGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount || "0"),
      currency: formData.currency,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      description: formData.description || undefined,
      createdAt: now,
      updatedAt: now
    };

    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);

    // Save to localStorage
    localStorage.setItem("fint26_savings_goals", JSON.stringify(updatedGoals));

    // Reset form
    setFormData({
      name: "",
      targetAmount: "",
      currentAmount: "",
      currency: "USD",
      deadline: "",
      description: ""
    });

    setShowForm(false);
  };

  const activeGoals = goals.filter((goal) => !isGoalCompleted(goal));
  const completedGoals = goals.filter((goal) => isGoalCompleted(goal));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">
              Savings Goals
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Track your progress towards financial targets
            </p>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              + Create Goal
            </button>
          )}
        </div>

        {showForm && (
          <div className="card">
            <h3 className="text-xl font-semibold text-neutral-900 mb-6">
              Create New Savings Goal
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label" htmlFor="name">
                  Goal Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g., Emergency Fund, New Car, House Deposit"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="targetAmount">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    id="targetAmount"
                    value={formData.targetAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        targetAmount: e.target.value
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
                  <label className="label" htmlFor="currentAmount">
                    Current Amount (Optional)
                  </label>
                  <input
                    type="number"
                    id="currentAmount"
                    value={formData.currentAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currentAmount: e.target.value
                      }))
                    }
                    className="input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="label" htmlFor="deadline">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deadline: e.target.value
                      }))
                    }
                    className="input"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="description">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value
                    }))
                  }
                  className="input"
                  rows={3}
                  placeholder="What are you saving for?"
                />
              </div>

              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">
                  Create Goal
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

        {activeGoals.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              Active Goals ({activeGoals.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeGoals.map((goal) => {
                const progress = calculateProgress(goal);
                return (
                  <div key={goal.id} className="card">
                    <h4 className="font-semibold text-neutral-900 text-lg mb-2">
                      {goal.name}
                    </h4>
                    {goal.description && (
                      <p className="text-sm text-neutral-600 mb-4">
                        {goal.description}
                      </p>
                    )}

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-neutral-600 mb-1">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-3">
                        <div
                          className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-neutral-600">Saved</p>
                        <p className="text-lg font-bold text-neutral-900">
                          {formatCurrency(goal.currentAmount, goal.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-neutral-600">Target</p>
                        <p className="text-lg font-bold text-neutral-900">
                          {formatCurrency(goal.targetAmount, goal.currency)}
                        </p>
                      </div>
                    </div>

                    {goal.deadline && (
                      <p className="text-xs text-neutral-500 mt-3">
                        Deadline: {formatDate(goal.deadline)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {completedGoals.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              Completed Goals ({completedGoals.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="card bg-success/5 border-success/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-neutral-900 text-lg">
                      {goal.name}
                    </h4>
                    <span className="text-xs bg-success text-white px-2 py-1 rounded">
                      ✓ Complete
                    </span>
                  </div>
                  <p className="text-lg font-bold text-success">
                    {formatCurrency(goal.currentAmount, goal.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {goals.length === 0 && !showForm && (
          <div className="card text-center py-12">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No Savings Goals Yet
            </h3>
            <p className="text-neutral-600 mb-6">
              Create your first savings goal to start building towards your
              financial targets.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              Create Your First Goal
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
