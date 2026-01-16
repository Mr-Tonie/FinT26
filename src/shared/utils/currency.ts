/**
 * Currency utility functions for FinT26_01
 * Handles multi-currency formatting for Zimbabwean context
 */

import type { CurrencyCode } from '../types/financial.types';

/**
 * Currency symbols mapping
 */
const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  ZWL: 'ZWL',
  ZIG: 'ZIG'
};

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = formatNumber(amount, 2);
  
  // USD uses symbol prefix, others use suffix
  if (currency === 'USD') {
    return `${symbol}${formatted}`;
  }
  
  return `${formatted} ${symbol}`;
}

/**
 * Format number with specified decimal places
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Parse currency string to number
 */
export function parseCurrencyAmount(value: string): number {
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculate percentage change between two amounts
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Calculate compound growth
 */
export function calculateCompoundGrowth(
  principal: number,
  rate: number,
  periods: number
): number {
  return principal * Math.pow(1 + rate / 100, periods);
}
