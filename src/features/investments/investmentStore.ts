import type { Investment, CurrencyCode } from '@/shared/types/financial.types';
import { saveToStorage, loadFromStorage } from '@/shared/utils/storage';

const STORAGE_KEY = 'investments';

export function loadInvestments(): Investment[] {
  const stored = loadFromStorage<Investment[]>(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  
  return stored.map(inv => ({
    ...inv,
    purchaseDate: new Date(inv.purchaseDate),
    createdAt: new Date(inv.createdAt),
    updatedAt: new Date(inv.updatedAt),
  }));
}

export function getTotalCurrentValue(currency?: CurrencyCode): number {
  const investments = loadInvestments();
  return investments
    .filter(inv => !currency || inv.currency === currency)
    .reduce((sum, inv) => sum + inv.currentValue, 0);
}

export function getTotalGainLoss(currency?: CurrencyCode): number {
  const investments = loadInvestments();
  return investments
    .filter(inv => !currency || inv.currency === currency)
    .reduce((sum, inv) => sum + (inv.currentValue - inv.principalAmount), 0);
}