export interface Transaction {
  date: string;
  description: string;
  amount: number;
  counterparty?: string;
}


export interface DonationResult {
  organization: string;
  amount: number;
  date: string;
  description: string;
  isAnbi: boolean;
  confidence: number;
}
