'use client';

import React, { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { DailyEmotionalCheckin, PRESET_MISTAKES } from '@/types/emotion';
import { useLanguage } from '@/context/LanguageContext';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  DollarSign,
  PieChart,
  BarChart3,
  Target,
} from 'lucide-react';

interface MindsetCorrelationWidgetProps {
  trades: Trade[];
  checkins?: DailyEmotionalCheckin[];
}

export default function MindsetCorrelationWidget({
  trades = [],
  checkins = [],
}: MindsetCorrelationWidgetProps) {
  const { language } = useLanguage();

  // 1. Correlate trades with Emotional Readiness State (OPTIMAL vs NORMAL vs WARNING)
  const emotionalCorrelation = useMemo(() => {
    const closed = trades.filter((t) => t.status === 'WIN' || t.status === 'LOSS' || t.status === 'BREAK_EVEN');

    const checkinMap = new Map<string, DailyEmotionalCheckin>();
    checkins.forEach((c) => checkinMap.set(c.date, c));

    const stats = {
      OPTIMAL: { trades: 0, wins: 0, losses: 0, netPnL: 0, grossWins: 0, grossLosses: 0 },
      NORMAL: { trades: 0, wins: 0, losses: 0, netPnL: 0, grossWins: 0, grossLosses: 0 },
      WARNING: { trades: 0, wins: 0, losses: 0, netPnL: 0, grossWins: 0, grossLosses: 0 },
    };

    closed.forEach((t) => {
      let state: 'OPTIMAL' | 'NORMAL' | 'WARNING' = 'NORMAL';

      if (t.emotionalStateAtEntry) {
        state = t.emotionalStateAtEntry;
      } else {
        const dateKey = t.entryDate ? t.entryDate.slice(0, 10) : '';
        const dayCheckin = checkinMap.get(dateKey);
        if (dayCheckin) {
          state = dayCheckin.status;
        }
      }

      const pnl = t.financials?.netPnL || 0;
      stats[state].trades += 1;
      stats[state].netPnL += pnl;

      if (t.status === 'WIN') {
        stats[state].wins += 1;
        stats[state].grossWins += pnl;
      } else if (t.status === 'LOSS') {
        stats[state].losses += 1;
        stats[state].grossLosses += Math.abs(pnl);
      }
    });

    const calculateMetrics = (group: { trades: number; wins: number; losses: number; netPnL: number; grossWins: number; grossLosses: number }) => {
      const winRate = group.trades > 0 ? (group.wins / group.trades) * 100 : 0;
      const profitFactor = group.grossLosses > 0 ? group.grossWins / group.grossLosses : group.grossWins > 0 ? 99 : 0;
      return { ...group, winRate, profitFactor };
    };

    return {
      OPTIMAL: calculateMetrics(stats.OPTIMAL),
      NORMAL: calculateMetrics(stats.NORMAL),
      WARNING: calculateMetrics(stats.WARNING),
    };
  }, [trades, checkins]);

  // 2. Pre-Trade Checklist Correlation (Passed 4/4 vs Incomplete)
  const checklistCorrelation = useMemo(() => {
    const closed = trades.filter((t) => t.status === 'WIN' || t.status === 'LOSS');

    let fullPass = { trades: 0, wins: 0, netPnL: 0 };
    let partial = { trades: 0, wins: 0, netPnL: 0 };

    closed.forEach((t) => {
      const pnl = t.financials?.netPnL || 0;
      const cl = t.notes?.checklist;
      const isFull = cl && cl.validSetup && cl.properRisk && cl.acceptedSL && cl.calmMindset;

      if (isFull) {
        fullPass.trades += 1;
        fullPass.netPnL += pnl;
        if (t.status === 'WIN') fullPass.wins += 1;
      } else {
        partial.trades += 1;
        partial.netPnL += pnl;
        if (t.status === 'WIN') partial.wins += 1;
      }
    });

    return {
      fullPass: {
        ...fullPass,
        winRate: fullPass.trades > 0 ? (fullPass.wins / fullPass.trades) * 100 : 0,
      },
      partial: {
        ...partial,
        winRate: partial.trades > 0 ? (partial.wins / partial.trades) * 100 : 0,
      },
    };
  }, [trades]);

  // 3. Cognitive Biases & Mistakes Aggregation
  const mistakesAnalytics = useMemo(() => {
    const counts: Record<string, { count: number; cost: number }> = {};
    let totalCost = 0;

    trades.forEach((t) => {
      const mistakes = t.notes?.mistakes;
      const cost = t.notes?.mistakeCost || 0;
      totalCost += cost;

      if (Array.isArray(mistakes)) {
        mistakes.forEach((m) => {
          if (!counts[m]) counts[m] = { count: 0, cost: 0 };
          counts[m].count += 1;
          counts[m].cost += cost / mistakes.length; // distribute cost
        });
      }
    });

    const list = Object.entries(counts)
      .map(([id, data]) => {
        const found = PRESET_MISTAKES.find((p) => p.id === id);
        return {
          id,
          labelTh: found?.labelTh || id,
          labelEn: found?.labelEn || id,
          descTh: found?.descTh || '',
          count: data.count,
          cost: data.cost,
        };
      })
      .sort((a, b) => b.count - a.count);

    return { list, totalCost };
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* 1. Emotional Mindset Zone vs P&L Performance Grid */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                {language === 'th'
                  ? '📊 วิเคราะห์ความสัมพันธ์: อารมณ์ vs กำไรขาดทุน (Mindset P&L Correlation)'
                  : '📊 Mindset vs P&L Correlation Matrix'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'th'
                  ? 'เปรียบเทียบผลงานจริงของพอร์ตเมื่อเทรดในแต่ละสภาวะจิตวิทยา'
                  : 'Real portfolio performance segmented by emotional readiness state'}
              </p>
            </div>
          </div>
        </div>

        {/* 3 Zone Cards: Optimal vs Normal vs Warning */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* OPTIMAL ZONE */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.04] to-transparent border border-emerald-500/30 relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-500" />
                <span>🟢 OPTIMAL ZONE (70-100 pts)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                {emotionalCorrelation.OPTIMAL.trades} ไม้
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Win Rate:</span>
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {emotionalCorrelation.OPTIMAL.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1 border-t border-emerald-500/15">
                <span className="text-xs text-slate-500">กำไรสุทธิ (Net P&L):</span>
                <span className={`text-base font-black font-mono ${
                  emotionalCorrelation.OPTIMAL.netPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}>
                  {emotionalCorrelation.OPTIMAL.netPnL >= 0 ? '+' : ''}${emotionalCorrelation.OPTIMAL.netPnL.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-slate-500">
                <span>Profit Factor:</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                  {emotionalCorrelation.OPTIMAL.profitFactor.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* NORMAL ZONE */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/[0.08] via-yellow-500/[0.03] to-transparent border border-amber-500/30 relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-amber-500" />
                <span>🟡 NORMAL ZONE (50-69 pts)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200">
                {emotionalCorrelation.NORMAL.trades} ไม้
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Win Rate:</span>
                <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {emotionalCorrelation.NORMAL.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1 border-t border-amber-500/15">
                <span className="text-xs text-slate-500">กำไรสุทธิ (Net P&L):</span>
                <span className={`text-base font-black font-mono ${
                  emotionalCorrelation.NORMAL.netPnL >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'
                }`}>
                  {emotionalCorrelation.NORMAL.netPnL >= 0 ? '+' : ''}${emotionalCorrelation.NORMAL.netPnL.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-slate-500">
                <span>Profit Factor:</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                  {emotionalCorrelation.NORMAL.profitFactor.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* WARNING ZONE */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/[0.09] via-red-500/[0.04] to-transparent border border-rose-500/35 relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-500" />
                <span>🔴 WARNING ZONE (&lt;50 pts)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-200">
                {emotionalCorrelation.WARNING.trades} ไม้
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Win Rate:</span>
                <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
                  {emotionalCorrelation.WARNING.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1 border-t border-rose-500/15">
                <span className="text-xs text-slate-500">กำไรสุทธิ (Net P&L):</span>
                <span className={`text-base font-black font-mono ${
                  emotionalCorrelation.WARNING.netPnL >= 0 ? 'text-emerald-600' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {emotionalCorrelation.WARNING.netPnL >= 0 ? '+' : ''}${emotionalCorrelation.WARNING.netPnL.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-xs text-slate-500">
                <span>Profit Factor:</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                  {emotionalCorrelation.WARNING.profitFactor.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Psychological Takeaway */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.05] flex items-start gap-3 text-xs leading-relaxed">
          <Target size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-slate-700 dark:text-slate-300">
            <span className="font-bold">
              {language === 'th' ? 'บทสรุปทางจิตวิทยา:' : 'Psychological Takeaway:'}{' '}
            </span>
            {language === 'th' ? (
              <span>
                เมื่อคุณเทรดใน <strong>Optimal Zone</strong> พอร์ตทำ Win Rate ได้ถึง{' '}
                <strong className="text-emerald-600">{emotionalCorrelation.OPTIMAL.winRate.toFixed(1)}%</strong>{' '}
                ในขณะที่ช่วง <strong>Warning Zone</strong> สถิติยืนยันว่าการเทรดมักสูญเสียเงิน{' '}
                <strong className="text-rose-600">(${emotionalCorrelation.WARNING.netPnL.toFixed(2)})</strong>{' '}
                การใช้ <strong>ระบบพักใจ (Cool-down)</strong> จึงเป็นการรักษาต้นทุนที่มีค่าที่สุด
              </span>
            ) : (
              <span>
                Trading in the Optimal Zone delivers higher win rate ({emotionalCorrelation.OPTIMAL.winRate.toFixed(1)}%).
                Stepping away when in Warning Zone directly preserves your trading capital.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Pre-Trade Checklist Edge & Cognitive Biases / Mistakes Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pre-Trade Checklist Impact */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {language === 'th' ? 'ประสิทธิภาพเกราะคัดกรอง 4 ข้อ (Checklist Edge)' : 'Pre-Trade Checklist Impact'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {language === 'th' ? 'เปรียบเทียบไม้ที่ผ่านเกณฑ์ครบ 4/4 กับไม้ที่เช็คไม่ครบ' : 'Full checklist pass vs unverified entries'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/40 space-y-1.5">
              <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>ผ่านครบ 4/4 ข้อ</span>
              </div>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {checklistCorrelation.fullPass.winRate.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500">
                {checklistCorrelation.fullPass.trades} ไม้ • {checklistCorrelation.fullPass.netPnL >= 0 ? '+' : ''}${checklistCorrelation.fullPass.netPnL.toFixed(1)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-1.5">
              <div className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <HelpCircle size={13} />
                <span>ไม่ครบ 4 ข้อ</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-700 dark:text-slate-300">
                {checklistCorrelation.partial.winRate.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500">
                {checklistCorrelation.partial.trades} ไม้ • {checklistCorrelation.partial.netPnL >= 0 ? '+' : ''}${checklistCorrelation.partial.netPnL.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Cognitive Biases & Mistake Cost Tracker */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Flame size={18} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {language === 'th' ? 'ดัชนีกับดักอารมณ์ (Cost of Mistakes)' : 'Cognitive Mistakes & Biases'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {language === 'th' ? 'ความเสียหายสะสมที่เกิดจากพฤติกรรมหลุดวินัย' : 'Financial cost caused by emotional errors'}
                </p>
              </div>
            </div>

            {mistakesAnalytics.totalCost > 0 && (
              <span className="text-xs font-black font-mono px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30">
                -${mistakesAnalytics.totalCost.toFixed(0)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {mistakesAnalytics.list.length > 0 ? (
              mistakesAnalytics.list.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[220px]">
                    {language === 'th' ? item.labelTh : item.labelEn}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-slate-400">{item.count} ครั้ง</span>
                    {item.cost > 0 && (
                      <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                        -${item.cost.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-5 text-center text-xs text-slate-400 italic">
                {language === 'th'
                  ? 'ยังไม่มีการบันทึกกับดักอารมณ์ในไม้เทรด (ยอดเยี่ยมมาก รักษามาตรฐานนี้ไว้!)'
                  : 'No cognitive bias tags recorded yet. Keep up the high discipline!'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
