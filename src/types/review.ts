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
  // Professional trading journal additions
  tradingSessions?: string[];
  psychologyPitfalls?: string[];
  energyLevel?: 'high' | 'normal' | 'low';
  tomorrowPlan?: string;
  chartUrl?: string;
  createdAt: string;
}
