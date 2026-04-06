import { TransactionGroup } from './analysis';

export interface ManualCorrection {
  originalGroupId: string;
  correctedCounterpartyName: string;
}

export function applyManualCorrections(
  groups: TransactionGroup[],
  corrections: ManualCorrection[],
): TransactionGroup[] {
  const correctedGroups = groups.map((d) => ({ ...d }));

  for (const correction of corrections) {
    const groupToCorrect = correctedGroups.find(
      (d) =>
        `${d.counterparty.name}#${d.counterparty.iban}` ===
        correction.originalGroupId,
    );

    if (groupToCorrect) {
      groupToCorrect.counterparty.name = correction.correctedCounterpartyName;
      groupToCorrect.manuallyEdited = true;
    }
  }

  return correctedGroups;
}
