'use client';

import {
  DailyEmotionalCheckin,
  PRESET_EMOTIONS,
  CooldownSession,
  EmotionLogEntry,
  EmotionTimePeriod,
  DailyDebrief,
  CircuitBreakerTrigger,
} from '@/types/emotion';
import { Trade } from '@/types/trade';
import { safeSetLocalStorage, getUserKey, getActiveUserId } from '@/lib/clientStorage';
import { getSupabase } from '@/lib/supabase';

const EMOTION_KEY = 'tj_daily_emotions';

export const PERIOD_METADATA: Record<
  EmotionTimePeriod,
  {
    labelTh: string;
    labelEn: string;
    icon: string;
    timeRangeTh: string;
    timeRangeEn: string;
    session: 'ASIAN' | 'LONDON' | 'NEW_YORK';
  }
> = {
  morning: {
    labelTh: 'ช่วงเช้า',
    labelEn: 'Morning',
    icon: '🌅',
    timeRangeTh: '05:00 - 11:59 (ตลาดเอเชีย)',
    timeRangeEn: '05:00 - 11:59 (Asian Session)',
    session: 'ASIAN',
  },
  afternoon: {
    labelTh: 'ช่วงบ่าย',
    labelEn: 'Afternoon',
    icon: '☀️',
    timeRangeTh: '12:00 - 17:59 (ตลาดลอนดอน)',
    timeRangeEn: '12:00 - 17:59 (London Session)',
    session: 'LONDON',
  },
  evening: {
    labelTh: 'ช่วงเย็น-ค่ำ',
    labelEn: 'Evening',
    icon: '🌆',
    timeRangeTh: '18:00 - 22:59 (ตลาดนิวยอร์ก)',
    timeRangeEn: '18:00 - 22:59 (NY Session)',
    session: 'NEW_YORK',
  },
  night: {
    labelTh: 'ช่วงดึก',
    labelEn: 'Late Night',
    icon: '🌙',
    timeRangeTh: '23:00 - 04:59 (ก่อนนอน/ปิดวัน)',
    timeRangeEn: '23:00 - 04:59 (Late Night/Wrap)',
    session: 'NEW_YORK',
  },
};

export function getCurrentTimePeriod(date = new Date()): {
  period: EmotionTimePeriod;
  labelTh: string;
  labelEn: string;
  icon: string;
  marketSession: 'ASIAN' | 'LONDON' | 'NEW_YORK';
} {
  const hour = date.getHours();
  let period: EmotionTimePeriod = 'morning';

  if (hour >= 5 && hour < 12) {
    period = 'morning';
  } else if (hour >= 12 && hour < 18) {
    period = 'afternoon';
  } else if (hour >= 18 && hour < 23) {
    period = 'evening';
  } else {
    period = 'night';
  }

  const meta = PERIOD_METADATA[period];
  return {
    period,
    labelTh: meta.labelTh,
    labelEn: meta.labelEn,
    icon: meta.icon,
    marketSession: meta.session,
  };
}

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
  note = '',
  customPeriod?: EmotionTimePeriod
): Promise<DailyEmotionalCheckin> {
  const today = getTodayDateString();
  const userId = getActiveUserId() || undefined;
  const { netScore, baseScore, totalScore, status, adviceTh } = calculateEmotionalScore(selectedEmotionIds);

  const now = new Date();
  const periodInfo = getCurrentTimePeriod(now);
  const activePeriod = customPeriod || periodInfo.period;
  const activeMeta = PERIOD_METADATA[activePeriod];
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const logEntry: EmotionLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    time: timeString,
    period: activePeriod,
    periodLabelTh: activeMeta.labelTh,
    periodLabelEn: activeMeta.labelEn,
    marketSession: activeMeta.session,
    selectedEmotionIds,
    netScore,
    totalScore,
    status,
    advice: adviceTh,
    note,
  };

  const checkins = await getDailyCheckins();
  const existing = checkins.find((c) => c.date === today);

  let existingLogs: EmotionLogEntry[] = [];
  if (existing && Array.isArray(existing.logs) && existing.logs.length > 0) {
    existingLogs = [...existing.logs];
  } else if (existing && existing.selectedEmotionIds && existing.selectedEmotionIds.length > 0) {
    // Convert existing legacy checkin into an initial morning log
    const prevPeriod: EmotionTimePeriod = existing.currentPeriod || 'morning';
    const prevMeta = PERIOD_METADATA[prevPeriod];
    existingLogs = [
      {
        id: `log-legacy-${existing.date}`,
        timestamp: existing.updatedAt || now.toISOString(),
        time: existing.updatedAt
          ? new Date(existing.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '09:00',
        period: prevPeriod,
        periodLabelTh: prevMeta.labelTh,
        periodLabelEn: prevMeta.labelEn,
        marketSession: prevMeta.session,
        selectedEmotionIds: existing.selectedEmotionIds,
        netScore: existing.netScore,
        totalScore: existing.totalScore,
        status: existing.status,
        advice: existing.advice,
        note: existing.note,
      },
    ];
  }

  // Add the new checkin log entry
  const updatedLogs = [...existingLogs, logEntry];

  const checkin: DailyEmotionalCheckin = {
    id: existing?.id || `chk-${today}`,
    userId,
    date: today,
    selectedEmotionIds,
    netScore,
    baseScore,
    totalScore,
    status,
    advice: adviceTh,
    note,
    currentPeriod: activePeriod,
    logs: updatedLogs,
    updatedAt: now.toISOString(),
  };

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
        updated_at: now.toISOString(),
      })
    )
      .then(({ error }) => {
        if (error) console.warn('Supabase daily emotions upsert warning:', error.message);
      })
      .catch(() => {});
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dailyEmotionUpdated', { detail: checkin }));
    window.dispatchEvent(new CustomEvent('dailyEmotionLogsUpdated', { detail: checkin.logs }));
  }

  return checkin;
}

