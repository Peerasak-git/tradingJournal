'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { useLanguage } from '@/context/LanguageContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TradingCalendarProps {
  trades: Trade[];
}

interface DayData {
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  trades: Trade[];
  closedTrades: Trade[];
  wins: number;
  losses: number;
  netPnL: number;
  winRate: number;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const THAI_DAYS_SHORT = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
const EN_DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateKey(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    return typeof dateInput === 'string' ? dateInput.slice(0, 10) : '';
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function TradingCalendar({ trades }: TradingCalendarProps) {
  const { t, language } = useLanguage();

  const now = new Date();
  const todayStr = toDateKey(now);

  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [hasInitializedMonth, setHasInitializedMonth] = useState(false);

  // Automatically jump to the latest month with trades if current month has no trades on initial load
  useEffect(() => {
    if (!hasInitializedMonth && trades.length > 0) {
      const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const hasTradesInCurrentMonth = trades.some(tr => toDateKey(tr.entryDate).startsWith(currentMonthPrefix));

      if (!hasTradesInCurrentMonth) {
        const sorted = [...trades].sort(
          (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
        );
        const latestDate = new Date(sorted[0].entryDate);
        if (!isNaN(latestDate.getTime())) {
          setCurrentYear(latestDate.getFullYear());
          setCurrentMonth(latestDate.getMonth());
          setSelectedDate(toDateKey(latestDate));
        }
      } else {
        // Select latest traded day in current month
        const currentMonthTrades = trades
          .filter(tr => toDateKey(tr.entryDate).startsWith(currentMonthPrefix))
          .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
        if (currentMonthTrades.length > 0) {
          setSelectedDate(toDateKey(currentMonthTrades[0].entryDate));
        }
      }
      setHasInitializedMonth(true);
    }
  }, [trades, hasInitializedMonth]);

  // Group trades by YYYY-MM-DD
  const tradesByDate = useMemo(() => {
    const map = new Map<string, Trade[]>();
    trades.forEach(tr => {
      const key = toDateKey(tr.entryDate);
      if (!key) return;
      const list = map.get(key) || [];
      list.push(tr);
      map.set(key, list);
    });
    return map;
  }, [trades]);

  // Build calendar grid for currentYear & currentMonth (Monday-first, 6 weeks max)
  const calendarWeeks = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    // Monday = 0 ... Sunday = 6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: DayData[] = [];

    // Previous month padding days
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const d = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = toDateKey(d);
      const dayTrades = tradesByDate.get(dateStr) || [];
      const closed = dayTrades.filter(tr => tr.status !== 'OPEN');
      const wins = closed.filter(tr => tr.status === 'WIN').length;
      const losses = closed.filter(tr => tr.status === 'LOSS').length;
      const netPnL = dayTrades.reduce((acc, tr) => acc + (tr.financials.netPnL || 0), 0);

      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        trades: dayTrades,
        closedTrades: closed,
        wins,
        losses,
        netPnL,
        winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum);
      const dateStr = toDateKey(d);
      const dayTrades = tradesByDate.get(dateStr) || [];
      const closed = dayTrades.filter(tr => tr.status !== 'OPEN');
      const wins = closed.filter(tr => tr.status === 'WIN').length;
      const losses = closed.filter(tr => tr.status === 'LOSS').length;
      const netPnL = dayTrades.reduce((acc, tr) => acc + (tr.financials.netPnL || 0), 0);

      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: true,
        trades: dayTrades,
        closedTrades: closed,
        wins,
        losses,
        netPnL,
        winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
      });
    }

    // Next month padding days to complete 7-day rows
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(currentYear, currentMonth + 1, dayNum);
      const dateStr = toDateKey(d);
      const dayTrades = tradesByDate.get(dateStr) || [];
      const closed = dayTrades.filter(tr => tr.status !== 'OPEN');
      const wins = closed.filter(tr => tr.status === 'WIN').length;
      const losses = closed.filter(tr => tr.status === 'LOSS').length;
      const netPnL = dayTrades.reduce((acc, tr) => acc + (tr.financials.netPnL || 0), 0);

      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        trades: dayTrades,
        closedTrades: closed,
        wins,
        losses,
        netPnL,
        winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
      });
    }

    // Chunk into weeks of 7 days
    const weeks: { days: DayData[]; weekPnL: number; weekTrades: number; weekWins: number; weekLosses: number }[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      const slice = cells.slice(i, i + 7);
      const currentMonthDays = slice.filter(c => c.isCurrentMonth);
      const weekPnL = currentMonthDays.reduce((acc, c) => acc + c.netPnL, 0);
      const weekTrades = currentMonthDays.reduce((acc, c) => acc + c.trades.length, 0);
      const weekWins = currentMonthDays.reduce((acc, c) => acc + c.wins, 0);
      const weekLosses = currentMonthDays.reduce((acc, c) => acc + c.losses, 0);
      weeks.push({ days: slice, weekPnL, weekTrades, weekWins, weekLosses });
    }

    return weeks;
  }, [currentYear, currentMonth, tradesByDate]);

  // Monthly aggregated statistics
  const monthlyStats = useMemo(() => {
    const monthCells = calendarWeeks.flatMap(w => w.days).filter(d => d.isCurrentMonth);
    const activeDays = monthCells.filter(d => d.trades.length > 0);
    const winDays = activeDays.filter(d => d.netPnL > 0);
    const lossDays = activeDays.filter(d => d.netPnL < 0);

    const totalMonthlyPnL = activeDays.reduce((acc, d) => acc + d.netPnL, 0);
    const totalMonthlyTrades = activeDays.reduce((acc, d) => acc + d.trades.length, 0);
    const totalWins = activeDays.reduce((acc, d) => acc + d.wins, 0);
    const totalLosses = activeDays.reduce((acc, d) => acc + d.losses, 0);
    const totalClosed = activeDays.reduce((acc, d) => acc + d.closedTrades.length, 0);

    const dayWinRate = activeDays.length > 0 ? (winDays.length / activeDays.length) * 100 : 0;
    const tradeWinRate = totalClosed > 0 ? (totalWins / totalClosed) * 100 : 0;

    let bestDay: DayData | null = null;
    let worstDay: DayData | null = null;

    activeDays.forEach(d => {
      if (!bestDay || d.netPnL > bestDay.netPnL) bestDay = d;
      if (!worstDay || d.netPnL < worstDay.netPnL) worstDay = d;
    });

    return {
      totalMonthlyPnL,
      totalMonthlyTrades,
      totalWins,
      totalLosses,
      tradingDays: activeDays.length,
      winDays: winDays.length,
      lossDays: lossDays.length,
      dayWinRate,
      tradeWinRate,
      bestDay: bestDay as DayData | null,
      worstDay: worstDay as DayData | null,
    };
  }, [calendarWeeks]);

  // Selected day data
  const selectedDayData = useMemo(() => {
    const dayTrades = tradesByDate.get(selectedDate) || [];
    const closed = dayTrades.filter(tr => tr.status !== 'OPEN');
    const wins = closed.filter(tr => tr.status === 'WIN').length;
    const losses = closed.filter(tr => tr.status === 'LOSS').length;
    const netPnL = dayTrades.reduce((acc, tr) => acc + (tr.financials.netPnL || 0), 0);
    const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

    return {
      dateStr: selectedDate,
      trades: dayTrades,
      wins,
      losses,
      netPnL,
      winRate,
    };
  }, [selectedDate, tradesByDate]);

  const handlePrevMonth = () => {
    let newY = currentYear;
    let newM = currentMonth - 1;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    }
    setCurrentYear(newY);
    setCurrentMonth(newM);
    selectFirstActiveOrFirstDay(newY, newM);
  };

  const handleNextMonth = () => {
    let newY = currentYear;
    let newM = currentMonth + 1;
    if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    setCurrentYear(newY);
    setCurrentMonth(newM);
    selectFirstActiveOrFirstDay(newY, newM);
  };

  const selectFirstActiveOrFirstDay = (year: number, month: number) => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const matching = trades
      .filter(tr => toDateKey(tr.entryDate).startsWith(prefix))
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
    if (matching.length > 0) {
      setSelectedDate(toDateKey(matching[0].entryDate));
    } else {
      setSelectedDate(`${prefix}-01`);
    }
  };

  const handleJumpToday = () => {
    const d = new Date();
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setSelectedDate(toDateKey(d));
  };

  const handleJumpLatestTrade = () => {
    if (trades.length === 0) return;
    const sorted = [...trades].sort(
      (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
    );
    const d = new Date(sorted[0].entryDate);
    if (!isNaN(d.getTime())) {
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
      setSelectedDate(toDateKey(d));
    }
  };

  const monthLabel = language === 'th'
    ? `${THAI_MONTHS[currentMonth]} ${currentYear}`
    : `${EN_MONTHS[currentMonth]} ${currentYear}`;

  const daysHeader = language === 'th' ? THAI_DAYS_SHORT : EN_DAYS_SHORT;

  const formatSelectedDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <section className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-2xl overflow-hidden mb-6 shadow-sm">
      {/* ---------------- Top Header & Month Switcher ---------------- */}
      <div className="p-5 md:p-6 border-b border-slate-100 dark:border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-500/20">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {t('tradingCalendar') || 'ปฏิทินสรุปผลการเทรดรายเดือน & รายวัน'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('tradingCalendarSubtitle') || 'ภาพรวมกำไร/ขาดทุนทั้งเดือน และเจาะลึกรายการเทรดในแต่ละวัน'}
            </p>
          </div>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {trades.length > 0 && (
            <button
              onClick={handleJumpLatestTrade}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/70 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition cursor-pointer"
            >
              {language === 'th' ? 'เดือนที่เทรดล่าสุด' : 'Latest Trade Month'}
            </button>
          )}
          <button
            onClick={handleJumpToday}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition cursor-pointer"
          >
            {t('todayLabel') || 'วันนี้'}
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-white/[0.05] rounded-xl p-1 border border-slate-200/80 dark:border-white/[0.07]">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3.5 text-xs md:text-sm font-black text-slate-900 dark:text-white min-w-[140px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- Monthly Summary Strip (สรุปทั้งเดือน) ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-slate-100 dark:bg-white/[0.04] border-b border-slate-100 dark:border-white/[0.05]">
        {/* 1. Monthly Net P&L */}
        <div className="bg-white dark:bg-[#1a1a1a] p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('monthlyPnL') || 'กำไร/ขาดทุนสุทธิเดือนนี้'}
          </span>
          <div className={`text-xl md:text-2xl font-black font-mono mt-1 ${
            monthlyStats.totalMonthlyPnL > 0
              ? 'text-win-600 dark:text-win-400'
              : monthlyStats.totalMonthlyPnL < 0
              ? 'text-loss-600 dark:text-loss-400'
              : 'text-slate-900 dark:text-white'
          }`}>
            {monthlyStats.totalMonthlyPnL >= 0 ? '+' : ''}${monthlyStats.totalMonthlyPnL.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {monthlyStats.totalMonthlyTrades} {language === 'th' ? 'ไม้ในเดือนนี้' : 'trades this month'} ({monthlyStats.totalWins}W / {monthlyStats.totalLosses}L)
          </span>
        </div>

        {/* 2. Trading Days */}
        <div className="bg-white dark:bg-[#1a1a1a] p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('tradingDaysCount') || 'วันที่เข้าเทรด'}
          </span>
          <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {monthlyStats.tradingDays} <span className="text-xs font-bold text-slate-400">{language === 'th' ? 'วัน' : 'days'}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] mt-0.5">
            <span className="text-win-600 dark:text-win-400 font-bold">
              🟢 {monthlyStats.winDays} {language === 'th' ? 'วันบวก' : 'Win'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-loss-600 dark:text-loss-400 font-bold">
              🔴 {monthlyStats.lossDays} {language === 'th' ? 'วันลบ' : 'Loss'}
            </span>
          </div>
        </div>

        {/* 3. Daily Win Rate */}
        <div className="bg-white dark:bg-[#1a1a1a] p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('dailyWinRate') || 'อัตราชนะรายวัน'}
          </span>
          <div className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {monthlyStats.dayWinRate.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {language === 'th' ? 'อัตราชนะรายไม้:' : 'Trade WR:'} {monthlyStats.tradeWinRate.toFixed(1)}%
          </span>
        </div>

        {/* 4. Best Day */}
        <div className="bg-white dark:bg-[#1a1a1a] p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('bestDay') || 'วันที่กำไรสูงสุด'}
          </span>
          <div className="text-lg md:text-xl font-black font-mono text-win-600 dark:text-win-400 mt-1">
            {monthlyStats.bestDay && monthlyStats.bestDay.netPnL > 0
              ? `+$${monthlyStats.bestDay.netPnL.toFixed(2)}`
              : '—'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {monthlyStats.bestDay && monthlyStats.bestDay.netPnL > 0
              ? `${language === 'th' ? 'วันที่' : 'Day'} ${monthlyStats.bestDay.dayNum} (${monthlyStats.bestDay.trades.length} ${language === 'th' ? 'ไม้' : 'trades'})`
              : language === 'th' ? 'ยังไม่มีข้อมูล' : 'No data'}
          </span>
        </div>

        {/* 5. Worst Day */}
        <div className="bg-white dark:bg-[#1a1a1a] p-4 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('worstDay') || 'วันที่ขาดทุนหนักสุด'}
          </span>
          <div className="text-lg md:text-xl font-black font-mono text-loss-600 dark:text-loss-400 mt-1">
            {monthlyStats.worstDay && monthlyStats.worstDay.netPnL < 0
              ? `-$${Math.abs(monthlyStats.worstDay.netPnL).toFixed(2)}`
              : '—'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
            {monthlyStats.worstDay && monthlyStats.worstDay.netPnL < 0
              ? `${language === 'th' ? 'วันที่' : 'Day'} ${monthlyStats.worstDay.dayNum} (${monthlyStats.worstDay.trades.length} ${language === 'th' ? 'ไม้' : 'trades'})`
              : language === 'th' ? 'ไม่มีวันขาดทุน' : 'No losing day'}
          </span>
        </div>
      </div>

      {/* ---------------- Calendar Grid (ตารางปฏิทินรายวัน + สรุปรายสัปดาห์) ---------------- */}
      <div className="p-4 md:p-6">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 lg:grid-cols-8 gap-1.5 md:gap-2 mb-2">
          {daysHeader.map((day, idx) => (
            <div
              key={idx}
              className="text-center text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1.5"
            >
              {day}
            </div>
          ))}
          <div className="hidden lg:block text-center text-[11px] font-black uppercase tracking-wider text-blue-500 dark:text-blue-400 py-1.5">
            {language === 'th' ? 'สรุปสัปดาห์' : 'Weekly'}
          </div>
        </div>

        {/* Weeks Rows */}
        <div className="space-y-1.5 md:space-y-2">
          {calendarWeeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-cols-7 lg:grid-cols-8 gap-1.5 md:gap-2">
              {week.days.map(cell => {
                const hasTrades = cell.trades.length > 0;
                const isSelected = cell.dateStr === selectedDate;
                const isToday = cell.dateStr === todayStr;

                let cellStyle = 'bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/[0.05]';
                if (!cell.isCurrentMonth) {
                  cellStyle = 'bg-slate-50/20 dark:bg-white/[0.005] border-slate-100 dark:border-white/[0.02] opacity-40';
                } else if (hasTrades) {
                  if (cell.netPnL > 0) {
                    cellStyle = 'bg-win-50/80 dark:bg-win-500/10 border-win-200 dark:border-win-500/30 hover:border-win-400';
                  } else if (cell.netPnL < 0) {
                    cellStyle = 'bg-loss-50/80 dark:bg-loss-500/10 border-loss-200 dark:border-loss-500/30 hover:border-loss-400';
                  } else {
                    cellStyle = 'bg-blue-50/50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30';
                  }
                }

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`relative min-h-[74px] md:min-h-[92px] p-2 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${cellStyle} ${
                      isSelected
                        ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-md scale-[1.01] z-10'
                        : 'hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Top row: Day number + Today/Trade count badge */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-black inline-flex items-center justify-center w-6 h-6 rounded-lg ${
                          isToday
                            ? 'bg-blue-600 text-white'
                            : isSelected
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {hasTrades && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-black/40 text-slate-600 dark:text-slate-300">
                          {cell.trades.length} {language === 'th' ? 'ไม้' : 'tr'}
                        </span>
                      )}
                    </div>

                    {/* Bottom row: Daily Net P&L and Win/Loss count */}
                    {hasTrades ? (
                      <div className="mt-1 w-full">
                        <div
                          className={`text-xs md:text-sm font-black font-mono truncate ${
                            cell.netPnL > 0
                              ? 'text-win-700 dark:text-win-400'
                              : cell.netPnL < 0
                              ? 'text-loss-700 dark:text-loss-400'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {cell.netPnL >= 0 ? '+' : ''}${cell.netPnL.toFixed(2)}
                        </div>
                        <div className="hidden sm:flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          <span>
                            {cell.wins}W / {cell.losses}L
                          </span>
                          <span>{cell.winRate.toFixed(0)}%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-300 dark:text-slate-700 font-medium">
                        —
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Weekly Summary Cell (Desktop) */}
              <div className="hidden lg:flex flex-col justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {language === 'th' ? `สัปดาห์ ${wIdx + 1}` : `Week ${wIdx + 1}`}
                  </span>
                  {week.weekTrades > 0 && (
                    <span className="text-[10px] font-bold text-slate-500">
                      {week.weekTrades} {language === 'th' ? 'ไม้' : 'tr'}
                    </span>
                  )}
                </div>

                {week.weekTrades > 0 ? (
                  <div>
                    <div
                      className={`text-sm font-black font-mono ${
                        week.weekPnL > 0
                          ? 'text-win-600 dark:text-win-400'
                          : week.weekPnL < 0
                          ? 'text-loss-600 dark:text-loss-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {week.weekPnL >= 0 ? '+' : ''}${week.weekPnL.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      {week.weekWins}W / {week.weekLosses}L
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-300 dark:text-slate-700">—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Daily Detail Breakdown (แสดงรายละเอียดรายวัน) ---------------- */}
      <div className="border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#141414] p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {t('selectedDayDetails') || 'รายละเอียดการเทรดประจำวัน'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {formatSelectedDateLabel(selectedDayData.dateStr)}
              </span>
            </div>
          </div>

          {selectedDayData.trades.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200">
                {selectedDayData.trades.length} {language === 'th' ? 'รายการ' : 'Trades'} ({selectedDayData.wins}W / {selectedDayData.losses}L)
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400">
                Win Rate {selectedDayData.winRate.toFixed(0)}%
              </span>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-black font-mono border ${
                  selectedDayData.netPnL >= 0
                    ? 'bg-win-50 dark:bg-win-500/10 border-win-200 dark:border-win-500/30 text-win-700 dark:text-win-400'
                    : 'bg-loss-50 dark:bg-loss-500/10 border-loss-200 dark:border-loss-500/30 text-loss-700 dark:text-loss-400'
                }`}
              >
                {selectedDayData.netPnL >= 0 ? '+' : ''}${selectedDayData.netPnL.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {selectedDayData.trades.length === 0 ? (
          <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.01]">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {t('noTradesOnSelectedDay') || 'ไม่มีรายการเทรดในวันที่เลือก'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {t('clickDayForDetails') || 'คลิกที่วันที่มีสีเขียวหรือสีแดงในปฏิทินเพื่อดูรายละเอียดไม้เทรดของวันนั้น'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedDayData.trades.map(trade => {
              const pnl = trade.financials.netPnL || 0;
              const tvUrl = trade.notes?.tradingViewUrl || trade.notes?.exitTradingViewUrl;

              return (
                <div
                  key={trade.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#1e1e1e] border border-slate-200/80 dark:border-white/[0.07] shadow-sm flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {trade.instrument}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            trade.direction === 'LONG'
                              ? 'bg-win-50 text-win-700 dark:bg-win-500/10 dark:text-win-400'
                              : 'bg-loss-50 text-loss-700 dark:bg-loss-500/10 dark:text-loss-400'
                          }`}
                        >
                          {trade.direction === 'LONG' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                          {trade.direction}
                        </span>
                        <span className="text-xs font-mono text-slate-500">{trade.lotSize} Lot</span>
                      </div>

                      <span
                        className={`text-sm font-black font-mono ${
                          pnl > 0
                            ? 'text-win-600 dark:text-win-400'
                            : pnl < 0
                            ? 'text-loss-600 dark:text-loss-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </span>
                    </div>

                    {/* Price & Strategy Info */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        Entry: <strong className="font-mono text-slate-700 dark:text-slate-200">{trade.entryPrice}</strong>
                      </span>
                      {trade.exitPrice ? (
                        <span>
                          → Exit: <strong className="font-mono text-slate-700 dark:text-slate-200">{trade.exitPrice}</strong>
                        </span>
                      ) : null}
                      {trade.analysis?.actualRR != null && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] font-mono font-bold text-slate-700 dark:text-slate-300">
                          {trade.analysis.actualRR}R
                        </span>
                      )}
                    </div>

                    {trade.analysis?.strategy && (
                      <div className="mt-2">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20">
                          Setup: {trade.analysis.strategy}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Psychology tags & TV link */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between gap-2 text-[10px] text-slate-400">
                    <div className="truncate">
                      {trade.notes?.preTrade && (
                        <span className="mr-1.5">🧠 {trade.notes.preTrade}</span>
                      )}
                      {trade.notes?.duringTrade && (
                        <span>• {trade.notes.duringTrade}</span>
                      )}
                    </div>

                    {tvUrl && (
                      <a
                        href={tvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                      >
                        Chart <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
