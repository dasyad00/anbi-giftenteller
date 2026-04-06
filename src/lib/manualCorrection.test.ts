import { describe, it, expect } from 'vitest';
import { applyManualCorrections } from './manualCorrection';
import { TransactionGroup } from './analysis';

describe('applyManualCorrections', () => {
  const mockTransactionGroups: TransactionGroup[] = [
    {
      id: '1',
      counterparty: { name: 'Charity A', iban: 'NL1', rsin: 123 },
      totalAmount: 100,
      transactions: [],
    },
    {
      id: '2',
      counterparty: { name: 'Charity B', iban: 'NL2' },
      totalAmount: 50,
      transactions: [],
    },
    {
      id: '3',
      counterparty: { name: 'Mistakenly Grouped', iban: 'NL3' },
      totalAmount: 25,
      transactions: [],
    },
  ];

  it('should apply a manual correction correctly', () => {
    const corrections = [
      {
        originalGroupId: 'Mistakenly Grouped#NL3',
        correctedCounterpartyName: 'Corrected Charity',
      },
    ];

    const result = applyManualCorrections(mockTransactionGroups, corrections);

    const correctedGroup = result.find(
      (g) => g.counterparty.name === 'Corrected Charity',
    );
    expect(correctedGroup).toBeDefined();
    expect(correctedGroup?.manuallyEdited).toBe(true);
    expect(correctedGroup?.counterparty.iban).toBe('NL3'); // IBAN should be preserved
  });

  it('should not change anything if no corrections are provided', () => {
    const result = applyManualCorrections(mockTransactionGroups, []);
    expect(result).toEqual(mockTransactionGroups);
  });

  it('should not change anything if the groupId does not match', () => {
    const corrections = [
      {
        originalGroupId: 'Non-existent Group#NL4',
        correctedCounterpartyName: 'This should not appear',
      },
    ];

    const result = applyManualCorrections(mockTransactionGroups, corrections);
    expect(result).toEqual(mockTransactionGroups);
  });

  it('should handle multiple corrections', () => {
    const corrections = [
      {
        originalGroupId: 'Mistakenly Grouped#NL3',
        correctedCounterpartyName: 'Corrected Charity',
      },
      {
        originalGroupId: 'Charity B#NL2',
        correctedCounterpartyName: 'Charity B Renamed',
      },
    ];

    const result = applyManualCorrections(mockTransactionGroups, corrections);

    const correctedGroup1 = result.find(
      (g) => g.counterparty.name === 'Corrected Charity',
    );
    expect(correctedGroup1).toBeDefined();

    const correctedGroup2 = result.find(
      (g) => g.counterparty.name === 'Charity B Renamed',
    );
    expect(correctedGroup2).toBeDefined();
  });
});
