export interface JournalEntry {
  id: string;
  userId?: string;
  accountId: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
  type: 'GENERAL' | 'PLAN' | 'LEARNING' | 'MARKET_REVIEW';
}