export async function deleteEmotionLogEntry(logId: string): Promise<DailyEmotionalCheckin | null> {
  const checkins = await getDailyCheckins();
  const today = getTodayDateString();
  const existing = checkins.find((c) => c.date === today);
  if (!existing || !existing.logs) return null;

  const filteredLogs = existing.logs.filter((l) => l.id !== logId);
  const latestLog = filteredLogs[filteredLogs.length - 1];

  const updatedCheckin: DailyEmotionalCheckin = {
    ...existing,
    logs: filteredLogs,
    selectedEmotionIds: latestLog ? latestLog.selectedEmotionIds : [],
    netScore: latestLog ? latestLog.netScore : 0,
    totalScore: latestLog ? latestLog.totalScore : 50,
    status: latestLog ? latestLog.status : 'NORMAL',
    advice: latestLog ? latestLog.advice : 'สภาวะอารมณ์เป็นปกติ แนะนำให้เทรดตามแผน',
    currentPeriod: latestLog ? latestLog.period : undefined,
    note: latestLog ? latestLog.note : '',
    updatedAt: new Date().toISOString(),
  };

  const updatedCheckins = [updatedCheckin, ...checkins.filter((c) => c.date !== today)];
  const key = getUserKey(EMOTION_KEY);
  safeSetLocalStorage(key, JSON.stringify(updatedCheckins));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dailyEmotionUpdated', { detail: updatedCheckin }));
    window.dispatchEvent(new CustomEvent('dailyEmotionLogsUpdated', { detail: updatedCheckin.logs }));
  }

  return updatedCheckin;
}

/**
 * Save Post-Market Reflection / End-of-Day Debrief
 */
export async function saveDailyDebrief(debrief: DailyDebrief): Promise<DailyEmotionalCheckin> {
  const checkins = await getDailyCheckins();
  const today = getTodayDateString();
  let existing = checkins.find((c) => c.date === today);

  if (!existing) {
    const defaultCheckin = await saveDailyCheckin(['calm'], 'บันทึกทบทวนปิดวัน');
    existing = defaultCheckin;
  }

  const updated: DailyEmotionalCheckin = {
    ...existing,
    debrief,
    updatedAt: new Date().toISOString(),
  };

  const filtered = checkins.filter((c) => c.date !== today);
  const updatedCheckins = [updated, ...filtered];

  const key = getUserKey(EMOTION_KEY);
  safeSetLocalStorage(key, JSON.stringify(updatedCheckins));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dailyEmotionUpdated', { detail: updated }));
  }

  return updated;
}

/**
 * Intelligent Circuit Breaker Checker:
 * Evaluates trade history and psychological signals to prevent fatal drawdowns.
 */
