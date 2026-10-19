export interface Review {
  id: string;
  date: string;
  rating: number;
  notes: string;
  emotion?: string;
  followedRules?: boolean;
  mistakes?: string;
  lessons?: string;
  createdAt: string;
}
