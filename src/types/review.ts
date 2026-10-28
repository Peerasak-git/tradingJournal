export interface Review {
  id: string;
  date: string;
  rating: number;
  notes: string;
  emotion?: string;
  emotions?: string[];
  followedRules?: boolean;
  mistakes?: string;
  lessons?: string;
  createdAt: string;
}
