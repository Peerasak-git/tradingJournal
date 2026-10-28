'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAccount } from '@/context/AccountContext';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Award,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  RefreshCw,
  Activity,
  Sparkles,
  Flame,
  Shield,
  HelpCircle,
  Clock,
  Compass,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import { Trade } from '@/types/trade';
import { Review } from '@/types/review';
import { getTrades, getReviews } from '@/lib/clientStorage';
import {
  computeTechnicalStats,
  computePsychologyStats,
  computeMindsetStats,
  computeTraderScores,
  generateActionableInsights,
  TechnicalStats,
  PsychologyStats,
  MindsetStats,
  TraderScores,
  ActionableInsight
} from '@/lib/analysisCalculations';

type DateFilter = 'all' | '30d' | '7d' | 'month';
type ActiveTab = 'overview' | 'technical' | 'psychology' | 'mindset';

export default function AnalysisPage() {
  const { t, language } = useLanguage();
  const { selectedAccount, accounts, setSelectedAccount } = useAccount();
  const { user } = useAuth();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [psychSubTab, setPsychSubTab] = useState<'pre' | 'during' | 'post'>('pre');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, rData] = await Promise.all([getTrades(), getReviews()]);
      setTrades(tData || []);
      setReviews(rData || []);
    } catch (err) {
      console.error('Error loading analysis data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, selectedAccount?.id]);

  // Filter trades based on account and date range
  const filteredTrades = useMemo(() => {
    let list = trades;
    if (selectedAccount?.id) {
      list = list.filter(t => t.accountId === selectedAccount.id);
    }

    if (dateFilter === 'all') return list;

    const now = new Date();
    return list.filter(t => {
      const entry = new Date(t.entryDate);
      if (isNaN(entry.getTime())) return true;

      if (dateFilter === '7d') {
        const diff = (now.getTime() - entry.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      }
      if (dateFilter === '30d') {
        const diff = (now.getTime() - entry.getTime()) / (1000 * 3600 * 24);
        return diff <= 30;
      }
      if (dateFilter === 'month') {
        return entry.getMonth() === now.getMonth() && entry.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [trades, selectedAccount?.id, dateFilter]);

  // Filter reviews based on date range
  const filteredReviews = useMemo(() => {
    if (dateFilter === 'all') return reviews;
    const now = new Date();
    return reviews.filter(r => {
      if (!r.date) return true;
      const rDate = new Date(r.date);
      if (isNaN(rDate.getTime())) return true;

      if (dateFilter === '7d') {
        const diff = (now.getTime() - rDate.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      }
      if (dateFilter === '30d') {
        const diff = (now.getTime() - rDate.getTime()) / (1000 * 3600 * 24);
        return diff <= 30;
      }
      if (dateFilter === 'month') {
        return rDate.getMonth() === now.getMonth() && rDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [reviews, dateFilter]);

  // Computed analysis metrics
  const technicalStats: TechnicalStats = useMemo(() => {
    return computeTechnicalStats(filteredTrades);
  }, [filteredTrades]);

  const psychologyStats: PsychologyStats = useMemo(() => {
    return computePsychologyStats(filteredTrades, filteredReviews);
  }, [filteredTrades, filteredReviews]);

  const mindsetStats: MindsetStats = useMemo(() => {
    return computeMindsetStats(filteredTrades, filteredReviews);
  }, [filteredTrades, filteredReviews]);

  const traderScores: TraderScores = useMemo(() => {
    return computeTraderScores(technicalStats, psychologyStats, mindsetStats);
  }, [technicalStats, psychologyStats, mindsetStats]);

  const actionableInsights: ActionableInsight[] = useMemo(() => {
    return generateActionableInsights(technicalStats, psychologyStats, mindsetStats);
  }, [technicalStats, psychologyStats, mindsetStats]);

  if (loading) {
    return (
      <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* ---------------- Top Header Bar ---------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
                {t('analysis') || 'Trader Analysis'}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                {t('analysisSubtitle') || 'วิเคราะห์เจาะลึก 3 มิติ: เทคนิค จิตวิทยา และวินัย'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Account Selector */}
          {accounts.length > 1 && (
            <select
              value={selectedAccount?.id || ''}
              onChange={e => {
                const found = accounts.find(a => a.id === e.target.value);
                if (found) setSelectedAccount(found);
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-sm hover:border-blue-500/50 transition cursor-pointer"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency} {acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          )}

          {/* Date Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
            {(
              [
                { id: 'all', label: t('filterAll') || 'ทั้งหมด' },
                { id: '30d', label: t('filter30Days') || '30 วัน' },
                { id: '7d', label: t('filter7Days') || '7 วัน' },
                { id: 'month', label: t('filterThisMonth') || 'เดือนนี้' },
              ] as const
            ).map(f => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  dateFilter === f.id
                    ? 'bg-white dark:bg-[#252525] text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-500 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ---------------- Hero: Trader Health Scorecard ---------------- */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white border border-blue-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Score Dial */}
          <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400/90 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {t('traderScore') || 'คะแนนประเมินเทรดเดอร์'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-6xl md:text-7xl font-black tracking-tight text-white">
                {traderScores.overallScore}
              </span>
              <span className="text-xl font-bold text-slate-400">/ 100</span>
            </div>
            <div className={`mt-3 px-3 py-1 rounded-full text-xs font-extrabold border inline-flex items-center gap-1.5 ${traderScores.colorClass}`}>
              {traderScores.ratingLabel}
            </div>
            <p className="text-xs text-slate-300/80 mt-3 max-w-xs">
              คำนวณถ่วงน้ำหนักจาก ความคมทางเทคนิค (40%), ความนิ่งของจิตวิทยา (30%) และวินัยการตามแผน (30%)
            </p>
          </div>

          {/* 3 Pillar Meter Bars */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Technical */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  {t('technicalScoreLabel') || 'ความคมเชิงเทคนิค'}
                </span>
                <span className="font-extrabold text-blue-400">{traderScores.technicalScore}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${traderScores.technicalScore}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                <span>WR: {technicalStats.winRate}%</span>
                <span>PF: {technicalStats.profitFactor}</span>
                <span>RR: {technicalStats.avgRR}R</span>
              </div>
            </div>

            {/* 2. Psychology */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  {t('psychologyScoreLabel') || 'ความมั่นคงทางอารมณ์'}
                </span>
                <span className="font-extrabold text-purple-400">{traderScores.psychologyScore}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${traderScores.psychologyScore}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                <span>อารมณ์หลัก: {psychologyStats.dominantEmotion}</span>
                <span>กับดัก: {psychologyStats.pitfalls.reduce((acc, p) => acc + p.count, 0)}</span>
              </div>
            </div>

            {/* 3. Discipline */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  {t('disciplineScoreLabel') || 'วินัยการตามแผน'}
                </span>
                <span className="font-extrabold text-emerald-400">{traderScores.disciplineScore}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                  style={{ width: `${traderScores.disciplineScore}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 flex justify-between pt-1">
                <span>ตามกฎ: {mindsetStats.disciplineRate}%</span>
                <span>Revenge: {mindsetStats.revengeTradeCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Navigation Tabs ---------------- */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] overflow-x-auto pb-px">
        {[
          { id: 'overview', label: t('tabOverview') || 'ภาพรวม & โค้ช AI', icon: Sparkles },
          { id: 'technical', label: t('tabTechnical') || 'ประสิทธิภาพเชิงเทคนิค', icon: Target },
          { id: 'psychology', label: t('tabPsychology') || 'สภาวะจิตวิทยา', icon: Brain },
          { id: 'mindset', label: t('tabMindset') || 'กรอบความคิด & วินัย', icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-extrabold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & AI COACH                                               */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Key Metrics Quick Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a] shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Profit</span>
              <div className={`text-2xl font-black mt-1 ${technicalStats.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {technicalStats.netProfit >= 0 ? '+' : ''}${technicalStats.netProfit.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">จาก {technicalStats.closedTrades} ไม้ที่ปิดแล้ว</span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a] shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Win Rate</span>
              <div className="text-2xl font-black mt-1 text-blue-600 dark:text-blue-400">
                {technicalStats.winRate}%
              </div>
              <span className="text-[11px] text-slate-400">
                {technicalStats.wins} ชนะ / {technicalStats.losses} แพ้
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a] shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profit Factor</span>
              <div className="text-2xl font-black mt-1 text-slate-900 dark:text-white">
                {technicalStats.profitFactor}
              </div>
              <span className="text-[11px] text-slate-400">
                Expected: ${technicalStats.expectedValue}/ไม้
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a] shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rule Compliance</span>
              <div className="text-2xl font-black mt-1 text-emerald-500">
                {mindsetStats.disciplineRate}%
              </div>
              <span className="text-[11px] text-slate-400">
                ประเมินตนเองเฉลี่ย {mindsetStats.avgSelfScore} / 10
              </span>
            </div>
          </div>

          {/* Actionable Coach Insights */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-black tracking-tight">
                {t('actionableInsightsLabel') || 'ข้อสรุปและคำแนะนำเชิงปฏิบัติ (AI Coach)'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {actionableInsights.map((insight, idx) => {
                const isStrength = insight.type === 'STRENGTH';
                const isLeak = insight.type === 'LEAK';

                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border backdrop-blur-sm relative overflow-hidden transition-all hover:scale-[1.01] ${
                      isStrength
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : isLeak
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : 'border-blue-500/30 bg-blue-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isStrength
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : isLeak
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isStrength ? '🏆 จุดแข็ง (Edge)' : isLeak ? '⚠️ จุดรั่วไหล (Leak)' : '💡 คำแนะนำ (Action)'}
                      </span>
                      {insight.impact && (
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                          {insight.impact}
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-1.5">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Overview Split: Technical Edge vs Mindset Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Strategy Table */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
              <h3 className="text-base font-black mb-4 flex items-center justify-between">
                <span>Top กลยุทธ์ที่ทำกำไร</span>
                <span className="text-xs font-normal text-slate-400">เรียงตาม P&L</span>
              </h3>
              {technicalStats.strategies.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">ยังไม่มีข้อมูลกลยุทธ์</p>
              ) : (
                <div className="space-y-3">
                  {technicalStats.strategies.slice(0, 4).map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{s.strategy}</div>
                        <div className="text-[11px] text-slate-400">
                          {s.total} ไม้ (ชนะ {s.wins} / แพ้ {s.losses}) • RR: {s.avgRR}R
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-bold text-sm ${s.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {s.netPnL >= 0 ? '+' : ''}${s.netPnL.toLocaleString()}
                        </div>
                        <div className="text-[11px] font-semibold text-blue-500">
                          Win Rate {s.winRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discipline vs Pitfalls Alert */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
              <h3 className="text-base font-black mb-4 flex items-center justify-between">
                <span>ความเสียหายจากการแหกกฎ (Discipline Check)</span>
                <span className="text-xs font-bold text-rose-500">
                  รั่วไหล: -${mindsetStats.costOfBreakingRules.toLocaleString()}
                </span>
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">ไม้ที่ทำตามแผน (ตามกฎ)</div>
                      <div className="text-[11px] text-slate-500">{mindsetStats.followedRules.count} ไม้ • Win Rate {mindsetStats.followedRules.winRate.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="font-mono font-black text-emerald-500">
                    {mindsetStats.followedRules.netPnL >= 0 ? '+' : ''}${mindsetStats.followedRules.netPnL.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-rose-500" />
                    <div>
                      <div className="text-xs font-bold text-rose-700 dark:text-rose-300">ไม้ที่แหกกฎ / นอกแผน</div>
                      <div className="text-[11px] text-slate-500">{mindsetStats.brokeRules.count} ไม้ • Win Rate {mindsetStats.brokeRules.winRate.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="font-mono font-black text-rose-500">
                    ${mindsetStats.brokeRules.netPnL.toLocaleString()}
                  </div>
                </div>

                {mindsetStats.revengeTradeCount > 0 && (
                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
                    <Flame className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div>
                      ตรวจพบการเข้าไม้เอาคืน (Revenge Trade) <strong>{mindsetStats.revengeTradeCount} ครั้ง</strong> (P&L: ${mindsetStats.revengeTradePnL.toLocaleString()})
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TECHNICAL EDGE                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'technical' && (
        <div className="space-y-8 animate-fade-in">
          {/* Strategy Breakdown Table & Comparison */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-lg font-black tracking-tight">{t('strategyPerformance') || 'ประสิทธิภาพตามกลยุทธ์ (Setup)'}</h2>
                <p className="text-xs text-slate-400">เปรียบเทียบผลงานของแต่ละกลยุทธ์ เพื่อเลือกเทรดเฉพาะ Setup ที่ให้ Edge สูงสุด</p>
              </div>
            </div>

            {technicalStats.strategies.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">ยังไม่มีข้อมูลกลยุทธ์ในรายการเทรด</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/[0.08] text-slate-400 font-bold">
                      <th className="py-3 px-4">กลยุทธ์ (Strategy)</th>
                      <th className="py-3 px-4 text-center">จำนวนไม้</th>
                      <th className="py-3 px-4 text-center">ชนะ / แพ้</th>
                      <th className="py-3 px-4 text-center">Win Rate</th>
                      <th className="py-3 px-4 text-center">Average RR</th>
                      <th className="py-3 px-4 text-right">Net P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {technicalStats.strategies.map((strat, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                          {strat.strategy}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{strat.total}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-emerald-500 font-bold">{strat.wins}</span> / <span className="text-rose-500 font-bold">{strat.losses}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <span className="font-bold">{strat.winRate.toFixed(1)}%</span>
                            <div className="w-12 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, strat.winRate)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                          {strat.avgRR > 0 ? `${strat.avgRR}R` : '—'}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-black ${strat.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {strat.netPnL >= 0 ? '+' : ''}${strat.netPnL.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Direction & Instrument Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Long vs Short */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
              <h3 className="text-base font-black mb-4 flex items-center justify-between">
                <span>{t('directionAnalysis') || 'สถิติแยกตามทิศทาง (LONG vs SHORT)'}</span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center justify-center gap-1">
                    <ArrowUpRight className="w-4 h-4" /> LONG
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {technicalStats.longStats.winRate.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Win Rate ({technicalStats.longStats.total} ไม้)</div>
                  <div className={`mt-2 font-mono font-bold text-sm ${technicalStats.longStats.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {technicalStats.longStats.netPnL >= 0 ? '+' : ''}${technicalStats.longStats.netPnL.toLocaleString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center">
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-1 flex items-center justify-center gap-1">
                    <ArrowDownLeft className="w-4 h-4" /> SHORT
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {technicalStats.shortStats.winRate.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Win Rate ({technicalStats.shortStats.total} ไม้)</div>
                  <div className={`mt-2 font-mono font-bold text-sm ${technicalStats.shortStats.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {technicalStats.shortStats.netPnL >= 0 ? '+' : ''}${technicalStats.shortStats.netPnL.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk:Reward Execution */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
              <h3 className="text-base font-black mb-4 flex items-center justify-between">
                <span>{t('rrExecution') || 'การจัดการ Risk:Reward (วางแผน vs ปิดจริง)'}</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500">Planned RR (ที่วางแผนไว้):</span>
                    <span className="text-blue-500 font-mono">{technicalStats.plannedRRAvg > 0 ? `${technicalStats.plannedRRAvg}R` : '—'}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (technicalStats.plannedRRAvg / 3) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-500">Actual RR (ที่ปิดได้จริง):</span>
                    <span className="text-emerald-500 font-mono">{technicalStats.avgRR > 0 ? `${technicalStats.avgRR}R` : '—'}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (technicalStats.avgRR / 3) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] text-[11px] text-slate-500 leading-relaxed">
                  {technicalStats.avgRR >= technicalStats.plannedRRAvg && technicalStats.avgRR > 0
                    ? '✓ เยี่ยมมาก! คุณสามารถปล่อยให้กำไรวิ่ง (Let profits run) ได้ตามเป้าหมาย หรือเกินเป้าหมาย'
                    : '⚠️ Actual RR ต่ำกว่า Planned RR: บ่งบอกถึงการปิดทำกำไรก่อนถึงเป้าหมายด้วยความลังเล'}
                </div>
              </div>
            </div>
          </div>

          {/* Instrument Breakdown Table */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
            <h3 className="text-base font-black mb-4">
              {t('pairPerformance') || 'ประสิทธิภาพตามสินทรัพย์ (Instruments / Pairs)'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicalStats.instruments.map((inst, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-slate-900 dark:text-white">{inst.instrument}</span>
                    <span className={`font-mono font-bold text-xs ${inst.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {inst.netPnL >= 0 ? '+' : ''}${inst.netPnL.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{inst.total} ไม้ (ชนะ {inst.wins} / แพ้ {inst.losses})</span>
                    <span className="font-bold text-blue-500">Win Rate {inst.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, inst.winRate)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between pt-0.5">
                    <span>LONG: {inst.longs}</span>
                    <span>SHORT: {inst.shorts}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day of the week stats */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
            <h3 className="text-base font-black mb-4">
              {t('dayOfWeekPerformance') || 'สถิติแยกตามวันในสัปดาห์ (Day of Week Edge)'}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {technicalStats.dayOfWeek.map(d => (
                <div key={d.dayIndex} className="p-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] text-center space-y-1">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">{d.dayName}</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">{d.winRate.toFixed(0)}%</div>
                  <div className="text-[10px] text-slate-400">{d.total} ไม้</div>
                  <div className={`text-[11px] font-mono font-bold ${d.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    ${d.netPnL.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRADING PSYCHOLOGY                                                */}
      {/* ========================================================================= */}
      {activeTab === 'psychology' && (
        <div className="space-y-8 animate-fade-in">
          {/* Psychology Highlights Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smile className="w-4 h-4" /> สภาวะอารมณ์ทำกำไรสูงสุด
              </span>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
                "{psychologyStats.bestEmotionForProfit}"
              </div>
              <p className="text-xs text-slate-500 mt-1">
                การเข้าเทรดด้วยอารมณ์นี้สร้างกำไรสุทธิเฉลี่ยและ Win Rate ได้ดีที่สุด
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Frown className="w-4 h-4" /> สภาวะอารมณ์ที่อันตรายที่สุด
              </span>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
                "{psychologyStats.worstEmotionForProfit}"
              </div>
              <p className="text-xs text-slate-500 mt-1">
                เมื่อรู้สึกเช่นนี้ ควรหยุดเทรดทันทีเพราะสถิติบ่งชี้ว่ามักขาดทุน
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4" /> อารมณ์ที่เกิดขึ้นบ่อยที่สุด
              </span>
              <div className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
                "{psychologyStats.dominantEmotion}"
              </div>
              <p className="text-xs text-slate-500 mt-1">
                อารมณ์มาตรฐานที่คุณใช้เข้าตลาดเป็นประจำ
              </p>
            </div>
          </div>

          {/* Emotional Impact Matrix */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-black tracking-tight">{t('emotionMatrix') || 'ผลตอบแทนแยกตามสภาวะอารมณ์ (Emotion P&L Matrix)'}</h2>
                <p className="text-xs text-slate-400">ดูว่าความรู้สึกในแต่ละช่วงของการเทรด ส่งผลต่อผลงานและพอร์ตของคุณอย่างไร</p>
              </div>

              {/* Sub tabs: Pre / During / Post */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] self-start sm:self-auto">
                <button
                  onClick={() => setPsychSubTab('pre')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    psychSubTab === 'pre'
                      ? 'bg-white dark:bg-[#252525] text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  ก่อนเข้าไม้ (Pre-Trade)
                </button>
                <button
                  onClick={() => setPsychSubTab('during')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    psychSubTab === 'during'
                      ? 'bg-white dark:bg-[#252525] text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  ระหว่างถือไม้ (During)
                </button>
                <button
                  onClick={() => setPsychSubTab('post')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    psychSubTab === 'post'
                      ? 'bg-white dark:bg-[#252525] text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  หลังปิดไม้ (Post-Trade)
                </button>
              </div>
            </div>

            {/* Selected Matrix Grid */}
            {(() => {
              const list =
                psychSubTab === 'pre'
                  ? psychologyStats.preTrade
                  : psychSubTab === 'during'
                  ? psychologyStats.duringTrade
                  : psychologyStats.postTrade;

              if (list.length === 0) {
                return <p className="text-xs text-slate-400 py-8 text-center">ยังไม่มีข้อมูลอารมณ์ในหมวดนี้</p>;
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {list.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] space-y-2 hover:border-purple-500/30 transition"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          {item.emotion}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          {item.total} ไม้
                        </span>
                      </div>

                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Win Rate:</span>
                        <span className="font-bold text-blue-500">{item.winRate.toFixed(1)}%</span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, item.winRate)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/[0.04]">
                        <span className="text-slate-400">Net P&L:</span>
                        <span className={`font-mono font-black ${item.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {item.netPnL >= 0 ? '+' : ''}${item.netPnL.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Psychology Pitfalls Tracker */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
            <h3 className="text-base font-black mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {t('psychPitfalls') || 'ดัชนีกับดักทางอารมณ์ (Psychology Pitfalls Tracker)'}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {psychologyStats.pitfalls.map((pit, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border text-center transition ${
                    pit.count > 0
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : 'border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="text-2xl mb-1">{pit.emoji}</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{pit.name}</div>
                  <div className={`mt-2 font-black text-lg ${pit.count > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {pit.count} <span className="text-[10px] font-normal text-slate-400">ครั้ง</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MINDSET & DISCIPLINE                                              */}
      {/* ========================================================================= */}
      {activeTab === 'mindset' && (
        <div className="space-y-8 animate-fade-in">
          {/* Rule Discipline Card */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
            <h2 className="text-lg font-black tracking-tight mb-2">
              {t('ruleCompliance') || 'อัตราการปฏิบัติตามกฎ & ผลกระทบต่อพอร์ต'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              การเปรียบเทียบผลตอบแทนระหว่าง "การเทรดตามแผนและวินัย" กับ "การแหกกฎ"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Followed Rules */}
              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-base">
                    <CheckCircle2 className="w-5 h-5" />
                    ไม้ที่ทำตามกฎ (Followed Rules)
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    {mindsetStats.followedRules.count} ไม้
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Win Rate:</span>
                    <span className="font-bold text-emerald-500">{mindsetStats.followedRules.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-emerald-500/20">
                    <span>กำไรสุทธิ (Net P&L):</span>
                    <span className="font-mono text-emerald-500 text-lg">
                      {mindsetStats.followedRules.netPnL >= 0 ? '+' : ''}${mindsetStats.followedRules.netPnL.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Broke Rules */}
              <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-base">
                    <XCircle className="w-5 h-5" />
                    ไม้ที่แหกกฎ (Broke Rules)
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400">
                    {mindsetStats.brokeRules.count} ไม้
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Win Rate:</span>
                    <span className="font-bold text-rose-500">{mindsetStats.brokeRules.winRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-rose-500/20">
                    <span>ความเสียหาย (Net P&L):</span>
                    <span className="font-mono text-rose-500 text-lg">
                      ${mindsetStats.brokeRules.netPnL.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Cost of Breaking Rules Callout */}
            {mindsetStats.costOfBreakingRules > 0 && (
              <div className="mt-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between text-xs md:text-sm">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <div>
                    <strong>ต้นทุนความเสียหายจากการแหกกฎ (Cost of Breaking Rules):</strong>{' '}
                    หากคุณไม่กดไม้ที่แหกกฎเหล่านี้ พอร์ตจะมีกำไรเพิ่มขึ้นทันที <strong>+${mindsetStats.costOfBreakingRules.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Revenge Trading Detector & Top Mistakes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenge Trading Detector */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a]">
              <h3 className="text-base font-black mb-2 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                {t('revengeTradingDetector') || 'ระบบตรวจจับการเทรดเอาคืน (Revenge Trading)'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                ตรวจสอบไม้ที่เปิดภายใน 60 นาทีหลังโดน SL ด้วย Lot Size ที่เพิ่มขึ้น
              </p>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] text-center space-y-2">
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {mindsetStats.revengeTradeCount}{' '}
                  <span className="text-sm font-normal text-slate-400">ครั้งที่ตรวจพบ</span>
                </div>
                <div className="text-xs text-slate-500">
                  ผลรวมความเสียหาย: <span className="font-mono font-bold text-rose-500">${mindsetStats.revengeTradePnL.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                  {mindsetStats.revengeTradeCount === 0
                    ? '✓ ยอดเยี่ยมมาก! ไม่พบพฤติกรรมเร่งเอาคืนหลังเสีย'
                    : '⚠️ การเทรดเอาคืนมักเกิดจาก Cortisol สูง แนะนำให้ตั้งกฎบังคับปิดจอ 30 นาทีทันทีหลัง SL'}
                </div>
              </div>
            </div>

            {/* Top Mistakes & Lessons */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#1a1a1a] space-y-4">
              <h3 className="text-base font-black flex items-center justify-between">
                <span>{t('topMistakesLabel') || 'ข้อผิดพลาดที่พบบ่อยที่สุด'}</span>
                <span className="text-xs font-normal text-slate-400">จากบันทึกทบทวน</span>
              </h3>

              {mindsetStats.topMistakes.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">ยังไม่มีข้อมูลข้อผิดพลาดที่บันทึกไว้</p>
              ) : (
                <div className="space-y-2">
                  {mindsetStats.topMistakes.map((m, i) => (
                    <div key={i} className="flex justify-between items-center p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs">
                      <span className="font-semibold text-rose-700 dark:text-rose-300">
                        {i + 1}. {m.text}
                      </span>
                      <span className="font-bold text-rose-500 font-mono">{m.count} ครั้ง</span>
                    </div>
                  ))}
                </div>
              )}

              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider pt-2">
                {t('topLessonsLabel') || 'บทเรียนสำคัญที่ต้องจดจำ'}
              </h4>
              {mindsetStats.topLessons.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">ยังไม่มีบันทึกบทเรียน</p>
              ) : (
                <div className="space-y-1.5">
                  {mindsetStats.topLessons.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      <span>{l.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