export function checkCircuitBreaker(trades: Trade[]): CircuitBreakerTrigger | null {
  if (!trades || trades.length === 0) return null;

  const todayStr = getTodayDateString();
  const todayTrades = trades.filter((t) => t.entryDate && t.entryDate.startsWith(todayStr));

  // 1. Consecutive Loss Detection (2+ losses in a row today)
  const closedToday = todayTrades
    .filter((t) => t.status === 'WIN' || t.status === 'LOSS')
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  if (closedToday.length >= 2) {
    if (closedToday[0].status === 'LOSS' && closedToday[1].status === 'LOSS') {
      return {
        isTriggered: true,
        type: 'CONSECUTIVE_LOSS',
        titleTh: '⚠️ พักด่วน: แพ้ติดต่อกัน 2 ไม้ในวันนี้ (Loss Streak)',
        titleEn: '⚠️ Pause Alert: 2 Consecutive Losses Today',
        reasonTh: 'ตรวจพบการเสีย 2 ไม้ติดกัน ความเสี่ยงที่จะเกิด Revenge Trading สูงมาก แนะนำให้หยุดพัก 30 นาทีเพื่อตัดวงจร',
        reasonEn: 'Detected 2 consecutive losses. High risk of revenge trading. We strongly suggest taking a 30-min break.',
        suggestedCooldownMins: 30,
      };
    }
  }

  // 2. High Frequency Overtrading Frenzy (4+ trades within 60 mins)
  const now = Date.now();
  const recentTrades = todayTrades.filter((t) => {
    const entryTime = new Date(t.entryDate).getTime();
    return now - entryTime <= 60 * 60 * 1000;
  });

  if (recentTrades.length >= 4) {
    return {
      isTriggered: true,
      type: 'OVERTRADING_FREQUENCY',
      titleTh: '⚡ คำเตือน: เข้าออเดอร์ถี่เกินไป (Overtrading Frenzy)',
      titleEn: '⚡ Warning: High Frequency Trading Detected',
      reasonTh: `คุณเปิดไปแล้ว ${recentTrades.length} ไม้ภายใน 1 ชั่วโมง อาจเกิดจากอาการคันมือหรือ FOMO แนะนำให้พักล้างชาร์ต 15 นาที`,
      reasonEn: `You placed ${recentTrades.length} trades within 1 hour. Step away from charts for 15 minutes.`,
      suggestedCooldownMins: 15,
    };
  }

  // 3. Daily Loss Limit Threshold (-$250+)
  const todayLossPnL = closedToday.reduce((acc, t) => acc + (t.financials.netPnL || 0), 0);
  if (todayLossPnL <= -250) {
    return {
      isTriggered: true,
      type: 'DAILY_DRAWDOWN',
      titleTh: '🛑 ถึงจุดจำกัดขาดทุนประจำวัน (Daily Loss Limit)',
      titleEn: '🛑 Daily Loss Limit Reached',
      reasonTh: `ขาดทุนสะสมวันนี้ -$${Math.abs(todayLossPnL).toFixed(0)} ถึงเกณฑ์เตือนภัย Circuit Breaker ควรหยุดเทรดตลอดทั้งวันเพื่อรักษาทุน`,
      reasonEn: `Today's net loss is -$${Math.abs(todayLossPnL).toFixed(0)}. Stop trading for today to protect capital.`,
      suggestedCooldownMins: 120,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Psychological Trading Cool-down / Reset Countdown System
// ---------------------------------------------------------------------------

const COOLDOWN_KEY = 'tj_trading_cooldown';

export function getCooldownSession(): CooldownSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = getUserKey(COOLDOWN_KEY);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const session: CooldownSession = JSON.parse(raw);
    if (!session || !session.endsAt) return null;

    // Check if still within window
    const now = Date.now();
    const ends = new Date(session.endsAt).getTime();

    if (now >= ends) {
      // Cooldown has naturally expired
      if (session.isActive) {
        session.isActive = false;
        session.completedAt = new Date().toISOString();
        safeSetLocalStorage(key, JSON.stringify(session));
      }
    }

    return session;
  } catch (e) {
    console.error('Failed to get cooldown session:', e);
    return null;
  }
}

export function isCooldownActive(session: CooldownSession | null): boolean {
  if (!session || !session.isActive) return false;
  const now = Date.now();
  const ends = new Date(session.endsAt).getTime();
  return now < ends;
}

export function startCooldownSession(
  durationMinutes: number,
  reason = 'พักรีเซ็ตอารมณ์',
  sourceEmotions: string[] = [],
  note = ''
): CooldownSession {
  const startedAt = new Date();
  let endsAt: Date;

  if (durationMinutes <= 0) {
    // End of day (23:59:59 tonight)
    endsAt = new Date(startedAt);
    endsAt.setHours(23, 59, 59, 999);
  } else {
    endsAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
  }

  const effectiveMinutes = durationMinutes <= 0
    ? Math.max(1, Math.round((endsAt.getTime() - startedAt.getTime()) / (60 * 1000)))
    : durationMinutes;

  const session: CooldownSession = {
    isActive: true,
    durationMinutes: effectiveMinutes,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    reason,
    sourceEmotions,
    note,
  };

  if (typeof window !== 'undefined') {
    const key = getUserKey(COOLDOWN_KEY);
    safeSetLocalStorage(key, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('tradingCooldownStarted', { detail: session }));
    window.dispatchEvent(new CustomEvent('tradingCooldownUpdated', { detail: session }));
  }

  return session;
}

export function extendCooldownSession(extraMinutes: number): CooldownSession | null {
  const current = getCooldownSession();
  if (!current || !current.isActive) return null;

  const currentEnds = new Date(current.endsAt).getTime();
  const newEnds = new Date(Math.max(Date.now(), currentEnds) + extraMinutes * 60 * 1000);

  current.endsAt = newEnds.toISOString();
  current.durationMinutes += extraMinutes;

  if (typeof window !== 'undefined') {
    const key = getUserKey(COOLDOWN_KEY);
    safeSetLocalStorage(key, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('tradingCooldownUpdated', { detail: current }));
  }

  return current;
}

export function cancelCooldownSession(): void {
  if (typeof window === 'undefined') return;

  const key = getUserKey(COOLDOWN_KEY);
  const current = getCooldownSession();
  if (current) {
    current.isActive = false;
    current.completedAt = new Date().toISOString();
    safeSetLocalStorage(key, JSON.stringify(current));
  } else {
    localStorage.removeItem(key);
  }

  window.dispatchEvent(new CustomEvent('tradingCooldownEnded', { detail: { cancelled: true } }));
  window.dispatchEvent(new CustomEvent('tradingCooldownUpdated', { detail: null }));
}

/**
 * Reset emotional state post cooldown:
 * Clears destructive negative emotions (tilt, revenge, fomo, etc.) and replaces them
 * with disciplined/calm/fresh state, with a celebratory log note.
 */
export async function completeCooldownSessionAndReset(
  positiveEmotionsToSet: string[] = ['calm', 'fresh', 'disciplined'],
  affirmationNote = 'รีเซ็ตจิตวิทยาหลัง Cool-down พักสมอง สำเร็จ'
): Promise<{ checkin: DailyEmotionalCheckin; session: CooldownSession | null }> {
  const current = getCooldownSession();
  if (current) {
    current.isActive = false;
    current.completedAt = new Date().toISOString();
    if (typeof window !== 'undefined') {
      const key = getUserKey(COOLDOWN_KEY);
      safeSetLocalStorage(key, JSON.stringify(current));
    }
  }

  // Play gentle celebratory chime
  playZenChime();

  // Save new positive/disciplined checkin
  const checkin = await saveDailyCheckin(
    positiveEmotionsToSet,
    affirmationNote
  );

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tradingCooldownEnded', { detail: { completed: true, reset: true } }));
    window.dispatchEvent(new CustomEvent('tradingCooldownUpdated', { detail: null }));
  }

  return { checkin, session: current };
}

/**
 * Calming harmonic chime sound synthesized using the Web Audio API.
 * No external mp3/asset required; plays a tranquil 528Hz & 792Hz Solfeggio / singing bowl tone.
 */
export function playZenChime(): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const frequencies = [528, 792, 1056]; // Miraculous tone harmonic triad
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Gentle attack and long decaying chime ring
      const delay = idx * 0.08;
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.18 / (idx + 1), now + delay + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + delay + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 2.6);
    });
  } catch (err) {
    // Non-critical if browser audio policy blocks autoplay
    console.debug('Audio chime skipped:', err);
  }
}

