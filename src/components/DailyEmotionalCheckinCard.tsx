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

// 7 Key Archetype Emotions mapping to the 7-Hexagon UX Honeycomb diagram
const SEVEN_CLUSTER_CONFIG = [
  { position: 'top', id: 'calm', role: 'Credible', category: 'THINK' },
  { position: 'topLeft', id: 'focused', role: 'Useful', category: 'THINK' },
  { position: 'bottomLeft', id: 'disciplined', role: 'Findable', category: 'THINK' },
  { position: 'bottom', id: 'coffee', role: 'Usable', category: 'USE' },
  { position: 'bottomRight', id: 'risk_accept', role: 'Accessible', category: 'USE' },
  { position: 'topRight', id: 'fomo', role: 'Desirable', category: 'FEEL' },
] as const;

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

  // Honeycomb View Modes: 'cluster' (Exact 7-Hexagon matching user photo) vs 'full' (Full 21-Emotion Hive)
  const [viewMode, setViewMode] = useState<'cluster' | 'full'>('cluster');
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
      const next = isSelecting ? [...prev, emotion.id] : prev.filter((item) => item !== emotion.id);
      // Dispatch real-time emotional score to dashboard for synchronized motion & ambiance
      if (typeof window !== 'undefined') {
        const liveScore = calculateEmotionalScore(next);
        window.dispatchEvent(
          new CustomEvent('dailyEmotionLiveScore', {
            detail: { score: liveScore, selectedIds: next },
          })
        );
      }
      return next;
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
    if (typeof window !== 'undefined') {
      const zeroScore = calculateEmotionalScore([]);
      window.dispatchEvent(
        new CustomEvent('dailyEmotionLiveScore', {
          detail: { score: zeroScore, selectedIds: [] },
        })
      );
    }
  };

  // Filtered emotions by category
  const filteredEmotions = useMemo(() => {
    if (categoryFilter === 'all') return PRESET_EMOTIONS;
    return PRESET_EMOTIONS.filter((e) => e.category === categoryFilter);
  }, [categoryFilter]);

  // Grouped emotions for the full interlocking honeycomb columns
  const fullHiveColumns = useMemo(() => {
    if (categoryFilter === 'all') {
      const pos = PRESET_EMOTIONS.filter((e) => e.category === 'positive'); // 8
      const neu = PRESET_EMOTIONS.filter((e) => e.category === 'neutral'); // 3
      const neg = PRESET_EMOTIONS.filter((e) => e.category === 'negative'); // 10
      return [
        { title: 'THINK', label: 'วินัย & พลังบวก', color: 'emerald', items: pos.slice(0, 4), isOdd: false },
        { title: 'THINK', label: 'วิเคราะห์คม', color: 'emerald', items: pos.slice(4), isOdd: true },
        { title: 'USE', label: 'เป็นกลาง / เฝ้าดู', color: 'blue', items: neu, isOdd: false },
        { title: 'FEEL', label: 'อารมณ์เสี่ยงสูง', color: 'rose', items: neg.slice(0, 5), isOdd: true },
        { title: 'FEEL', label: 'กับดักจิตวิทยา', color: 'rose', items: neg.slice(5), isOdd: false },
      ];
    } else if (categoryFilter === 'positive') {
      return [
        { title: 'THINK', label: 'สมาธิ & นิ่งสงบ', color: 'emerald', items: filteredEmotions.slice(0, 3), isOdd: false },
        { title: 'THINK', label: 'ความมั่นใจในแผน', color: 'emerald', items: filteredEmotions.slice(3, 5), isOdd: true },
        { title: 'THINK', label: 'การคุมความเสี่ยง', color: 'emerald', items: filteredEmotions.slice(5), isOdd: false },
      ];
    } else if (categoryFilter === 'neutral') {
      return [
        { title: 'USE', label: 'สภาวะเฝ้าระวัง', color: 'blue', items: filteredEmotions.slice(0, 2), isOdd: false },
        { title: 'USE', label: 'รอดูตลาด', color: 'blue', items: filteredEmotions.slice(2), isOdd: true },
      ];
    } else {
      return [
        { title: 'FEEL', label: 'ความกลัว & ลังเล', color: 'rose', items: filteredEmotions.slice(0, 3), isOdd: false },
        { title: 'FEEL', label: 'FOMO & คันมือ', color: 'rose', items: filteredEmotions.slice(3, 7), isOdd: true },
        { title: 'FEEL', label: 'หัวร้อน & แก้แค้น', color: 'rose', items: filteredEmotions.slice(7), isOdd: false },
      ];
    }
  }, [categoryFilter, filteredEmotions]);

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
      coreGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
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
      coreGradient: 'from-amber-500 via-orange-500 to-amber-600',
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
      coreGradient: 'from-rose-500 via-red-500 to-rose-600',
    },
  }[currentScore.status];

  // Helper renderer for a single flat-topped hexagon emotion cell with true 6-sided SVG border
  const renderHexCell = (emotion: EmotionTag, customRole?: string) => {
    const isSelected = selectedIds.includes(emotion.id);
    const isJustToggled = lastToggledId === emotion.id;
    const labelInfo = formatEmotionLabel(language === 'th' ? emotion.labelTh : emotion.labelEn);

    // Color definitions matching the reference image:
    // Positive (THINK) -> Coral Orange / Emerald Gradient (#f1875d / #10b981)
    // Negative (FEEL)  -> Coral Red / Rose Gradient (#e97872 / #f43f5e)
    // Neutral (USE)    -> Sky Blue Gradient (#5695f4 / #3b82f6)
    let selectedBg = 'bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30';
    let unselectedBg = 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200';
    let glowColor = 'rgba(16, 185, 129, 0.45)';
    let scoreBadgeBg = 'bg-emerald-500 text-white';

    // True 6-sided SVG stroke styling for all 6 edges
    let strokeClass = 'stroke-slate-200/90 dark:stroke-slate-700/90 group-hover:stroke-emerald-400 group-hover:drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]';
    if (isSelected) {
      strokeClass = 'stroke-emerald-200 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]';
    }

    if (emotion.category === 'negative') {
      selectedBg = 'bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 text-white shadow-lg shadow-rose-500/35';
      unselectedBg = 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200';
      glowColor = 'rgba(244, 63, 94, 0.45)';
      scoreBadgeBg = 'bg-rose-500 text-white';
      strokeClass = 'stroke-slate-200/90 dark:stroke-slate-700/90 group-hover:stroke-rose-400 group-hover:drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]';
      if (isSelected) {
        strokeClass = 'stroke-rose-200 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]';
      }
    } else if (emotion.category === 'neutral') {
      selectedBg = 'bg-gradient-to-br from-blue-500 via-sky-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30';
      unselectedBg = 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200';
      glowColor = 'rgba(59, 130, 246, 0.45)';
      scoreBadgeBg = 'bg-blue-500 text-white';
      strokeClass = 'stroke-slate-200/90 dark:stroke-slate-700/90 group-hover:stroke-blue-400 group-hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]';
      if (isSelected) {
        strokeClass = 'stroke-blue-200 drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]';
      }
    }

    return (
      <div
        key={emotion.id}
        className="relative group select-none flex items-center justify-center"
        onMouseEnter={() => setActiveTooltip(emotion.id)}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        {/* Floating RPG Score Popup on Click */}
        {floatingScore?.id === emotion.id && (
          <div
            key={floatingScore.key}
            className={`absolute z-40 -top-6 left-1/2 -translate-x-1/2 pointer-events-none text-xs font-black px-2.5 py-0.5 rounded-full shadow-lg border animate-pop-float whitespace-nowrap ${
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

        {/* Flat-Topped Hexagon Button with 6-Sided SVG Border Frame */}
        <button
          type="button"
          onClick={() => toggleEmotion(emotion)}
          className={`relative w-[104px] h-[92px] sm:w-[114px] sm:h-[100px] flex flex-col items-center justify-center p-2 transition-all duration-300 cursor-pointer hover:scale-105 hover:z-30 active:scale-95 ${
            isSelected ? `${selectedBg} scale-105 z-20` : unselectedBg
          }`}
          style={{
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          }}
        >
          {/* True 6-Sided SVG Border Overlay with Rounded Vertices (Visible on all 6 sides!) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
            viewBox="0 0 100 88"
          >
            <polygon
              points="25,2 75,2 98,44 75,86 25,86 2,44"
              strokeLinejoin="round"
              strokeWidth="3.5"
              fill="transparent"
              className={`transition-all duration-200 ${strokeClass}`}
            />
          </svg>

          {/* Ripple Burst on Click */}
          {isSelected && isJustToggled && (
            <div
              className="absolute inset-0 pointer-events-none animate-ripple"
              style={{
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                backgroundColor: glowColor,
              }}
            />
          )}

          {/* Top-Right: Mini Score Badge */}
          <span
            className={`absolute top-1.5 right-4 z-20 text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs border border-white/40 ${
              isSelected ? 'bg-white/30 text-white' : scoreBadgeBg
            }`}
          >
            {emotion.score > 0 ? `+${emotion.score}` : emotion.score}
          </span>

          {/* Top-Left: Checkmark badge when selected */}
          {isSelected && (
            <span className="absolute top-1.5 left-4 z-20 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md animate-spring-pop font-black">
              <Check size={9} strokeWidth={4} />
            </span>
          )}

          {/* Center Emoji */}
          <span
            className={`text-xl sm:text-2xl leading-none transition-transform duration-200 group-hover:scale-115 mb-0.5 ${
              isSelected ? 'animate-spring-pop' : ''
            }`}
          >
            {emotion.emoji}
          </span>

          {/* Main Title (White & Bold in reference photo) */}
          <span
            className={`text-xs sm:text-[13px] font-black tracking-tight text-center leading-tight line-clamp-1 w-full px-2 transition-colors ${
              isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
            }`}
          >
            {labelInfo.main}
          </span>

          {/* Subtitle / Role Tag */}
          <span
            className={`text-[8.5px] sm:text-[9px] font-medium text-center leading-tight truncate w-full px-2 mt-0.5 transition-colors ${
              isSelected ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {customRole ? customRole : labelInfo.sub || (language === 'th' ? emotion.labelTh : emotion.labelEn)}
          </span>
        </button>

        {/* Hover Tooltip */}
        {activeTooltip === emotion.id && emotion.descriptionTh && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-56 p-2 rounded-xl bg-slate-900/95 dark:bg-black/95 text-white text-[10px] sm:text-[11px] shadow-2xl backdrop-blur-md border border-white/10 pointer-events-none animate-fade-in text-center">
            <div className="font-bold text-emerald-400 mb-0.5">
              {language === 'th' ? emotion.labelTh : emotion.labelEn} ({emotion.score > 0 ? `+${emotion.score}` : emotion.score} pts)
            </div>
            <div className="text-slate-300 font-normal leading-snug">
              {language === 'th' ? emotion.descriptionTh : emotion.descriptionEn || emotion.descriptionTh}
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900 dark:border-t-black" />
          </div>
        )}
      </div>
    );
  };

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
                ? 'ผังรังผึ้ง 6 เหลี่ยม (Honeycomb UX) ประเมินความพร้อมและจุดบอดทางจิตวิทยา'
                : 'Interactive Honeycomb Matrix to evaluate trading psychology and emotional edge'}
            </p>
          </div>
        </div>

        {/* Live Score Display & Toggle Action */}
        <div className="flex items-center gap-3">
          {/* Mini 6-Sided Hexagon Gauge / Score Widget */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-white/90 dark:bg-black/50 border border-slate-200/80 dark:border-white/[0.08] shadow-xs transition-transform hover:scale-105">
            <div className="relative w-11 h-12 flex items-center justify-center shrink-0">
              <div
                className="absolute inset-0 blur-md opacity-35 animate-glow-pulse pointer-events-none"
                style={{ backgroundColor: statusConfig.meterColor }}
              />
              <svg className="w-11 h-12 overflow-visible" viewBox="0 0 40 46">
                <polygon
                  points="20,2 38,11.5 38,34.5 20,44 2,34.5 2,11.5"
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                  fill="transparent"
                />
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

            {/* View Mode Toggle: 7-Hexagon Focus Cluster (Exact like photo) vs Full 21 Hive */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/[0.06] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('cluster')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === 'cluster'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="คลัสเตอร์ 7 ช่อง รวงผึ้งตามภาพต้นฉบับ"
                >
                  <Hexagon size={13} className={viewMode === 'cluster' ? 'animate-pulse' : ''} />
                  <span>{language === 'th' ? 'คลัสเตอร์ 7 ช่อง' : '7-Cluster'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    viewMode === 'full'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-bold scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="รังผึ้งเต็มระบบ 21 อารมณ์ประสานคอลัมน์"
                >
                  <LayoutGrid size={13} />
                  <span>{language === 'th' ? 'รังผึ้งเต็ม 21 อารมณ์' : 'Full 21 Hive'}</span>
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
          {viewMode === 'cluster' ? (
            /* ============================================================ */
            /* 1. EXACT 7-HEXAGON HONEYCOMB CLUSTER (เหมือนรูปเป๊ะๆ 100%)    */
            /* ============================================================ */
            <div className="relative w-full max-w-[480px] h-[390px] sm:h-[430px] mx-auto my-4 flex items-center justify-center select-none overflow-visible">
              {/* Category Labels Outside the Cluster (as shown in reference image) */}
              {/* THINK (Top-Left) */}
              <div className="absolute top-2 left-6 sm:left-12 z-30 flex flex-col items-start pointer-events-none">
                <span className="text-xs sm:text-sm font-black tracking-widest text-[#f1875d] dark:text-[#f1875d] uppercase">
                  THINK
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  วินัย & สมาธิ
                </span>
              </div>

              {/* FEEL (Top-Right) */}
              <div className="absolute top-2 right-6 sm:right-12 z-30 flex flex-col items-end pointer-events-none">
                <span className="text-xs sm:text-sm font-black tracking-widest text-[#e97872] dark:text-[#e97872] uppercase">
                  FEEL
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  อารมณ์ & กับดัก
                </span>
              </div>

              {/* USE (Bottom Center) */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
                <span className="text-xs sm:text-sm font-black tracking-widest text-[#5695f4] dark:text-[#5695f4] uppercase">
                  USE
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  ระบบ & บริหารความเสี่ยง
                </span>
              </div>

              {/* 1. CENTER HEXAGON: Valuable / Hive Core Readiness Hub with 6-Sided SVG Border */}
              <div
                className="group absolute z-20 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[114px] h-[100px] sm:w-[124px] sm:h-[110px] flex flex-col items-center justify-center p-2 transition-transform duration-300 shadow-xl cursor-pointer hover:scale-105 active:scale-95"
                style={{
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                  background: 'linear-gradient(135deg, #f1875d 0%, #e86e3f 100%)',
                }}
              >
                {/* True 6-Sided SVG Border for Center Hub */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                  viewBox="0 0 100 88"
                >
                  <polygon
                    points="25,2 75,2 98,44 75,86 25,86 2,44"
                    strokeLinejoin="round"
                    strokeWidth="3.5"
                    fill="transparent"
                    className="stroke-[#f9a37f] group-hover:stroke-amber-200 group-hover:drop-shadow-[0_0_8px_rgba(241,135,93,0.7)] transition-all duration-200"
                  />
                </svg>

                {/* Score Bump Pulse */}
                {scoreBump && (
                  <div
                    className="absolute inset-0 border-2 border-white animate-ring-pulse pointer-events-none"
                    style={{
                      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                    }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center justify-center text-center select-none text-white">
                  <span className="text-[9px] font-black uppercase tracking-wider text-white/90 -mb-0.5">
                    VALUABLE
                  </span>
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight leading-none ${scoreBump ? 'animate-score-bump' : ''}`}>
                    {currentScore.totalScore}
                  </span>
                  <span className="text-[8px] sm:text-[8.5px] font-extrabold uppercase tracking-widest text-white/80">
                    / 100 PTS
                  </span>
                  <span className="mt-1 text-[8px] sm:text-[9px] font-black px-2 py-0.2 rounded-full bg-white/20 text-white shadow-xs border border-white/30">
                    {currentScore.netScore >= 0 ? `+${currentScore.netScore} Net` : `${currentScore.netScore} Net`}
                  </span>
                </div>
              </div>

              {/* 2. SIX SURROUNDING HEXAGONS (Touch Face-to-Face with Center) */}
              {SEVEN_CLUSTER_CONFIG.map((cfg) => {
                const emotion = PRESET_EMOTIONS.find((e) => e.id === cfg.id);
                if (!emotion) return null;

                // Mathematical offset for flat-topped hexagons (W=114, H=100, gap=7):
                // dx = W * 0.75 + gap * (sqrt(3)/2) approx 91px (sm: 100px)
                // dy = H + gap approx 107px (sm: 117px)
                // dyHalf = dy / 2 approx 53px (sm: 58px)
                let styleObj: React.CSSProperties = {};

                switch (cfg.position) {
                  case 'top':
                    styleObj = { transform: 'translate(-50%, -150%)', top: '50%', left: '50%', marginTop: '-7px' };
                    break;
                  case 'bottom':
                    styleObj = { transform: 'translate(-50%, 50%)', top: '50%', left: '50%', marginTop: '7px' };
                    break;
                  case 'topLeft':
                    styleObj = { transform: 'translate(calc(-150% - 7px), calc(-100% - 3.5px))', top: '50%', left: '50%' };
                    break;
                  case 'bottomLeft':
                    styleObj = { transform: 'translate(calc(-150% - 7px), 0%)', top: '50%', left: '50%', marginTop: '3.5px' };
                    break;
                  case 'topRight':
                    styleObj = { transform: 'translate(calc(50% + 7px), calc(-100% - 3.5px))', top: '50%', left: '50%' };
                    break;
                  case 'bottomRight':
                    styleObj = { transform: 'translate(calc(50% + 7px), 0%)', top: '50%', left: '50%', marginTop: '3.5px' };
                    break;
                }

                return (
                  <div key={cfg.id} className="absolute z-10 transition-all duration-300" style={styleObj}>
                    {renderHexCell(emotion, cfg.role)}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ============================================================ */
            /* 2. FULL 21-EMOTION HONEYCOMB HIVE (ประสาน 5 คอลัมน์สมบูรณ์)    */
            /* ============================================================ */
            <div className="py-2 px-1 max-w-4xl mx-auto flex flex-col items-center select-none animate-fade-in overflow-x-auto">
              <div className="flex justify-center items-start gap-1 sm:gap-2 pt-2 pb-4">
                {fullHiveColumns.map((col, colIdx) => (
                  <div
                    key={`col-${colIdx}`}
                    className={`flex flex-col gap-1.5 sm:gap-2 ${col.isOdd ? 'pt-10 sm:pt-12' : ''} -ml-4 sm:-ml-5 first:ml-0 transition-all`}
                  >
                    {/* Column Header Label */}
                    <div className="text-center py-1 pointer-events-none">
                      <span className={`text-[10px] sm:text-xs font-black tracking-wider uppercase ${
                        col.color === 'emerald'
                          ? 'text-emerald-500'
                          : col.color === 'rose'
                          ? 'text-rose-500'
                          : 'text-blue-500'
                      }`}>
                        {col.title}
                      </span>
                      <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[90px] mx-auto">
                        {col.label}
                      </div>
                    </div>

                    {/* Column Hexagons */}
                    {col.items.map((emotion) => renderHexCell(emotion))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assessment & Advice Summary Container */}
          <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-white/[0.08] shadow-md space-y-4 transition-all">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Mini Hexagon Gauge Summary with 6-sided SVG Border */}
              <div className="relative flex flex-col items-center justify-center shrink-0">
                <div
                  className="group relative w-28 h-24 sm:w-32 sm:h-28 flex flex-col items-center justify-center p-2 text-white shadow-lg transition-transform hover:scale-105"
                  style={{
                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                    background: `linear-gradient(135deg, ${statusConfig.meterColor} 0%, #0f172a 120%)`,
                  }}
                >
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                    viewBox="0 0 100 88"
                  >
                    <polygon
                      points="25,2 75,2 98,44 75,86 25,86 2,44"
                      strokeLinejoin="round"
                      strokeWidth="3.5"
                      fill="transparent"
                      stroke={statusConfig.meterColor}
                      className="opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </svg>

                  <span className="text-[8.5px] font-black uppercase tracking-wider text-white/90">
                    READINESS
                  </span>
                  <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none">
                    {currentScore.totalScore}
                  </span>
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-white/80">
                    / 100 PTS
                  </span>
                  <span className="mt-1 text-[8.5px] font-black px-2 py-0.2 rounded-full bg-white/20 text-white">
                    {currentScore.netScore >= 0 ? `+${currentScore.netScore} Net` : `${currentScore.netScore} Net`}
                  </span>
                </div>

                <span className="mt-2 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Hexagon size={12} className="text-blue-500" />
                  <span>{language === 'th' ? 'เกจรวงผึ้งประเมินจิตวิทยา' : 'Honeycomb Readiness'}</span>
                </span>
              </div>

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
