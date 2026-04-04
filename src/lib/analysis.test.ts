import { describe, it, expect } from 'vitest';
import { groupTransactionsByCounterparty } from './analysis';
import { Party, Transaction } from './types';

describe('groupTransactionsByCounterparty', () => {
  const charityA: Party = {
    name: 'Charity A',
    iban: 'NL1',
  };
  const charityB: Party = {
    name: 'Charity B',
    iban: 'NL2',
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
      description: 'Misc',
      amount: 5,
      counterparty: { name: '', iban: '' },
    }, // No counterparty
  ];

  it('should group transactions by counterparty for a specific year', () => {
    const result = groupTransactionsByCounterparty(mockTransactions, '2025');

    expect(result).toHaveLength(3);

    const charityA = result.find((g) => g.counterparty.name === 'Charity A');
    expect(charityA?.totalAmount).toBe(30);
    expect(charityA?.transactions).toHaveLength(2);

    const charityB = result.find((g) => g.counterparty.name === 'Charity B');
    expect(charityB?.totalAmount).toBe(15);
    expect(charityB?.transactions).toHaveLength(1);
  });

  it('should sort results by total amount descending', () => {
    const result = groupTransactionsByCounterparty(mockTransactions, '2025');
    expect(result[0].totalAmount).toBe(30); // Charity A
    expect(result[1].totalAmount).toBe(15); // Charity B
    expect(result[2].totalAmount).toBe(5); // Misc
  });

  it('should return empty array if no transactions match the year', () => {
    const result = groupTransactionsByCounterparty(mockTransactions, '2023');
    expect(result).toHaveLength(0);
  });
});
