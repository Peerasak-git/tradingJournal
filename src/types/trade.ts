export type Direction = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'WIN' | 'LOSS' | 'BREAK_EVEN';

export interface TradeFinancials {
  grossPnL: number | null;
  commission: number;
  swap: number;
  netPnL: number | null;
  currency: string;
}

export interface TradeAnalysis {
  strategy: string | null;
  timeframe: string | null;
  plannedRR: number | null;
  actualRR: number | null;
}

export interface TradeNotes {
  preTrade: string | null;
  duringTrade: string | null;
  postTrade: string | null;
  detailedNotes: string | null;
  entryImage: string | null;
  exitImage: string | null;
  selfAssessment?: number | null;
}

export interface Trade {
  id: string;
  accountId: string; // Associated account
  instrument: string;
  direction: Direction;
  lotSize: number;
  status: TradeStatus;
  entryDate: string;
  exitDate: string | null;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  financials: TradeFinancials;
  analysis: TradeAnalysis;
  notes: TradeNotes;
}
