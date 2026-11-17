'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DailyDebrief } from '@/types/emotion';
import { saveDailyDebrief, playZenChime } from '@/lib/emotionStorage';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sparkles,
  Star,
  CheckCircle2,
  X,
  Shield,
  HelpCircle,
  Lightbulb,
  Trophy,
  Heart,
} from 'lucide-react';

interface DailyDebriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDebrief?: DailyDebrief;
  onSaved?: (debrief: DailyDebrief) => void;
}

const MENTAL_WIN_SUGGESTIONS = [
  'อดทนรอจังหวะคม ไม่เข้ามั่ว',
  'ยอมรับ SL ได้ตามแผน ไม่เปิดไม้แก้แค้น',
  'ปล่อยให้กราฟ Run ถึง TP ไม่รีบปิดก่อน',
  'รู้ตัวว่าเริ่มล้าแล้วหยุดพักหน้าจอ',
  'จำกัดความเสี่ยงไม่เกิน 1-2% ทุกไม้',
];

const LESSON_SUGGESTIONS = [
  'อย่าเทรดดึกเกินไปเพราะสมองล้าและขาดสติ',
  'โดน SL แล้วต้องลุกออกจากหน้าจอ 30 นาที',
  'ห้ามเบิ้ล Lot แม้จะมั่นใจมากแค่ไหน',
  'ไม่ไล่ราคาแท่งยาว รอให้ย่อกลับมาใน Setup',
];

export default function DailyDebriefModal({
  isOpen,
  onClose,
  initialDebrief,
  onSaved,
}: DailyDebriefModalProps) {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState<boolean>(false);

  const [disciplineScore, setDisciplineScore] = useState<number>(8);
  const [followedRules, setFollowedRules] = useState<'yes' | 'partial' | 'no'>('yes');
  const [mentalWin, setMentalWin] = useState<string>('');
  const [oneLesson, setOneLesson] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialDebrief) {
      setDisciplineScore(initialDebrief.disciplineScore || 8);
      setFollowedRules(initialDebrief.followedRules || 'yes');
      setMentalWin(initialDebrief.mentalWin || '');
      setOneLesson(initialDebrief.oneLesson || '');
    }
  }, [initialDebrief, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const debrief: DailyDebrief = {
        disciplineScore,
        followedRules,
        mentalWin: mentalWin.trim(),
        oneLesson: oneLesson.trim(),
        completedAt: new Date().toISOString(),
      };

      await saveDailyDebrief(debrief);
      playZenChime();

      if (onSaved) onSaved(debrief);
      onClose();
    } catch (e) {
      console.error('Failed to save daily debrief:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-6 text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-purple-500/15 dark:bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-blue-500/15 dark:bg-blue-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 border-b border-slate-100 dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 shrink-0">
              <Trophy size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {language === 'th'
                  ? '🪞 บันทึกตกผลึกปิดวัน (Daily Post-Market De-brief)'
                  : '🪞 Post-Market Mindset De-brief'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'th'
                  ? 'ประเมินวินัยตนเอง สรุปข้อคิด เพื่อปิดวันเทรดอย่างมีสติ'
                  : 'Reflect on discipline and lock in today’s psychological lessons'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Discipline Rating (1 - 10) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Star size={14} className="text-amber-500" />
              <span>{language === 'th' ? 'คะแนนความมีวินัยของวันนี้ (Discipline Score):' : 'Today’s Discipline Rating:'}</span>
            </span>
            <span className={`text-sm font-black px-2.5 py-0.5 rounded-full ${
              disciplineScore >= 8
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : disciplineScore >= 5
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}>
              {disciplineScore} / 10
            </span>
          </div>

          <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
              const isSelected = disciplineScore === score;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => setDisciplineScore(score)}
                  className={`h-9 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isSelected
                      ? score >= 8
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105'
                        : score >= 5
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                        : 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
                      : 'bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {score}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Rule Adherence */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Shield size={14} className="text-blue-500" />
            <span>{language === 'th' ? 'การปฏิบัติตามแผนการเทรด:' : 'Trading Plan Execution:'}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'yes', labelTh: '✅ ทำตามแผน 100%', labelEn: '✅ 100% On Plan', color: 'emerald' },
              { id: 'partial', labelTh: '⚠️ หลุดแผนเล็กน้อย', labelEn: '⚠️ Minor Drift', color: 'amber' },
              { id: 'no', labelTh: '❌ แหกกฎ/หลุดวินัย', labelEn: '❌ Broke Rules', color: 'rose' },
            ].map((opt) => {
              const isSelected = followedRules === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFollowedRules(opt.id as any)}
                  className={`p-2.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? opt.color === 'emerald'
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : opt.color === 'amber'
                        ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'bg-rose-50 dark:bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {language === 'th' ? opt.labelTh : opt.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Mental Win */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Trophy size={14} className="text-emerald-500" />
              <span>{language === 'th' ? 'สิ่งที่ทำได้ดีทางจิตวิทยา (Mental Win):' : 'Psychological Win Today:'}</span>
            </span>
          </div>
          <input
            type="text"
            placeholder={
              language === 'th'
                ? 'เช่น: วันนี้อดทนรอจังหวะ ไม่เปิดไม้มั่ว, SL แล้วไม่เปิดแก้แค้น...'
                : 'e.g., Patiently waited for setup, didn’t revenge trade...'
            }
            value={mentalWin}
            onChange={(e) => setMentalWin(e.target.value)}
            className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {MENTAL_WIN_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMentalWin(s)}
                className="text-[10px] font-medium px-2 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-200 transition cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* 4. One Lesson */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Lightbulb size={14} className="text-amber-500" />
              <span>{language === 'th' ? 'บทเรียนสำคัญ 1 ข้อของวันนี้ (One Key Lesson):' : 'Key Lesson Learned:'}</span>
            </span>
          </div>
          <input
            type="text"
            placeholder={
              language === 'th'
                ? 'เช่น: ตลาดนิวยอร์กหลัง 22:00 น. เริ่มล้า คราวหลังควรหยุดพัก...'
                : 'e.g., Tired after 10PM, should stop trading earlier...'
            }
            value={oneLesson}
            onChange={(e) => setOneLesson(e.target.value)}
            className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {LESSON_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setOneLesson(s)}
                className="text-[10px] font-medium px-2 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200 transition cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white text-xs font-bold shadow-lg shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Sparkles size={15} />
            <span>
              {isSaving
                ? language === 'th' ? 'กำลังบันทึก...' : 'Saving...'
                : language === 'th' ? 'บันทึกการตกผลึกปิดวัน' : 'Save Daily De-brief'}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
