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

export interface PreTradeChecklist {
  validSetup: boolean; // กราฟตรง Setup 100%
  properRisk: boolean; // Lot Size & ความเสี่ยงถูกต้อง ไม่ Overlot
  acceptedSL: boolean; // ยอมรับ SL ได้ 100% โดยไม่หัวร้อน
  calmMindset: boolean; // จิตใจนิ่งพอ ไม่ได้เข้าเพราะ FOMO/คันมือ/แก้แค้น
}

export type CognitiveBiasType =
  | 'paper_hands'
  | 'moved_sl'
  | 'fomo_chase'
  | 'revenge_lot'
  | 'overconfidence'
  | 'overtrading'
  | 'no_plan_entry';

export interface TradeNotes {
  preTrade: string | null;
  duringTrade: string | null;
  postTrade: string | null;
  detailedNotes: string | null;
  entryImage: string | null;
  exitImage: string | null;
  tradingViewUrl?: string | null;
  exitTradingViewUrl?: string | null;
  selfAssessment?: number | null;
  checklist?: PreTradeChecklist;
  mistakes?: CognitiveBiasType[];
  mistakeCost?: number; // Estimated financial cost caused by psychological bias
}

export interface Trade {
  id: string;
  userId?: string;
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
  mindsetScoreAtEntry?: number; // Emotional score (0-100) when trade was placed
  emotionalStateAtEntry?: 'OPTIMAL' | 'NORMAL' | 'WARNING';
}
