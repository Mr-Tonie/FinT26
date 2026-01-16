/**
 * Core domain types for FinT26_01
 * These types represent the fundamental financial entities in the system
 */

// Currency codes supported in Zimbabwe
export type CurrencyCode = 'USD' | 'ZWL' | 'ZIG';

// Transaction categories
export type TransactionCategory =
  | 'income_salary'
  | 'income_business'
  | 'income_investment'
  | 'income_other'
  | 'expense_food'
  | 'expense_transport'
  | 'expense_housing'
  | 'expense_utilities'
  | 'expense_healthcare'
  | 'expense_education'
  | 'expense_entertainment'
  | 'expense_other';

// Payment methods relevant to Zimbabwe
export type PaymentMethod = 'cash' | 'ecocash' | 'onamii' | 'bank_transfer' | 'card';

// Investment risk levels
export type RiskLevel = 'low' | 'medium' | 'high';

// Investment asset types
export type AssetType = 'unit_trust' | 'fixed_income' | 'equity_local' | 'equity_regional';

/**
 * Core transaction entity
 */
export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  currency: CurrencyCode;
  category: TransactionCategory;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Savings goal entity
 */
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  deadline?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Investment entity
 */
export interface Investment {
  id: string;
  name: string;
  assetType: AssetType;
  riskLevel: RiskLevel;
  principalAmount: number;
  currentValue: number;
  currency: CurrencyCode;
  purchaseDate: Date;
  provider?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Financial snapshot - net worth at a point in time
 */
export interface FinancialSnapshot {
  date: Date;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: CurrencyCode;
}

/**
 * Monthly summary statistics
 */
export interface MonthlySummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  currency: CurrencyCode;
}
