'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trade } from '@/types/trade';
import { useLanguage } from '@/context/LanguageContext';
import { useAccount } from '@/context/AccountContext';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ExternalLink,
  LayoutDashboard,
  CalendarDays,
  Layers,
  ListFilter,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Coins,
  Compass,
  Filter,
  RotateCcw,
} from 'lucide-react';

import { getTrades } from '@/lib/clientStorage';
import TradingCalendar from '@/components/TradingCalendar';

type DashboardTab = 'overview' | 'calendar' | 'categories' | 'recent' | 'all';
type CategoryDimension = 'instrument' | 'direction' | 'strategy' | 'session' | 'dayOfWeek';

interface CategoryGroupStat {
  key: string;
  label: string;
  subLabel?: string;
  totalTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number;
  netPnL: number;
  grossWins: number;
  grossLosses: number;
  profitFactor: number;
  avgRR: number;
  avgPnL: number;
}

function computeGroupStats(
  trades: Trade[],
  keyExtractor: (t: Trade) => { key: string; label: string; subLabel?: string }
): CategoryGroupStat[] {
  const map = new Map<string, { label: string; subLabel?: string; list: Trade[] }>();

  trades.forEach((t) => {
    const { key, label, subLabel } = keyExtractor(t);
    const existing = map.get(key);
    if (existing) {
      existing.list.push(t);
    } else {
      map.set(key, { label, subLabel, list: [t] });
    }
  });

  const stats: CategoryGroupStat[] = [];
  map.forEach(({ label, subLabel, list }, key) => {
    const closed = list.filter((t) => t.status !== 'OPEN');
    const wins = list.filter((t) => t.status === 'WIN').length;
    const losses = list.filter((t) => t.status === 'LOSS').length;
    const breakEven = list.filter((t) => t.status === 'BREAK_EVEN').length;
    const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

    const netPnL = list.reduce((acc, t) => acc + (t.financials.netPnL || 0), 0);
    const grossWins = list.reduce((acc, t) => {
      const p = t.financials.netPnL || 0;
      return p > 0 ? acc + p : acc;
    }, 0);
    const grossLosses = Math.abs(
      list.reduce((acc, t) => {
        const p = t.financials.netPnL || 0;
        return p < 0 ? acc + p : acc;
      }, 0)
    );
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 99.9 : 0;

    const rrTrades = closed.filter(
      (t) => t.analysis?.actualRR !== null && t.analysis?.actualRR !== undefined && t.analysis.actualRR > 0
    );
    const avgRR =
      rrTrades.length > 0
        ? rrTrades.reduce((acc, t) => acc + (t.analysis.actualRR || 0), 0) / rrTrades.length
        : 0;

    const avgPnL = closed.length > 0 ? netPnL / closed.length : 0;

    stats.push({
      key,
      label,
      subLabel,
      totalTrades: list.length,
      closedTrades: closed.length,
      wins,
      losses,
      breakEven,
      winRate,
      netPnL,
      grossWins,
      grossLosses,
      profitFactor,
      avgRR,
      avgPnL,
    });
  });

  return stats.sort((a, b) => b.netPnL - a.netPnL);
}

