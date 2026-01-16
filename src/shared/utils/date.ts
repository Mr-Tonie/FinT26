/**
 * Date utility functions for FinT26_01
 * Provides consistent date handling and formatting
 */

/**
 * Format date to British English standard (DD/MM/YYYY)
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date to ISO string for storage
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ISO string to Date object
 */
export function fromISOString(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Get month name in British English
 */
export function getMonthName(monthIndex: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex] ?? 'Invalid';
}

/**
 * Get current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

/**
 * Check if a date is in the past
 */
export function isInPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Check if a date is in the future
 */
export function isInFuture(date: Date): boolean {
  return date > new Date();
}

/**
 * Calculate days until a target date
 */
export function daysUntil(targetDate: Date): number {
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
