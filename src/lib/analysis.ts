import { Transaction } from "./types";

export interface GroupedDonation {
  counterparty: string;
  totalAmount: number;
  transactions: Transaction[];
}

/**
 * Groups transactions by counterparty and sums their amounts.
 * Useful for manual review of recurring donations.
 */
export function groupTransactionsByCounterparty(
  transactions: Transaction[],
  year: string
): GroupedDonation[] {
  const filtered = transactions.filter((t) => {
    // Basic year check (assuming YYYY-MM-DD or similar format)
    return t.date.includes(year);
  });

  const groups: Record<string, GroupedDonation> = {};

  filtered.forEach((t) => {
    const key = t.counterparty || t.description || "Unknown";
    if (!groups[key]) {
      groups[key] = {
        counterparty: key,
        totalAmount: 0,
        transactions: [],
      };
    }
    groups[key].totalAmount += t.amount;
    groups[key].transactions.push(t);
  });

  // Return sorted by total amount descending
  return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
}
