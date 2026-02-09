import { useState, useEffect } from "react";
import { Layout } from "@/shared/components/Layout";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDate } from "@/shared/utils/date";
import type { CurrencyCode } from "@/shared/types/financial.types";
import { firebaseAuthService } from "@/services/firebase/auth.service";
import { firestoreService } from "@/services/firebase/firestore.service";

interface Investment {
  id: string;
  name: string;
  assetType: string;
  riskLevel: string;
  principalAmount: number;
  currentValue: number;
  currency: CurrencyCode;
  purchaseDate: Date;
  provider: string | null;
  notes: string | null;
}

export function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);
  const [newValue, setNewValue] = useState("");

  const [statistics, setStatistics] = useState({
    totalInvested: 0,
    totalValue: 0,
    totalGainLoss: 0,
    investmentCount: 0
  });

  const [formData, setFormData] = useState({
    name: "",
    assetType: "",
    riskLevel: "",
    principalAmount: "",
    currentValue: "",
    currency: "USD" as CurrencyCode,
    purchaseDate: new Date().toISOString().split("T")[0],
    provider: "",
    notes: ""
  });

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    setLoading(true);
    const user = firebaseAuthService.getCurrentUser();

    if (user) {
      const investmentsList = await firestoreService.investments.getAll(
        user.uid
      );
      setInvestments(investmentsList as Investment[]);

      const stats = await firestoreService.investments.getStatistics(user.uid);
      setStatistics(stats);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = firebaseAuthService.getCurrentUser();
    if (!user) return;

    try {
      await firestoreService.investments.create(user.uid, {
        name: formData.name,
        assetType: formData.assetType,
        riskLevel: formData.riskLevel,
        principalAmount: parseFloat(formData.principalAmount),
        currentValue: parseFloat(
          formData.currentValue || formData.principalAmount
        ),
        currency: formData.currency,
        purchaseDate: formData.purchaseDate,
        provider: formData.provider || null,
        notes: formData.notes || null
      });

      setShowModal(false);
      setFormData({
        name: "",
        assetType: "",
        riskLevel: "",
        principalAmount: "",
        currentValue: "",
        currency: "USD",
        purchaseDate: new Date().toISOString().split("T")[0],
        provider: "",
        notes: ""
      });

      loadInvestments();
    } catch (error) {
      console.error("Error creating investment:", error);
      alert("Failed to create investment");
    }
  };

  const handleUpdateValue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvestment) return;

    try {
      await firestoreService.investments.update(
        selectedInvestment.id,
        parseFloat(newValue)
      );

      setShowUpdateModal(false);
      setSelectedInvestment(null);
      setNewValue("");
      loadInvestments();
    } catch (error) {
      console.error("Error updating investment:", error);
      alert("Failed to update investment");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this investment?"))
      return;

    try {
      await firestoreService.investments.delete(id);
      loadInvestments();
    } catch (error) {
      console.error("Error deleting investment:", error);
      alert("Failed to delete investment");
    }
  };

  const getGainLoss = (investment: Investment) => {
    return investment.currentValue - investment.principalAmount;
  };

  const getGainLossPercentage = (investment: Investment) => {
    return (
      ((investment.currentValue - investment.principalAmount) /
        investment.principalAmount) *
      100
    );
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case "low":
        return "text-success bg-success/10";
      case "medium":
        return "text-warning bg-warning/10";
      case "high":
        return "text-danger bg-danger/10";
      default:
        return "text-neutral-600 bg-neutral-100";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900">
              Investment Portfolio
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Track your investments and monitor returns
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + Add Investment
          </button>
        </div>

        {/* Portfolio Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-primary-50 border-primary-200">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Total Invested
            </h3>
            <p className="text-3xl font-bold text-primary-600">
              {formatCurrency(statistics.totalInvested, "USD")}
            </p>
          </div>

          <div className="card bg-success/5 border-success/20">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Current Value
            </h3>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(statistics.totalValue, "USD")}
            </p>
          </div>

          <div
            className={`card ${
              statistics.totalGainLoss >= 0
                ? "bg-success/5 border-success/20"
                : "bg-danger/5 border-danger/20"
            }`}
          >
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Total Gain/Loss
            </h3>
            <p
              className={`text-3xl font-bold ${
                statistics.totalGainLoss >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {statistics.totalGainLoss >= 0 ? "+" : ""}
              {formatCurrency(statistics.totalGainLoss, "USD")}
            </p>
            <p
              className={`text-sm mt-1 ${
                statistics.totalGainLoss >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {statistics.totalInvested > 0
                ? `${((statistics.totalGainLoss / statistics.totalInvested) * 100).toFixed(2)}%`
                : "0%"}
            </p>
          </div>

          <div className="card bg-neutral-50 border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-600 mb-2">
              Active Investments
            </h3>
            <p className="text-3xl font-bold text-neutral-900">
              {statistics.investmentCount}
            </p>
          </div>
        </div>

        {/* Investments List */}
        {loading ? (
          <div className="card">
            <p className="text-center py-12 text-neutral-500">
              Loading investments...
            </p>
          </div>
        ) : investments.length === 0 ? (
          <div className="card">
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">No investments yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                Add Your First Investment
              </button>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                      Risk
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      Invested
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      Current Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      Gain/Loss
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {investments.map((investment) => {
                    const gainLoss = getGainLoss(investment);
                    const gainLossPercentage =
                      getGainLossPercentage(investment);

                    return (
                      <tr key={investment.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-neutral-900">
                              {investment.name}
                            </p>
                            {investment.provider && (
                              <p className="text-sm text-neutral-500">
                                {investment.provider}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {investment.assetType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(investment.riskLevel)}`}
                          >
                            {investment.riskLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-neutral-900">
                          {formatCurrency(
                            investment.principalAmount,
                            investment.currency
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-neutral-900">
                          {formatCurrency(
                            investment.currentValue,
                            investment.currency
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <div
                            className={
                              gainLoss >= 0 ? "text-success" : "text-danger"
                            }
                          >
                            <p className="font-semibold">
                              {gainLoss >= 0 ? "+" : ""}
                              {formatCurrency(gainLoss, investment.currency)}
                            </p>
                            <p className="text-xs">
                              ({gainLossPercentage >= 0 ? "+" : ""}
                              {gainLossPercentage.toFixed(2)}%)
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <button
                            onClick={() => {
                              setSelectedInvestment(investment);
                              setNewValue(investment.currentValue.toString());
                              setShowUpdateModal(true);
                            }}
                            className="text-primary-600 hover:text-primary-700 mr-3"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => handleDelete(investment.id)}
                            className="text-danger hover:text-danger/80"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Investment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">
                Add Investment
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Investment Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input"
                  placeholder="e.g., Apple Stock, Bitcoin, Real Estate"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Asset Type</label>
                  <select
                    value={formData.assetType}
                    onChange={(e) =>
                      setFormData({ ...formData, assetType: e.target.value })
                    }
                    className="input"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Stocks">Stocks</option>
                    <option value="Bonds">Bonds</option>
                    <option value="Crypto">Cryptocurrency</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Mutual Funds">Mutual Funds</option>
                    <option value="ETF">ETF</option>
                    <option value="Commodities">Commodities</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="label">Risk Level</label>
                  <select
                    value={formData.riskLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, riskLevel: e.target.value })
                    }
                    className="input"
                    required
                  >
                    <option value="">Select risk</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Amount Invested</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.principalAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        principalAmount: e.target.value
                      })
                    }
                    className="input"
                    placeholder="1000"
                    required
                  />
                </div>

                <div>
                  <label className="label">Current Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.currentValue}
                    onChange={(e) =>
                      setFormData({ ...formData, currentValue: e.target.value })
                    }
                    className="input"
                    placeholder="1000"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Leave empty if same as invested
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="label">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseDate: e.target.value })
                    }
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Provider/Platform (Optional)</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  className="input"
                  placeholder="e.g., Robinhood, Coinbase, Fidelity"
                />
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
                  Add Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Value Modal */}
      {showUpdateModal && selectedInvestment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900">
                Update {selectedInvestment.name}
              </h3>
            </div>

            <form onSubmit={handleUpdateValue} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-600">Invested</p>
                  <p className="text-lg font-bold text-neutral-900">
                    {formatCurrency(
                      selectedInvestment.principalAmount,
                      selectedInvestment.currency
                    )}
                  </p>
                </div>

                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-sm text-neutral-600">Current</p>
                  <p className="text-lg font-bold text-primary-600">
                    {formatCurrency(
                      selectedInvestment.currentValue,
                      selectedInvestment.currency
                    )}
                  </p>
                </div>
              </div>

              <div>
                <label className="label">New Current Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="input"
                  required
                />
              </div>

              {newValue && (
                <div
                  className={`p-4 rounded-lg ${
                    parseFloat(newValue) >= selectedInvestment.principalAmount
                      ? "bg-success/10"
                      : "bg-danger/10"
                  }`}
                >
                  <p className="text-sm text-neutral-600">Gain/Loss</p>
                  <p
                    className={`text-2xl font-bold ${
                      parseFloat(newValue) >= selectedInvestment.principalAmount
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {parseFloat(newValue) >= selectedInvestment.principalAmount
                      ? "+"
                      : ""}
                    {formatCurrency(
                      parseFloat(newValue) - selectedInvestment.principalAmount,
                      selectedInvestment.currency
                    )}
                  </p>
                  <p
                    className={`text-sm ${
                      parseFloat(newValue) >= selectedInvestment.principalAmount
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {(
                      ((parseFloat(newValue) -
                        selectedInvestment.principalAmount) /
                        selectedInvestment.principalAmount) *
                      100
                    ).toFixed(2)}
                    %
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setSelectedInvestment(null);
                    setNewValue("");
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Update Value
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
