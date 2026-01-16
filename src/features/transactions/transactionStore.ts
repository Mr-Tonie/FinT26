/**
 * Transaction store - State management for transactions
 */

import type { Transaction, TransactionCategory, PaymentMethod, CurrencyCode } from '@/shared/types/financial.types';
import { saveToStorage, loadFromStorage } from '@/shared/utils/storage';

const STORAGE_KEY = 'transactions';

function generateId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function loadTransactions(): Transaction[] {
  const stored = loadFromStorage<Transaction[]>(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  
  return stored.map(txn => ({
    ...txn,
    date: new Date(txn.date),
    createdAt: new Date(txn.createdAt),
    updatedAt: new Date(txn.updatedAt),
  }));
}

function saveTransactions(transactions: Transaction[]): void {
  saveToStorage(STORAGE_KEY, transactions);
}

export function createTransaction(
  data: {
    date: Date;
    description: string;
    amount: number;
    currency: CurrencyCode;
    category: TransactionCategory;
    paymentMethod: PaymentMethod;
    notes?: string;
  }
): Transaction {
  const now = new Date();
  const transaction: Transaction = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  const transactions = loadTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);
  
  return transaction;
}

export function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>
): Transaction | null {
  const transactions = loadTransactions();
  const index = transactions.findIndex(txn => txn.id === id);
  
  if (index === -1) {
    return null;
  }
  
  transactions[index] = {
    ...transactions[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  saveTransactions(transactions);
  return transactions[index];
}

export function deleteTransaction(id: string): boolean {
  const transactions = loadTransactions();
  const filtered = transactions.filter(txn => txn.id !== id);
  
  if (filtered.length === transactions.length) {
    return false;
  }
  
  saveTransactions(filtered);
  return true;
}

export function getTotalIncome(
  startDate: Date,
  endDate: Date,
  currency?: CurrencyCode
): number {
  const transactions = loadTransactions();
  return transactions
    .filter(txn => txn.date >= startDate && txn.date <= endDate)
    .filter(txn => txn.category.startsWith('income_'))
    .filter(txn => !currency || txn.currency === currency)
    .reduce((sum, txn) => sum + txn.amount, 0);
}

export function getTotalExpenses(
  startDate: Date,
  endDate: Date,
  currency?: CurrencyCode
): number {
  const transactions = loadTransactions();
  return transactions
    .filter(txn => txn.date >= startDate && txn.date <= endDate)
    .filter(txn => txn.category.startsWith('expense_'))
    .filter(txn => !currency || txn.currency === currency)
    .reduce((sum, txn) => sum + txn.amount, 0);
}

export function getNetCashflow(
  startDate: Date,
  endDate: Date,
  currency?: CurrencyCode
): number {
  const income = getTotalIncome(startDate, endDate, currency);
  const expenses = getTotalExpenses(startDate, endDate, currency);
  return income - expenses;
}