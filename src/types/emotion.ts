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

export interface CooldownSession {
  isActive: boolean;
  durationMinutes: number;
  startedAt: string; // ISO string
  endsAt: string; // ISO string
  reason: string;
  sourceEmotions?: string[]; // IDs of negative emotions that triggered the cooldown
  note?: string;
  completedAt?: string;
}

export interface CooldownPreset {
  id: string;
  minutes: number;
  labelTh: string;
  labelEn: string;
  icon: string;
  descTh: string;
  descEn: string;
}

export const COOLDOWN_PRESETS: CooldownPreset[] = [
  {
    id: '15m',
    minutes: 15,
    labelTh: '15 นาที (จิบน้ำ / หายใจลึกๆ)',
    labelEn: '15 Mins (Quick Reset)',
    icon: '☕',
    descTh: 'ดื่มน้ำ 1 แก้ว ปรับลมหายใจ ดึงสติกลับมา',
    descEn: 'Drink water, deep breaths, regain focus',
  },
  {
    id: '30m',
    minutes: 30,
    labelTh: '30 นาที (ลุกเดิน / พักสายตา)',
    labelEn: '30 Mins (Power Walk)',
    icon: '🚶',
    descTh: 'ลุกออกจากโต๊ะเทรด ยืดเส้นยืดสาย พักสายตาจากชาร์ต',
    descEn: 'Step away from screen, stretch, rest eyes',
  },
  {
    id: '60m',
    minutes: 60,
    labelTh: '1 ชั่วโมง (ล้างสมอง / ออกกำลังกาย)',
    labelEn: '1 Hour (Mind Refresh)',
    icon: '🧠',
    descTh: 'ปิดหน้าจอกราฟ ทำกิจกรรมอื่นให้สมองคลายความล้า',
    descEn: 'Shut down charts, workout, clear mental clutter',
  },
  {
    id: '120m',
    minutes: 120,
    labelTh: '2 ชั่วโมง (รอ Session ถัดไป)',
    labelEn: '2 Hours (Session Pause)',
    icon: '⏳',
    descTh: 'พักข้ามรอบตลาด เช่น รอ London หรือ New York Session',
    descEn: 'Wait for next market session (London/NY)',
  },
  {
    id: '240m',
    minutes: 240,
    labelTh: '4 ชั่วโมง (พักครึ่งวัน)',
    labelEn: '4 Hours (Half-Day Break)',
    icon: '🛡️',
    descTh: 'หยุดความเสี่ยงครึ่งวัน ป้องกันการ Overtrading ติดต่อกัน',
    descEn: 'Half-day circuit breaker against tilt/overtrading',
  },
  {
    id: 'eod',
    minutes: 0, // dynamic calculated until 23:59:59
    labelTh: 'พักทั้งวัน (พอแค่นี้สำหรับวันนี้)',
    labelEn: 'Rest of Day (Market Close)',
    icon: '🌙',
    descTh: 'ยุติการเทรดของวัน รักษาทุนไว้สู้ใหม่วันพรุ่งนี้',
    descEn: 'Done for the day. Protect capital for tomorrow',
  },
];
