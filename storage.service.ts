import { FinancialSnapshot } from "../types/finance";
import { getItem, setItem } from "../lib/indexeddb";

const SNAPSHOT_KEY = "snapshot";

export async function loadSnapshot(): Promise<FinancialSnapshot> {
  const data = await getItem<FinancialSnapshot>(SNAPSHOT_KEY);
  return (
    data ?? {
      currency: "USD",
      transactions: [],
      savingsGoals: [],
      investments: [],
    }
  );
}


export async function saveSnapshot(snapshot: FinancialSnapshot): Promise<void> {
  await setItem(SNAPSHOT_KEY, snapshot);
}
