export interface Party {
  name: string;
  iban: string;
  rsin?: number;
}

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  counterparty: Party;
}

export interface DonationResult {
  organization: string;
  amount: number;
  date: string;
  description: string;
  isAnbi: boolean;
  confidence: number;
}
