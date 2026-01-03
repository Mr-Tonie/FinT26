// src/features/savings/SavingsForm.tsx
import { useState, FormEvent } from "react";
import { SavingsGoal } from "../../types/finance";

interface Props {
  onAddSavingsGoal: (goal: SavingsGoal) => void;
}

export function SavingsForm({ onAddSavingsGoal }: Props) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [deadline, setDeadline] = useState("");

  function resetForm() {
    setName("");
    setTargetAmount("");
    setMonthlyContribution("");
    setDeadline("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const parsedTarget = parseFloat(targetAmount);
    const parsedContribution = parseFloat(monthlyContribution);

    if (!name.trim()) {
      alert("Please enter a goal name.");
      return;
    }

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      alert("Target amount must be greater than zero.");
      return;
    }

    if (
      monthlyContribution &&
      (isNaN(parsedContribution) || parsedContribution <= 0)
    ) {
      alert("Monthly contribution must be greater than zero.");
      return;
    }

    const newGoal: SavingsGoal = {
      id: crypto.randomUUID(),
      name: name.trim(),
      targetAmount: parsedTarget,
      currentAmount: 0,
      deadline: deadline || undefined,
      monthlyContribution: monthlyContribution
        ? parsedContribution
        : undefined,
    };

    onAddSavingsGoal(newGoal);
    resetForm();
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <h3>Add Savings Goal</h3>

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
          Target Amount (USD):
          <input
            type="number"
            step="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Monthly Contribution (optional):
          <input
            type="number"
            step="0.01"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Deadline (optional):
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </label>
      </div>

      <button type="submit">Add Goal</button>
    </form>
  );
}
