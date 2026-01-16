import type { SavingsGoal, CurrencyCode } from '@/shared/types/financial.types';
import { saveToStorage, loadFromStorage } from '@/shared/utils/storage';

const STORAGE_KEY = 'savings_goals';

function generateId(): string {
  return `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function loadSavingsGoals(): SavingsGoal[] {
  const stored = loadFromStorage<SavingsGoal[]>(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  
  return stored.map(goal => ({
    ...goal,
    deadline: goal.deadline ? new Date(goal.deadline) : undefined,
    createdAt: new Date(goal.createdAt),
    updatedAt: new Date(goal.updatedAt),
  }));
}

export function calculateProgress(goal: SavingsGoal): number {
  if (goal.targetAmount === 0) {
    return 0;
  }
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

export function isGoalCompleted(goal: SavingsGoal): boolean {
  return goal.currentAmount >= goal.targetAmount;
}