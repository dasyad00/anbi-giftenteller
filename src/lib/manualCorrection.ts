import { GroupedDonation } from './analysis';

export interface ManualCorrection {
  originalGroupId: string;
  correctedCounterpartyName: string;
}

export function applyManualCorrections(
  donations: GroupedDonation[],
  corrections: ManualCorrection[],
): GroupedDonation[] {
  const correctedDonations = donations.map((d) => ({ ...d }));

  for (const correction of corrections) {
    const donationToCorrect = correctedDonations.find(
      (d) =>
        `${d.counterparty.name}#${d.counterparty.iban}` ===
        correction.originalGroupId,
    );

    if (donationToCorrect) {
      donationToCorrect.counterparty.name =
        correction.correctedCounterpartyName;
      donationToCorrect.manuallyEdited = true;
    }
  }

  return correctedDonations;
}