function getMarketSession(entryDate: string, language: string): { key: string; label: string; subLabel: string } {
  const d = new Date(entryDate);
  if (isNaN(d.getTime())) {
    return {
      key: 'UNKNOWN',
      label: language === 'th' ? 'ไม่ระบุเวลา' : 'Unknown Session',
      subLabel: '-',
    };
  }
  const utcHour = d.getUTCHours();
  // Approximate forex sessions in UTC (or Thai time UTC+7):
  // Asian: 00:00 - 07:59 UTC (07:00 - 14:59 TH)
  // London: 08:00 - 12:59 UTC (15:00 - 19:59 TH)
  // London/NY Overlap + NY: 13:00 - 21:59 UTC (20:00 - 04:59 TH)
  if (utcHour >= 0 && utcHour < 8) {
    return {
      key: 'ASIAN',
      label: language === 'th' ? '🌏 ตลาดเอเชีย (Asian Session)' : '🌏 Asian Session',
      subLabel: '07:00 - 15:00 น. (เวลาไทย)',
    };
  } else if (utcHour >= 8 && utcHour < 13) {
    return {
      key: 'LONDON',
      label: language === 'th' ? '🇬🇧 ตลาดลอนดอน (London Session)' : '🇬🇧 London Session',
      subLabel: '15:00 - 20:00 น. (เวลาไทย)',
    };
  } else if (utcHour >= 13 && utcHour < 21) {
    return {
      key: 'NEW_YORK',
      label: language === 'th' ? '🇺🇸 ตลาดนิวยอร์ก (New York Session)' : '🇺🇸 New York Session',
      subLabel: '20:00 - 04:00 น. (เวลาไทย)',
    };
  }
  return {
    key: 'LATE_NY',
    label: language === 'th' ? '🌙 ช่วงปิดตลาด (Late NY / Rollover)' : '🌙 Late NY / Rollover',
    subLabel: '04:00 - 07:00 น. (เวลาไทย)',
  };
}

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'pnl' | 'balance'>('balance');

  // Main Dashboard Tab & Sub-category states
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [categoryDimension, setCategoryDimension] = useState<CategoryDimension>('instrument');

  // Category Filters
  const [selectedInstrument, setSelectedInstrument] = useState<string>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const { t, language } = useLanguage();
  const { selectedAccount } = useAccount();
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    getTrades()
      .then((data) => {
        setTrades(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching trades:', err);
        setLoading(false);
      });
  }, [user?.id, selectedAccount?.id]);

  // All trades for the selected account
  const rawAccountTrades = useMemo(
    () => trades.filter((t) => t.accountId === selectedAccount?.id),
    [trades, selectedAccount?.id]
  );

  // Unique instruments in this account for category filter pills
  const instrumentsList = useMemo(() => {
    const set = new Set<string>();
    rawAccountTrades.forEach((tr) => {
      if (tr.instrument) set.add(tr.instrument.toUpperCase());
    });
    return Array.from(set).sort();
  }, [rawAccountTrades]);

  // Filtered trades according to global category filter bar
  const accountTrades = useMemo(() => {
    return rawAccountTrades.filter((tr) => {
      if (selectedInstrument !== 'ALL' && tr.instrument.toUpperCase() !== selectedInstrument) return false;
      if (selectedDirection !== 'ALL' && tr.direction !== selectedDirection) return false;
      if (selectedStatus !== 'ALL' && tr.status !== selectedStatus) return false;
      return true;
    });
  }, [rawAccountTrades, selectedInstrument, selectedDirection, selectedStatus]);

  const hasActiveFilter =
    selectedInstrument !== 'ALL' || selectedDirection !== 'ALL' || selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSelectedInstrument('ALL');
    setSelectedDirection('ALL');
    setSelectedStatus('ALL');
  };

  const closedTrades = accountTrades.filter((t) => t.status !== 'OPEN');
  const wins = accountTrades.filter((t) => t.status === 'WIN');
  const losses = accountTrades.filter((t) => t.status === 'LOSS');

  const totalProfit = accountTrades.reduce((acc, t) => acc + (t.financials.netPnL || 0), 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;

  const grossWins = accountTrades.reduce((acc, t) => {
    const pnl = t.financials.netPnL || 0;
    return pnl > 0 ? acc + pnl : acc;
  }, 0);

  const grossLosses = Math.abs(
    accountTrades.reduce((acc, t) => {
      const pnl = t.financials.netPnL || 0;
      return pnl < 0 ? acc + pnl : acc;
    }, 0)
  );

  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : 0;

  const rrTrades = closedTrades.filter(
    (t) => t.analysis?.actualRR !== null && t.analysis?.actualRR !== undefined && t.analysis.actualRR > 0
  );
  const avgRR =
    rrTrades.length > 0
      ? rrTrades.reduce((acc, t) => acc + (t.analysis.actualRR || 0), 0) / rrTrades.length
      : 0;

  const assessedTrades = closedTrades.filter((t) => t.notes?.selfAssessment && t.notes.selfAssessment > 0);
  const avgScore =
    assessedTrades.length > 0
      ? assessedTrades.reduce((acc, t) => acc + (t.notes.selfAssessment || 0), 0) / assessedTrades.length
      : 0;

  // Category Breakdown Computations
  const instrumentStats = useMemo(
    () =>
      computeGroupStats(accountTrades, (tr) => ({
        key: tr.instrument.toUpperCase(),
        label: tr.instrument.toUpperCase(),
        subLabel: language === 'th' ? 'สินทรัพย์ / คู่เงิน' : 'Trading Instrument',
      })),
    [accountTrades, language]
  );

  const directionStats = useMemo(
    () =>
      computeGroupStats(accountTrades, (tr) => ({
        key: tr.direction,
        label:
          tr.direction === 'LONG'
            ? language === 'th'
              ? '🟢 ฝั่งซื้อ (LONG / BUY)'
              : '🟢 LONG (BUY)'
            : language === 'th'
            ? '🔴 ฝั่งขาย (SHORT / SELL)'
            : '🔴 SHORT (SELL)',
        subLabel:
          tr.direction === 'LONG'
            ? language === 'th'
              ? 'เก็งกำไรขาขึ้น'
              : 'Bullish / Buy Orders'
            : language === 'th'
            ? 'เก็งกำไรขาลง'
            : 'Bearish / Sell Orders',
      })),
    [accountTrades, language]
  );

  const strategyStats = useMemo(
    () =>
      computeGroupStats(accountTrades, (tr) => {
        const strat = tr.analysis?.strategy?.trim() || (language === 'th' ? 'ไม่ระบุกลยุทธ์' : 'Unspecified Setup');
        return {
          key: strat,
          label: strat,
          subLabel: language === 'th' ? 'กลยุทธ์ / รูปแบบการเข้าเทรด' : 'Trading Strategy / Setup',
        };
      }),
    [accountTrades, language]
  );

  const sessionStats = useMemo(
    () => computeGroupStats(accountTrades, (tr) => getMarketSession(tr.entryDate, language)),
    [accountTrades, language]
  );

  const dayOfWeekStats = useMemo(() => {
    const dayNamesTh = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return computeGroupStats(accountTrades, (tr) => {
      const d = new Date(tr.entryDate);
      const dayIdx = isNaN(d.getTime()) ? 1 : d.getDay();
      return {
        key: String(dayIdx),
        label: language === 'th' ? dayNamesTh[dayIdx] : dayNamesEn[dayIdx],
        subLabel: language === 'th' ? 'สถิติแยกตามวันในสัปดาห์' : 'Day of the Week Performance',
      };
    });
  }, [accountTrades, language]);

  const activeCategoryStats = useMemo(() => {
    switch (categoryDimension) {
      case 'instrument':
        return instrumentStats;
      case 'direction':
        return directionStats;
      case 'strategy':
        return strategyStats;
      case 'session':
        return sessionStats;
      case 'dayOfWeek':
        return dayOfWeekStats;
    }
  }, [categoryDimension, instrumentStats, directionStats, strategyStats, sessionStats, dayOfWeekStats]);

  if (loading)
    return (
      <main className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200 dark:bg-white/[0.04]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-slate-50 dark:bg-[#1a1a1a] p-5 h-24" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </main>
    );

  const today = new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const recentPnL = accountTrades
    .slice(0, 10)
    .reverse()
    .map((t) => ({
      instrument: t.instrument,
      pnl: t.financials.netPnL || 0,
    }));

  const maxPnL = Math.max(...recentPnL.map((d) => Math.abs(d.pnl)), 10);

  const balanceHistory = (() => {
    if (!selectedAccount || accountTrades.length === 0) return [];
    const sorted = [...accountTrades]
      .filter((t) => t.status !== 'OPEN')
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    let current = selectedAccount.balance;
    const history = [{ date: 'Start', balance: current }];
    sorted.forEach((t) => {
      current += t.financials.netPnL || 0;
      const d = new Date(t.entryDate);
      history.push({ date: `${d.getDate()}/${d.getMonth() + 1}`, balance: current });
    });
    return history;
  })();

  const maxBalance = Math.max(...balanceHistory.map((h) => h.balance), selectedAccount?.balance || 0);
  const minBalance = Math.min(...balanceHistory.map((h) => h.balance), selectedAccount?.balance || 0);

  const drawBalanceLine = () => {
    if (balanceHistory.length === 0) return '';
    const rangeY = maxBalance === minBalance ? 1 : maxBalance - minBalance;
    return balanceHistory
      .map((h, i) => {
        const x = (i / (balanceHistory.length - 1 || 1)) * 100;
        const y = 95 - ((h.balance - minBalance) / rangeY) * 90;
        return `${x},${y}`;
      })
      .join(' ');
  };
  const linePath = drawBalanceLine();

  const metrics = [
    {
      label: t('totalTrades'),
      value: String(accountTrades.length),
      sub: `${wins.length}W · ${losses.length}L`,
      valueClass: 'text-slate-900 dark:text-white',
    },
    {
      label: t('winRate'),
      value: `${winRate.toFixed(1)}%`,
      sub: `${wins.length} ${t('wins')} / ${closedTrades.length} ${t('closed')}`,
      valueClass: 'text-slate-900 dark:text-white',
    },
    {
      label: t('netProfit'),
      value: `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`,
      sub: totalProfit >= 0 ? t('profitable') : t('lossPeriod'),
      valueClass: totalProfit >= 0 ? 'text-win-600 dark:text-win-400' : 'text-loss-600 dark:text-loss-400',
    },
    {
      label: t('profitFactor'),
      value: profitFactor.toFixed(2),
      sub: profitFactor >= 1.5 ? t('strongEdge') : profitFactor >= 1 ? t('slightEdge') : t('noEdge'),
      valueClass: profitFactor >= 1 ? 'text-win-600 dark:text-win-400' : 'text-slate-900 dark:text-white',
    },
    {
      label: 'Avg R:R',
      value: `1 : ${avgRR.toFixed(2)}`,
      sub: avgRR >= 2 ? 'Excellent RR' : avgRR >= 1 ? 'Good RR' : 'Poor RR',
      valueClass: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Discipline',
      value: `${avgScore.toFixed(1)} / 5`,
      sub: avgScore >= 4 ? 'Highly Disciplined' : avgScore >= 3 ? 'Average' : 'Needs Work',
      valueClass: 'text-slate-900 dark:text-white',
    },
  ];

  const dashboardTabs: { id: DashboardTab; label: string; badge?: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: t('dashTabOverview'),
      icon: <LayoutDashboard size={15} />,
    },
    {
      id: 'calendar',
      label: t('dashTabCalendar'),
      icon: <CalendarDays size={15} />,
    },
    {
      id: 'categories',
      label: t('dashTabCategories'),
      badge: String(instrumentStats.length),
      icon: <Layers size={15} />,
    },
    {
      id: 'recent',
      label: t('dashTabRecentTrades'),
      badge: String(accountTrades.length),
      icon: <ListFilter size={15} />,
    },
    {
      id: 'all',
      label: t('dashTabAllView'),
      icon: <Sparkles size={15} />,
    },
  ];

  const categorySubTabs: { id: CategoryDimension; label: string; icon: React.ReactNode }[] = [
    { id: 'instrument', label: t('categoryByInstrument'), icon: <Coins size={14} /> },
    { id: 'direction', label: t('categoryByDirection'), icon: <Compass size={14} /> },
    { id: 'strategy', label: t('categoryByStrategy'), icon: <Target size={14} /> },
    { id: 'session', label: t('categoryBySession'), icon: <Clock size={14} /> },
    { id: 'dayOfWeek', label: t('categoryByDayOfWeek'), icon: <Calendar size={14} /> },
  ];

  const maxCategoryAbsPnL = Math.max(...activeCategoryStats.map((s) => Math.abs(s.netPnL)), 1);

  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-win-700 dark:text-win-400 bg-win-50 dark:bg-win-500/10 border border-win-200/70 dark:border-win-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-win-500 animate-pulse inline-block" />
              {t('live')}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{today}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t('dashboard')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'th'
              ? 'สรุปภาพรวมพอร์ต ปฏิทินรายเดือน/รายวัน และวิเคราะห์แยกตามประเภทการเทรด'
              : 'Performance analytics, monthly calendar, and category insights'}
          </p>
        </div>

        {/* Global Category Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] p-2 rounded-xl shadow-xs">
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Filter size={13} className="text-blue-500" />
            <span>{t('filter')}:</span>
          </div>

          {/* Instrument Filter */}
          <select
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">{t('allInstruments')}</option>
            {instrumentsList.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>

          {/* Direction Filter */}
          <select
            value={selectedDirection}
            onChange={(e) => setSelectedDirection(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">{t('allDirections')}</option>
            <option value="LONG">LONG (BUY)</option>
            <option value="SHORT">SHORT (SELL)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="ALL">{t('allStatuses')}</option>
            <option value="WIN">WIN</option>
            <option value="LOSS">LOSS</option>
            <option value="BREAK_EVEN">BREAK EVEN</option>
            <option value="OPEN">OPEN</option>
          </select>

          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 transition"
            >
              <RotateCcw size={12} />
              {t('resetFilter')}
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="mb-6 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl p-1.5 flex flex-wrap items-center gap-1.5 shadow-xs">
        {dashboardTabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Metrics Panel — Always visible at top so user sees instant KPI impact when switching category filters */}
      <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-200 dark:bg-white/[0.04]">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1a1a] p-4 sm:p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{m.label}</p>
              <p className={`text-xl sm:text-2xl font-semibold tracking-tight mb-1 ${m.valueClass}`}>
                {m.value}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW & CHARTS                                              */}
      {/* ===================================================================== */}
      {(activeTab === 'overview' || activeTab === 'all') && (
        <div className="space-y-6 mb-6 animate-fade-in">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Performance Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {language === 'th' ? 'กราฟการเติบโตของพอร์ต & กำไรรายไม้' : 'Performance Overview'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'th'
                      ? 'ติดตามแนวโน้ม Balance และผลกำไร/ขาดทุน'
                      : 'Tracking your account growth'}
                  </p>
                </div>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 rounded-lg p-0.5">
                  <button
                    onClick={() => setChartType('balance')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      chartType === 'balance'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    Balance
                  </button>
                  <button
                    onClick={() => setChartType('pnl')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      chartType === 'pnl'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    P&L
                  </button>
                </div>
              </div>

              {chartType === 'pnl' ? (
                <div className="h-44 flex items-end gap-2 px-1 animate-fade-in">
                  {recentPnL.map((data, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="relative w-full flex flex-col items-center justify-end h-[120px]">
                        <span
                          className={`absolute -top-5 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                            data.pnl >= 0
                              ? 'text-win-600 dark:text-win-400'
                              : 'text-loss-600 dark:text-loss-400'
                          }`}
                        >
                          ${data.pnl.toFixed(0)}
                        </span>
                        <div
                          className={`w-full max-w-[32px] rounded-t transition-all duration-300 group-hover:brightness-110 ${
                            data.pnl >= 0 ? 'bg-win-500/75' : 'bg-loss-500/75'
                          }`}
                          style={{ height: `${(Math.abs(data.pnl) / maxPnL) * 100}%`, minHeight: '3px' }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full text-center font-medium">
                        {data.instrument}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-44 relative w-full animate-fade-in group flex flex-col">
                  <div className="flex-1 w-full relative">
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full"
                    >
                      <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[20, 50, 80].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="100"
                          y2={y}
                          stroke="#e2e8f0"
                          className="dark:stroke-white/[0.05]"
                          strokeWidth="0.5"
                          strokeDasharray="2 3"
                        />
                      ))}
                      {balanceHistory.length > 0 && (
                        <>
                          <polygon points={`0,100 ${linePath} 100,100`} fill="url(#balanceGradient)" />
                          <polyline
                            points={linePath}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </>
                      )}
                    </svg>
                    {balanceHistory.map((h, i) => {
                      const x = (i / (balanceHistory.length - 1 || 1)) * 100;
                      const rangeY = maxBalance === minBalance ? 1 : maxBalance - minBalance;
                      const y = 95 - ((h.balance - minBalance) / rangeY) * 90;
                      return (
                        <div
                          key={i}
                          className="absolute w-2.5 h-2.5 rounded-full bg-white dark:bg-[#1a1a1a] border-2 border-blue-500 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{ left: `${x}%`, top: `${y}%` }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>Start: ${selectedAccount?.balance.toFixed(2) || '0.00'}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      Current: ${balanceHistory[balanceHistory.length - 1]?.balance.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Trade Distribution */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 flex flex-col">
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {language === 'th' ? 'สัดส่วนผลการเทรด' : 'Trade Distribution'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'th' ? 'อัตราส่วนไม้ชนะเทียบกับไม้แพ้' : 'Win vs Loss ratio'}
                </p>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="relative w-28 h-28">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="currentColor"
                      className="text-win-500 transition-all duration-700"
                      strokeWidth="3"
                      strokeDasharray={`${winRate} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-semibold text-slate-900 dark:text-white">
                      {winRate.toFixed(0)}%
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Win Rate</span>
                  </div>
                </div>

                <div className="w-full space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm bg-win-500" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Wins</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{wins.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm bg-loss-500" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Losses</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{losses.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Category Summary Cards inside Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Instrument Card */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Coins size={14} className="text-amber-500" />
                  {language === 'th' ? 'สินทรัพย์ที่ทำกำไรสูงสุด' : 'Top Performing Instrument'}
                </span>
                <button
                  onClick={() => {
                    setActiveTab('categories');
                    setCategoryDimension('instrument');
                  }}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {language === 'th' ? 'ดูทุกคู่เงิน →' : 'View all →'}
                </button>
              </div>
              {instrumentStats.length > 0 ? (
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {instrumentStats[0].label}
                    </span>
                    <span
                      className={`text-base font-bold ${
                        instrumentStats[0].netPnL >= 0
                          ? 'text-win-600 dark:text-win-400'
                          : 'text-loss-600 dark:text-loss-400'
                      }`}
                    >
                      {instrumentStats[0].netPnL >= 0 ? '+' : ''}${instrumentStats[0].netPnL.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {instrumentStats[0].totalTrades} {language === 'th' ? 'ไม้' : 'trades'} · Win Rate{' '}
                    {instrumentStats[0].winRate.toFixed(1)}% · PF {instrumentStats[0].profitFactor.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">-</p>
              )}
            </div>

            {/* Direction Comparison Card */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Compass size={14} className="text-blue-500" />
                  {language === 'th' ? 'เปรียบเทียบฝั่ง LONG vs SHORT' : 'LONG vs SHORT Split'}
                </span>
                <button
                  onClick={() => {
                    setActiveTab('categories');
                    setCategoryDimension('direction');
                  }}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {language === 'th' ? 'ดูรายละเอียด →' : 'Details →'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['LONG', 'SHORT'] as const).map((dir) => {
                  const stat = directionStats.find((d) => d.key === dir);
                  const pnl = stat?.netPnL || 0;
                  return (
                    <div
                      key={dir}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]"
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span
                          className={
                            dir === 'LONG'
                              ? 'text-win-600 dark:text-win-400'
                              : 'text-loss-600 dark:text-loss-400'
                          }
                        >
                          {dir}
                        </span>
                        <span className="text-[11px] text-slate-500">{stat?.totalTrades || 0} ไม้</span>
                      </div>
                      <p
                        className={`text-sm font-bold ${
                          pnl >= 0 ? 'text-win-600 dark:text-win-400' : 'text-loss-600 dark:text-loss-400'
                        }`}
                      >
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Best Strategy Card */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Target size={14} className="text-purple-500" />
                  {language === 'th' ? 'กลยุทธ์ที่ทำเงินดีที่สุด' : 'Best Strategy / Setup'}
                </span>
                <button
                  onClick={() => {
                    setActiveTab('categories');
                    setCategoryDimension('strategy');
                  }}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {language === 'th' ? 'ดูทุกกลยุทธ์ →' : 'View all →'}
                </button>
              </div>
              {strategyStats.length > 0 ? (
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {strategyStats[0].label}
                    </span>
                    <span
                      className={`text-base font-bold shrink-0 ${
                        strategyStats[0].netPnL >= 0
                          ? 'text-win-600 dark:text-win-400'
                          : 'text-loss-600 dark:text-loss-400'
                      }`}
                    >
                      {strategyStats[0].netPnL >= 0 ? '+' : ''}${strategyStats[0].netPnL.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {strategyStats[0].totalTrades} {language === 'th' ? 'ไม้' : 'trades'} · Win Rate{' '}
                    {strategyStats[0].winRate.toFixed(1)}% · Avg RR 1:{strategyStats[0].avgRR.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">-</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MONTHLY & DAILY CALENDAR                                       */}
      {/* ===================================================================== */}
      {(activeTab === 'calendar' || activeTab === 'all') && (
        <div className="animate-fade-in">
          <TradingCalendar trades={accountTrades} />
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: CATEGORY BREAKDOWN (แยกประเภทสถิติ)                              */}
      {/* ===================================================================== */}
      {(activeTab === 'categories' || activeTab === 'all') && (
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden mb-6 animate-fade-in">
          {/* Category Header & Dimension Selector */}
          <div className="p-5 border-b border-slate-100 dark:border-white/[0.05] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers size={18} className="text-blue-600 dark:text-blue-400" />
                {language === 'th'
                  ? 'วิเคราะห์ผลการเทรดแยกตามประเภท (Category Breakdown)'
                  : 'Performance Breakdown by Category'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'th'
                  ? 'เลือกมิติที่ต้องการเจาะลึกเพื่อดูว่าคู่เงิน ทิศทาง กลยุทธ์ หรือช่วงเวลาไหนทำกำไรให้คุณมากที่สุด'
                  : 'Analyze which instruments, directions, setups, or market sessions generate your edge'}
              </p>
            </div>

            {/* Sub-Tabs for Category Dimension */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
              {categorySubTabs.map((sub) => {
                const active = categoryDimension === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setCategoryDimension(sub.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {sub.icon}
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-b border-slate-100 dark:border-white/[0.05]">
            {activeCategoryStats.map((stat) => {
              const isProfit = stat.netPnL >= 0;
              const barWidth = Math.min(Math.max((Math.abs(stat.netPnL) / maxCategoryAbsPnL) * 100, 6), 100);
              return (
                <div
                  key={stat.key}
                  className="p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] hover:border-blue-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{stat.label}</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{stat.subLabel}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-black px-2.5 py-1 rounded-lg ${
                          isProfit
                            ? 'bg-win-50 text-win-700 dark:bg-win-500/10 dark:text-win-400'
                            : 'bg-loss-50 text-loss-700 dark:bg-loss-500/10 dark:text-loss-400'
                        }`}
                      >
                        {isProfit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {isProfit ? '+' : ''}${stat.netPnL.toFixed(2)}
                      </span>
                    </div>

                    {/* Visual P&L Bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden my-3">
                      <div
                        className={`h-full rounded-full ${isProfit ? 'bg-win-500' : 'bg-loss-500'}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.05] text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {language === 'th' ? 'จำนวนไม้' : 'Trades'}
                      </p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {stat.totalTrades} ({stat.wins}W/{stat.losses}L)
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Win Rate</p>
                      <p
                        className={`text-xs font-bold ${
                          stat.winRate >= 50
                            ? 'text-win-600 dark:text-win-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {stat.winRate.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Profit Factor</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {stat.profitFactor >= 99 ? '∞' : stat.profitFactor.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Avg R:R</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        1:{stat.avgRR.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Category Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.04] bg-slate-50/60 dark:bg-white/[0.01]">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'th' ? 'หมวดหมู่ / ประเภท' : 'Category'}
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'th' ? 'จำนวนเทรด' : 'Trades'}
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'th' ? 'ชนะ / แพ้ / เสมอ' : 'W / L / BE'}
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Win Rate</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Profit Factor
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Avg R:R</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {language === 'th' ? 'เฉลี่ยต่อไม้' : 'Avg P&L / Trade'}
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">
                    {language === 'th' ? 'กำไร/ขาดทุนสุทธิ' : 'Net P&L'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeCategoryStats.map((stat) => (
                  <tr
                    key={stat.key}
                    className="border-t border-slate-50 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-white">
                      {stat.label}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                      {stat.totalTrades}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="text-win-600 dark:text-win-400 font-semibold">{stat.wins}W</span>
                      {' · '}
                      <span className="text-loss-600 dark:text-loss-400 font-semibold">{stat.losses}L</span>
                      {' · '}
                      <span className="text-slate-400">{stat.breakEven}BE</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-900 dark:text-white">
                      {stat.winRate.toFixed(1)}%
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                      {stat.profitFactor >= 99 ? '∞' : stat.profitFactor.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                      1 : {stat.avgRR.toFixed(2)}
                    </td>
                    <td
                      className={`px-5 py-3.5 text-xs font-semibold ${
                        stat.avgPnL >= 0
                          ? 'text-win-600 dark:text-win-400'
                          : 'text-loss-600 dark:text-loss-400'
                      }`}
                    >
                      {stat.avgPnL >= 0 ? '+' : ''}${stat.avgPnL.toFixed(2)}
                    </td>
                    <td
                      className={`px-5 py-3.5 text-sm font-bold text-right ${
                        stat.netPnL >= 0
                          ? 'text-win-600 dark:text-win-400'
                          : 'text-loss-600 dark:text-loss-400'
                      }`}
                    >
                      {stat.netPnL >= 0 ? '+' : ''}${stat.netPnL.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: RECENT TRADES TABLE WITH CATEGORY PILLS                        */}
      {/* ===================================================================== */}
      {(activeTab === 'recent' || activeTab === 'all') && (
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden animate-fade-in">
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.04]">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('recentTrades')}</h2>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                {accountTrades.length}
              </span>
            </div>

            {/* Quick Category Pills inside Recent Trades Header */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['ALL', 'WIN', 'LOSS', 'BREAK_EVEN'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedStatus === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {st === 'ALL'
                    ? language === 'th'
                      ? 'ทั้งหมด'
                      : 'All'
                    : st === 'BREAK_EVEN'
                    ? 'B/E'
                    : st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.04]">
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 w-10">#</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('instrument')}
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('direction')}
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('strategy')}
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('lot')}</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('status')}
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('pnl')}</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('date')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'recent' ? accountTrades : accountTrades.slice(0, 12)).map((trade, index) => (
                  <tr
                    key={trade.id}
                    className="border-t border-slate-50 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-xs text-slate-400 dark:text-slate-600 font-mono">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {trade.instrument}
                        </span>
                        {(trade.notes?.tradingViewUrl || trade.notes?.exitTradingViewUrl) && (
                          <a
                            href={trade.notes.tradingViewUrl || trade.notes.exitTradingViewUrl || '#'}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="เปิดดูกราฟ TradingView"
                            className="inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 transition"
                          >
                            TV <ExternalLink size={7} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                          trade.direction === 'LONG'
                            ? 'bg-win-50 text-win-700 dark:bg-win-500/10 dark:text-win-400'
                            : 'bg-loss-50 text-loss-700 dark:bg-loss-500/10 dark:text-loss-400'
                        }`}
                      >
                        {trade.direction === 'LONG' ? (
                          <ArrowUpRight size={11} />
                        ) : (
                          <ArrowDownLeft size={11} />
                        )}
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-md">
                        {trade.analysis?.strategy || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-sm text-slate-600 dark:text-slate-300">
                      {trade.lotSize}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={trade.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-sm font-semibold ${
                          (trade.financials.netPnL || 0) >= 0
                            ? 'text-win-600 dark:text-win-400'
                            : 'text-loss-600 dark:text-loss-400'
                        }`}
                      >
                        {trade.financials.netPnL !== null ? (
                          `${trade.financials.netPnL >= 0 ? '+' : ''}$${trade.financials.netPnL.toFixed(2)}`
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 font-normal">—</span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar size={11} />
                        {new Date(trade.entryDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    WIN: 'bg-win-50 text-win-700 dark:bg-win-500/10 dark:text-win-400',
    LOSS: 'bg-loss-50 text-loss-700 dark:bg-loss-500/10 dark:text-loss-400',
    OPEN: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    BREAK_EVEN: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${styles[status] || styles.OPEN}`}>
      {status === 'BREAK_EVEN' ? 'B/E' : status}
    </span>
  );
}
