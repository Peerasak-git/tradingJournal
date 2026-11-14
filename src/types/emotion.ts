export interface EmotionTag {
  id: string;
  labelTh: string;
  labelEn: string;
  emoji: string;
  score: number;
  category: 'positive' | 'neutral' | 'negative';
}

export const PRESET_EMOTIONS: EmotionTag[] = [
  // Positive (+10, +8, +6)
  { id: 'happy', labelTh: 'มีความสุข / อารมณ์ดี', labelEn: 'Happy & Positive', emoji: '😊', score: 10, category: 'positive' },
  { id: 'calm', labelTh: 'นิ่งสงบ / มีวินัย', labelEn: 'Calm & Disciplined', emoji: '🧘', score: 10, category: 'positive' },
  { id: 'focused', labelTh: 'โฟกัสดี / มั่นใจตามแผน', labelEn: 'Focused & Confident', emoji: '🎯', score: 8, category: 'positive' },
  { id: 'fresh', labelTh: 'สดชื่น / พักผ่อนเต็มที่', labelEn: 'Refreshed & Energetic', emoji: '⚡', score: 6, category: 'positive' },
  
  // Neutral (0)
  { id: 'neutral', labelTh: 'เฉยๆ / ปกติ', labelEn: 'Neutral / Normal', emoji: '😐', score: 0, category: 'neutral' },
  
  // Negative (-6, -8, -10)
  { id: 'anxious', labelTh: 'กังวล / กลัวขาดทุน', labelEn: 'Anxious / Fearful', emoji: '😰', score: -6, category: 'negative' },
  { id: 'fatigued', labelTh: 'อ่อนเพลีย / ล้า / ง่วง', labelEn: 'Fatigued / Sleepy', emoji: '🥱', score: -6, category: 'negative' },
  { id: 'stressed', labelTh: 'เครียด / กดดัน', labelEn: 'Stressed / Pressured', emoji: '😣', score: -8, category: 'negative' },
  { id: 'fomo', labelTh: 'FOMO / คันมืออยากกด', labelEn: 'FOMO / Impatient', emoji: '🚀', score: -8, category: 'negative' },
  { id: 'tilt', labelTh: 'หัวร้อน / อยากเอาคืน', labelEn: 'Tilt / Frustrated', emoji: '😡', score: -10, category: 'negative' },
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
