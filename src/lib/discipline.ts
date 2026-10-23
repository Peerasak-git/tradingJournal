import { Trade } from '@/types/trade';
import { Review } from '@/types/review';

export type CatMood = 'HAPPY' | 'CALM' | 'WARNING' | 'TILT';

export interface DisciplineMetrics {
  score: number; // 0 - 100
  mood: CatMood;
  title: string;
  message: string;
  advice: string;
  todayTradeCount: number;
  consecutiveLosses: number;
  noSlTradesCount: number;
  followedRules: boolean;
  isOvertrading: boolean;
  isRevengeTrading: boolean;
}

export function evaluateDiscipline(trades: Trade[], reviews: Review[]): DisciplineMetrics {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter today's trades (by entryDate or exitDate)
  const todayTrades = trades.filter(t => {
    const entryDay = t.entryDate ? t.entryDate.split('T')[0] : '';
    const exitDay = t.exitDate ? t.exitDate.split('T')[0] : '';
    return entryDay === todayStr || exitDay === todayStr;
  });

  // Calculate today's metrics
  const todayTradeCount = todayTrades.length;
  
  // Trades without Stop Loss
  const noSlTradesCount = todayTrades.filter(t => !t.stopLoss || t.stopLoss <= 0).length;

  // Calculate consecutive losses today
  const closedToday = todayTrades
    .filter(t => t.status !== 'OPEN')
    .sort((a, b) => new Date(b.exitDate || b.entryDate).getTime() - new Date(a.exitDate || a.entryDate).getTime());

  let consecutiveLosses = 0;
  for (const t of closedToday) {
    if (t.status === 'LOSS') {
      consecutiveLosses++;
    } else {
      break;
    }
  }

  // Check today's review rules adherence
  const todayReview = reviews.find(r => r.date === todayStr);
  const followedRules = todayReview ? (todayReview.followedRules ?? true) : true;

  // Evaluation flags
  const isOvertrading = todayTradeCount >= 5;
  const isRevengeTrading = consecutiveLosses >= 2 && todayTradeCount >= 3;

  // Calculate Discipline Score (starts at 100)
  let score = 100;

  if (isOvertrading) score -= 30;
  else if (todayTradeCount >= 3) score -= 10;

  if (isRevengeTrading) score -= 35;
  else if (consecutiveLosses >= 1) score -= 10;

  if (noSlTradesCount > 0) score -= Math.min(25, noSlTradesCount * 15);
  if (!followedRules) score -= 30;

  score = Math.max(0, Math.min(100, score));

  // Determine Mood & Messages
  let mood: CatMood = 'CALM';
  let title = 'น้องแมวอารมณ์สงบ';
  let message = 'ตลาดวิ่งเรื่อยๆ ใจเย็นๆ รอจังหวะเข้าตามแผนนะเหมียว 🌿';
  let advice = 'หมั่นเช็ค Checklist ก่อนเปิดออเดอร์เสมอ';

  if (score >= 80) {
    mood = 'HAPPY';
    title = 'น้องแมวแฮปปี้มาก!';
    if (todayTradeCount > 0) {
      message = 'เจ้านายเทรดตามแผนเป๊ะ วินัยยอดเยี่ยมแบบนี้พอร์ตโตแน่นอนเหมียว! ✨🐾';
      advice = 'รักษาวินัยแบบนี้ต่อไป วันนี้อาจจะพอแค่นี้แล้วพักผ่อนได้เลย';
    } else {
      message = 'ยังไม่มีออเดอร์วันนี้ รอ Setup ที่ใช่แล้วค่อยเข้า อย่าเพิ่ง FOMO น้าเหมียว 🐱';
      advice = 'การไม่เข้าเทรดในตลาดที่ไม่ชัดเจน ถือเป็นสุดยอดวินัยอย่างหนึ่ง';
    }
  } else if (score >= 60) {
    mood = 'CALM';
    title = 'น้องแมวคอยเฝ้ามอง';
    message = 'เทรดด้วยสมาธินะเหมียว ตลาดมีโอกาสให้เสมอ ไม่ต้องรีบร้อน 🍵';
    advice = 'รักษาความเสี่ยงต่อไม้ให้อยู่ในกรอบ 1-2% เสมอ';
  } else if (score >= 40) {
    mood = 'WARNING';
    title = 'น้องแมวเริ่มเป็นห่วง!';
    if (noSlTradesCount > 0) {
      message = 'เจ้านาย! มีไม้ที่ไม่ได้ตั้ง Stop Loss ด้วยนะเหมียว อันตรายมาก! ⚠️';
      advice = 'รีบเช็คจุดตัดขาดทุน และห้ามเทรดโดยไม่มี SL เด็ดขาด';
    } else if (isOvertrading) {
      message = 'วันนี้เปิดไปหลายไม้แล้วนะเหมียว เริ่มเหนื่อยหรือยัง? พักสายตาสักนิดเถอะ 🐾';
      advice = 'การ Overtrade มักตามมาด้วยการคืนกำไร ลองตั้งโควต้าวันละไม่เกิน 3 ไม้ดูนะ';
    } else {
      message = 'เสียติดกันแล้วนะเหมียว อย่าเพิ่งรีบแก้มือ ไปล้างหน้าดื่มน้ำก่อน 💧';
      advice = 'หลังแพ้ติดกัน ควรหยุดพักอย่างน้อย 15-30 นาทีเพื่อรีเซ็ตอารมณ์';
    }
  } else {
    mood = 'TILT';
    title = '🚨 น้องแมวเตือนสติขั้นวิกฤต!';
    if (isRevengeTrading) {
      message = 'หยุดก่อนเจ้านาย! กำลังเข้าโหมด Revenge Trade แล้วนะเหมียว! ปิดจอด่วนเลย 🛑';
      advice = 'ตลาดกำลังดึงอารมณ์คุณไป ปิดโปรแกรมแล้วไปเดินเล่นหรือนอนพักทันที!';
    } else if (isOvertrading) {
      message = 'เจ้านาย Overtrade หนักมากแล้วเหมียว! พอแค่นี้ก่อน พรุ่งนี้ตลาดยังเปิดอยู่! 🛑';
      advice = 'หยุดเปิดไม้เพิ่มในวันนี้ทันที เพื่อปกป้องเงินทุนที่เหลืออยู่';
    } else {
      message = 'วันนี้น้องแมวเป็นห่วงมาก อารมณ์กำลังครอบงำแผนการเทรด พักก่อนนะเหมียว 😿';
      advice = 'ยอมรับผลของวันนี้ แล้วบันทึกบทเรียนในหน้า Daily Review ครับ';
    }
  }

  return {
    score,
    mood,
    title,
    message,
    advice,
    todayTradeCount,
    consecutiveLosses,
    noSlTradesCount,
    followedRules,
    isOvertrading,
    isRevengeTrading
  };
}
