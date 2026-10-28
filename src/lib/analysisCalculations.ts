import { Trade } from '@/types/trade';
import { Review } from '@/types/review';

export interface StrategyStat {
  strategy: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
  avgRR: number;
}

export interface InstrumentStat {
  instrument: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
  longs: number;
  shorts: number;
}

export interface EmotionStat {
  emotion: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
  avgPnL: number;
}

export interface DayOfWeekStat {
  dayName: string;
  dayIndex: number;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  netPnL: number;
}

export interface TechnicalStats {
  totalTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfit: number;
  grossWins: number;
  grossLosses: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
  plannedRRAvg: number;
  expectedValue: number;
  longStats: { total: number; winRate: number; netPnL: number };
  shortStats: { total: number; winRate: number; netPnL: number };
  strategies: StrategyStat[];
  instruments: InstrumentStat[];
  dayOfWeek: DayOfWeekStat[];
}

export interface PsychologyStats {
  preTrade: EmotionStat[];
  duringTrade: EmotionStat[];
  postTrade: EmotionStat[];
  pitfalls: { key: string; name: string; emoji: string; count: number }[];
  energyCorrelation: {
    high: { count: number; avgRating: number };
    normal: { count: number; avgRating: number };
    low: { count: number; avgRating: number };
  };
  dominantEmotion: string;
  bestEmotionForProfit: string;
  worstEmotionForProfit: string;
}

export interface MindsetStats {
  disciplineRate: number;
  followedRules: { count: number; winRate: number; netPnL: number };
  brokeRules: { count: number; winRate: number; netPnL: number };
  costOfBreakingRules: number;
  revengeTradeCount: number;
  revengeTradePnL: number;
  topMistakes: { text: string; count: number }[];
  topLessons: { text: string; count: number }[];
  avgSelfScore: number;
}

export interface TraderScores {
  overallScore: number; // 0-100
  technicalScore: number; // 0-100
  psychologyScore: number; // 0-100
  disciplineScore: number; // 0-100
  ratingLabel: string;
  colorClass: string;
}

export interface ActionableInsight {
  type: 'STRENGTH' | 'LEAK' | 'RECOMMENDATION';
  title: string;
  description: string;
  impact?: string;
}

// ---------------- Helper Calculations ----------------

