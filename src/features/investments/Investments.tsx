import { useState, FormEvent } from "react";
import { Layout } from "@/shared/components/Layout";
import {
  loadInvestments,
  getTotalCurrentValue,
  getTotalGainLoss
} from "./investmentStore";
import { formatCurrency, formatPercentage } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import type {
  Investment,
  AssetType,
  RiskLevel,
  CurrencyCode
} from "@/shared/types/financial.types";

export function Investments() {
  const [showForm, setShowForm] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>(
    loadInvestments()
  );

  const [formData, setFormData] = useState({
    name: "",
    assetType: "unit_trust" as AssetType,
    riskLevel: "medium" as RiskLevel,
    principalAmount: "",
    currentValue: "",
    currency: "USD" as CurrencyCode,
    purchaseDate: new Date().toISOString().split("T")[0],
    provider: "",
    notes: ""
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const newInvestment: Investment = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: formData.name,
      assetType: formData.assetType,
      riskLevel: formData.riskLevel,
      principalAmount: parseFloat(formData.principalAmount),
      currentValue: parseFloat(formData.currentValue),
      currency: formData.currency,
      purchaseDate: new Date(formData.purchaseDate),
      provider: formData.provider || undefined,
      notes: formData.notes || undefined,
      createdAt: now,
      updatedAt: now
    };

    const updatedInvestments = [...investments, newInvestment];
    setInvestments(updatedInvestments);

    // Save to localStorage
    localStorage.setItem(
      "fint26_investments",
      JSON.stringify(updatedInvestments)
    );

    // Reset form
    setFormData({
      name: "",
      assetType: "unit_trust",
      riskLevel: "medium",
      principalAmount: "",
      currentValue: "",
      currency: "USD",
      purchaseDate: new Date().toISOString().split("T")[0],
      provider: "",
      notes: ""
    });

    setShowForm(false);
  };

  const ASSET_TYPE_LABELS: Record<AssetType, string> = {
    unit_trust: "Unit Trust",
    fixed_income: "Fixed Income",
    equity_local: "Local Equity",
    equity_regional: "Regional Equity"
  };

  const RISK_LABELS: Record<RiskLevel, { label: string; color: string }> = {
    low: {
      label: "Low Risk",
      color: "bg-success/10 text-success border-success/20"
    },
    medium: {
      label: "Medium Risk",
      color: "bg-warning/10 text-warning border-warning/20"
    },
    high: {
      label: "High Risk",
      color: "bg-danger/10 text-danger border-danger/20"
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">Investments</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Track your investment portfolio performance
            </p>
          </div>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              + Add Investment
            </button>
          )}
        </div>

        {showForm && (
          <div className="card">
            <h3 className="text-xl font-semibold text-neutral-900 mb-6">
              Add New Investment
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label" htmlFor="name">
                  Investment Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g., Old Mutual Unit Trust, Delta Stock"
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="assetType">
                  Asset Type
                </label>
                <select
                  id="assetType"
                  value={formData.assetType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      assetType: e.target.value as AssetType
                    }))
                  }
                  className="input"
                >
                  <option value="unit_trust">
                    Unit Trust — Old Mutual, Datvest
                  </option>
                  <option value="fixed_income">
                    Fixed Income — Bonds, Treasury Bills
                  </option>
                  <option value="equity_local">
                    Local Equities — ZSE stocks
                  </option>
                  <option value="equity_regional">
                    Regional Equities — JSE, NSE
                  </option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="riskLevel">
                  Risk Level
                </label>
                <select
                  id="riskLevel"
                  value={formData.riskLevel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      riskLevel: e.target.value as RiskLevel
                    }))
                  }
                  className="input"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="principalAmount">
                    Principal Amount
                  </label>
                  <input
                    type="number"
                    id="principalAmount"
                    value={formData.principalAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        principalAmount: e.target.value
                      }))
                    }
                    className="input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                  <p className="text-xs text-neutral-600 mt-1">
                    Initial investment amount
                  </p>
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
                <label className="label" htmlFor="currentValue">
                  Current Value
                </label>
                <input
                  type="number"
                  id="currentValue"
                  value={formData.currentValue}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currentValue: e.target.value
                    }))
                  }
                  className="input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
                <p className="text-xs text-neutral-600 mt-1">
                  Current market value
                </p>
              </div>

              <div>
                <label className="label" htmlFor="purchaseDate">
                  Purchase Date
                </label>
                <input
                  type="date"
                  id="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      purchaseDate: e.target.value
                    }))
                  }
                  className="input"
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="provider">
                  Provider (Optional)
                </label>
                <input
                  type="text"
                  id="provider"
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      provider: e.target.value
                    }))
                  }
                  className="input"
                  placeholder="e.g., Old Mutual, Stanbic"
                />
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
                  Add Investment
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

        {investments.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-4">
              All Investments ({investments.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {investments.map((inv) => {
                const gainLoss = inv.currentValue - inv.principalAmount;
                const returnPercent =
                  inv.principalAmount > 0
                    ? ((inv.currentValue - inv.principalAmount) /
                        inv.principalAmount) *
                      100
                    : 0;
                const isProfitable = gainLoss > 0;

                return (
                  <div key={inv.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900 text-lg">
                          {inv.name}
                        </h4>
                        <p className="text-sm text-neutral-500">
                          {ASSET_TYPE_LABELS[inv.assetType]}
                          {inv.provider && ` · ${inv.provider}`}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          RISK_LABELS[inv.riskLevel].color
                        }`}
                      >
                        {RISK_LABELS[inv.riskLevel].label}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-neutral-600 mb-1">
                          Principal
                        </p>
                        <p className="text-lg font-semibold text-neutral-900">
                          {formatCurrency(inv.principalAmount, inv.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-600 mb-1">
                          Current Value
                        </p>
                        <p className="text-lg font-semibold text-neutral-900">
                          {formatCurrency(inv.currentValue, inv.currency)}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-md mb-4 ${
                        isProfitable
                          ? "bg-success/5 border border-success/20"
                          : gainLoss < 0
                          ? "bg-danger/5 border border-danger/20"
                          : "bg-neutral-100 border border-neutral-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-neutral-600 mb-1">
                            Gain/Loss
                          </p>
                          <p
                            className={`text-xl font-bold ${
                              isProfitable
                                ? "text-success"
                                : gainLoss < 0
                                ? "text-danger"
                                : "text-neutral-700"
                            }`}
                          >
                            {isProfitable ? "+" : ""}
                            {formatCurrency(gainLoss, inv.currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-600 mb-1">
                            Return
                          </p>
                          <p
                            className={`text-xl font-bold ${
                              isProfitable
                                ? "text-success"
                                : returnPercent < 0
                                ? "text-danger"
                                : "text-neutral-700"
                            }`}
                          >
                            {formatPercentage(returnPercent)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-500">
                      Purchase Date: {formatDate(inv.purchaseDate)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {investments.length === 0 && !showForm && (
          <div className="card text-center py-12">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No Investments Yet
            </h3>
            <p className="text-neutral-600 mb-6">
              Start building your investment portfolio by adding your first
              investment.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              Add Your First Investment
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
