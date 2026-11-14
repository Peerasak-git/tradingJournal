'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PRESET_EMOTIONS, DailyEmotionalCheckin, EmotionTag } from '@/types/emotion';
import { calculateEmotionalScore, getTodayCheckin, saveDailyCheckin } from '@/lib/emotionStorage';
import { useLanguage } from '@/context/LanguageContext';
import {
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldAlert,
  Flame,
  Info,
  Check,
  Compass,
  Zap,
  Hexagon,
  LayoutGrid,
} from 'lucide-react';

type EmotionCategoryTab = 'all' | 'positive' | 'neutral' | 'negative';

// Helper to partition emotions into interlocking honeycomb rows
function getHoneycombRows<T>(items: T[], baseRowSize = 5): T[][] {
  const rows: T[][] = [];
  let cur = 0;
  let isEven = true;
  while (cur < items.length) {
    const count = isEven ? baseRowSize : Math.max(1, baseRowSize - 1);
    rows.push(items.slice(cur, cur + count));
    cur += count;
    isEven = !isEven;
  }
  return rows;
}

// Helper to split emotion label into a concise main title and subtle subtitle
function formatEmotionLabel(label: string) {
  if (label.includes(' / ')) {
    const [main, ...rest] = label.split(' / ');
    return {
      main: main.trim(),
      sub: rest.join(' / ').trim(),
    };
  }
  return { main: label.trim(), sub: '' };
}

