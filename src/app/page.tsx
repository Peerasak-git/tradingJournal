'use client';

import { useEffect, useState } from 'react';
import { Trade } from '@/types/trade';
import { useLanguage } from '@/context/LanguageContext';
import { useAccount } from '@/context/AccountContext';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ExternalLink,
} from 'lucide-react';

import { getTrades } from '@/lib/clientStorage';

export default function Dashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'pnl' | 'balance'>('balance');
  const { t } = useLanguage();
  const { selectedAccount } = useAccount();

  useEffect(() => {
    getTrades()
      .then(data => {
        setTrades(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching trades:', err);
        setLoading(false);
      });
  }, []);

  const accountTrades = trades.filter(t => t.accountId === selectedAccount?.id);
  const closedTrades = accountTrades.filter(t => t.status !== 'OPEN');
  const wins = accountTrades.filter(t => t.status === 'WIN');
  const losses = accountTrades.filter(t => t.status === 'LOSS');

  const totalProfit = accountTrades.reduce((acc, t) => acc + (t.financials.netPnL || 0), 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length * 100) : 0;

  const grossWins = accountTrades.reduce((acc, t) => {
    const pnl = t.financials.netPnL || 0;
    return pnl > 0 ? acc + pnl : acc;
  }, 0);

  const grossLosses = Math.abs(accountTrades.reduce((acc, t) => {
    const pnl = t.financials.netPnL || 0;
    return pnl < 0 ? acc + pnl : acc;
  }, 0));

  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : 0;

  const rrTrades = closedTrades.filter(t => t.analysis?.actualRR !== null && t.analysis?.actualRR !== undefined && t.analysis.actualRR > 0);
  const avgRR = rrTrades.length > 0 ? (rrTrades.reduce((acc, t) => acc + (t.analysis.actualRR || 0), 0) / rrTrades.length) : 0;

  const assessedTrades = closedTrades.filter(t => t.notes?.selfAssessment && t.notes.selfAssessment > 0);
  const avgScore = assessedTrades.length > 0 ? (assessedTrades.reduce((acc, t) => acc + (t.notes.selfAssessment || 0), 0) / assessedTrades.length) : 0;

  if (loading) return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-7 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200 dark:bg-white/[0.04]">
            {[1,2,3,4,5,6].map(i => (
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const recentPnL = accountTrades.slice(0, 7).reverse().map(t => ({
    instrument: t.instrument,
    pnl: t.financials.netPnL || 0
  }));

  const maxPnL = Math.max(...recentPnL.map(d => Math.abs(d.pnl)), 10);

  const balanceHistory = (() => {
    if (!selectedAccount || accountTrades.length === 0) return [];
    const sorted = [...accountTrades]
      .filter(t => t.status !== 'OPEN')
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    let current = selectedAccount.balance;
    const history = [{ date: 'Start', balance: current }];
    sorted.forEach(t => {
      current += (t.financials.netPnL || 0);
      const d = new Date(t.entryDate);
      history.push({ date: `${d.getDate()}/${d.getMonth()+1}`, balance: current });
    });
    return history;
  })();

  const maxBalance = Math.max(...balanceHistory.map(h => h.balance), selectedAccount?.balance || 0);
  const minBalance = Math.min(...balanceHistory.map(h => h.balance), selectedAccount?.balance || 0);

  const drawBalanceLine = () => {
    if (balanceHistory.length === 0) return '';
    const rangeY = maxBalance === minBalance ? 1 : maxBalance - minBalance;
    return balanceHistory.map((h, i) => {
      const x = (i / (balanceHistory.length - 1 || 1)) * 100;
      const y = 95 - ((h.balance - minBalance) / rangeY) * 90;
      return `${x},${y}`;
    }).join(' ');
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

  return (
    <main className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">

      {/* Header */}
      <div className="mb-7">
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
          Performance analytics and trade insights
        </p>
      </div>

      {/* Metrics Panel — single container, cell dividers via gap-px trick */}
      <div className="border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200 dark:bg-white/[0.04]">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1a1a] p-5">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">{m.label}</p>
              <p className={`text-2xl font-semibold tracking-tight mb-1 ${m.valueClass}`}>{m.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Performance Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tracking your account growth</p>
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
                    <span className={`absolute -top-5 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${data.pnl >= 0 ? 'text-win-600 dark:text-win-400' : 'text-loss-600 dark:text-loss-400'}`}>
                      ${data.pnl.toFixed(0)}
                    </span>
                    <div
                      className={`w-full max-w-[32px] rounded-t transition-all duration-300 group-hover:brightness-110 ${data.pnl >= 0 ? 'bg-win-500/75' : 'bg-loss-500/75'}`}
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
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[20, 50, 80].map(y => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e2e8f0" className="dark:stroke-white/[0.05]" strokeWidth="0.5" strokeDasharray="2 3" />
                  ))}
                  {balanceHistory.length > 0 && (
                    <>
                      <polygon
                        points={`0,100 ${linePath} 100,100`}
                        fill="url(#balanceGradient)"
                      />
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
                {/* HTML dots — avoid SVG distortion from preserveAspectRatio="none" */}
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
                  Current: ${balanceHistory[balanceHistory.length-1]?.balance.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Trade Distribution */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl p-5 flex flex-col">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Trade Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Win vs Loss ratio</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="currentColor"
                  className="text-win-500 transition-all duration-700"
                  strokeWidth="3"
                  strokeDasharray={`${winRate} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold text-slate-900 dark:text-white">{winRate.toFixed(0)}%</span>
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

      {/* Recent Trades Table */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-2.5 border-b border-slate-100 dark:border-white/[0.04]">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('recentTrades')}</h2>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
            {accountTrades.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/[0.04]">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 w-10">#</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('instrument')}</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('direction')}</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('lot')}</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('status')}</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('pnl')}</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {accountTrades.slice(0, 10).map((trade, index) => (
                <tr
                  key={trade.id}
                  className="border-t border-slate-50 dark:border-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5 text-xs text-slate-400 dark:text-slate-600 font-mono">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{trade.instrument}</span>
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
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                      trade.direction === 'LONG'
                        ? 'bg-win-50 text-win-700 dark:bg-win-500/10 dark:text-win-400'
                        : 'bg-loss-50 text-loss-700 dark:bg-loss-500/10 dark:text-loss-400'
                    }`}>
                      {trade.direction === 'LONG'
                        ? <ArrowUpRight size={11} />
                        : <ArrowDownLeft size={11} />}
                      {trade.direction}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm text-slate-600 dark:text-slate-300">
                    {trade.lotSize}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={trade.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-semibold ${(trade.financials.netPnL || 0) >= 0 ? 'text-win-600 dark:text-win-400' : 'text-loss-600 dark:text-loss-400'}`}>
                      {trade.financials.netPnL !== null
                        ? `${trade.financials.netPnL >= 0 ? '+' : ''}$${trade.financials.netPnL.toFixed(2)}`
                        : <span className="text-slate-400 dark:text-slate-600 font-normal">—</span>}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Calendar size={11} />
                      {new Date(trade.entryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    WIN:        'bg-win-50 text-win-700 dark:bg-win-500/10 dark:text-win-400',
    LOSS:       'bg-loss-50 text-loss-700 dark:bg-loss-500/10 dark:text-loss-400',
    OPEN:       'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    BREAK_EVEN: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${styles[status] || styles.OPEN}`}>
      {status === 'BREAK_EVEN' ? 'B/E' : status}
    </span>
  );
}
