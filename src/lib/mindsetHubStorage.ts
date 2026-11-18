import { MindsetHubDayState, GameLevel, LoggedUrge, BioMetrics } from '@/types/mindsetHub';

const STORAGE_KEY = 'trading_mindset_hub_days';

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultBioMetrics(): BioMetrics {
  return {
    sleepHours: 7.5,
    sleepQuality: 4,
    energyLevel: 8,
    stressLevel: 'low',
  };
}

export function getDefaultTodayState(): MindsetHubDayState {
  const today = getTodayString();
  return {
    date: today,
    currentGame: 'A',
    selectedCriteriaIds: ['a_plan', 'a_risk', 'a_detach'],
    gameNotes: '',
    urges: [],
    bioMetrics: getDefaultBioMetrics(),
    zenCompletedCount: 0,
    lastUpdated: new Date().toISOString(),
  };
}

export function getMindsetHistory(): MindsetHubDayState[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with realistic demo history for immediate visual preview if empty
      const demo = generateSampleHistory();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
      return demo;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to get mindset history:', err);
    return [];
  }
}

export function getTodayMindset(): MindsetHubDayState {
  const history = getMindsetHistory();
  const today = getTodayString();
  const existing = history.find((h) => h.date === today);
  if (existing) return existing;

  const fresh = getDefaultTodayState();
  saveMindsetDay(fresh);
  return fresh;
}

export function saveMindsetDay(state: MindsetHubDayState): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getMindsetHistory();
    const filtered = history.filter((h) => h.date !== state.date);
    const updated = [{ ...state, lastUpdated: new Date().toISOString() }, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent('mindsetHubUpdated', { detail: state }));
  } catch (err) {
    console.error('Failed to save mindset day:', err);
  }
}

export function logInTradeUrge(urgeId: string, intensity = 3, pair?: string, note?: string): MindsetHubDayState {
  const current = getTodayMindset();
  const newUrge: LoggedUrge = {
    id: 'urge_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    timestamp: new Date().toISOString(),
    urgeId,
    intensity,
    pair,
    note,
  };
  const updated: MindsetHubDayState = {
    ...current,
    urges: [newUrge, ...(current.urges || [])],
  };
  saveMindsetDay(updated);
  return updated;
}

export function recordZenSessionCompleted(): MindsetHubDayState {
  const current = getTodayMindset();
  const updated: MindsetHubDayState = {
    ...current,
    zenCompletedCount: (current.zenCompletedCount || 0) + 1,
  };
  saveMindsetDay(updated);
  return updated;
}

// Generates 14 days of realistic sample data so charts and correlations are immediately active
function generateSampleHistory(): MindsetHubDayState[] {
  const days: MindsetHubDayState[] = [];
  const today = new Date();

  const presets: Array<{ game: GameLevel; sleep: number; quality: number; energy: number; stress: 'low' | 'moderate' | 'high' }> = [
    { game: 'A', sleep: 8.0, quality: 5, energy: 9, stress: 'low' },
    { game: 'A', sleep: 7.5, quality: 4, energy: 8, stress: 'low' },
    { game: 'B', sleep: 6.5, quality: 3, energy: 6, stress: 'moderate' },
    { game: 'A', sleep: 7.0, quality: 4, energy: 8, stress: 'low' },
    { game: 'C', sleep: 5.0, quality: 2, energy: 4, stress: 'high' },
    { game: 'B', sleep: 6.0, quality: 3, energy: 5, stress: 'moderate' },
    { game: 'A', sleep: 8.5, quality: 5, energy: 9, stress: 'low' },
    { game: 'A', sleep: 7.5, quality: 4, energy: 8, stress: 'low' },
    { game: 'B', sleep: 6.5, quality: 3, energy: 6, stress: 'moderate' },
    { game: 'C', sleep: 5.5, quality: 2, energy: 4, stress: 'high' },
    { game: 'B', sleep: 7.0, quality: 3, energy: 7, stress: 'low' },
    { game: 'A', sleep: 8.0, quality: 5, energy: 9, stress: 'low' },
  ];

  presets.forEach((p, idx) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (idx + 1));
    const dateStr = d.toISOString().split('T')[0];

    days.push({
      date: dateStr,
      currentGame: p.game,
      selectedCriteriaIds: p.game === 'A' ? ['a_plan', 'a_risk', 'a_detach', 'a_screen'] : p.game === 'B' ? ['b_hesitate', 'b_pnl_watch'] : ['c_revenge', 'c_fomo', 'c_move_sl'],
      gameNotes: p.game === 'A' ? 'เทรดนิ่งมาก รอกราฟตามแผน' : p.game === 'C' ? 'นอนน้อย ตลาดเหวี่ยง หลุดวินัย' : 'คันมือเล็กน้อย',
      urges: p.game === 'C'
        ? [{ id: 'u1', timestamp: d.toISOString(), urgeId: 'panic_profit', intensity: 4 }, { id: 'u2', timestamp: d.toISOString(), urgeId: 'screen_staring', intensity: 5 }]
        : p.game === 'B'
        ? [{ id: 'u3', timestamp: d.toISOString(), urgeId: 'screen_staring', intensity: 3 }]
        : [{ id: 'u4', timestamp: d.toISOString(), urgeId: 'calm_zen', intensity: 5 }],
      bioMetrics: {
        sleepHours: p.sleep,
        sleepQuality: p.quality,
        energyLevel: p.energy,
        stressLevel: p.stress,
      },
      zenCompletedCount: p.game === 'A' ? 2 : p.game === 'B' ? 1 : 0,
      lastUpdated: d.toISOString(),
    });
  });

  return days;
}
