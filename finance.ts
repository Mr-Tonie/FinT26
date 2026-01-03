export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string; // ISO date string
  note?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO date string
}

export interface Investment {
  id: string;
  name: string;
  amountInvested: number;
  currentValue: number;
  purchaseDate: string; // ISO date string
  riskLevel?: "Low" | "Medium" | "High";
}

export interface FinancialSnapshot {
  currency: string;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  investments: Investment[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;

  // NEW (v0.014)
  monthlyContribution?: number;
}

