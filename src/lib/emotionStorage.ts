'use client';

import { DailyEmotionalCheckin, PRESET_EMOTIONS } from '@/types/emotion';
import { safeSetLocalStorage, getUserKey, getActiveUserId } from '@/lib/clientStorage';
import { getSupabase } from '@/lib/supabase';

const EMOTION_KEY = 'tj_daily_emotions';

export function calculateEmotionalScore(selectedIds: string[]): {
  netScore: number;
  baseScore: number;
  totalScore: number;
  status: 'OPTIMAL' | 'NORMAL' | 'WARNING';
  adviceTh: string;
  adviceEn: string;
} {
  const baseScore = 50;
  let netScore = 0;

  selectedIds.forEach((id) => {
    const emotion = PRESET_EMOTIONS.find((e) => e.id === id);
    if (emotion) {
      netScore += emotion.score;
    }
  });

  // Calculate total score bounded between 0 and 100
  const totalScore = Math.max(0, Math.min(100, baseScore + netScore));

  let status: 'OPTIMAL' | 'NORMAL' | 'WARNING' = 'NORMAL';
  let adviceTh = 'สภาวะอารมณ์เป็นปกติ แนะนำให้เทรดตามแผนและจำกัดความเสี่ยงไม่เกิน 1-2% ต่อไม้';
  let adviceEn = 'Mindset is stable. Stick to your plan and limit risk to 1-2% per trade.';

  if (netScore >= 6 || totalScore >= 70) {
    status = 'OPTIMAL';
    adviceTh = 'สภาวะจิตใจพร้อมเทรด 100% มีสมาธิและนิ่งสงบ ทำตาม Setup แผนการเทรดได้อย่างมั่นใจ';
    adviceEn = 'Optimal mental state. Highly focused and disciplined. Trade your setups with confidence.';
  } else if (netScore < 0 || totalScore < 50) {
    status = 'WARNING';
    adviceTh = '⚠️ สภาวะอารมณ์มีความเสี่ยงสูง (มีภาวะเครียด/FOMO/ล้า) แนะนำให้พักเทรด หรือลด Lot Size ลง 50%';
    adviceEn = '⚠️ High emotional risk (Stress/FOMO/Fatigue detected). Consider resting or reducing lot size by 50%.';
  }

  return {
    netScore,
    baseScore,
    totalScore,
    status,
    adviceTh,
    adviceEn,
  };
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getDailyCheckins(): Promise<DailyEmotionalCheckin[]> {
  if (typeof window === 'undefined') return [];

  const key = getUserKey(EMOTION_KEY);
  const local = localStorage.getItem(key);
  let checkins: DailyEmotionalCheckin[] = [];

  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) checkins = parsed;
    } catch {}
  }

  // Check Supabase if available
  const supabase = getSupabase();
  const userId = getActiveUserId();
  if (supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('daily_emotions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (!error && data && data.length > 0) {
        const remote = data.map((d: any) => ({
          ...(d.data || d),
          userId: d.user_id || userId,
        }));
        // Merge with local
        const map = new Map<string, DailyEmotionalCheckin>();
        remote.forEach((r: DailyEmotionalCheckin) => map.set(r.date, r));
        checkins.forEach((c: DailyEmotionalCheckin) => {
          if (!map.has(c.date)) map.set(c.date, c);
        });
        checkins = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
        safeSetLocalStorage(key, JSON.stringify(checkins));
      }
    } catch (e) {
      console.warn('Supabase daily emotions fetch skipped:', e);
    }
  }

  return checkins;
}

export async function getTodayCheckin(): Promise<DailyEmotionalCheckin | null> {
  const checkins = await getDailyCheckins();
  const today = getTodayDateString();
  return checkins.find((c) => c.date === today) || null;
}

export async function saveDailyCheckin(
  selectedEmotionIds: string[],
  note = ''
): Promise<DailyEmotionalCheckin> {
  const today = getTodayDateString();
  const userId = getActiveUserId() || undefined;
  const { netScore, baseScore, totalScore, status, adviceTh } = calculateEmotionalScore(selectedEmotionIds);

  const checkin: DailyEmotionalCheckin = {
    id: `chk-${today}`,
    userId,
    date: today,
    selectedEmotionIds,
    netScore,
    baseScore,
    totalScore,
    status,
    advice: adviceTh,
    note,
    updatedAt: new Date().toISOString(),
  };

  const checkins = await getDailyCheckins();
  const filtered = checkins.filter((c) => c.date !== today);
  const updated = [checkin, ...filtered];

  const key = getUserKey(EMOTION_KEY);
  safeSetLocalStorage(key, JSON.stringify(updated));

  // Sync with Supabase if configured
  const supabase = getSupabase();
  if (supabase && userId) {
    Promise.resolve(
      supabase.from('daily_emotions').upsert({
        id: checkin.id,
        user_id: userId,
        date: today,
        data: checkin,
        updated_at: new Date().toISOString(),
      })
    )
      .then(({ error }) => {
        if (error) console.warn('Supabase daily emotions upsert warning:', error.message);
      })
      .catch(() => {});
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dailyEmotionUpdated', { detail: checkin }));
  }

  return checkin;
}
