'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PRESET_EMOTIONS, DailyEmotionalCheckin } from '@/types/emotion';
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
} from 'lucide-react';

export default function DailyEmotionalCheckinCard() {
  const { language } = useLanguage();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [todayCheckin, setTodayCheckin] = useState<DailyEmotionalCheckin | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    getTodayCheckin().then((checkin) => {
      if (checkin) {
        setTodayCheckin(checkin);
        setSelectedIds(checkin.selectedEmotionIds || []);
        setNote(checkin.note || '');
        // Default collapse if already checked in today to save space
        setIsExpanded(false);
      } else {
        // Not checked in yet today -> expand so user sees it
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

  const toggleEmotion = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
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
      }, 1500);
    } catch (err) {
      console.error('Failed to save daily emotion checkin:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedIds([]);
    setNote('');
  };

  // Status visual configurations
  const statusConfig = {
    OPTIMAL: {
      border: 'border-emerald-500/40 dark:border-emerald-500/30',
      bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: <Sparkles size={16} className="text-emerald-500 animate-pulse" />,
      titleTh: '🟢 สภาวะพร้อมเทรด 100% (Optimal Zone)',
      titleEn: '🟢 Optimal Trading Mindset',
      barColor: 'bg-emerald-500',
    },
    NORMAL: {
      border: 'border-amber-500/40 dark:border-amber-500/30',
      bg: 'bg-amber-500/5 dark:bg-amber-500/10',
      badgeBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
      text: 'text-amber-600 dark:text-amber-400',
      icon: <Info size={16} className="text-amber-500" />,
      titleTh: '🟡 สภาวะปกติ / เฝ้าระวังความเสี่ยง (Normal Zone)',
      titleEn: '🟡 Normal / Guarded Mindset',
      barColor: 'bg-amber-500',
    },
    WARNING: {
      border: 'border-rose-500/40 dark:border-rose-500/30',
      bg: 'bg-rose-500/5 dark:bg-rose-500/10',
      badgeBg: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40',
      text: 'text-rose-600 dark:text-rose-400',
      icon: <ShieldAlert size={16} className="text-rose-500 animate-bounce" />,
      titleTh: '🔴 เสี่ยงสูง / อารมณ์ไม่พร้อมเทรด (Risk Warning)',
      titleEn: '🔴 High Emotional Risk Warning',
      barColor: 'bg-rose-500',
    },
  }[currentScore.status];

  return (
    <div
      className={`relative mb-6 rounded-2xl transition-all duration-300 border backdrop-blur-md shadow-sm overflow-hidden ${
        statusConfig.border
      } ${statusConfig.bg} bg-white/70 dark:bg-slate-900/70`}
    >
      {/* Top Banner Bar */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <HeartHandshake size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'th' ? 'เช็คสภาวะอารมณ์ก่อนเทรดประจำวัน' : 'Daily Pre-Trade Emotional Check-in'}
              </h2>
              {todayCheckin ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  <CheckCircle2 size={10} />
                  {language === 'th' ? 'เช็คอินแล้ววันนี้' : 'Checked in today'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30">
                  <Flame size={10} />
                  {language === 'th' ? 'รอประเมินวันนี้' : 'Pending check-in'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'th'
                ? 'แตะเลือกอารมณ์ที่รู้สึกเพื่อรวม Score ประเมินความพร้อมก่อนเปิดออเดอร์'
                : 'Select current emotions to calculate your readiness score before executing'}
            </p>
          </div>
        </div>

        {/* Live Score & Toggle Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Score:</span>
            <span className={`text-base font-black ${statusConfig.text}`}>
              {currentScore.netScore >= 0 ? `+${currentScore.netScore}` : currentScore.netScore}
            </span>
            <span className="text-xs font-bold text-slate-400">({currentScore.totalScore}/100)</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={isExpanded ? 'ย่อการ์ด' : 'ขยายการ์ด'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-200/60 dark:border-white/[0.06] animate-fade-in">
          {/* Emotion Tag Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'th' ? 'แตะเลือกอารมณ์ของคุณตอนนี้ (เลือกได้หลายข้อ):' : 'Select your current emotions:'}
              </span>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw size={10} />
                  {language === 'th' ? 'ล้างค่า' : 'Clear all'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_EMOTIONS.map((emotion) => {
                const isSelected = selectedIds.includes(emotion.id);
                let scoreBadgeColor = 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
                let tagBorderColor = 'border-slate-200 dark:border-white/[0.08]';
                let tagBgColor = 'bg-white/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80';

                if (emotion.category === 'positive') {
                  scoreBadgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300';
                  if (isSelected) {
                    tagBorderColor = 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/30';
                    tagBgColor = 'bg-emerald-50 dark:bg-emerald-950/40';
                  }
                } else if (emotion.category === 'negative') {
                  scoreBadgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300';
                  if (isSelected) {
                    tagBorderColor = 'border-rose-500 dark:border-rose-400 ring-2 ring-rose-500/30';
                    tagBgColor = 'bg-rose-50 dark:bg-rose-950/40';
                  }
                } else if (emotion.category === 'neutral') {
                  scoreBadgeColor = 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
                  if (isSelected) {
                    tagBorderColor = 'border-slate-400 dark:border-slate-300 ring-2 ring-slate-400/30';
                    tagBgColor = 'bg-slate-100 dark:bg-slate-800/80';
                  }
                }

                return (
                  <button
                    key={emotion.id}
                    type="button"
                    onClick={() => toggleEmotion(emotion.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-95 shadow-2xs ${tagBorderColor} ${tagBgColor}`}
                  >
                    <span className="text-base leading-none">{emotion.emoji}</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {language === 'th' ? emotion.labelTh : emotion.labelEn}
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${scoreBadgeColor}`}
                    >
                      {emotion.score > 0 ? `+${emotion.score}` : emotion.score}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result & Assessment Box */}
          <div className="p-4 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {statusConfig.icon}
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'th' ? statusConfig.titleTh : statusConfig.titleEn}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                คะแนนความพร้อม:{' '}
                <strong className={`font-black ${statusConfig.text}`}>{currentScore.totalScore} / 100</strong>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${statusConfig.barColor}`}
                style={{ width: `${currentScore.totalScore}%` }}
              />
            </div>

            {/* Advice Text */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              💡 {language === 'th' ? currentScore.adviceTh : currentScore.adviceEn}
            </p>

            {/* Optional Daily Note / Affirmation */}
            <div className="pt-2 border-t border-slate-200/50 dark:border-white/[0.04]">
              <input
                type="text"
                placeholder={
                  language === 'th'
                    ? 'คำเตือนสติตัวเองสั้นๆ วันนี้ (เช่น: รอคอนเฟิร์มก่อนเข้า, ไม่เกิน 2 ไม้)...'
                    : 'Daily trading affirmation or rule...'
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] rounded-xl px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Save & Action Button */}
            <div className="flex items-center justify-end gap-2 pt-1">
              {savedNotice && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 size={13} />
                  {language === 'th' ? 'บันทึกสำเร็จเรียบร้อยแล้ว!' : 'Saved successfully!'}
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={13} />
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
      )}
    </div>
  );
}
