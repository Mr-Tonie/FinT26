import { SavingsGoal } from "../types/finance";

export interface SavingsForecast {
  goalId: string;
  monthsRemaining: number | null;
}

export function forecastSavingsGoals(
  goals: SavingsGoal[]
): SavingsForecast[] {
  return goals.map((goal) => {
    const remaining = goal.targetAmount - goal.currentAmount;

    if (
      remaining <= 0 ||
      !goal.monthlyContribution ||
      goal.monthlyContribution <= 0
    ) {
      return { goalId: goal.id, monthsRemaining: null };
    }

    return {
      goalId: goal.id,
      monthsRemaining: Math.ceil(
        remaining / goal.monthlyContribution
      ),
    };
  });
}


