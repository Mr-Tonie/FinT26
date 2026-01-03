import { SavingsGoal } from "../../types/finance";
import { SavingsForecast } from "../../utils/savingsForecast";

interface Props {
  savingsGoals: SavingsGoal[];
  forecasts: SavingsForecast[];
}

export function SavingsList({ savingsGoals, forecasts }: Props) {
  if (savingsGoals.length === 0) {
    return <p>No savings goals defined.</p>;
  }

  return (
    <section>
      <h2>Savings Goals</h2>
      <ul>
        {savingsGoals.map((goal) => {
          const progress = Math.min(
            (goal.currentAmount / goal.targetAmount) * 100,
            100
          );

          const forecast = forecasts.find((f) => f.goalId === goal.id);

          {goal.monthlyContribution && (
  <div>
    Monthly contribution: $
    {goal.monthlyContribution.toFixed(2)}
  </div>
)}

          return (
            <li key={goal.id} style={{ marginBottom: "1.5rem" }}>
              <strong>{goal.name}</strong>

              <div>
                Saved: ${goal.currentAmount.toFixed(2)} / $
                {goal.targetAmount.toFixed(2)} ({progress.toFixed(1)}%)
              </div>

              {goal.deadline && <div>Deadline: {goal.deadline}</div>}

              {forecast?.monthsRemaining !== null ? (
                <div>
                  Estimated completion:{" "}
                  <strong>{forecast?.monthsRemaining} months</strong>
                </div>
              ) : (
                <div style={{ color: "#999" }}>
                  Forecast unavailable
                </div>
              )}

              <progress value={progress} max={100} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

