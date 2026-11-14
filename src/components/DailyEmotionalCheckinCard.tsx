'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PRESET_EMOTIONS, DailyEmotionalCheckin, EmotionTag } from '@/types/emotion';
import { calculateEmotionalScore, getTodayCheckin, saveDailyCheckin } from '@/lib/emotionStorage';
import { useLanguage } from '@/context/LanguageContext';
import {
  HeartHandshake,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldAlert,
  Flame,
  Info,
  Check,
  TrendingUp,
  TrendingDown,
  Compass,
  Zap,
} from 'lucide-react';

type EmotionCategoryTab = 'all' | 'positive' | 'neutral' | 'negative';

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

  // Motion States
  const [floatingScore, setFloatingScore] = useState<{ id: string; score: number; key: number } | null>(null);
  const [scoreBump, setScoreBump] = useState<boolean>(false);
  const [lastToggledId, setLastToggledId] = useState<string | null>(null);

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
    },
  }[currentScore.status];

  // SVG Gauge Calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore.totalScore / 100) * circumference;

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
                ? 'แตะเลือกอารมณ์ที่มีผลต่อจิตวิทยาการเทรดเพื่อรวมคะแนนความพร้อมก่อนเปิดไม้'
                : 'Select current feelings to compute psychological readiness score'}
            </p>
          </div>
        </div>

        {/* Live Score Display & Toggle Action */}
        <div className="flex items-center gap-3">
          {/* Mini Gauge / Score Widget */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-black/50 border border-slate-200/80 dark:border-white/[0.08] shadow-xs transition-transform hover:scale-[1.02]">
            {/* Circular Gauge */}
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-9 h-9 -rotate-90 transform">
                <circle
                  cx="18"
                  cy="18"
                  r={radius * 0.42}
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="18"
                  cy="18"
                  r={radius * 0.42}
                  stroke={statusConfig.meterColor}
                  strokeWidth="3.5"
                  strokeDasharray={circumference * 0.42}
                  strokeDashoffset={strokeDashoffset * 0.42}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className={`absolute text-[11px] font-black transition-transform ${scoreBump ? 'animate-score-bump' : ''} ${statusConfig.text}`}>
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
          {/* Category Tabs & Quick Reset */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/[0.06] text-xs font-semibold">
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

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
              >
                <RotateCcw size={11} className="transition-transform group-hover:-rotate-90" />
                <span>{language === 'th' ? `ล้างค่าที่เลือก (${selectedIds.length})` : `Clear (${selectedIds.length})`}</span>
              </button>
            )}
          </div>

          {/* Emotion Interactive Tag Cloud with Rich Micro-Interactions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {filteredEmotions.map((emotion) => {
              const isSelected = selectedIds.includes(emotion.id);
              const isJustToggled = lastToggledId === emotion.id;

              let scoreBadge = 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
              let borderClass = 'border-slate-200/80 dark:border-white/[0.07]';
              let bgClass = 'bg-white/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/90 hover:border-slate-300 dark:hover:border-white/[0.15]';

              if (emotion.category === 'positive') {
                scoreBadge = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-300';
                if (isSelected) {
                  borderClass = 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/15';
                  bgClass = 'bg-emerald-50/95 dark:bg-emerald-950/60';
                }
              } else if (emotion.category === 'negative') {
                scoreBadge = 'bg-rose-100 text-rose-800 dark:bg-rose-500/25 dark:text-rose-300';
                if (isSelected) {
                  borderClass = 'border-rose-500 dark:border-rose-400 ring-2 ring-rose-500/40 shadow-md shadow-rose-500/15';
                  bgClass = 'bg-rose-50/95 dark:bg-rose-950/60';
                }
              } else if (emotion.category === 'neutral') {
                scoreBadge = 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
                if (isSelected) {
                  borderClass = 'border-slate-400 dark:border-slate-300 ring-2 ring-slate-400/40 shadow-md shadow-slate-500/10';
                  bgClass = 'bg-slate-100 dark:bg-slate-800/90';
                }
              }

              return (
                <div
                  key={emotion.id}
                  className="relative"
                  onMouseEnter={() => setActiveTooltip(emotion.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  {/* Floating RPG Score Popup on Click */}
                  {floatingScore?.id === emotion.id && (
                    <div
                      key={floatingScore.key}
                      className={`absolute z-30 -top-3 left-1/2 pointer-events-none text-xs font-black px-2.5 py-0.5 rounded-full shadow-lg border animate-pop-float ${
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

                  {/* Main Interactive Button with Ripple & Bounce */}
                  <button
                    type="button"
                    onClick={() => toggleEmotion(emotion)}
                    className={`relative overflow-hidden w-full group text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 flex flex-col justify-between gap-1.5 hover:-translate-y-1 hover:shadow-lg ${borderClass} ${bgClass}`}
                  >
                    {/* Ripple Burst on Click */}
                    {isSelected && isJustToggled && (
                      <div
                        className={`absolute inset-0 rounded-xl pointer-events-none border-2 animate-ripple ${
                          emotion.category === 'positive'
                            ? 'border-emerald-400'
                            : emotion.category === 'negative'
                            ? 'border-rose-400'
                            : 'border-slate-400'
                        }`}
                      />
                    )}

                    <div className="flex items-center justify-between w-full">
                      {/* Spring Bouncing Emoji */}
                      <span
                        className={`text-xl leading-none transition-transform duration-200 group-hover:scale-125 ${
                          isSelected ? 'animate-spring-pop' : ''
                        }`}
                      >
                        {emotion.emoji}
                      </span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md transition-all duration-200 ${scoreBadge} ${
                          isSelected ? 'scale-105 shadow-xs' : ''
                        }`}
                      >
                        {emotion.score > 0 ? `+${emotion.score}` : emotion.score}
                      </span>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {language === 'th' ? emotion.labelTh : emotion.labelEn}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 animate-spring-pop shadow-xs">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Micro-Tooltip for Deep Psychology Context */}
                  {activeTooltip === emotion.id && emotion.descriptionTh && (
                    <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded-xl bg-slate-900/95 dark:bg-black/95 text-white text-[11px] shadow-xl backdrop-blur-md border border-white/[0.1] pointer-events-none animate-fade-in text-center">
                      <div className="font-semibold text-slate-200">
                        {language === 'th' ? emotion.descriptionTh : emotion.descriptionEn || emotion.descriptionTh}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-black" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Assessment & Advice Summary Container */}
          <div className="p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3.5 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {statusConfig.icon}
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'th' ? statusConfig.titleTh : statusConfig.titleEn}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                คะแนนความพร้อม:{' '}
                <strong className={`font-black text-sm transition-transform ${scoreBump ? 'animate-score-bump' : ''} ${statusConfig.text}`}>
                  {currentScore.totalScore} / 100
                </strong>
              </div>
            </div>

            {/* Dynamic Smooth Gradient Progress Bar with Animated Shimmer Sheen */}
            <div className="relative w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-700 ease-out rounded-full bg-gradient-to-r relative overflow-hidden ${statusConfig.barColor}`}
                style={{ width: `${currentScore.totalScore}%` }}
              >
                {/* Flowing Shimmer Sheen */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
            </div>

            {/* Contextual Smart Trading Advice */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] flex items-start gap-2.5">
              <Compass size={16} className="text-blue-500 shrink-0 mt-0.5 animate-pulse" />
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {language === 'th' ? currentScore.adviceTh : currentScore.adviceEn}
              </p>
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
