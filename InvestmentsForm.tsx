// src/features/investments/InvestmentsForm.tsx
import { useState, FormEvent } from "react";
import { Investment } from "../../types/finance";

interface Props {
  onAddInvestment: (investment: Investment) => void;
}

const riskLevels = ["Low", "Medium", "High"] as const;

export function InvestmentsForm({ onAddInvestment }: Props) {
  const [name, setName] = useState("");
  const [amountInvested, setAmountInvested] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [riskLevel, setRiskLevel] = useState<typeof riskLevels[number]>("Medium");

  function resetForm() {
    setName("");
    setAmountInvested("");
    setCurrentValue("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setRiskLevel("Medium");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const invested = parseFloat(amountInvested);
    const current = parseFloat(currentValue);

    if (!name.trim()) {
      alert("Please enter investment name.");
      return;
    }
    if (isNaN(invested) || invested <= 0) {
      alert("Please enter a valid invested amount greater than zero.");
      return;
    }
    if (isNaN(current) || current < 0) {
      alert("Please enter a valid current value (zero or more).");
      return;
    }
    if (!purchaseDate) {
      alert("Please select a purchase date.");
      return;
    }

    const newInvestment: Investment = {
      id: crypto.randomUUID(),
      name: name.trim(),
      amountInvested: invested,
      currentValue: current,
      purchaseDate,
      riskLevel,
    };

    onAddInvestment(newInvestment);
    resetForm();
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <h3>Add Investment</h3>

      <div>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Amount Invested (USD):
          <input
            type="number"
            step="0.01"
            value={amountInvested}
            onChange={(e) => setAmountInvested(e.target.value)}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Current Value (USD):
          <input
            type="number"
            step="0.01"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Purchase Date:
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Risk Level:
          <select
            value={riskLevel}
            onChange={(e) =>
              setRiskLevel(e.target.value as typeof riskLevels[number])
            }
          >
            {riskLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit">Add Investment</button>
    </form>
  );
}
