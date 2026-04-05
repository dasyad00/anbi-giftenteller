import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import { groupTransactionsByCounterparty } from './analysis';
import { Party, Transaction } from './types';
import { applyManualCorrections } from './manualCorrection';

// Mock the ANBI data service
vi.mock('../services/anbi', () => ({
  getAnbiData: vi.fn(),
}));

import { AnbiOrganisationDataset, getAnbiData } from '../services/anbi';

const mockedGetAnbiData = getAnbiData as Mock;

describe('groupTransactionsByCounterparty', () => {
  const charityA: Party = {
    name: 'Stichting Charity A',
    iban: 'NL1',
  };
  const charityB: Party = {
    name: 'Goede Doelen B',
    iban: 'NL2',
  };
  const nonCharity: Party = {
    name: 'Albert Heijn',
    iban: 'NL3',
  };

  const mockTransactions: Transaction[] = [
    {
      date: '2025-01-01',
      description: 'Donation 1',
      amount: 10,
      counterparty: charityA,
    },
    {
      date: '2025-02-01',
      description: 'Donation 2',
      amount: 20,
      counterparty: charityA,
    },
    {
      date: '2025-03-01',
      description: 'Donation 3',
      amount: 15,
      counterparty: charityB,
    },
    {
      date: '2024-12-31',
      description: 'Old Donation',
      amount: 50,
      counterparty: charityA,
    }, // Wrong year
    {
      date: '2025-04-01',
      description: 'Groceries',
      amount: 5,
      counterparty: nonCharity,
    },
  ];

  const mockAnbiData: AnbiOrganisationDataset = {
    header: {
      aanmaakDatum: '2026-01-01',
      versie: 1,
    },
    beschikking: [
      {
        dossierNummer: 1,
        fiscaalNummer: 123456789,
        naam: 'Stichting Charity A',
        vestigingsPlaats: 'Amsterdam',
      },
      {
        dossierNummer: 2,
        fiscaalNummer: 987654321,
        naam: 'Stichting Goede Doelen B',
        vestigingsPlaats: 'Utrecht',
      },
    ],
  };

  beforeEach(() => {
    mockedGetAnbiData.mockResolvedValue(mockAnbiData);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should group transactions and sum totals for a specific year', async () => {
    const result = await groupTransactionsByCounterparty(
      mockTransactions,
      '2025',
    );

    expect(result).toHaveLength(3);

    const groupA = result.find(
      (g) => g.counterparty.name === 'Stichting Charity A',
    );
    expect(groupA?.totalAmount).toBe(30);
    expect(groupA?.transactions).toHaveLength(2);

    const groupB = result.find((g) => g.counterparty.name === 'Goede Doelen B');
    expect(groupB?.totalAmount).toBe(15);
    expect(groupB?.transactions).toHaveLength(1);

    const groupC = result.find((g) => g.counterparty.name === 'Albert Heijn');
    expect(groupC?.totalAmount).toBe(5);
    expect(groupC?.transactions).toHaveLength(1);
  });

  it('should sort results by total amount descending', async () => {
    const result = await groupTransactionsByCounterparty(
      mockTransactions,
      '2025',
    );
    expect(result[0].totalAmount).toBe(30); // Charity A
    expect(result[1].totalAmount).toBe(15); // Charity B
    expect(result[2].totalAmount).toBe(5); // Albert Heijn
  });

  it('should return empty array if no transactions match the year', async () => {
    const result = await groupTransactionsByCounterparty(
      mockTransactions,
      '2023',
    );
    expect(result).toHaveLength(0);
  });

  it('should attempt to match counterparties to ANBI RSINs', async () => {
    const result = await groupTransactionsByCounterparty(
      mockTransactions,
      '2025',
    );

    const groupA = result.find(
      (g) => g.counterparty.name === 'Stichting Charity A',
    );
    expect(groupA?.counterparty.rsin).toBe(123456789);

    // 'Goede Doelen B' should match 'Stichting Goede Doelen B'
    const groupB = result.find((g) => g.counterparty.name === 'Goede Doelen B');
    expect(groupB?.counterparty.rsin).toBe(987654321);
  });

  it('should not assign an RSIN if no match is found', async () => {
    const result = await groupTransactionsByCounterparty(
      mockTransactions,
      '2025',
    );

    const nonCharityGroup = result.find(
      (g) => g.counterparty.name === 'Albert Heijn',
    );
    expect(nonCharityGroup?.counterparty.rsin).toBeUndefined();
  });

  it('should handle failure of ANBI data fetch gracefully', async () => {
    mockedGetAnbiData.mockRejectedValue(new Error('Failed to fetch'));
    const result = await groupTransactionsByCounterparty(
      mockTransactions,
      '2025',
    );

    expect(result).toHaveLength(3); // Should still group, just without RSINs
    result.forEach((group) => {
      expect(group.counterparty.rsin).toBeUndefined();
    });
  });

  it('should handle transactions via payment proxies', async () => {
    const transactions: Transaction[] = [
      {
        date: '2025-01-01',
        description: 'Real Charity Name',
        amount: 10,
        counterparty: { name: 'Payment via some bank', iban: 'NL4' },
      },
      {
        date: '2025-02-01',
        description: 'Donation 2',
        amount: 5,
        counterparty: { name: 'Olivia', iban: 'NL5' },
      },
    ];

    const result = await groupTransactionsByCounterparty(transactions, '2025');

    expect(result).toHaveLength(2);
    expect(result[0].counterparty.name).toBe('Real Charity Name');
    expect(result[1].counterparty.name).toBe('Olivia');
  });

  it('should apply manual corrections', async () => {
    const initialDonations = await groupTransactionsByCounterparty(
      mockTransactions,
      '2025',
    );
    const correction = {
      originalGroupId: `${initialDonations[2].counterparty.name}#${initialDonations[2].counterparty.iban}`,
      correctedCounterpartyName: 'Corrected Name',
    };

    const correctedDonations = applyManualCorrections(initialDonations, [
      correction,
    ]);

    const correctedGroup = correctedDonations.find((d) => d.manuallyEdited);

    expect(correctedGroup?.counterparty.name).toBe('Corrected Name');
  });
});
