/**
 * Local storage utility for FinT26_01
 * Provides type-safe localStorage operations with error handling
 */

const STORAGE_PREFIX = 'fint26_';

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Save data to localStorage with type safety
 */
export function saveToStorage<T>(key: string, data: T): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_PREFIX + key, serialized);
  } catch (error) {
    throw new StorageError(`Failed to save data to storage: ${error}`);
  }
}

/**
 * Load data from localStorage with type safety
 */
export function loadFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    throw new StorageError(`Failed to load data from storage: ${error}`);
  }
}

/**
 * Remove data from localStorage
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (error) {
    throw new StorageError(`Failed to remove data from storage: ${error}`);
  }
}

/**
 * Clear all FinT26 data from localStorage
 */
export function clearAllStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    throw new StorageError(`Failed to clear storage: ${error}`);
  }
}

/**
 * Check if storage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = STORAGE_PREFIX + 'test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
