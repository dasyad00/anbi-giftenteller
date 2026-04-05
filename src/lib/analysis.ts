import { AnbiOrganisation, getAnbiData } from '../services/anbi';
import { Party, Transaction } from './types';

export interface GroupedDonation {
  id: string;
  counterparty: Party;
  totalAmount: number;
  transactions: Transaction[];
  manuallyEdited?: boolean;
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
): number | undefined {
  if (!anbiOrganisations || !counterpartyName) {
    return undefined;
  }

  const match = anbiOrganisations.find((anbi) => {
    if (typeof anbi.naam !== 'string') return false;
    return areStringsSimilar(counterpartyName, anbi.naam);
  });

  return match ? match.fiscaalNummer : undefined;
}

/**
 * Extracts the intended recipient from the transaction if a payment proxy is used.
 * @param transaction The transaction to parse.
 * @returns The (potentially corrected) name of the counterparty.
 */
function getRealRecipientName(transaction: Transaction): string {
  const { description, counterparty } = transaction;
  const counterpartyName = counterparty.name.toLowerCase();

  // If the counterparty name includes a payment proxy, the description may hold the real recipient.
  const viaBunq = ' via bunq';
  const viaIng = ' via ING Zakelijk Betaalverzoek';
  const sumup = 'Sumup *';

  if (
    counterpartyName.includes(viaBunq) ||
    counterpartyName.includes(viaIng) ||
    counterpartyName.includes(sumup)
  ) {
    // A simple heuristic: the real recipient is often at the start of the description.
    // This is a guess and might need to be more sophisticated.
    const potentialName = description.split(/,|\./)[0].trim();
    if (potentialName) {
      return potentialName;
    }
  }

  return counterparty.name;
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
  // console.log(anbiData);
  const anbiOrganisations: AnbiOrganisation[] = anbiData?.beschikking ?? [];

  const filtered = transactions.filter((t) => {
    // Basic year check (assuming YYYY-MM-DD or similar format)
    return t.date.includes(year);
  });

  const groups: Record<string, GroupedDonation> = {};

  for (const t of filtered) {
    const realRecipientName = getRealRecipientName(t);
    const key = `${realRecipientName}#${t.counterparty.iban}`;

    if (!groups[key]) {
      const rsin = findRsinForCounterparty(
        realRecipientName,
        anbiOrganisations,
      );
      groups[key] = {
        id: key,
        counterparty: { ...t.counterparty, name: realRecipientName, rsin },
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