export default function DailyEmotionalCheckinCard() {
  const { language } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<DailyEmotionalCheckin | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<EmotionCategoryTab>('all');
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Motion & Honeycomb Layout States
  const [viewMode, setViewMode] = useState<'wheel' | 'grid'>('wheel');
  const [wheelRadius, setWheelRadius] = useState<number>(280);
  const [floatingScore, setFloatingScore] = useState<{ id: string; score: number; key: number } | null>(null);
  const [scoreBump, setScoreBump] = useState<boolean>(false);
  const [lastToggledId, setLastToggledId] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 440) {
        setWheelRadius(155);
      } else if (w < 640) {
        setWheelRadius(205);
      } else if (w < 1024) {
        setWheelRadius(250);
      } else {
        setWheelRadius(280);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    getTodayCheckin().then((checkin) => {
      if (checkin) {
        setTodayCheckin(checkin);
        setSelectedIds(checkin.selectedEmotionIds || []);
        setNote(checkin.note || '');
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    });

    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setTodayCheckin(e.detail);
        setSelectedIds(e.detail.selectedEmotionIds || []);
        setNote(e.detail.note || '');
      }
    };

    window.addEventListener('dailyEmotionUpdated', handleUpdate);
    return () => window.removeEventListener('dailyEmotionUpdated', handleUpdate);
  }, []);

  const currentScore = useMemo(() => {
    return calculateEmotionalScore(selectedIds);
  }, [selectedIds]);

  const toggleEmotion = (emotion: EmotionTag) => {
    setLastToggledId(emotion.id);

    setSelectedIds((prev) => {
      const isSelecting = !prev.includes(emotion.id);
      if (isSelecting) {
        setFloatingScore({ id: emotion.id, score: emotion.score, key: Date.now() });
      } else {
        setFloatingScore(null);
      }
      return isSelecting ? [...prev, emotion.id] : prev.filter((item) => item !== emotion.id);
    });

    // Score punch animation bump
    setScoreBump(true);
    setTimeout(() => setScoreBump(false), 320);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await saveDailyCheckin(selectedIds, note);
      setTodayCheckin(saved);
      setSavedNotice(true);
      setTimeout(() => {
        setSavedNotice(false);
        setIsExpanded(false);
      }, 1400);
    } catch (err) {
      console.error('Failed to save daily emotion checkin:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedIds([]);
    setNote('');
    setFloatingScore(null);
  };

  // Filtered emotions by category
  const filteredEmotions = useMemo(() => {
    if (categoryFilter === 'all') return PRESET_EMOTIONS;
    return PRESET_EMOTIONS.filter((e) => e.category === categoryFilter);
  }, [categoryFilter]);

  // Dynamic Honeycomb Grid Rows
  const honeycombRows = useMemo(() => {
    if (categoryFilter === 'all') {
      return getHoneycombRows(filteredEmotions, 5);
    } else if (categoryFilter === 'negative') {
      return getHoneycombRows(filteredEmotions, 4);
    } else if (categoryFilter === 'positive') {
      return getHoneycombRows(filteredEmotions, 3);
    } else {
      return getHoneycombRows(filteredEmotions, 2);
    }
  }, [filteredEmotions, categoryFilter]);

  // Status visual themes
  const statusConfig = {
    OPTIMAL: {
      border: 'border-emerald-500/40 dark:border-emerald-500/30',
      glow: 'shadow-lg shadow-emerald-500/15 dark:shadow-emerald-950/40',
      bg: 'bg-gradient-to-br from-emerald-500/[0.05] via-teal-500/[0.02] to-transparent',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: <Sparkles size={16} className="text-emerald-500 animate-spin-slow" />,
      titleTh: '🟢 สภาวะพร้อมเทรด 100% (Optimal Zone)',
      titleEn: '🟢 Optimal Trading Mindset',
      barColor: 'from-emerald-500 via-teal-400 to-emerald-400',
      meterColor: '#10b981',
      meterColorLight: '#34d399',
    },
    NORMAL: {
      border: 'border-amber-500/40 dark:border-amber-500/30',
      glow: 'shadow-lg shadow-amber-500/10 dark:shadow-amber-950/30',
      bg: 'bg-gradient-to-br from-amber-500/[0.04] via-orange-500/[0.02] to-transparent',
      badgeBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
      text: 'text-amber-600 dark:text-amber-400',
      icon: <Info size={16} className="text-amber-500" />,
      titleTh: '🟡 สภาวะปกติ / เฝ้าระวังความเสี่ยง (Normal Zone)',
      titleEn: '🟡 Normal / Guarded Mindset',
      barColor: 'from-amber-500 via-yellow-400 to-orange-400',
      meterColor: '#f59e0b',
      meterColorLight: '#fbbf24',
    },
    WARNING: {
      border: 'border-rose-500/40 dark:border-rose-500/30',
      glow: 'shadow-lg shadow-rose-500/20 dark:shadow-rose-950/40',
      bg: 'bg-gradient-to-br from-rose-500/[0.07] via-red-500/[0.03] to-transparent',
      badgeBg: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40',
      text: 'text-rose-600 dark:text-rose-400',
      icon: <ShieldAlert size={16} className="text-rose-500 animate-bounce" />,
      titleTh: '🔴 เสี่ยงสูง / อารมณ์ไม่พร้อมเทรด (Risk Warning)',
      titleEn: '🔴 High Emotional Risk Warning',
      barColor: 'from-rose-600 via-red-500 to-rose-400',
      meterColor: '#f43f5e',
      meterColorLight: '#fb7185',
    },
  }[currentScore.status];

  // Helper for radial hexagon track coordinates around center (390, 380)
  const outerHexTrack = useMemo(() => {
    const pts: string[] = [];
    for (let k = 0; k < 6; k++) {
      const angle = (k * 60 - 90) * (Math.PI / 180);
      const x = Math.round((390 + wheelRadius * Math.cos(angle)) * 10) / 10;
      const y = Math.round((380 + wheelRadius * Math.sin(angle)) * 10) / 10;
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }, [wheelRadius]);

  const innerHexTrack = useMemo(() => {
    const pts: string[] = [];
    for (let k = 0; k < 6; k++) {
      const angle = (k * 60 - 90) * (Math.PI / 180);
      const x = Math.round((390 + wheelRadius * 0.65 * Math.cos(angle)) * 10) / 10;
      const y = Math.round((380 + wheelRadius * 0.65 * Math.sin(angle)) * 10) / 10;
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }, [wheelRadius]);

  return (
    <div
      className={`relative mb-6 rounded-2xl transition-all duration-300 border backdrop-blur-md overflow-hidden ${
        statusConfig.border
      } ${statusConfig.glow} ${statusConfig.bg} bg-white/80 dark:bg-slate-900/80`}
    >
      {/* Top Banner Bar */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/25 transition-transform hover:scale-105 active:scale-95">
            <HeartHandshake size={22} className="animate-pulse" />
            {currentScore.status === 'OPTIMAL' && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                {language === 'th' ? 'เช็คสภาวะอารมณ์ก่อนเทรดประจำวัน' : 'Daily Pre-Trade Emotional Check-in'}
              </h2>
              {todayCheckin ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                  <CheckCircle2 size={11} />
                  {language === 'th' ? 'เช็คอินแล้ว' : 'Checked In'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 animate-pulse">
                  <Flame size={11} />
                  {language === 'th' ? 'รอประเมินวันนี้' : 'Pending Today'}
                </span>
              )}
              {currentScore.status === 'OPTIMAL' && selectedIds.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs animate-spring-pop">
                  <Sparkles size={10} />
                  <span>{language === 'th' ? 'สมาธิดีเยี่ยม!' : 'High Edge!'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'th'
                ? 'แตะเลือกรังผึ้งอารมณ์ (Honeycomb) เพื่อคำนวณคะแนนความพร้อมจิตวิทยาการเทรด'
                : 'Select emotional honeycomb cells to compute trading readiness score'}
            </p>
          </div>
        </div>

        {/* Live Score Display & Toggle Action */}
        <div className="flex items-center gap-3">
          {/* Mini 6-Sided Hexagon Gauge / Score Widget */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-black/50 border border-slate-200/80 dark:border-white/[0.08] shadow-xs transition-transform hover:scale-105">
            <div className="relative w-11 h-12 flex items-center justify-center shrink-0">
              {/* Mini Hexagon Ambient Glow */}
              <div
                className="absolute inset-0 blur-md opacity-35 animate-glow-pulse pointer-events-none"
                style={{ backgroundColor: statusConfig.meterColor }}
              />
              <svg className="w-11 h-12 overflow-visible" viewBox="0 0 40 46">
                {/* Background track hexagon */}
                <polygon
                  points="20,2 38,11.5 38,34.5 20,44 2,34.5 2,11.5"
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                  fill="transparent"
                />
                {/* Active progress stroke around 6 edges (perimeter ~128) */}
                <polygon
                  points="20,2 38,11.5 38,34.5 20,44 2,34.5 2,11.5"
                  stroke={statusConfig.meterColor}
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                  strokeDasharray={128}
                  strokeDashoffset={128 - (currentScore.totalScore / 100) * 128}
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className={`absolute text-xs font-black transition-transform ${scoreBump ? 'animate-score-bump scale-110' : ''} ${statusConfig.text}`}>
                {currentScore.totalScore}
              </span>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Net Score
              </div>
              <div className={`text-sm font-black transition-transform ${scoreBump ? 'animate-score-bump' : ''} ${statusConfig.text}`}>
                {currentScore.netScore >= 0 ? `+${currentScore.netScore}` : currentScore.netScore}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 transition-all duration-200 cursor-pointer active:scale-95"
            title={isExpanded ? 'ย่อการ์ด' : 'ขยายการ์ด'}
          >
            {isExpanded ? (
              <ChevronUp size={16} className="transition-transform duration-200" />
            ) : (
              <ChevronDown size={16} className="transition-transform duration-200" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Area */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-200/60 dark:border-white/[0.06] animate-fade-in">
          {/* Category Tabs & View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/[0.06] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {language === 'th' ? `ทั้งหมด (${PRESET_EMOTIONS.length})` : `All (${PRESET_EMOTIONS.length})`}
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('positive')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                  categoryFilter === 'positive'
                    ? 'bg-emerald-500 text-white shadow-xs font-bold scale-[1.02]'
                    : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700'
                }`}
              >
                <span>🟢</span>
                <span>{language === 'th' ? 'พลังบวก & วินัย' : 'Positive & Edge'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('neutral')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                  categoryFilter === 'neutral'
                    ? 'bg-slate-600 text-white shadow-xs font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>⚪</span>
                <span>{language === 'th' ? 'เป็นกลาง' : 'Neutral'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('negative')}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                  categoryFilter === 'negative'
                    ? 'bg-rose-500 text-white shadow-xs font-bold scale-[1.02]'
                    : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                }`}
              >
                <span>🔴</span>
                <span>{language === 'th' ? 'ความเสี่ยง & กับดัก' : 'Risk & Pitfalls'}</span>
              </button>
            </div>

            {/* View Mode Toggle: Orbital Honeycomb vs Interlocking Honeycomb Hive */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/[0.06] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('wheel')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === 'wheel'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="แสดงผลแบบรังผึ้งรอบแกน 6 เหลี่ยม"
                >
                  <Hexagon size={13} className={viewMode === 'wheel' ? 'animate-pulse' : ''} />
                  <span>{language === 'th' ? 'รังผึ้งรอบแกน' : 'Orbital Honeycomb'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="แสดงผลแบบตารางรังผึ้งเต็มระนาบ"
                >
                  <LayoutGrid size={13} />
                  <span>{language === 'th' ? 'ตารางรังผึ้ง' : 'Honeycomb Hive'}</span>
                </button>
              </div>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
                >
                  <RotateCcw size={11} className="transition-transform group-hover:-rotate-90" />
                  <span>{language === 'th' ? `ล้าง (${selectedIds.length})` : `Clear (${selectedIds.length})`}</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Emotion Honeycomb Area */}
          {viewMode === 'wheel' ? (
            /* ============================================================ */
            /* 1. ORBITAL 6-SIDED HONEYCOMB (รังผึ้ง 6 เหลี่ยมรอบศูนย์กลาง) */
            /* ============================================================ */
            <div className="relative w-full max-w-[820px] h-[560px] sm:h-[680px] md:h-[760px] mx-auto flex items-center justify-center my-3 select-none overflow-visible">
              {/* Concentric Hexagonal Guide Tracks & Connecting Laser Rays */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 780 760">
                <defs>
                  <radialGradient id="hexWheelCenterAura" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={statusConfig.meterColor} stopOpacity="0.22" />
                    <stop offset="65%" stopColor={statusConfig.meterColor} stopOpacity="0.05" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Ambient Radial Wheel Center Backdrop Glow */}
                <circle cx="390" cy="380" r={wheelRadius + 60} fill="url(#hexWheelCenterAura)" />

                {/* Outer & Inner 6-Sided Hexagonal Guide Tracks */}
                <polygon
                  points={outerHexTrack}
                  className="stroke-slate-300/40 dark:stroke-white/10"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  strokeLinejoin="round"
                  fill="none"
                />
                <polygon
                  points={innerHexTrack}
                  className="stroke-slate-200/50 dark:stroke-white/[0.05]"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* Glowing Laser Connecting Rays to Selected Honeycomb Cells */}
                {filteredEmotions.map((emotion, idx) => {
                  const isSelected = selectedIds.includes(emotion.id);
                  if (!isSelected) return null;

                  const total = filteredEmotions.length;
                  const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                  const targetX = 390 + Math.cos(angle) * wheelRadius;
                  const targetY = 380 + Math.sin(angle) * wheelRadius;

                  let rayColor = '#64748b';
                  if (emotion.category === 'positive') rayColor = '#10b981';
                  else if (emotion.category === 'negative') rayColor = '#f43f5e';

                  return (
                    <g key={`ray-${emotion.id}`}>
                      {/* Soft Glow Underline */}
                      <line
                        x1="390"
                        y1="380"
                        x2={targetX}
                        y2={targetY}
                        stroke={rayColor}
                        strokeWidth="4"
                        strokeOpacity="0.3"
                        strokeLinecap="round"
                      />
                      {/* Animated Dashed Beam */}
                      <line
                        x1="390"
                        y1="380"
                        x2={targetX}
                        y2={targetY}
                        stroke={rayColor}
                        strokeWidth="2"
                        strokeDasharray="5 5"
                        strokeLinecap="round"
                      />
                      {/* Pulsing Target Dot */}
                      <circle cx={targetX} cy={targetY} r="4" fill={rayColor} className="animate-ping" />
                    </g>
                  );
                })}
              </svg>

              {/* Center Core Hub: 6-Sided Hexagon Honeycomb Hub & Gauge */}
              <div
                className="absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-56 sm:w-56 sm:h-64 md:w-64 md:h-74 flex flex-col items-center justify-center select-none"
              >
                {/* Outer Breathing Aura Glow */}
                <div
                  className="absolute inset-0 blur-2xl transition-all duration-700 animate-glow-pulse pointer-events-none"
                  style={{
                    backgroundColor: statusConfig.meterColor,
                    opacity: 0.35,
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  }}
                />

                {/* Score Bump Ripple Polygon */}
                {scoreBump && (
                  <div
                    className="absolute inset-0 border-2 animate-ring-pulse pointer-events-none"
                    style={{
                      borderColor: statusConfig.meterColor,
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    }}
                  />
                )}

                {/* SVG 6-Sided Hexagon Progress Meter in Center Hub */}
                <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 240 276">
                  <defs>
                    <linearGradient id="hubHexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={statusConfig.meterColor} stopOpacity="0.9" />
                      <stop offset="100%" stopColor={statusConfig.meterColorLight} stopOpacity="1" />
                    </linearGradient>
                    <filter id="hubHexShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={statusConfig.meterColor} floodOpacity="0.55" />
                    </filter>
                  </defs>

                  {/* Backdrop Hexagon Fill with Glassmorphism */}
                  <polygon
                    points="120,6 234,69 234,207 120,270 6,207 6,69"
                    className="fill-white/95 dark:fill-slate-900/95"
                    strokeLinejoin="round"
                  />

                  {/* Outer decorative dashed spinning hexagon frame */}
                  <polygon
                    points="120,2 238,67 238,209 120,274 2,209 2,67"
                    className="stroke-slate-300/60 dark:stroke-white/20 animate-gauge-spin origin-center"
                    strokeWidth="1.5"
                    strokeDasharray="8 8"
                    strokeLinejoin="round"
                    fill="none"
                  />

                  {/* Background Track Hexagon (perimeter ~797) */}
                  <polygon
                    points="120,6 234,69 234,207 120,270 6,207 6,69"
                    className="stroke-slate-100 dark:stroke-slate-800"
                    strokeWidth="10"
                    strokeLinejoin="round"
                    fill="none"
                  />

                  {/* Active Animated Hexagon Progress Stroke along 6 Edges */}
                  <polygon
                    points="120,6 234,69 234,207 120,270 6,207 6,69"
                    stroke="url(#hubHexGradient)"
                    strokeWidth="10"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={797}
                    strokeDashoffset={797 - (currentScore.totalScore / 100) * 797}
                    fill="none"
                    filter="url(#hubHexShadow)"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Inside Center Metrics */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center select-none pointer-events-none px-4">
                  <div className="flex items-center gap-1.5 -mb-1">
                    {statusConfig.icon}
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {currentScore.status === 'OPTIMAL' ? 'Optimal Edge' : currentScore.status === 'WARNING' ? 'High Risk' : 'Normal'}
                    </span>
                  </div>
                  <span className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight transition-transform duration-300 ${scoreBump ? 'animate-score-bump scale-110' : ''} ${statusConfig.text}`}>
                    {currentScore.totalScore}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 -mt-0.5">
                    / 100 PTS
                  </span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full shadow-xs ${
                      currentScore.netScore >= 0
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}>
                      {currentScore.netScore >= 0 ? `+${currentScore.netScore} Net` : `${currentScore.netScore} Net`}
                    </span>
                    {selectedIds.length > 0 && (
                      <span className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500">
                        ({selectedIds.length})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Orbiting 6-Sided Honeycomb Nodes (Positioned along 360-degree radial ring) */}
              {filteredEmotions.map((emotion, idx) => {
                const isSelected = selectedIds.includes(emotion.id);
                const isJustToggled = lastToggledId === emotion.id;
                const total = filteredEmotions.length;
                const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                const x = Math.cos(angle) * wheelRadius;
                const y = Math.sin(angle) * wheelRadius;

                let strokeColor = 'rgba(148, 163, 184, 0.5)';
                let scoreColor = 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
                let glowColor = 'rgba(100, 116, 139, 0.4)';

                if (emotion.category === 'positive') {
                  scoreColor = 'bg-emerald-500 text-white';
                  glowColor = 'rgba(16, 185, 129, 0.5)';
                  if (isSelected) {
                    strokeColor = '#10b981';
                  }
                } else if (emotion.category === 'negative') {
                  scoreColor = 'bg-rose-500 text-white';
                  glowColor = 'rgba(244, 63, 94, 0.5)';
                  if (isSelected) {
                    strokeColor = '#f43f5e';
                  }
                } else if (emotion.category === 'neutral') {
                  scoreColor = 'bg-slate-500 text-white';
                  glowColor = 'rgba(100, 116, 139, 0.5)';
                  if (isSelected) {
                    strokeColor = '#94a3b8';
                  }
                }

                // Sizing of honeycomb nodes
                const nodeWidthClass = total <= 10 ? 'w-15 sm:w-17 md:w-19' : 'w-12 sm:w-14 md:w-15';
                const nodeHeightClass = total <= 10 ? 'h-17 sm:h-20 md:h-22' : 'h-14 sm:h-16 md:h-18';
                const labelInfo = formatEmotionLabel(language === 'th' ? emotion.labelTh : emotion.labelEn);

                return (
                  <div
                    key={emotion.id}
                    className="absolute z-25 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none transition-all duration-500 ease-out"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                    onMouseEnter={() => setActiveTooltip(emotion.id)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  >
                    {/* Floating RPG Score Popup on Click */}
                    {floatingScore?.id === emotion.id && (
                      <div
                        key={floatingScore.key}
                        className={`absolute z-40 -top-7 left-1/2 -translate-x-1/2 pointer-events-none text-xs font-black px-2.5 py-0.5 rounded-full shadow-lg border animate-pop-float whitespace-nowrap ${
                          floatingScore.score > 0
                            ? 'bg-emerald-500 text-white border-emerald-300 shadow-emerald-500/40'
                            : floatingScore.score < 0
                            ? 'bg-rose-500 text-white border-rose-300 shadow-rose-500/40'
                            : 'bg-slate-700 text-white border-slate-500 shadow-slate-700/40'
                        }`}
                      >
                        {floatingScore.score > 0 ? `+${floatingScore.score}` : floatingScore.score}
                      </div>
                    )}

                    {/* 6-Sided Hexagon Honeycomb Button */}
                    <button
                      type="button"
                      onClick={() => toggleEmotion(emotion)}
                      className={`relative ${nodeWidthClass} ${nodeHeightClass} flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-120 hover:z-30 active:scale-95 group ${
                        isSelected ? 'scale-110' : ''
                      }`}
                      title={language === 'th' ? emotion.labelTh : emotion.labelEn}
                    >
                      {/* SVG Hexagon Shape with Anti-Aliased Border & Glowing Stroke */}
                      <svg
                        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none transition-transform duration-300 group-hover:drop-shadow-md"
                        viewBox="0 0 100 116"
                      >
                        <polygon
                          points="50,3 97,29 97,87 50,113 3,87 3,29"
                          stroke={strokeColor}
                          strokeWidth={isSelected ? '4' : '2'}
                          strokeLinejoin="round"
                          className="transition-colors duration-300 fill-white/95 dark:fill-slate-800/95"
                          style={{
                            filter: isSelected ? `drop-shadow(0 0 8px ${glowColor})` : undefined,
                          }}
                        />
                      </svg>

                      {/* Clipped Inner Background for Tinted Fill */}
                      <div
                        className="absolute inset-1 transition-colors duration-300 pointer-events-none"
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                          backgroundColor: isSelected ? glowColor : 'transparent',
                        }}
                      />

                      {/* Ripple Burst on Click */}
                      {isSelected && isJustToggled && (
                        <div
                          className="absolute inset-0 pointer-events-none animate-ripple"
                          style={{
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                            backgroundColor: glowColor,
                          }}
                        />
                      )}

                      {/* Top-Left: Checkmark when selected (Cleanly separated from bottom text) */}
                      {isSelected && (
                        <span className="absolute -top-1 -left-1 z-20 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md animate-spring-pop border border-white dark:border-slate-900">
                          <Check size={10} strokeWidth={3.5} />
                        </span>
                      )}

                      {/* Top-Right: Mini Score Badge at Vertex */}
                      <span
                        className={`absolute -top-1 -right-1 z-20 text-[8.5px] sm:text-[9.5px] font-black px-1.5 py-0.2 rounded-full shadow-xs border border-white/60 dark:border-black/40 transition-transform ${scoreColor} ${
                          isSelected ? 'scale-110 shadow-md ring-1 ring-white/50' : ''
                        }`}
                      >
                        {emotion.score > 0 ? `+${emotion.score}` : emotion.score}
                      </span>

                      {/* Emoji in Center */}
                      <span
                        className={`relative z-10 text-xl sm:text-2xl md:text-2.5xl leading-none transition-transform duration-200 group-hover:scale-115 ${
                          isSelected ? 'animate-spring-pop scale-110' : ''
                        }`}
                      >
                        {emotion.emoji}
                      </span>
                    </button>

                    {/* Directly Visible Balanced Text Pill Underneath Hexagon */}
                    <div
                      onClick={() => toggleEmotion(emotion)}
                      className={`mt-1.5 flex flex-col items-center justify-center cursor-pointer transition-all px-2 py-0.5 rounded-lg shadow-xs backdrop-blur-md max-w-[76px] sm:max-w-[84px] md:max-w-[92px] ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-300 bg-blue-500/15 border border-blue-500/35 font-black scale-105 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/[0.08]'
                      }`}
                      title={language === 'th' ? emotion.labelTh : emotion.labelEn}
                    >
                      {/* Line 1: Primary Keyword */}
                      <span className="text-[9px] sm:text-[10px] md:text-[10.5px] font-black text-center leading-tight truncate w-full">
                        {labelInfo.main}
                      </span>
                      {/* Line 2: Subtle Subtitle (Clean & Never Wrapped Awkwardly) */}
                      {labelInfo.sub && (
                        <span className="text-[8px] sm:text-[8.5px] font-medium text-slate-400 dark:text-slate-400 text-center leading-tight truncate w-full mt-0.5">
                          {labelInfo.sub}
                        </span>
                      )}
                    </div>

                    {/* Deep Psychology Tooltip on Hover */}
                    {activeTooltip === emotion.id && emotion.descriptionTh && (
                      <div className="absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-56 p-2 rounded-xl bg-slate-900/95 dark:bg-black/95 text-white text-[10px] sm:text-[11px] font-semibold shadow-2xl backdrop-blur-md border border-white/10 pointer-events-none whitespace-normal animate-fade-in text-center leading-snug">
                        <div className="text-emerald-400 font-bold mb-0.5">
                          {language === 'th' ? emotion.labelTh : emotion.labelEn} ({emotion.score > 0 ? `+${emotion.score}` : emotion.score} pts)
                        </div>
                        <div className="text-slate-300 font-normal">
                          {language === 'th' ? emotion.descriptionTh : emotion.descriptionEn || emotion.descriptionTh}
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-black" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ============================================================ */
            /* 2. INTERLOCKING HONEYCOMB HIVE GRID (ตารางรังผึ้งประสานแถว) */
            /* ============================================================ */
            <div className="py-4 px-1 max-w-4xl mx-auto flex flex-col items-center select-none animate-fade-in">
              {honeycombRows.map((row, rowIndex) => (
                <div
                  key={`honeycomb-row-${rowIndex}`}
                  className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 -mt-2 sm:-mt-2.5 md:-mt-3 first:mt-0 transition-all duration-300"
                >
                  {row.map((emotion) => {
                    const isSelected = selectedIds.includes(emotion.id);
                    const isJustToggled = lastToggledId === emotion.id;

                    let strokeColor = 'rgba(148, 163, 184, 0.45)';
                    let scoreColor = 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
                    let glowColor = 'rgba(100, 116, 139, 0.4)';

                    if (emotion.category === 'positive') {
                      scoreColor = 'bg-emerald-500 text-white';
                      glowColor = 'rgba(16, 185, 129, 0.45)';
                      if (isSelected) {
                        strokeColor = '#10b981';
                      }
                    } else if (emotion.category === 'negative') {
                      scoreColor = 'bg-rose-500 text-white';
                      glowColor = 'rgba(244, 63, 94, 0.45)';
                      if (isSelected) {
                        strokeColor = '#f43f5e';
                      }
                    } else if (emotion.category === 'neutral') {
                      scoreColor = 'bg-slate-500 text-white';
                      glowColor = 'rgba(100, 116, 139, 0.45)';
                      if (isSelected) {
                        strokeColor = '#94a3b8';
                      }
                    }

                    const labelInfo = formatEmotionLabel(language === 'th' ? emotion.labelTh : emotion.labelEn);

                    return (
                      <div
                        key={emotion.id}
                        className="relative flex flex-col items-center group"
                        onMouseEnter={() => setActiveTooltip(emotion.id)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      >
                        {/* Floating RPG Score Popup on Click */}
                        {floatingScore?.id === emotion.id && (
                          <div
                            key={floatingScore.key}
                            className={`absolute z-40 -top-5 left-1/2 -translate-x-1/2 pointer-events-none text-xs font-black px-2.5 py-0.5 rounded-full shadow-lg border animate-pop-float whitespace-nowrap ${
                              floatingScore.score > 0
                                ? 'bg-emerald-500 text-white border-emerald-300 shadow-emerald-500/40'
                                : floatingScore.score < 0
                                ? 'bg-rose-500 text-white border-rose-300 shadow-rose-500/40'
                                : 'bg-slate-700 text-white border-slate-500 shadow-slate-700/40'
                            }`}
                          >
                            {floatingScore.score > 0 ? `+${floatingScore.score}` : floatingScore.score}
                          </div>
                        )}

                        {/* 6-Sided Honeycomb Cell */}
                        <button
                          type="button"
                          onClick={() => toggleEmotion(emotion)}
                          className={`relative w-22 h-26 sm:w-26 sm:h-30 md:w-28 md:h-33 flex flex-col items-center justify-between py-2.5 px-1.5 transition-all duration-300 cursor-pointer hover:scale-110 hover:z-30 active:scale-95 group ${
                            isSelected ? 'scale-105 z-20' : ''
                          }`}
                        >
                          {/* SVG Hexagon Outline with Drop Shadow */}
                          <svg
                            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none transition-transform duration-300"
                            viewBox="0 0 100 116"
                          >
                            <polygon
                              points="50,3 97,29 97,87 50,113 3,87 3,29"
                              stroke={strokeColor}
                              strokeWidth={isSelected ? '3.5' : '1.8'}
                              strokeLinejoin="round"
                              className="transition-colors duration-300 fill-white/90 dark:fill-slate-800/90"
                              style={{
                                filter: isSelected ? `drop-shadow(0 0 7px ${glowColor})` : undefined,
                              }}
                            />
                          </svg>

                          {/* Clipped Inner Tint */}
                          <div
                            className="absolute inset-1 transition-colors duration-300 pointer-events-none"
                            style={{
                              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                              backgroundColor: isSelected ? glowColor : 'transparent',
                            }}
                          />

                          {/* Ripple Burst on Click */}
                          {isSelected && isJustToggled && (
                            <div
                              className="absolute inset-0 pointer-events-none animate-ripple"
                              style={{
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                backgroundColor: glowColor,
                              }}
                            />
                          )}

                          {/* Top Area: Checkmark (Top-Left) & Score Pill (Top-Right) */}
                          <div className="relative z-20 w-full flex items-center justify-between px-1.5 pt-0.5">
                            {isSelected ? (
                              <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md animate-spring-pop border border-white dark:border-slate-900">
                                <Check size={10} strokeWidth={3.5} />
                              </span>
                            ) : (
                              <span className="w-4 h-4" />
                            )}

                            <span
                              className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs border border-white/60 dark:border-black/40 ${scoreColor} ${
                                isSelected ? 'scale-110 shadow-md ring-1 ring-white/50' : ''
                              }`}
                            >
                              {emotion.score > 0 ? `+${emotion.score}` : emotion.score}
                            </span>
                          </div>

                          {/* Center Area: Emoji */}
                          <span
                            className={`relative z-10 text-2xl sm:text-2.5xl md:text-3xl leading-none transition-transform duration-200 group-hover:scale-120 my-auto ${
                              isSelected ? 'animate-spring-pop scale-110' : ''
                            }`}
                          >
                            {emotion.emoji}
                          </span>

                          {/* Lower Area: Balanced 2-Line Text inside Hexagon */}
                          <div className="relative z-10 w-full flex flex-col items-center justify-center pb-1 px-1">
                            {/* Main Title */}
                            <span
                              className={`text-[9.5px] sm:text-[10.5px] md:text-[11px] font-black text-center leading-tight truncate w-full transition-colors ${
                                isSelected
                                  ? 'text-blue-600 dark:text-blue-300 font-extrabold'
                                  : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                              }`}
                            >
                              {labelInfo.main}
                            </span>
                            {/* Subtitle */}
                            {labelInfo.sub && (
                              <span className="text-[8px] sm:text-[8.5px] font-medium text-slate-400 dark:text-slate-400 text-center leading-tight truncate w-full mt-0.5">
                                {labelInfo.sub}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Hover Tooltip */}
                        {activeTooltip === emotion.id && emotion.descriptionTh && (
                          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-56 p-2 rounded-xl bg-slate-900/95 dark:bg-black/95 text-white text-[10px] sm:text-[11px] shadow-2xl backdrop-blur-md border border-white/10 pointer-events-none animate-fade-in text-center">
                            <div className="font-semibold text-slate-200 leading-snug">
                              {language === 'th' ? emotion.descriptionTh : emotion.descriptionEn || emotion.descriptionTh}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-black" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Assessment & Advice Summary Container */}
          <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-white/[0.08] shadow-md space-y-4 transition-all">
            <div className={`flex flex-col ${viewMode === 'grid' ? 'md:flex-row' : ''} items-center gap-6`}>
              {/* 6-Sided Hexagon Gauge (Shown in Honeycomb Hive Mode for complete context) */}
              {viewMode === 'grid' && (
                <div className="relative flex flex-col items-center justify-center shrink-0">
                  <div className="relative w-36 h-42 flex items-center justify-center">
                    {/* Breathing Aura */}
                    <div
                      className="absolute inset-0 blur-2xl transition-all duration-700 animate-glow-pulse pointer-events-none"
                      style={{
                        backgroundColor: statusConfig.meterColor,
                        opacity: 0.28,
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      }}
                    />

                    {/* Expanding ripple polygon on score update */}
                    {scoreBump && (
                      <div
                        className="absolute inset-0 border-2 animate-ring-pulse pointer-events-none"
                        style={{
                          borderColor: statusConfig.meterColor,
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        }}
                      />
                    )}

                    {/* SVG Hexagon Meter */}
                    <svg className="w-36 h-42 overflow-visible" viewBox="0 0 100 116">
                      <polygon
                        points="50,3 97,29 97,87 50,113 3,87 3,29"
                        className="stroke-slate-100 dark:stroke-slate-800"
                        strokeWidth="8"
                        strokeLinejoin="round"
                        fill="transparent"
                      />
                      <polygon
                        points="50,3 97,29 97,87 50,113 3,87 3,29"
                        stroke={statusConfig.meterColor}
                        strokeWidth="8"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        strokeDasharray={331}
                        strokeDashoffset={331 - (currentScore.totalScore / 100) * 331}
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>

                    {/* Center Score Metrics Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                      <span className={`text-4xl font-black tracking-tight transition-transform duration-300 ${scoreBump ? 'animate-score-bump scale-110' : ''} ${statusConfig.text}`}>
                        {currentScore.totalScore}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 -mt-0.5">
                        / 100 PTS
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 mt-1 rounded-full shadow-xs ${
                        currentScore.netScore >= 0
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}>
                        {currentScore.netScore >= 0 ? `+${currentScore.netScore} Net` : `${currentScore.netScore} Net`}
                      </span>
                    </div>
                  </div>

                  <span className="mt-2 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Hexagon size={12} className="text-blue-500" />
                    <span>{language === 'th' ? 'เกจรังผึ้งความพร้อม' : 'Honeycomb Gauge'}</span>
                  </span>
                </div>
              )}

              {/* Status details & Smart Advice */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {statusConfig.icon}
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {language === 'th' ? statusConfig.titleTh : statusConfig.titleEn}
                    </span>
                  </div>
                  <span className={`text-xs font-black px-3 py-1 rounded-full shadow-xs ${
                    currentScore.status === 'OPTIMAL'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                      : currentScore.status === 'WARNING'
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 animate-pulse'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                  }`}>
                    {currentScore.status === 'OPTIMAL' ? '⚡ Zone พร้อมเทรด 100%' : currentScore.status === 'WARNING' ? '⚠️ ระวังอารมณ์เสี่ยงสูง' : '⚪ สภาวะจิตใจปกติ'}
                  </span>
                </div>

                {/* Linear sub-progress with shimmer sheen */}
                <div className="relative w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
                  <div
                    className={`h-full transition-all duration-700 ease-out rounded-full bg-gradient-to-r relative overflow-hidden ${statusConfig.barColor}`}
                    style={{ width: `${currentScore.totalScore}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>

                {/* Contextual Smart Trading Advice */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] flex items-start gap-2.5 shadow-xs">
                  <Compass size={17} className="text-blue-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {language === 'th' ? currentScore.adviceTh : currentScore.adviceEn}
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Affirmation Note Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  language === 'th'
                    ? '✍️ บันทึกคำเตือนสติตนเองวันนี้ (เช่น: รอสัญญาณชัดเจน, ไม่คันมือ, SL แล้วจบ)...'
                    : '✍️ Daily trading rule or affirmation...'
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] rounded-xl px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors"
              />
            </div>

            {/* Save & Confirmation Action Bar */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Zap size={12} className="text-amber-500 animate-bounce" />
                <span>
                  {language === 'th'
                    ? 'เลือกอารมณ์แล้วกดบันทึกเพื่อนำไปวิเคราะห์ร่วมกับไม้เทรด'
                    : 'Save to track correlation with your trade P&L'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {savedNotice && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-spring-pop">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    {language === 'th' ? 'บันทึกสำเร็จเรียบร้อย!' : 'Saved successfully!'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer flex items-center gap-1.5 hover:shadow-indigo-500/30"
                >
                  <CheckCircle2 size={14} />
                  <span>
                    {isSaving
                      ? language === 'th'
                        ? 'กำลังบันทึก...'
                        : 'Saving...'
                      : language === 'th'
                      ? 'บันทึกผลประเมินวันนี้'
                      : 'Save Daily Assessment'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