export function computeTechnicalStats(trades: Trade[]): TechnicalStats {
  const closed = trades.filter(t => t.status !== 'OPEN');
  const wins = closed.filter(t => t.status === 'WIN');
  const losses = closed.filter(t => t.status === 'LOSS');

  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
  const netProfit = trades.reduce((acc, t) => acc + (t.financials.netPnL || 0), 0);

  const grossWins = wins.reduce((acc, t) => acc + Math.max(0, t.financials.netPnL || 0), 0);
  const grossLosses = Math.abs(losses.reduce((acc, t) => acc + Math.min(0, t.financials.netPnL || 0), 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 99 : 0;

  const avgWin = wins.length > 0 ? grossWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLosses / losses.length : 0;

  const rrTrades = closed.filter(t => t.analysis?.actualRR != null && t.analysis.actualRR > 0);
  const avgRR = rrTrades.length > 0 ? rrTrades.reduce((acc, t) => acc + (t.analysis.actualRR || 0), 0) / rrTrades.length : 0;

  const plannedTrades = closed.filter(t => t.analysis?.plannedRR != null && t.analysis.plannedRR > 0);
  const plannedRRAvg = plannedTrades.length > 0 ? plannedTrades.reduce((acc, t) => acc + (t.analysis.plannedRR || 0), 0) / plannedTrades.length : 0;

  // Expected Value = (WinRate * AvgWin) - (LossRate * AvgLoss)
  const lossRate = 100 - winRate;
  const expectedValue = closed.length > 0 ? ((winRate / 100) * avgWin) - ((lossRate / 100) * avgLoss) : 0;

  // Long vs Short
  const longs = closed.filter(t => t.direction === 'LONG');
  const shorts = closed.filter(t => t.direction === 'SHORT');
  const longWins = longs.filter(t => t.status === 'WIN').length;
  const shortWins = shorts.filter(t => t.status === 'WIN').length;

  const longStats = {
    total: longs.length,
    winRate: longs.length > 0 ? (longWins / longs.length) * 100 : 0,
    netPnL: longs.reduce((acc, t) => acc + (t.financials.netPnL || 0), 0),
  };
  const shortStats = {
    total: shorts.length,
    winRate: shorts.length > 0 ? (shortWins / shorts.length) * 100 : 0,
    netPnL: shorts.reduce((acc, t) => acc + (t.financials.netPnL || 0), 0),
  };

  // Strategy breakdown
  const stratMap = new Map<string, { total: number; wins: number; losses: number; netPnL: number; rrSum: number; rrCount: number }>();
  closed.forEach(t => {
    const sName = t.analysis?.strategy?.trim() || 'No Strategy';
    const curr = stratMap.get(sName) || { total: 0, wins: 0, losses: 0, netPnL: 0, rrSum: 0, rrCount: 0 };
    curr.total += 1;
    if (t.status === 'WIN') curr.wins += 1;
    if (t.status === 'LOSS') curr.losses += 1;
    curr.netPnL += t.financials.netPnL || 0;
    if (t.analysis?.actualRR != null && t.analysis.actualRR > 0) {
      curr.rrSum += t.analysis.actualRR;
      curr.rrCount += 1;
    }
    stratMap.set(sName, curr);
  });

  const strategies: StrategyStat[] = Array.from(stratMap.entries()).map(([strategy, d]) => ({
    strategy,
    total: d.total,
    wins: d.wins,
    losses: d.losses,
    winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
    netPnL: Number(d.netPnL.toFixed(2)),
    avgRR: d.rrCount > 0 ? Number((d.rrSum / d.rrCount).toFixed(2)) : 0,
  })).sort((a, b) => b.netPnL - a.netPnL);

  // Instrument breakdown
  const instMap = new Map<string, { total: number; wins: number; losses: number; netPnL: number; longs: number; shorts: number }>();
  closed.forEach(t => {
    const inst = (t.instrument || 'UNKNOWN').toUpperCase();
    const curr = instMap.get(inst) || { total: 0, wins: 0, losses: 0, netPnL: 0, longs: 0, shorts: 0 };
    curr.total += 1;
    if (t.status === 'WIN') curr.wins += 1;
    if (t.status === 'LOSS') curr.losses += 1;
    curr.netPnL += t.financials.netPnL || 0;
    if (t.direction === 'LONG') curr.longs += 1;
    if (t.direction === 'SHORT') curr.shorts += 1;
    instMap.set(inst, curr);
  });

  const instruments: InstrumentStat[] = Array.from(instMap.entries()).map(([instrument, d]) => ({
    instrument,
    total: d.total,
    wins: d.wins,
    losses: d.losses,
    winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
    netPnL: Number(d.netPnL.toFixed(2)),
    longs: d.longs,
    shorts: d.shorts,
  })).sort((a, b) => b.netPnL - a.netPnL);

  // Day of week breakdown
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const dayStats: DayOfWeekStat[] = days.map((dayName, idx) => {
    const dayTrades = closed.filter(t => {
      const d = new Date(t.entryDate);
      return !isNaN(d.getTime()) && d.getDay() === idx;
    });
    const dWins = dayTrades.filter(t => t.status === 'WIN').length;
    const dLosses = dayTrades.filter(t => t.status === 'LOSS').length;
    return {
      dayName,
      dayIndex: idx,
      total: dayTrades.length,
      wins: dWins,
      losses: dLosses,
      winRate: dayTrades.length > 0 ? (dWins / dayTrades.length) * 100 : 0,
      netPnL: Number(dayTrades.reduce((acc, t) => acc + (t.financials.netPnL || 0), 0).toFixed(2)),
    };
  });

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRate: Number(winRate.toFixed(1)),
    netProfit: Number(netProfit.toFixed(2)),
    grossWins: Number(grossWins.toFixed(2)),
    grossLosses: Number(grossLosses.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    avgRR: Number(avgRR.toFixed(2)),
    plannedRRAvg: Number(plannedRRAvg.toFixed(2)),
    expectedValue: Number(expectedValue.toFixed(2)),
    longStats,
    shortStats,
    strategies,
    instruments,
    dayOfWeek: dayStats,
  };
}

export function computePsychologyStats(trades: Trade[], reviews: Review[]): PsychologyStats {
  const closed = trades.filter(t => t.status !== 'OPEN');

  const extractEmotions = (getter: (t: Trade) => string | null | undefined): EmotionStat[] => {
    const map = new Map<string, { total: number; wins: number; losses: number; netPnL: number }>();
    closed.forEach(t => {
      const raw = getter(t);
      if (!raw) return;
      // Split multiple feelings if separated by comma or semicolon
      const tokens = raw.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
      tokens.forEach(tok => {
        const curr = map.get(tok) || { total: 0, wins: 0, losses: 0, netPnL: 0 };
        curr.total += 1;
        if (t.status === 'WIN') curr.wins += 1;
        if (t.status === 'LOSS') curr.losses += 1;
        curr.netPnL += t.financials.netPnL || 0;
        map.set(tok, curr);
      });
    });

    return Array.from(map.entries())
      .map(([emotion, d]) => ({
        emotion,
        total: d.total,
        wins: d.wins,
        losses: d.losses,
        winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
        netPnL: Number(d.netPnL.toFixed(2)),
        avgPnL: d.total > 0 ? Number((d.netPnL / d.total).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const preTrade = extractEmotions(t => t.notes?.preTrade);
  const duringTrade = extractEmotions(t => t.notes?.duringTrade);
  const postTrade = extractEmotions(t => t.notes?.postTrade);

  // Pitfalls from reviews
  const pitfallDefs = [
    { key: 'fomo', name: 'FOMO เข้าตามอารมณ์', emoji: '⚡' },
    { key: 'revenge', name: 'Revenge Trade เอาคืน', emoji: '🔥' },
    { key: 'overtrading', name: 'Overtrading เทรดมากเกินไป', emoji: '🎰' },
    { key: 'hesitation', name: 'ลังเล ไม่กล้ากด', emoji: '🐢' },
    { key: 'early_exit', name: 'ออกก่อนแผน กลัวกำไรหาย', emoji: '🏃' },
    { key: 'moving_sl', name: 'เลื่อน SL หนี', emoji: '🚷' },
  ];

  const pitfalls = pitfallDefs.map(p => {
    let count = 0;
    reviews.forEach(r => {
      if ((r as any).psychologyPitfalls && Array.isArray((r as any).psychologyPitfalls)) {
        if ((r as any).psychologyPitfalls.includes(p.key)) count++;
      }
      // Or check text in mistakes/notes
      const fullText = `${r.mistakes || ''} ${r.notes || ''}`.toLowerCase();
      if (p.key === 'fomo' && fullText.includes('fomo')) count++;
      if (p.key === 'revenge' && (fullText.includes('เอาคืน') || fullText.includes('revenge'))) count++;
      if (p.key === 'overtrading' && (fullText.includes('ovt') || fullText.includes('overtrade') || fullText.includes('เทรดเกิน'))) count++;
      if (p.key === 'moving_sl' && (fullText.includes('เอา sl ออก') || fullText.includes('เลื่อน sl'))) count++;
    });
    return { ...p, count };
  });

  // Energy correlation
  const energyCorrelation = {
    high: { count: 0, avgRating: 0 },
    normal: { count: 0, avgRating: 0 },
    low: { count: 0, avgRating: 0 },
  };
  const energyRatingSums = { high: 0, normal: 0, low: 0 };

  reviews.forEach(r => {
    const level = (r as any).energyLevel as 'high' | 'normal' | 'low';
    if (level && energyCorrelation[level]) {
      energyCorrelation[level].count++;
      energyRatingSums[level] += r.rating || 0;
    }
  });
  (['high', 'normal', 'low'] as const).forEach(k => {
    if (energyCorrelation[k].count > 0) {
      energyCorrelation[k].avgRating = Number((energyRatingSums[k] / energyCorrelation[k].count).toFixed(1));
    }
  });

  // Dominant emotion
  const dominantEmotion = preTrade[0]?.emotion || 'สงบนิ่ง';

  // Best / Worst emotions by netPnL
  const sortedByPnL = [...preTrade].sort((a, b) => b.netPnL - a.netPnL);
  const bestEmotionForProfit = sortedByPnL[0]?.emotion || 'มั่นใจ';
  const worstEmotionForProfit = sortedByPnL[sortedByPnL.length - 1]?.emotion || 'FOMO';

  return {
    preTrade,
    duringTrade,
    postTrade,
    pitfalls,
    energyCorrelation,
    dominantEmotion,
    bestEmotionForProfit,
    worstEmotionForProfit,
  };
}

export function computeMindsetStats(trades: Trade[], reviews: Review[]): MindsetStats {
  const closed = trades.filter(t => t.status !== 'OPEN');

  // Discipline Rate from reviews
  let followedCount = 0;
  let brokeCount = 0;

  reviews.forEach(r => {
    if (r.followedRules === true) followedCount++;
    else if (r.followedRules === false) brokeCount++;
  });

  const totalReviewsWithRules = followedCount + brokeCount;
  const disciplineRate = totalReviewsWithRules > 0 ? (followedCount / totalReviewsWithRules) * 100 : 80;

  // Correlate rule adherence with daily trades if dates match
  const reviewMap = new Map<string, boolean | undefined>();
  reviews.forEach(r => {
    if (r.date) {
      const dateKey = r.date.split('T')[0];
      reviewMap.set(dateKey, r.followedRules);
    }
  });

  let followedPnL = 0;
  let followedTrades = 0;
  let followedWins = 0;

  let brokePnL = 0;
  let brokeTrades = 0;
  let brokeWins = 0;

  closed.forEach(t => {
    const tradeDate = t.entryDate.split('T')[0];
    const isRuleFollowed = reviewMap.get(tradeDate);
    const pnl = t.financials.netPnL || 0;

    if (isRuleFollowed === false) {
      brokeTrades++;
      brokePnL += pnl;
      if (t.status === 'WIN') brokeWins++;
    } else {
      // Default to followed if true or undefined
      followedTrades++;
      followedPnL += pnl;
      if (t.status === 'WIN') followedWins++;
    }
  });

  const followedRules = {
    count: followedTrades,
    winRate: followedTrades > 0 ? (followedWins / followedTrades) * 100 : 0,
    netPnL: Number(followedPnL.toFixed(2)),
  };

  const brokeRules = {
    count: brokeTrades,
    winRate: brokeTrades > 0 ? (brokeWins / brokeTrades) * 100 : 0,
    netPnL: Number(brokePnL.toFixed(2)),
  };

  // Cost of breaking rules is the loss incurred from breaking rules
  const costOfBreakingRules = brokePnL < 0 ? Math.abs(brokePnL) : 0;

  // Revenge Trading Detector
  // Sort trades chronologically
  const sortedTrades = [...closed].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
  let revengeTradeCount = 0;
  let revengeTradePnL = 0;

  for (let i = 1; i < sortedTrades.length; i++) {
    const prevTrade = sortedTrades[i - 1];
    const currTrade = sortedTrades[i];

    if (prevTrade.status === 'LOSS') {
      const prevTime = new Date(prevTrade.exitDate || prevTrade.entryDate).getTime();
      const currTime = new Date(currTrade.entryDate).getTime();
      const timeDiffMinutes = (currTime - prevTime) / (1000 * 60);

      // If entered within 60 minutes after a loss and lot size is >= 1.25x of previous lot
      const lotMultiplier = prevTrade.lotSize > 0 ? currTrade.lotSize / prevTrade.lotSize : 1;
      const isRevengeNote = (currTrade.notes?.preTrade || '').includes('เอาคืน') || (currTrade.notes?.preTrade || '').includes('ใจร้อน');

      if ((timeDiffMinutes <= 60 && lotMultiplier >= 1.25) || isRevengeNote) {
        revengeTradeCount++;
        revengeTradePnL += (currTrade.financials.netPnL || 0);
      }
    }
  }

  // Top Mistakes & Lessons Extraction
  const mistakeCounts = new Map<string, number>();
  const lessonCounts = new Map<string, number>();

  reviews.forEach(r => {
    if (r.mistakes) {
      r.mistakes.split(/[,;\n]/).map(s => s.trim()).filter(Boolean).forEach(m => {
        mistakeCounts.set(m, (mistakeCounts.get(m) || 0) + 1);
      });
    }
    if (r.lessons) {
      r.lessons.split(/[,;\n]/).map(s => s.trim()).filter(Boolean).forEach(l => {
        lessonCounts.set(l, (lessonCounts.get(l) || 0) + 1);
      });
    }
  });

  const topMistakes = Array.from(mistakeCounts.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topLessons = Array.from(lessonCounts.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Self assessment average
  const scoredTrades = closed.filter(t => t.notes?.selfAssessment && t.notes.selfAssessment > 0);
  const avgSelfScore = scoredTrades.length > 0
    ? Number((scoredTrades.reduce((acc, t) => acc + (t.notes.selfAssessment || 0), 0) / scoredTrades.length).toFixed(1))
    : 0;

  return {
    disciplineRate: Number(disciplineRate.toFixed(1)),
    followedRules,
    brokeRules,
    costOfBreakingRules: Number(costOfBreakingRules.toFixed(2)),
    revengeTradeCount,
    revengeTradePnL: Number(revengeTradePnL.toFixed(2)),
    topMistakes,
    topLessons,
    avgSelfScore,
  };
}

export function computeTraderScores(
  tech: TechnicalStats,
  psy: PsychologyStats,
  mind: MindsetStats
): TraderScores {
  // 1. Technical Score (0-100)
  // Win rate component (max 40 pts): 50% = 25 pts, 60% = 35 pts, 70%+ = 40 pts
  const wrScore = Math.min(40, (tech.winRate / 70) * 40);
  // Profit Factor component (max 35 pts): PF 1.5 = 25 pts, PF 2.0+ = 35 pts
  const pfScore = Math.min(35, (tech.profitFactor / 2.0) * 35);
  // RR component (max 25 pts): RR 1.5 = 20 pts, RR 2.0+ = 25 pts
  const rrScore = Math.min(25, (tech.avgRR / 2.0) * 25);
  const technicalScore = Math.round(Math.max(10, Math.min(100, wrScore + pfScore + rrScore)));

  // 2. Discipline Score (0-100)
  // Based on disciplineRate and penalty for revenge trades / breaking rules
  let disciplineScore = mind.disciplineRate;
  if (mind.revengeTradeCount > 0) disciplineScore -= Math.min(25, mind.revengeTradeCount * 5);
  if (mind.costOfBreakingRules > 0) disciplineScore -= 10;
  disciplineScore = Math.round(Math.max(10, Math.min(100, disciplineScore)));

  // 3. Psychology Score (0-100)
  // Based on emotions win rates and pitfall counts
  let psychologyScore = 75;
  const pitfallCount = psy.pitfalls.reduce((acc, p) => acc + p.count, 0);
  psychologyScore -= Math.min(35, pitfallCount * 4);
  // Reward calm/disciplined emotion
  const calmStat = psy.preTrade.find(e => e.emotion === 'สงบนิ่ง' || e.emotion === 'มั่นใจ');
  if (calmStat && calmStat.winRate >= 50) psychologyScore += 15;
  psychologyScore = Math.round(Math.max(10, Math.min(100, psychologyScore)));

  // 4. Overall Weighted Score: 40% Tech, 30% Psy, 30% Discipline
  const overallScore = Math.round((technicalScore * 0.4) + (psychologyScore * 0.3) + (disciplineScore * 0.3));

  let ratingLabel = 'Beginner Trader';
  let colorClass = 'text-amber-500 border-amber-500/30 bg-amber-500/10';

  if (overallScore >= 85) {
    ratingLabel = 'Elite Disciplined Trader 🏆';
    colorClass = 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
  } else if (overallScore >= 70) {
    ratingLabel = 'Profitable & Consistent 📈';
    colorClass = 'text-blue-500 border-blue-500/30 bg-blue-500/10';
  } else if (overallScore >= 55) {
    ratingLabel = 'Developing Edge ⚖️';
    colorClass = 'text-amber-500 border-amber-500/30 bg-amber-500/10';
  } else {
    ratingLabel = 'High Leakage Risk ⚠️';
    colorClass = 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  }

  return {
    overallScore,
    technicalScore,
    psychologyScore,
    disciplineScore,
    ratingLabel,
    colorClass,
  };
}

export function generateActionableInsights(
  tech: TechnicalStats,
  psy: PsychologyStats,
  mind: MindsetStats
): ActionableInsight[] {
  const insights: ActionableInsight[] = [];

  // 1. Technical Strengths
  const bestStrat = tech.strategies[0];
  if (bestStrat && bestStrat.netPnL > 0) {
    insights.push({
      type: 'STRENGTH',
      title: `กลยุทธ์หัวหอก: ${bestStrat.strategy}`,
      description: `กลยุทธ์ ${bestStrat.strategy} สร้างกำไรสุทธิ $${bestStrat.netPnL.toLocaleString()} (Win Rate: ${bestStrat.winRate.toFixed(1)}%) เป็น Edge หลักที่คุณควรโฟกัสให้สม่ำเสมอ`,
      impact: `+$${bestStrat.netPnL.toLocaleString()}`,
    });
  }

  // 2. Emotional Edge
  if (psy.bestEmotionForProfit && psy.bestEmotionForProfit !== 'No Data') {
    const bestEmo = psy.preTrade.find(e => e.emotion === psy.bestEmotionForProfit);
    if (bestEmo && bestEmo.netPnL > 0) {
      insights.push({
        type: 'STRENGTH',
        title: `สภาวะจิตวิทยาที่ดีที่สุด: เข้าเทรดตอน "${bestEmo.emotion}"`,
        description: `เมื่อคุณเข้าเทรดด้วยอารมณ์ ${bestEmo.emotion} พอร์ตสร้างกำไรได้สูงสุดถึง $${bestEmo.netPnL.toLocaleString()} พร้อม Win Rate ${bestEmo.winRate.toFixed(1)}%`,
        impact: `Win Rate ${bestEmo.winRate.toFixed(1)}%`,
      });
    }
  }

  // 3. Fatal Leak: Breaking Rules & Revenge Trading
  if (mind.costOfBreakingRules > 0) {
    insights.push({
      type: 'LEAK',
      title: 'จุดรั่วไหลหลัก: ความเสียหายจากการแหกกฎ',
      description: `ไม้ที่คุณไม่ได้ทำตามแผนหรือแหกกฎ สร้างความเสียหายรวม $${mind.costOfBreakingRules.toLocaleString()} หากตัดไม้เหล่านี้ออก พอร์ตจะมีกำไรเพิ่มขึ้นทันที!`,
      impact: `-$${mind.costOfBreakingRules.toLocaleString()}`,
    });
  }

  if (mind.revengeTradeCount > 0) {
    insights.push({
      type: 'LEAK',
      title: `ตรวจพบ Revenge Trading (${mind.revengeTradeCount} ครั้ง)`,
      description: `มีพฤติกรรมรีบเข้าไม้หลังเพิ่งโดน Stop Loss โดยเพิ่ม Lot Size ผลลัพธ์ไม้เหล่านี้คือ Net P&L: $${mind.revengeTradePnL.toLocaleString()}`,
      impact: `$${mind.revengeTradePnL.toLocaleString()}`,
    });
  }

  // 4. Psychology Pitfall Leak
  const topPitfall = [...psy.pitfalls].sort((a, b) => b.count - a.count)[0];
  if (topPitfall && topPitfall.count > 0) {
    insights.push({
      type: 'LEAK',
      title: `กับดักอารมณ์ที่พบบ่อย: ${topPitfall.name}`,
      description: `คุณบันทึกพฤติกรรมนี้ไปแล้ว ${topPitfall.count} ครั้ง เป็นจุดที่คอยดึงรั้งผลตอบแทนของพอร์ตไว้`,
      impact: `${topPitfall.count} ครั้ง`,
    });
  }

  // 5. Practical Recommendations
  insights.push({
    type: 'RECOMMENDATION',
    title: 'กฎเหล็ก Cool-down 30 นาทีหลัง SL',
    description: 'เมื่อโดน Stop Loss ให้ปิดหน้าจอและลุกออกจากโต๊ะทันที 30 นาที เพื่อรีเซ็ต Cortisol ในร่างกาย ป้องกันการเข้าไม้เอาคืน',
  });

  if (tech.avgRR < tech.plannedRRAvg && tech.avgRR > 0) {
    insights.push({
      type: 'RECOMMENDATION',
      title: 'ฝึกถือไม้ให้ถึงเป้า TP ตามแผน',
      description: `ปัจจุบัน Actual RR (${tech.avgRR}R) ต่ำกว่า Planned RR (${tech.plannedRRAvg}R) บ่งชี้ว่าคุณมักปิดทำกำไรเร็วเกินไปด้วยความกังวล ลองใช้ Partial TP เพื่อให้ถือตามเทรนด์ได้นานขึ้น`,
    });
  } else {
    insights.push({
      type: 'RECOMMENDATION',
      title: 'ยึดมั่นเฉพาะ Setup ที่มี Edge ชัดเจน',
      description: `ให้เทรดเฉพาะ Setup ที่พิสูจน์แล้วว่ามีกำไร เช่น ${bestStrat?.strategy || 'แผนหลัก'} และปฏิเสธสัญญาณก้ำกึ่งทุกกรณี`,
    });
  }

  return insights;
}
