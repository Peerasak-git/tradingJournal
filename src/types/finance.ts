export type FinanceType = 'INCOME' | 'EXPENSE';

export interface FinanceEntry {
  id: string;
  userId?: string;
  type: FinanceType;
  amount: number;
  date: string; // ISO string for Day/Month/Year
  description: string;
  category?: string;
  accountId?: string;
}
