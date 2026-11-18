export type GameLevel = 'A' | 'B' | 'C';

export interface GameCriterion {
  id: string;
  level: GameLevel;
  labelTh: string;
  labelEn: string;
  category: 'execution' | 'risk' | 'emotion';
}

export const GAME_CRITERIA: GameCriterion[] = [
  // A-Game (Peak State)
  { id: 'a_plan', level: 'A', labelTh: 'เข้าตามแผน 100% รอสัญญาณยืนยันครบถ้วน', labelEn: 'Followed trade plan 100%, waited patiently for confirmation', category: 'execution' },
  { id: 'a_risk', level: 'A', labelTh: 'ขนาดความเสี่ยงคงที่ ไม่มีความโลภหรือตื่นเต้นกับกำไร', labelEn: 'Risk perfectly sized, no excitement or fear of outcome', category: 'risk' },
  { id: 'a_detach', level: 'A', labelTh: 'ยอมรับผลแพ้ชนะได้สนิทใจ ไม่ติดใจผลลัพธ์ของไม้ก่อนหน้า', labelEn: 'Fully detached from P&L, previous trade has zero mental impact', category: 'emotion' },
  { id: 'a_screen', level: 'A', labelTh: 'ตั้ง TP/SL แล้วปล่อยให้ระบบทำงาน ไม่จ้องจอพร่ำเพรื่อ', labelEn: 'Set TP/SL and let edge play out, no micro-managing', category: 'execution' },

  // B-Game (Average State / Slight Distortion)
  { id: 'b_hesitate', level: 'B', labelTh: 'มีความลังเลตอนกดเข้า เล็กน้อย แต่ยังเข้าตามแผนได้', labelEn: 'Slight hesitation before pulling trigger, but still executed', category: 'execution' },
  { id: 'b_frustrate', level: 'B', labelTh: 'รู้สึกหงุดหงิดเวลาโดน SL เล็กน้อย แต่ยังไม่ถึงขั้นอยากเอาคืน', labelEn: 'Mild annoyance after stop out, but resisted revenge urges', category: 'emotion' },
  { id: 'b_pnl_watch', level: 'B', labelTh: 'แอบเปิดดูกราฟและ PnL บ่อยกว่าปกติ กังวลเล็กน้อย', labelEn: 'Checking P&L more often than necessary, slight anxiety', category: 'emotion' },
  { id: 'b_boredom', level: 'B', labelTh: 'เริ่มรู้สึกเบื่อเมื่อตลาดนิ่ง มีความคิดอยากหาไม้เล่นแก้เบื่อ', labelEn: 'Restlessness during slow markets, mild boredom urges', category: 'execution' },

  // C-Game (Tilt / Disaster Danger Zone)
  { id: 'c_revenge', level: 'C', labelTh: 'อยากเอาคืนทันที (Revenge) หลังเพิ่งโดน Stop Loss', labelEn: 'Urge to immediately win back loss after being stopped out', category: 'emotion' },
  { id: 'c_move_sl', level: 'C', labelTh: 'เลื่อน Stop Loss หนี หรือถอด SL ออกเพราะไม่อยากยอมแพ้', labelEn: 'Moved or removed stop loss to avoid realizing a loss', category: 'risk' },
  { id: 'c_fomo', level: 'C', labelTh: 'กระโดดเข้าตามแท่งเทียนวิ่งแรงเพราะกลัวตกรถ (FOMO)', labelEn: 'Chased exploding green/red candle with no setup (FOMO)', category: 'execution' },
  { id: 'c_lot_increase', level: 'C', labelTh: 'เพิ่มขนาด Lot เกินเกณฑ์เพื่อเร่งกู้พอร์ตกลับมา', labelEn: 'Increased lot size recklessly to fast-track recovery', category: 'risk' },
];

export interface InTradeUrgeType {
  id: string;
  emoji: string;
  labelTh: string;
  labelEn: string;
  descriptionTh: string;
  dangerLevel: 'safe' | 'caution' | 'danger';
}

export const PRESET_IN_TRADE_URGES: InTradeUrgeType[] = [
  { id: 'panic_profit', emoji: '🏃‍♂️', labelTh: 'กลัวกำไรหาย / อยากรีบปิดก่อนถึง TP', labelEn: 'Fear of Giving Back Profits / Early Close', descriptionTh: 'กราฟวิ่งถูกทางแต่ใจสั่น รีบกดปิดทั้งที่ยังไม่ถึง Target R:R', dangerLevel: 'caution' },
  { id: 'screen_staring', emoji: '👀', labelTh: 'จ้องกราฟไม่กะพริบตา / เช็ค PnL รัวๆ', labelEn: 'Screen Addiction / Obsessive P&L Watch', descriptionTh: 'เปิดดูกราฟทุก 30 วินาที สร้าง Cortisol และความเครียดโดยไม่จำเป็น', dangerLevel: 'caution' },
  { id: 'move_tp_greedy', emoji: '🤑', labelTh: 'โลภขยับ TP ไกลออกไปนอกแผนเดิม', labelEn: 'Greedily Extending TP Beyond Setup', descriptionTh: 'เห็นกราฟแรงเลยเลื่อน TP หนี สุดท้ายกราฟดีดกลับมากินทุน', dangerLevel: 'danger' },
  { id: 'hope_stop', emoji: '🙏', labelTh: 'ภาวนาให้กราฟกลับตัวตอนกำลังลาก SL', labelEn: 'Hope Mode / Bargaining with Market', descriptionTh: 'ไม่เตรียมใจรับ SL เริ่มสวดมนต์ขอให้กราฟกลับตัว', dangerLevel: 'danger' },
  { id: 'calm_zen', emoji: '🧘‍♂️', labelTh: 'จิตใจสงบ นิ่ง ปล่อยให้สถิติทำหน้าที่', labelEn: 'Calm Detachment / Flawless Execution', descriptionTh: 'ทำตามกระบวนการครบถ้วน ไม่กระวนกระวายกับผลลัพธ์', dangerLevel: 'safe' },
];

export interface LoggedUrge {
  id: string;
  timestamp: string;
  urgeId: string;
  pair?: string;
  intensity: number; // 1-5
  note?: string;
}

export interface BioMetrics {
  sleepHours: number; // e.g. 7.5
  sleepQuality: number; // 1-5
  energyLevel: number; // 1-10
  stressLevel: 'low' | 'moderate' | 'high';
}

export interface MindsetHubDayState {
  date: string; // YYYY-MM-DD
  currentGame: GameLevel;
  selectedCriteriaIds: string[];
  gameNotes?: string;
  urges: LoggedUrge[];
  bioMetrics: BioMetrics;
  zenCompletedCount: number;
  lastUpdated: string;
}
