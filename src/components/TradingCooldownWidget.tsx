'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CooldownSession } from '@/types/emotion';
import {
  getCooldownSession,
  extendCooldownSession,
  cancelCooldownSession,
  completeCooldownSessionAndReset,
  playZenChime,
} from '@/lib/emotionStorage';
import { useLanguage } from '@/context/LanguageContext';
import {
  Timer,
  Clock,
  Sparkles,
  RotateCcw,
  Plus,
  X,
  Volume2,
  Wind,
  ShieldCheck,
  CheckCircle2,
  Coffee,
  Heart,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface TradingCooldownWidgetProps {
  variant?: 'card' | 'banner' | 'compact';
  onCooldownEnded?: () => void;
  onRequestOpenModal?: () => void;
}

const PSYCHOLOGY_TIPS_TH = [
  '💧 ดื่มน้ำเปล่า 1 แก้ว ช่วยให้อุณหภูมิร่างกายและอัตราการเต้นของหัวใจลดลง',
  '🧘 กราฟวิ่งตลอด 24 ชั่วโมง แต่เงินทุนและสุขภาพจิตของคุณมีจำกัด',
  '🌲 พักสายตา มองออกไปนอกหน้าต่าง หรือมองต้นไม้สีเขียว 20 วินาที',
  '🛡️ การไม่เปิดออเดอร์ในวันที่อารมณ์ไม่นิ่ง คือการรักษาต้นทุนที่ดีที่สุด',
  '🎯 ตลาดไม่เคยรู้ว่าคุณเสียหรือได้ อย่าเทรดเพื่อแก้แค้น ให้เทรดตามระบบ',
  '☕ ลุกขึ้นยืดกล้ามเนื้อและผ่อนคลายกล้ามเนื้อคอ-บ่า-ไหล่',
];

const PSYCHOLOGY_TIPS_EN = [
  '💧 Drink a glass of water. It calms your heart rate and recharges focus.',
  '🧘 Charts move 24/7, but your capital and mental peace are finite.',
  '🌲 Rest your eyes. Look out the window at something green for 20 seconds.',
  '🛡️ Sitting on your hands during emotional tilt is the ultimate edge.',
  '🎯 The market doesn’t know you exist. Never revenge trade; stick to rules.',
  '☕ Stand up, stretch, and release shoulder/neck tension.',
];

function formatTimeRemaining(seconds: number): { hours: string; minutes: string; seconds: string; formatted: string } {
  if (seconds <= 0) {
    return { hours: '00', minutes: '00', seconds: '00', formatted: '00:00:00' };
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  return {
    hours: hh,
    minutes: mm,
    seconds: ss,
    formatted: h > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`,
  };
}

export default function TradingCooldownWidget({
  variant = 'card',
  onCooldownEnded,
  onRequestOpenModal,
}: TradingCooldownWidgetProps) {
  const { language } = useLanguage();
  const [session, setSession] = useState<CooldownSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [showBreathing, setShowBreathing] = useState<boolean>(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingSec, setBreathingSec] = useState<number>(4);
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const hasChimedRef = useRef<boolean>(false);

  // Sync session on mount and DOM events
  useEffect(() => {
    const sync = () => {
      const s = getCooldownSession();
      setSession(s);
      if (s && s.isActive) {
        const now = Date.now();
        const ends = new Date(s.endsAt).getTime();
        const rem = Math.max(0, Math.round((ends - now) / 1000));
        setRemainingSeconds(rem);
      } else {
        setRemainingSeconds(0);
      }
    };

    sync();

    const handleUpdate = (e: any) => {
      sync();
    };

    window.addEventListener('tradingCooldownStarted', handleUpdate);
    window.addEventListener('tradingCooldownUpdated', handleUpdate);
    window.addEventListener('tradingCooldownEnded', handleUpdate);

    return () => {
      window.removeEventListener('tradingCooldownStarted', handleUpdate);
      window.removeEventListener('tradingCooldownUpdated', handleUpdate);
      window.removeEventListener('tradingCooldownEnded', handleUpdate);
    };
  }, []);

  // Countdown timer tick every 1000ms
  useEffect(() => {
    if (!session || !session.isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const ends = new Date(session.endsAt).getTime();
      const diff = Math.max(0, Math.round((ends - now) / 1000));
      setRemainingSeconds(diff);

      if (diff === 0 && !hasChimedRef.current) {
        hasChimedRef.current = true;
        playZenChime();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Breathing pacer cycle (4s inhale -> 4s hold -> 4s exhale)
  useEffect(() => {
    if (!showBreathing) return;

    const interval = setInterval(() => {
      setBreathingSec((prev) => {
        if (prev <= 1) {
          setBreathingPhase((phase) => {
            if (phase === 'inhale') return 'hold';
            if (phase === 'hold') return 'exhale';
            return 'inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showBreathing]);

  // Rotate psychology tips periodically
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % PSYCHOLOGY_TIPS_TH.length);
    }, 15000);
    return () => clearInterval(tipInterval);
  }, []);

  const totalSeconds = useMemo(() => {
    if (!session) return 1;
    const start = new Date(session.startedAt).getTime();
    const end = new Date(session.endsAt).getTime();
    return Math.max(1, Math.round((end - start) / 1000));
  }, [session]);

  const elapsedPercent = useMemo(() => {
    if (totalSeconds <= 0) return 0;
    const elapsed = totalSeconds - remainingSeconds;
    return Math.min(100, Math.max(0, Math.round((elapsed / totalSeconds) * 100)));
  }, [totalSeconds, remainingSeconds]);

  const isCompleted = session && session.isActive && remainingSeconds === 0;

  const handleExtend = (mins: number) => {
    hasChimedRef.current = false;
    extendCooldownSession(mins);
  };

  const handleCancel = () => {
    cancelCooldownSession();
    if (onCooldownEnded) onCooldownEnded();
  };

  const handleResetAndComplete = async () => {
    setIsResetting(true);
    try {
      await completeCooldownSessionAndReset(
        ['calm', 'fresh', 'disciplined'],
        language === 'th'
          ? 'รีเซ็ตจิตวิทยาหลัง Cool-down สำเร็จ พร้อมเทรดตามวินัย'
          : 'Psychological Reset completed. Ready to trade with discipline.'
      );
      if (onCooldownEnded) onCooldownEnded();
    } catch (e) {
      console.error('Failed to complete reset:', e);
    } finally {
      setIsResetting(false);
    }
  };

  // If no session exists or inactive and not completed, render trigger button or null
  if (!session || (!session.isActive && !isCompleted)) {
    if (variant === 'compact') return null;
    return (
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/[0.06] via-indigo-500/[0.04] to-transparent border border-blue-500/20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Timer size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>{language === 'th' ? 'ระบบพักใจรีเซ็ตอารมณ์ (Cool-down Timer)' : 'Psychological Cool-down'}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300">
                Circuit Breaker
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {language === 'th'
                ? 'รู้สึกหัวร้อน ล้า หรือ FOMO? ตั้งเวลานับถอยหลังพักเทรดเพื่อรีเซ็ตจิตวิทยา'
                : 'Feeling tilted or fatigued? Take a timed break to reset your trading psychology.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRequestOpenModal}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Timer size={13} />
          <span>{language === 'th' ? 'ตั้งเวลาพัก' : 'Start Timer'}</span>
        </button>
      </div>
    );
  }

  const time = formatTimeRemaining(remainingSeconds);
  const endFormatted = new Date(session.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // -------------------------------------------------------------
  // Compact / Banner Variant (e.g. at top of Dashboard)
  // -------------------------------------------------------------
  if (variant === 'banner') {
    return (
      <div className={`w-full rounded-2xl border transition-all shadow-md backdrop-blur-md overflow-hidden ${
        isCompleted
          ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 shadow-emerald-500/15'
          : 'bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-purple-600/10 border-blue-500/35 text-slate-900 dark:text-white shadow-blue-500/15 animate-fade-in'
      }`}>
        <div className="p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isCompleted
                ? 'bg-emerald-500 text-white animate-bounce'
                : 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
            }`}>
              {isCompleted ? <Sparkles size={20} /> : <Timer size={20} className="animate-spin-slow" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black tracking-tight">
                  {isCompleted
                    ? language === 'th' ? '🎉 ครบกำหนดพักใจเรียบร้อย!' : '🎉 Cool-down Period Complete!'
                    : language === 'th' ? '⏳ กำลังอยู่ในช่วงพักเทรดรีเซ็ตอารมณ์' : '⏳ Trading Cool-down Active'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 dark:bg-slate-800/80 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {session.reason}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isCompleted
                  ? language === 'th'
                    ? 'สภาวะจิตวิทยาพร้อมกลับเข้าสู่สมาธิและวินัยการเทรดแล้ว'
                    : 'Your psychological state is rested. Ready to return with full discipline.'
                  : language === 'th'
                  ? `สิ้นสุดเวลาประมาณ ${endFormatted} น. (ผ่านไปแล้ว ${elapsedPercent}%)`
                  : `Ends at ${endFormatted} (${elapsedPercent}% completed)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
            {!isCompleted ? (
              <div className="flex items-center gap-2">
                {/* Live ticking digits */}
                <div className="flex items-center gap-1 font-mono text-base sm:text-lg font-black bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-xl shadow-xs text-blue-600 dark:text-blue-400">
                  <Clock size={15} className="text-blue-500 animate-pulse mr-0.5" />
                  <span>{time.formatted}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleExtend(15)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                  title="+15 นาที"
                >
                  +15m
                </button>

                <button
                  type="button"
                  onClick={handleResetAndComplete}
                  disabled={isResetting}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-500/25 transition cursor-pointer flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  <span>{language === 'th' ? 'รีเซ็ตพร้อมเทรด' : 'Reset Mindset'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResetAndComplete}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>
                  {language === 'th'
                    ? 'รีเซ็ตอารมณ์เป็นพร้อมเทรด 100%'
                    : 'Reset to 100% Optimal Mindset'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Full Card Variant (Within DailyEmotionalCheckinCard)
  // -------------------------------------------------------------
  return (
    <div className={`relative overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl backdrop-blur-md p-5 sm:p-6 space-y-5 ${
      isCompleted
        ? 'bg-gradient-to-br from-emerald-500/[0.12] via-teal-500/[0.06] to-white/90 dark:to-slate-900/90 border-emerald-500/50 shadow-emerald-500/20'
        : 'bg-gradient-to-br from-blue-500/[0.09] via-indigo-500/[0.05] to-white/90 dark:to-slate-900/90 border-blue-500/40 shadow-blue-500/20'
    }`}>
      {/* Ambient background blur */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

      {/* Top Header & Status */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg ${
            isCompleted
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30 animate-bounce'
              : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-blue-500/30'
          }`}>
            {isCompleted ? <Sparkles size={22} /> : <Timer size={22} className="animate-spin-slow" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                {isCompleted
                  ? language === 'th' ? '🎉 ครบกำหนดเวลาพักใจแล้ว!' : '🎉 Cool-down Completed!'
                  : language === 'th' ? '🧘 ระบบพักใจรีเซ็ตอารมณ์ (Cool-down Active)' : '🧘 Trading Cool-down Active'}
              </h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isCompleted
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 animate-pulse'
              }`}>
                {isCompleted ? 'COMPLETED' : 'TICKING'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>{language === 'th' ? 'สาเหตุ:' : 'Reason:'}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {session.reason}
              </span>
              <span>•</span>
              <span>{language === 'th' ? `สิ้นสุดเวลา ${endFormatted} น.` : `Ends at ${endFormatted}`}</span>
            </p>
          </div>
        </div>

        {/* Chime & Breathing Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBreathing(!showBreathing)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showBreathing
                ? 'bg-teal-500 text-white border-teal-600 shadow-sm shadow-teal-500/30'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-300'
            }`}
          >
            <Wind size={13} />
            <span>{language === 'th' ? 'ฝึกหายใจ 4-4-4' : '4-4-4 Breath'}</span>
          </button>

          <button
            type="button"
            onClick={playZenChime}
            title={language === 'th' ? 'ทดสอบเสียงกระดิ่งบำบัด' : 'Play Zen Chime'}
            className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-white/10 transition cursor-pointer"
          >
            <Volume2 size={15} />
          </button>
        </div>
      </div>

      {/* Interactive 4-4-4 Breathing Circle Widget */}
      {showBreathing && (
        <div className="relative p-5 rounded-2xl bg-gradient-to-b from-teal-500/[0.08] to-emerald-500/[0.04] border border-teal-500/30 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
          <div className="relative flex items-center justify-center w-28 h-28">
            <div
              className={`absolute inset-0 rounded-full transition-all duration-1000 ease-in-out ${
                breathingPhase === 'inhale'
                  ? 'scale-110 bg-teal-400/30 dark:bg-teal-400/40 blur-md'
                  : breathingPhase === 'hold'
                  ? 'scale-110 bg-indigo-400/30 dark:bg-indigo-400/40 blur-md'
                  : 'scale-75 bg-blue-400/20 dark:bg-blue-400/30 blur-md'
              }`}
            />
            <div
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center text-white font-black shadow-lg transition-all duration-1000 ${
                breathingPhase === 'inhale'
                  ? 'scale-105 bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/40'
                  : breathingPhase === 'hold'
                  ? 'scale-105 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40'
                  : 'scale-90 bg-gradient-to-br from-blue-500 to-cyan-600 shadow-blue-500/30'
              }`}
            >
              <span className="text-xl leading-none">{breathingSec}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-90 mt-0.5">วินาที</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-black text-slate-800 dark:text-white">
              {breathingPhase === 'inhale'
                ? language === 'th' ? '🌬️ สูดลมหายใจเข้าช้าๆ ลึกๆ' : '🌬️ Inhale deeply...'
                : breathingPhase === 'hold'
                ? language === 'th' ? '🧘 กลั้นหายใจ ผ่อนคลายกล้ามเนื้อ' : '🧘 Hold your breath & relax...'
                : language === 'th' ? '💨 ผ่อนลมหายใจออกทางปากช้าๆ' : '💨 Exhale slowly...'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'th'
                ? 'เทคนิค 4-4-4 ช่วยลด Cortisol (ฮอร์โมนความเครียด) และชะลอการเต้นของหัวใจ'
                : 'Box breathing reduces cortisol and resets your autonomic nervous system.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Countdown Display Grid */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
        {/* Left: Big Radial Progress & Digits */}
        <div className="flex items-center gap-5">
          {/* Circular SVG Progress Ring */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                strokeWidth="8"
                className="stroke-slate-200 dark:stroke-slate-800"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                strokeWidth="8"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * elapsedPercent) / 100}
                strokeLinecap="round"
                className={`transition-all duration-700 ${
                  isCompleted
                    ? 'stroke-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                    : 'stroke-blue-600 drop-shadow-[0_0_8px_rgba(37,99,235,0.6)]'
                }`}
                fill="transparent"
              />
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {isCompleted ? 'READY' : 'REMAINING'}
              </span>
              <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white leading-tight">
                {time.formatted}
              </span>
              <span className="text-[9px] font-bold text-slate-400">
                {elapsedPercent}% ผ่านไป
              </span>
            </div>
          </div>

          {/* Time digits & description */}
          <div className="space-y-1.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {language === 'th' ? 'เวลานับถอยหลังพักเทรด' : 'Cool-down Remaining'}
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>{time.hours !== '00' ? `${time.hours}:` : ''}</span>
              <span>{time.minutes}</span>
              <span className="text-blue-500 animate-pulse">:</span>
              <span>{time.seconds}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              {isCompleted
                ? language === 'th'
                  ? '✨ ครบเวลาแล้ว! กดปุ่ม "รีเซ็ตอารมณ์" เพื่อเริ่มบันทึกการเทรดใหม่อย่างสดใส'
                  : '✨ Time is up! Click Reset Mindset to refresh and resume trading.'
                : language === 'th'
                ? 'ปล่อยให้ใจสงบ ห้ามเปิดออเดอร์เด็ดขาดจนกว่าเวลาจะสิ้นสุด'
                : 'Allow yourself to cool off. Avoid placing any trades until the timer expires.'}
            </p>
          </div>
        </div>

        {/* Right: Quick actions & Time extenders */}
        <div className="flex flex-col sm:items-end gap-2.5 w-full md:w-auto">
          <div className="text-xs font-bold text-slate-500">
            {language === 'th' ? 'ปรับเวลาพัก (Quick Adjust):' : 'Adjust Duration:'}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleExtend(5)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:scale-105 transition cursor-pointer"
            >
              +5 นาที
            </button>
            <button
              type="button"
              onClick={() => handleExtend(15)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:scale-105 transition cursor-pointer"
            >
              +15 นาที
            </button>
            <button
              type="button"
              onClick={() => handleExtend(30)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:scale-105 transition cursor-pointer"
            >
              +30 นาที
            </button>
          </div>
        </div>
      </div>

      {/* Psychology Tip Pill */}
      <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <Coffee size={15} className="text-amber-500 shrink-0" />
          <span className="font-medium leading-relaxed">
            {language === 'th' ? PSYCHOLOGY_TIPS_TH[tipIndex] : PSYCHOLOGY_TIPS_EN[tipIndex]}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setTipIndex((prev) => (prev + 1) % PSYCHOLOGY_TIPS_TH.length)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition p-1 cursor-pointer shrink-0"
          title="คำแนะนำถัดไป"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Bottom Main Action Bar */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-white/[0.08] flex-wrap">
        <button
          type="button"
          onClick={handleCancel}
          className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition cursor-pointer flex items-center gap-1"
        >
          <X size={13} />
          <span>{language === 'th' ? 'ยกเลิกการพัก' : 'Cancel Cooldown'}</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetAndComplete}
            disabled={isResetting}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all shadow-lg cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-emerald-500/30'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/30'
            }`}
          >
            <Sparkles size={15} className={isResetting ? 'animate-spin' : ''} />
            <span>
              {isResetting
                ? language === 'th' ? 'กำลังรีเซ็ตอารมณ์...' : 'Resetting...'
                : isCompleted
                ? language === 'th' ? '✨ รีเซ็ตอารมณ์เป็นพร้อมเทรด 100%' : '✨ Reset to 100% Optimal'
                : language === 'th' ? '✨ จบการพัก & รีเซ็ตอารมณ์ตอนนี้' : '✨ Finish & Reset Mindset'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
