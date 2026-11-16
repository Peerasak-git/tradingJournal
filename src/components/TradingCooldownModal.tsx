'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COOLDOWN_PRESETS, CooldownPreset, PRESET_EMOTIONS } from '@/types/emotion';
import { startCooldownSession } from '@/lib/emotionStorage';
import { useLanguage } from '@/context/LanguageContext';
import {
  Timer,
  Clock,
  Flame,
  ShieldAlert,
  Sparkles,
  X,
  Heart,
  Coffee,
  Check,
  Zap,
} from 'lucide-react';

interface TradingCooldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmotions?: string[];
  onStarted?: () => void;
}

const COMMON_REASONS = [
  { id: 'tilt', labelTh: '😡 หัวร้อน / เสียทรง (Tilt)', labelEn: '😡 Full Tilt / Frustrated' },
  { id: 'revenge', labelTh: '⚔️ เทรดแก้แค้น (Revenge)', labelEn: '⚔️ Revenge Trading' },
  { id: 'fomo', labelTh: '🚀 FOMO / คันมืออยากกด', labelEn: '🚀 FOMO / Impatient' },
  { id: 'fatigued', labelTh: '🥱 ล้า / นอนน้อย / เบลอ', labelEn: '🥱 Fatigued / Sleepy' },
  { id: 'stressed', labelTh: '😣 เครียด / กดดัน', labelEn: '😣 Stressed / Pressured' },
  { id: 'overtrading', labelTh: '⚡ Overtrading หลายไม้เกินไป', labelEn: '⚡ Too Many Trades' },
  { id: 'disciplined_break', labelTh: '🛡️ พักตามแผนรักษาวินัย', labelEn: '🛡️ Rule-Based Break' },
];

export default function TradingCooldownModal({
  isOpen,
  onClose,
  defaultEmotions = [],
  onStarted,
}: TradingCooldownModalProps) {
  const { language } = useLanguage();

  const [mounted, setMounted] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('30m');
  const [customMinutes, setCustomMinutes] = useState<string>('45');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Find if any default emotion matches our common reasons
      const matched = COMMON_REASONS.find((r) => defaultEmotions.includes(r.id));
      if (matched) {
        setSelectedReason(language === 'th' ? matched.labelTh : matched.labelEn);
      } else if (defaultEmotions.length > 0) {
        const found = PRESET_EMOTIONS.find((e) => defaultEmotions.includes(e.id));
        if (found) {
          setSelectedReason(
            language === 'th'
              ? `พักจาก: ${found.labelTh}`
              : `Rest from: ${found.labelEn}`
          );
        } else {
          setSelectedReason(language === 'th' ? 'พักรีเซ็ตอารมณ์' : 'Psychological Reset');
        }
      } else {
        setSelectedReason(language === 'th' ? 'พักตามแผนรักษาวินัย' : 'Rule-Based Break');
      }
    }
  }, [isOpen, defaultEmotions, language]);

  if (!isOpen || !mounted) return null;

  const handleStart = () => {
    let minutes = 30;
    if (isCustom) {
      const parsed = parseInt(customMinutes, 10);
      minutes = isNaN(parsed) || parsed <= 0 ? 30 : Math.min(parsed, 720);
    } else {
      const preset = COOLDOWN_PRESETS.find((p) => p.id === selectedPresetId);
      minutes = preset ? preset.minutes : 30;
    }

    startCooldownSession(
      minutes,
      selectedReason || (language === 'th' ? 'พักรีเซ็ตจิตวิทยา' : 'Cool-down Reset'),
      defaultEmotions,
      note
    );

    if (onStarted) onStarted();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-6 text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-blue-500/15 dark:bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-rose-500/15 dark:bg-rose-500/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative flex items-start justify-between gap-4 border-b border-slate-100 dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
              <Timer size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">
                {language === 'th'
                  ? '🧘 ตั้งเวลาระบบพักใจ (Cool-down Timer)'
                  : '🧘 Psychological Trading Cool-down'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'th'
                  ? 'ตัดวงจรอารมณ์ ป้องกันการเสียทรง และรีเซ็ตจิตวิทยาให้พร้อมใหม่'
                  : 'Break the tilt cycle, protect capital, and reset your mindset'}
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

        {/* Duration Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-blue-500" />
              <span>{language === 'th' ? 'เลือกระยะเวลาพัก (Duration)' : 'Select Break Duration'}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsCustom(!isCustom)}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-semibold"
            >
              {isCustom
                ? language === 'th' ? '← เลือกจากตัวเลือกด่วน' : '← Choose Preset'
                : language === 'th' ? '+ กำหนดนาทีเอง' : '+ Custom Minutes'}
            </button>
          </div>

          {!isCustom ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {COOLDOWN_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`p-3 rounded-2xl text-left border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-md shadow-blue-500/20 scale-[1.02]'
                        : 'bg-slate-50/70 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="text-xl mb-1">{preset.icon}</div>
                    <div className="text-xs font-black truncate">
                      {language === 'th' ? preset.labelTh : preset.labelEn}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {language === 'th' ? preset.descTh : preset.descEn}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {language === 'th' ? 'ระบุจำนวนนาทีที่ต้องการพัก (นาที):' : 'Specify break minutes:'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="5"
                  max="720"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-32 bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500 font-medium">
                  {language === 'th' ? 'นาที (เช่น 45, 90, 180 นาที)' : 'minutes (e.g. 45, 90, 180)'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Reason / Trigger */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Flame size={14} className="text-rose-500" />
            <span>{language === 'th' ? 'สาเหตุ / อารมณ์ที่ทำให้ต้องพัก:' : 'Trigger / Reason:'}</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_REASONS.map((r) => {
              const label = language === 'th' ? r.labelTh : r.labelEn;
              const isSelected = selectedReason === label;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(label)}
                  className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-500/30'
                      : 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.08]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Rule reminder note */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/[0.08] via-blue-500/[0.05] to-transparent border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {language === 'th' ? 'จิตวิทยาการเทรด:' : 'Trading Psychology Rule:'}{' '}
            </span>
            {language === 'th'
              ? 'ตลาดเปิดทุกวัน แต่เงินทุนมีจำกัด การหยุดพักเมื่ออารมณ์ไม่นิ่งคือทักษะของเทรดเดอร์มืออาชีพ'
              : 'The market is open everyday. Pausing when tilted is what separates professionals from gamblers.'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
          >
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Timer size={15} />
            <span>{language === 'th' ? 'เริ่มนับถอยหลังพักเทรด' : 'Start Cool-down Timer'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
