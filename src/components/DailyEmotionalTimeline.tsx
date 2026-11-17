'use client';

import React, { useMemo } from 'react';
import { EmotionLogEntry, PRESET_EMOTIONS, EmotionTimePeriod, DailyDebrief } from '@/types/emotion';
import { PERIOD_METADATA } from '@/lib/emotionStorage';
import { useLanguage } from '@/context/LanguageContext';
import {
  Clock,
  Sparkles,
  ShieldAlert,
  Trash2,
  TrendingUp,
  TrendingDown,
  History,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ArrowRight,
  Flame,
  Timer,
  ChevronRight,
  Trophy,
  Star,
  Lightbulb,
} from 'lucide-react';

interface DailyEmotionalTimelineProps {
  logs: EmotionLogEntry[];
  debrief?: DailyDebrief;
  onSelectLog?: (log: EmotionLogEntry) => void;
  onDeleteLog?: (logId: string) => void;
  onOpenCooldown?: () => void;
  onOpenDebrief?: () => void;
}

export default function DailyEmotionalTimeline({
  logs = [],
  debrief,
  onSelectLog,
  onDeleteLog,
  onOpenCooldown,
  onOpenDebrief,
}: DailyEmotionalTimelineProps) {
  const { language } = useLanguage();

  // Sort chronologically (oldest first for timeline progression)
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [logs]);

  // Analytics: Calculate emotional drift across sessions
  const analytics = useMemo(() => {
    if (sortedLogs.length < 2) return null;

    const first = sortedLogs[0];
    const last = sortedLogs[sortedLogs.length - 1];
    const scoreDiff = last.totalScore - first.totalScore;

    // Highest & lowest score periods
    let highest = sortedLogs[0];
    let lowest = sortedLogs[0];
    sortedLogs.forEach((l) => {
      if (l.totalScore > highest.totalScore) highest = l;
      if (l.totalScore < lowest.totalScore) lowest = l;
    });

    const hasWarning = sortedLogs.some((l) => l.status === 'WARNING');

    return {
      scoreDiff,
      first,
      last,
      highest,
      lowest,
      hasWarning,
      isImproving: scoreDiff > 0,
      isDeclining: scoreDiff < 0,
    };
  }, [sortedLogs]);

  const getPeriodIcon = (period: EmotionTimePeriod) => {
    switch (period) {
      case 'morning':
        return <Sunrise size={15} className="text-amber-500" />;
      case 'afternoon':
        return <Sun size={15} className="text-orange-500" />;
      case 'evening':
        return <Sunset size={15} className="text-purple-500" />;
      case 'night':
        return <Moon size={15} className="text-indigo-400" />;
    }
  };

  if (logs.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 text-center space-y-2.5">
        <div className="w-10 h-10 mx-auto rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <History size={20} />
        </div>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {language === 'th' ? 'ยังไม่มีประวัติบันทึกอารมณ์ของวันนี้' : 'No Emotional Logs Recorded Today'}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          {language === 'th'
            ? 'เลือกอารมณ์แล้วกดปุ่ม "บันทึกผลประเมิน" เพื่อเก็บ Log ในแต่ละช่วงเวลา (เช้า / บ่าย / เย็น) สำหรับนำมาวิเคราะห์เปรียบเทียบสภาวะจิตวิทยา'
            : 'Select emotions and click Save to log your mindset across morning, afternoon, and evening sessions.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {/* Analytics Summary Banner if 2+ logs exist */}
      {analytics && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/[0.08] via-indigo-500/[0.05] to-purple-500/[0.05] border border-blue-500/20 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                <History size={14} />
              </span>
              <span>
                {language === 'th'
                  ? '📊 วิเคราะห์การเปลี่ยนแปลงทางอารมณ์ตลอดวัน (Daily Mindset Drift)'
                  : '📊 Daily Mindset Drift Analytics'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-extrabold">
              {analytics.scoreDiff > 0 ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  <TrendingUp size={13} />
                  <span>+{analytics.scoreDiff} pts (อารมณ์นิ่งขึ้น)</span>
                </span>
              ) : analytics.scoreDiff < 0 ? (
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-500/20">
                  <TrendingDown size={13} />
                  <span>{analytics.scoreDiff} pts (ความเสี่ยงเพิ่มขึ้น)</span>
                </span>
              ) : (
                <span className="text-slate-500 bg-slate-100 dark:bg-white/[0.06] px-2.5 py-1 rounded-full">
                  เสถียรคงที่ (0 pts)
                </span>
              )}
            </div>
          </div>

          {/* Quick comparison pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-500 font-medium">
                {language === 'th' ? '🎯 ช่วงที่มีสมาธิ & วินัยดีที่สุด:' : 'Best Focus Session:'}
              </span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                {analytics.highest.periodLabelTh} ({analytics.highest.totalScore} pts)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-500 font-medium">
                {language === 'th' ? '⚠️ ช่วงที่จิตใจเสี่ยงสุด:' : 'Highest Risk Session:'}
              </span>
              <span className={`font-black ${analytics.lowest.status === 'WARNING' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {analytics.lowest.periodLabelTh} ({analytics.lowest.totalScore} pts)
              </span>
            </div>
          </div>

          {/* Cooldown prompt if tilted in later session */}
          {analytics.last.status === 'WARNING' && onOpenCooldown && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold">
                <ShieldAlert size={16} className="text-rose-500 shrink-0" />
                <span>
                  {language === 'th'
                    ? `พบสภาวะอารมณ์เสี่ยงในช่วง ${analytics.last.periodLabelTh} (${analytics.last.time} น.) แนะนำให้พักเทรด`
                    : `High emotional risk detected in ${analytics.last.periodLabelEn}. Take a break.`}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenCooldown}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Timer size={12} />
                <span>{language === 'th' ? 'พักใจ Cool-down' : 'Cool-down'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chronological Timeline Cards */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-indigo-500 before:to-purple-500">
        {sortedLogs.map((log, index) => {
          const isLatest = index === sortedLogs.length - 1;
          const meta = PERIOD_METADATA[log.period];
          const emotions = log.selectedEmotionIds
            .map((id) => PRESET_EMOTIONS.find((e) => e.id === id))
            .filter(Boolean);

          return (
            <div
              key={log.id}
              className={`relative group p-4 rounded-2xl border transition-all duration-200 ${
                isLatest
                  ? 'bg-white/95 dark:bg-slate-900/95 border-blue-500/40 shadow-md shadow-blue-500/10'
                  : 'bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300'
              }`}
            >
              {/* Timeline Node Point */}
              <div
                className={`absolute -left-[27px] sm:-left-[35px] top-5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center ${
                  log.status === 'OPTIMAL'
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                    : log.status === 'WARNING'
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50 animate-pulse'
                    : 'bg-amber-500 shadow-sm shadow-amber-500/50'
                }`}
              />

              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    {getPeriodIcon(log.period)}
                    <span>{log.periodLabelTh || meta.labelTh}</span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Clock size={11} />
                    <span>{log.time} น.</span>
                  </span>

                  {isLatest && (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                      CURRENT
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Readiness badge */}
                  <div className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${
                    log.status === 'OPTIMAL'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : log.status === 'WARNING'
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  }`}>
                    <span>{log.totalScore} PTS</span>
                    <span className="text-[10px] opacity-80">
                      ({log.netScore >= 0 ? `+${log.netScore}` : log.netScore})
                    </span>
                  </div>

                  {/* Actions */}
                  {onDeleteLog && (
                    <button
                      type="button"
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer"
                      title={language === 'th' ? 'ลบรายการนี้' : 'Delete log'}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Emotions Selected Chips */}
              <div className="pt-2.5 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {emotions.map((e) => {
                    if (!e) return null;
                    return (
                      <span
                        key={e.id}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border flex items-center gap-1 shadow-2xs ${
                          e.category === 'positive'
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                            : e.category === 'negative'
                            ? 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                            : 'bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40'
                        }`}
                      >
                        <span>{e.emoji}</span>
                        <span>{language === 'th' ? e.labelTh.split(' / ')[0] : e.labelEn}</span>
                      </span>
                    );
                  })}
                  {emotions.length === 0 && (
                    <span className="text-xs text-slate-400 italic">
                      {language === 'th' ? 'ไม่ได้ระบุอารมณ์' : 'No specific emotions selected'}
                    </span>
                  )}
                </div>

                {/* Log Note / Affirmation */}
                {log.note && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] text-xs text-slate-700 dark:text-slate-300 italic">
                    &ldquo;{log.note}&rdquo;
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* End of Day Debrief Reflective Node */}
        {debrief && (
          <div className="relative group p-4 rounded-2xl border bg-gradient-to-br from-purple-500/[0.08] via-indigo-500/[0.05] to-white/90 dark:to-slate-900/90 border-purple-500/40 shadow-md shadow-purple-500/10 space-y-3">
            <div className="absolute -left-[27px] sm:-left-[35px] top-5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 bg-purple-500 shadow-sm shadow-purple-500/50 flex items-center justify-center" />

            <div className="flex items-center justify-between gap-2 border-b border-purple-100 dark:border-white/[0.06] pb-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-black text-purple-900 dark:text-purple-200">
                <Trophy size={14} className="text-purple-500" />
                <span>{language === 'th' ? '🪞 บันทึกตกผลึกปิดวัน (Daily De-brief)' : '🪞 Daily Post-Market De-brief'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                  วินัย {debrief.disciplineScore}/10 ⭐
                </span>
                {onOpenDebrief && (
                  <button
                    type="button"
                    onClick={onOpenDebrief}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    {language === 'th' ? 'แก้ไข' : 'Edit'}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {debrief.mentalWin && (
                <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
                    {language === 'th' ? '🏆 ชัยชนะทางจิตวิทยา' : '🏆 Mental Win'}
                  </div>
                  <div className="text-slate-800 dark:text-slate-200">{debrief.mentalWin}</div>
                </div>
              )}
              {debrief.oneLesson && (
                <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">
                    {language === 'th' ? '💡 บทเรียนสำคัญ' : '💡 Key Lesson'}
                  </div>
                  <div className="text-slate-800 dark:text-slate-200">{debrief.oneLesson}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
