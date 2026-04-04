import { AnbiOrganisation, getAnbiData } from '../services/anbi';
import { Party, Transaction } from './types';

export interface GroupedDonation {
  counterparty: Party;
  totalAmount: number;
  transactions: Transaction[];
}

function areStringsSimilar(strA: string, strB: string): boolean {
  if (!strA || !strB) return false;
  const cleanA = strA.toLowerCase().replace(/[^a-z0-9]/gi, '');
  const cleanB = strB.toLowerCase().replace(/[^a-z0-9]/gi, '');

  if (cleanA.length === 0 || cleanB.length === 0) return false;

  if (Math.min(cleanA.length, cleanB.length) < 4) {
    return cleanA === cleanB;
  }

  return cleanA.includes(cleanB) || cleanB.includes(cleanA);
}

function findRsinForCounterparty(
  counterpartyName: string,
  anbiOrganisations: any[],
): string | undefined {
  if (!anbiOrganisations || !counterpartyName) {
    return undefined;
  }

  const match = anbiOrganisations.find((anbi) => {
    if (typeof anbi.naam !== 'string') return false;
    return areStringsSimilar(counterpartyName, anbi.naam);
  });

  return match ? match.rsin : undefined;
}

/**
 * Groups transactions by counterparty and sums their amounts.
 * Useful for manual review of recurring donations.
 */
export async function groupTransactionsByCounterparty(
  transactions: Transaction[],
  year: string,
): Promise<GroupedDonation[]> {
  const anbiData = await getAnbiData().catch((e) => {
    console.error(e);
    return null;
  });
  console.log(anbiData);
  const anbiOrganisations: AnbiOrganisation[] =
    anbiData?.beschikking ?? [];

  const filtered = transactions.filter((t) => {
    // Basic year check (assuming YYYY-MM-DD or similar format)
    return t.date.includes(year);
  });

  const groups: Record<string, GroupedDonation> = {};

  for (const t of filtered) {
    const counterparty = t.counterparty;
    const key = counterparty.iban;
    if (!groups[key]) {
      const rsin = findRsinForCounterparty(
        counterparty.name,
        anbiOrganisations,
      );
      groups[key] = {
        counterparty: { ...counterparty, rsin },
        totalAmount: 0,
        transactions: [],
      };
    }
    groups[key].totalAmount += t.amount;
    groups[key].transactions.push(t);
  }

  // Return sorted by total amount descending
  return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
}
