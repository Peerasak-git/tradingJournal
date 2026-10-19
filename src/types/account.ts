export type AccountType = 'STANDARD' | 'CENT';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  broker: string;
  balance: number;
  currency: string;
  leverage: string;
  createdAt: string;
}
