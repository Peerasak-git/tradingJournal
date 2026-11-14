export interface EmotionTag {
  id: string;
  labelTh: string;
  labelEn: string;
  emoji: string;
  score: number;
  category: 'positive' | 'neutral' | 'negative';
  descriptionTh?: string;
  descriptionEn?: string;
}

export const PRESET_EMOTIONS: EmotionTag[] = [
  // 🟢 Positive Emotions (วินัย & พลังบวก)
  { id: 'happy', labelTh: 'มีความสุข / อารมณ์ดี', labelEn: 'Happy & Joyful', emoji: '😊', score: 10, category: 'positive', descriptionTh: 'จิตใจสดใส มีพลังบวกสูง' },
  { id: 'calm', labelTh: 'นิ่งสงบ / จิตใจสงบ', labelEn: 'Calm & Peaceful', emoji: '🧘', score: 10, category: 'positive', descriptionTh: 'ไร้อารมณ์ครอบงำ นิ่งสงบดั่งสายน้ำ' },
  { id: 'disciplined', labelTh: 'มั่นใจในแผน / มีวินัย', labelEn: 'Disciplined & Confident', emoji: '🎯', score: 10, category: 'positive', descriptionTh: 'พร้อมเทรดตาม Setup 100%' },
  { id: 'risk_accept', labelTh: 'ยอมรับ SL ได้ 100%', labelEn: 'Full Risk Acceptance', emoji: '🛡️', score: 8, category: 'positive', descriptionTh: 'ยอมรับความเสี่ยงได้โดยไม่เสียทรง' },
  { id: 'patient', labelTh: 'อดทนรอจังหวะ / ไม่รีบ', labelEn: 'Patient / Sniper Mode', emoji: '⏳', score: 8, category: 'positive', descriptionTh: 'รอกราฟเข้าเงื่อนไขได้อย่างอดทน' },
  { id: 'focused', labelTh: 'สมองปลอดโปร่ง / สมาธิดี', labelEn: 'High Focus & Clarity', emoji: '🧠', score: 8, category: 'positive', descriptionTh: 'ความคิดเฉียบคม วิเคราะห์ได้แม่นยำ' },
  { id: 'fresh', labelTh: 'สดชื่น / พักผ่อนเต็มที่', labelEn: 'Refreshed & Energetic', emoji: '⚡', score: 6, category: 'positive', descriptionTh: 'นอนหลับเต็มอิ่ม ร่างกายพร้อม' },
  { id: 'let_run', labelTh: 'ปล่อยกำไร Run Trend ได้', labelEn: 'Trend Following Mindset', emoji: '📈', score: 6, category: 'positive', descriptionTh: 'ไม่ปิดกำไรเร็วเกินไป ปล่อยตามแผน' },

  // ⚪ Neutral (เป็นกลาง / ปกติ)
  { id: 'neutral', labelTh: 'เฉยๆ / ปกติ', labelEn: 'Neutral / Normal', emoji: '😐', score: 0, category: 'neutral', descriptionTh: 'ไม่มีอารมณ์ด้านใดเป็นพิเศษ' },
  { id: 'observing', labelTh: 'สังเกตการณ์ / รอข่าวออก', labelEn: 'Observing Market', emoji: '🔍', score: 0, category: 'neutral', descriptionTh: 'เฝ้าดูพฤติกรรมราคา ยังไม่รีบเข้า' },
  { id: 'coffee', labelTh: 'จิบกาแฟ / รอดูตลาด', labelEn: 'Chilling / Waiting', emoji: '☕', score: 0, category: 'neutral', descriptionTh: 'สบายๆ ไม่กดดัน รอจังหวะคมๆ' },

  // 🔴 Negative / Risk (ความเสี่ยง & กับดักอารมณ์)
  { id: 'anxious', labelTh: 'กังวล / กลัวตกรถ', labelEn: 'Anxious / Fearful', emoji: '😰', score: -6, category: 'negative', descriptionTh: 'ใจสั่น กังวลว่าจะพลาดโอกาส' },
  { id: 'fear_loss', labelTh: 'กลัวขาดทุน / ลังเลไม่กล้ากด', labelEn: 'Hesitant / Fear of Loss', emoji: '💸', score: -6, category: 'negative', descriptionTh: 'กลัวเสียเงิน ลังเลแม้มีสัญญาณชัด' },
  { id: 'fatigued', labelTh: 'อ่อนเพลีย / ล้า / นอนน้อย', labelEn: 'Fatigued / Sleepy', emoji: '🥱', score: -6, category: 'negative', descriptionTh: 'ร่างกายเหนื่อยล้า สมาธิลดลง' },
  { id: 'stressed', labelTh: 'เครียดจากงาน / กดดัน', labelEn: 'Stressed / Pressured', emoji: '😣', score: -8, category: 'negative', descriptionTh: 'มีความตึงเครียดสะสมจากเรื่องอื่น' },
  { id: 'fomo', labelTh: 'FOMO / คันมืออยากกด', labelEn: 'FOMO / Impatient', emoji: '🚀', score: -8, category: 'negative', descriptionTh: 'เห็นแท่งเทียนวิ่งแล้วอยากกระโดดใส่' },
  { id: 'overtrading', labelTh: 'คันมืออยาก Overtrade', labelEn: 'Urge to Overtrade', emoji: '⚡', score: -8, category: 'negative', descriptionTh: 'เข้าออเดอร์ถี่เกินไปโดยไร้แผน' },
  { id: 'greedy', labelTh: 'โลภ / อยากรวยเร็ว', labelEn: 'Greedy / Rushing Profits', emoji: '💣', score: -8, category: 'negative', descriptionTh: 'เปิด Lot เกินขนาด หวังกำไรก้อนใหญ่' },
  { id: 'tilt', labelTh: 'หัวร้อน / เสียทรง (Tilt)', labelEn: 'Full Tilt / Frustrated', emoji: '😡', score: -10, category: 'negative', descriptionTh: 'หงุดหงิดจากการโดนลากหรือโดน SL' },
  { id: 'revenge', labelTh: 'เทรดแก้แค้น (Revenge)', labelEn: 'Revenge Trading', emoji: '⚔️', score: -10, category: 'negative', descriptionTh: 'อยากเอาเงินที่เสียคืนมาทันที' },
  { id: 'gambling', labelTh: 'หวังพึ่งดวง / All-in', labelEn: 'Gambling / YOLO Mindset', emoji: '🎰', score: -10, category: 'negative', descriptionTh: 'เทรดเหมือนแทงพนัน ละทิ้งระบบเทรด' },
];

export interface DailyEmotionalCheckin {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  selectedEmotionIds: string[];
  netScore: number; // e.g. +14, -8
  baseScore: number; // 50
  totalScore: number; // clamped to 0 - 100
  status: 'OPTIMAL' | 'NORMAL' | 'WARNING';
  advice: string;
  note?: string;
  updatedAt: string;
}
