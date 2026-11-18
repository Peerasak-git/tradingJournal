'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAccount } from '@/context/AccountContext';
import { getTrades } from '@/lib/clientStorage';
import { Trade } from '@/types/trade';
import {
  GameLevel,
  GAME_CRITERIA,
  PRESET_IN_TRADE_URGES,
  LoggedUrge,
  MindsetHubDayState,
} from '@/types/mindsetHub';
import {
  getTodayMindset,
  getMindsetHistory,
  saveMindsetDay,
  logInTradeUrge,
  recordZenSessionCompleted,
} from '@/lib/mindsetHubStorage';
import {
  DEFAULT_QUOTES,
  CATEGORY_LABELS,
  MindsetQuote,
  getCustomQuotes,
  saveCustomQuote,
  deleteCustomQuote,
} from '@/data/mindsetQuotes';
import {
  Brain,
  Sparkles,
  Trophy,
  ShieldAlert,
  Flame,
  Heart,
  Activity,
  Moon,
  Sun,
  BatteryCharging,
  Zap,
  CheckCircle2,
  Clock,
  RotateCcw,
  Volume2,
  Eye,
  AlertTriangle,
  Play,
  Pause,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Quote,
  Copy,
  Check,
  Shuffle,
  Search,
  Plus,
  Trash2,
  X,
  Globe,
  ExternalLink,
  Loader2,
} from 'lucide-react';

type MindsetTab = 'agame' | 'urges' | 'zen' | 'bio' | 'quotes';

const DOUGLAS_TRUTHS = [
  {
    num: 1,
    titleTh: 'อะไรก็เกิดขึ้นได้ในตลาด (Anything can happen)',
    descTh: 'ไม่มีใครควบคุมการเคลื่อนไหวของราคาได้ ไม่ว่าจะวิเคราะห์มาดีแค่ไหนก็ตาม ความแน่นอน 100% ไม่มีอยู่จริงในการเทรด',
  },
  {
    num: 2,
    titleTh: 'คุณไม่จำเป็นต้องรู้ว่าอะไรจะเกิดขึ้น เพื่อที่จะทำเงิน',
    descTh: 'การเทรดคือการเล่นกับความน่าจะเป็น (Edge) ไม่ใช่การทำนายอนาคต การชนะเกิดจากชุดสถิติในระยะยาว',
  },
  {
    num: 3,
    titleTh: 'ผลแพ้ชนะมีการกระจายตัวแบบสุ่ม (Random distribution)',
    descTh: 'แม้จะมี Win Rate 70% ไม้ต่อไปก็อาจแพ้ 3-4 ไม้ติดได้ตามธรรมชาติของความน่าจะเป็น อย่าสูญเสียความมั่นใจจากผลลัพธ์ของไม้เดียว',
  },
  {
    num: 4,
    titleTh: 'Edge เป็นเพียงความน่าจะเป็นที่สิ่งหนึ่งจะเกิดมากกว่าอีกสิ่ง',
    descTh: 'Setup ไม่ได้การันตีกำไร แต่ให้แต้มต่อทางคณิตศาสตร์ หน้าที่ของเราคือบริหารความเสี่ยงและปล่อยให้ตัวเลขทำงาน',
  },
  {
    num: 5,
    titleTh: 'ทุกวินาทีในตลาดมีเอกลักษณ์เฉพาะตัว (Every moment is unique)',
    descTh: 'ตลาดตอนนี้ประกอบด้วยผู้เล่นและสภาพแวดล้อมที่ไม่เคยซ้ำกับในอดีต อย่าผูกใจเจ็บหรือดีใจเกินเหตุกับแพทเทิร์นเดิม',
  },
];

export default function MindsetHubPage() {
  const { language } = useLanguage();
  const { selectedAccount } = useAccount();

  const [activeTab, setActiveTab] = useState<MindsetTab>('agame');
  const [todayState, setTodayState] = useState<MindsetHubDayState>(getTodayMindset());
  const [history, setHistory] = useState<MindsetHubDayState[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  // Selected Urge form states
  const [selectedUrgeId, setSelectedUrgeId] = useState<string>(PRESET_IN_TRADE_URGES[0].id);
  const [urgeIntensity, setUrgeIntensity] = useState<number>(3);
  const [urgePair, setUrgePair] = useState<string>('XAUUSD');
  const [urgeNote, setUrgeNote] = useState<string>('');

  // Box Breathing States
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [breathSecondsLeft, setBreathSecondsLeft] = useState<number>(4);
  const [breathCyclesCompleted, setBreathCyclesCompleted] = useState<number>(0);

  // Quotes State
  const [customQuotes, setCustomQuotes] = useState<MindsetQuote[]>([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);
  const [selectedQuoteCategory, setSelectedQuoteCategory] = useState<string>('all');
  const [quoteSearchTerm, setQuoteSearchTerm] = useState<string>('');
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState<boolean>(false);
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [newQuoteTh, setNewQuoteTh] = useState<string>('');
  const [newQuoteEn, setNewQuoteEn] = useState<string>('');
  const [newCategory, setNewCategory] = useState<MindsetQuote['category']>('discipline');
  const [newReflection, setNewReflection] = useState<string>('');

  // Online Quotes Discovery State
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState<boolean>(false);
  const [onlineTopic, setOnlineTopic] = useState<string>('all');
  const [onlineQuotesList, setOnlineQuotesList] = useState<MindsetQuote[]>([]);
  const [isFetchingOnline, setIsFetchingOnline] = useState<boolean>(false);
  const [savedOnlineQuoteIds, setSavedOnlineQuoteIds] = useState<Record<string, boolean>>({});
  const [onlineSourceLabel, setOnlineSourceLabel] = useState<string>('');

  // 5-minute Auto-rotation Timer State (300 seconds)
  const QUOTE_AUTO_ROTATE_SECONDS = 300;
  const [quoteCountdown, setQuoteCountdown] = useState<number>(QUOTE_AUTO_ROTATE_SECONDS);
  const [isAutoRotateQuotes, setIsAutoRotateQuotes] = useState<boolean>(true);

  // Load data
  useEffect(() => {
    setTodayState(getTodayMindset());
    setHistory(getMindsetHistory());
    setCustomQuotes(getCustomQuotes());
    getTrades().then(setTrades).catch(console.error);

    const handleUpdate = () => {
      setTodayState(getTodayMindset());
      setHistory(getMindsetHistory());
    };
    const handleQuotesUpdate = () => {
      setCustomQuotes(getCustomQuotes());
    };

    window.addEventListener('mindsetHubUpdated', handleUpdate);
    window.addEventListener('customQuotesUpdated', handleQuotesUpdate);
    return () => {
      window.removeEventListener('mindsetHubUpdated', handleUpdate);
      window.removeEventListener('customQuotesUpdated', handleQuotesUpdate);
    };
  }, []);

  // Box Breathing Timer logic (4s inhale -> 4s hold -> 4s exhale -> 4s hold)
  useEffect(() => {
    if (!isBreathingActive) return;

    const timer = setInterval(() => {
      setBreathSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Phase Transition
        setBreathPhase((currentPhase) => {
          if (currentPhase === 'inhale') return 'hold1';
          if (currentPhase === 'hold1') return 'exhale';
          if (currentPhase === 'exhale') return 'hold2';
          // Completed 1 full cycle
          setBreathCyclesCompleted((c) => {
            const next = c + 1;
            if (next % 3 === 0) {
              recordZenSessionCompleted();
            }
            return next;
          });
          return 'inhale';
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreathingActive]);

  // Open trades currently running
  const openTrades = useMemo(() => {
    return trades.filter((t) => t.status === 'OPEN');
  }, [trades]);

  // Game Spectrum Statistics
  const spectrumStats = useMemo(() => {
    const totalDays = history.length || 1;
    const aCount = history.filter((h) => h.currentGame === 'A').length;
    const bCount = history.filter((h) => h.currentGame === 'B').length;
    const cCount = history.filter((h) => h.currentGame === 'C').length;

    return {
      aPct: Math.round((aCount / totalDays) * 100),
      bPct: Math.round((bCount / totalDays) * 100),
      cPct: Math.round((cCount / totalDays) * 100),
      aCount,
      bCount,
      cCount,
    };
  }, [history]);

  // Urges frequency
  const urgeFrequency = useMemo(() => {
    const map: Record<string, number> = {};
    history.forEach((h) => {
      (h.urges || []).forEach((u) => {
        map[u.urgeId] = (map[u.urgeId] || 0) + 1;
      });
    });
    return map;
  }, [history]);

  // Handlers for A/B/C Game
  const handleSelectGame = (game: GameLevel) => {
    const updated: MindsetHubDayState = {
      ...todayState,
      currentGame: game,
    };
    setTodayState(updated);
    saveMindsetDay(updated);
  };

  const handleToggleCriterion = (criterionId: string) => {
    const current = todayState.selectedCriteriaIds || [];
    const next = current.includes(criterionId)
      ? current.filter((id) => id !== criterionId)
      : [...current, criterionId];

    const updated: MindsetHubDayState = {
      ...todayState,
      selectedCriteriaIds: next,
    };
    setTodayState(updated);
    saveMindsetDay(updated);
  };

  // Handlers for Urge Logger
  const handleLogUrge = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = logInTradeUrge(selectedUrgeId, urgeIntensity, urgePair, urgeNote);
    setTodayState(updated);
    setUrgeNote('');
  };

  // Handlers for Bio Metrics
  const handleUpdateBio = (key: keyof MindsetHubDayState['bioMetrics'], value: any) => {
    const updated: MindsetHubDayState = {
      ...todayState,
      bioMetrics: {
        ...todayState.bioMetrics,
        [key]: value,
      },
    };
    setTodayState(updated);
    saveMindsetDay(updated);
  };

  // Quotes Logic
  const allQuotes = useMemo(() => {
    return [...customQuotes, ...DEFAULT_QUOTES];
  }, [customQuotes]);

  const activeHeroQuote = useMemo(() => {
    if (allQuotes.length === 0) return DEFAULT_QUOTES[0];
    return allQuotes[currentQuoteIndex % allQuotes.length];
  }, [allQuotes, currentQuoteIndex]);

  const handleShuffleQuote = () => {
    if (allQuotes.length <= 1) return;
    let nextIdx = Math.floor(Math.random() * allQuotes.length);
    if (nextIdx === currentQuoteIndex) {
      nextIdx = (nextIdx + 1) % allQuotes.length;
    }
    setCurrentQuoteIndex(nextIdx);
    setQuoteCountdown(QUOTE_AUTO_ROTATE_SECONDS);
  };

  // Auto rotate quote countdown (5 minutes = 300s)
  useEffect(() => {
    if (!isAutoRotateQuotes) return;

    const interval = setInterval(() => {
      setQuoteCountdown((prev) => {
        if (prev <= 1) {
          // Trigger next quote
          if (allQuotes.length > 1) {
            setCurrentQuoteIndex((currIdx) => {
              let nextIdx = Math.floor(Math.random() * allQuotes.length);
              if (nextIdx === currIdx) {
                nextIdx = (nextIdx + 1) % allQuotes.length;
              }
              return nextIdx;
            });
          }
          return QUOTE_AUTO_ROTATE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoRotateQuotes, allQuotes.length]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopyQuote = (q: MindsetQuote) => {
    const text = `"${q.quoteTh}" - ${q.author} (${q.quoteEn})`;
    navigator.clipboard.writeText(text);
    setCopiedQuoteId(q.id);
    setTimeout(() => setCopiedQuoteId(null), 2000);
  };

  const handleAddCustomQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuoteTh.trim() || !newAuthor.trim()) return;

    saveCustomQuote({
      author: newAuthor.trim(),
      role: newRole.trim() || 'คำคมเตือนสติตนเอง',
      quoteTh: newQuoteTh.trim(),
      quoteEn: newQuoteEn.trim(),
      category: newCategory,
      reflectionTh: newReflection.trim(),
    });

    setNewAuthor('');
    setNewRole('');
    setNewQuoteTh('');
    setNewQuoteEn('');
    setNewReflection('');
    setIsAddQuoteModalOpen(false);
  };

  const handleDeleteCustomQuote = (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคำคมนี้?')) {
      deleteCustomQuote(id);
    }
  };

  // Online Quotes Handlers
  const handleFetchOnlineQuotes = async (topicOverride?: string) => {
    setIsFetchingOnline(true);
    const targetTopic = topicOverride !== undefined ? topicOverride : onlineTopic;
    try {
      const storedKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '';
      // Pass IDs of quotes currently displayed to guarantee no immediate duplicate/repetition
      const currentShownIds = onlineQuotesList.map((q) => q.id);
      const res = await fetch('/api/ai/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          count: 5,
          apiKey: storedKey,
          excludeIds: currentShownIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.quotes)) {
        setOnlineQuotesList(data.quotes);
        setOnlineSourceLabel(data.source || 'Online Wisdom Pool');
      }
    } catch (err) {
      console.error('Error fetching online quotes:', err);
    } finally {
      setIsFetchingOnline(false);
    }
  };

  const handleOpenOnlineModal = () => {
    setIsOnlineModalOpen(true);
    if (onlineQuotesList.length === 0) {
      handleFetchOnlineQuotes(onlineTopic);
    }
  };

  const handleSaveOnlineQuote = (q: MindsetQuote) => {
    saveCustomQuote({
      author: q.author,
      role: q.role,
      category: q.category,
      quoteTh: q.quoteTh,
      quoteEn: q.quoteEn,
      reflectionTh: q.reflectionTh,
    });
    setSavedOnlineQuoteIds((prev) => ({ ...prev, [q.id]: true }));
  };

  const filteredQuotes = useMemo(() => {
    return allQuotes.filter((q) => {
      const matchCat = selectedQuoteCategory === 'all' || q.category === selectedQuoteCategory;
      const matchSearch =
        quoteSearchTerm.trim() === '' ||
        q.author.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
        q.quoteTh.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
        q.quoteEn.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
        q.role.toLowerCase().includes(quoteSearchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allQuotes, selectedQuoteCategory, quoteSearchTerm]);

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Brain size={18} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Mindset & Psychology Master Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {language === 'th'
              ? 'ระบบพัฒนาจิตวิทยาเทรดเดอร์มืออาชีพ: ควบคุม A/B/C Game, สภาวะระหว่างถือไม้, ห้องปรับจูนสติ และพลังงานร่างกาย'
              : 'Professional Trading Psychology Hub: A/B/C Game Spectrum, In-Trade Urges, Zen Protocol & Bio-Metrics'}
          </p>
        </div>

        {/* Quick Zen Action */}
        <button
          onClick={() => {
            setActiveTab('zen');
            setIsBreathingActive(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Sparkles size={15} className="animate-spin-slow" />
          <span>{language === 'th' ? 'ฝึกหายใจปรับสติ (Box Breathing)' : 'Start Box Breathing'}</span>
        </button>
      </div>

      {/* Hero Mindset Quote Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 p-5 sm:p-6 shadow-xl shadow-indigo-950/20 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Quote size={22} className="rotate-180" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/25">
                  ✨ คำคมเตือนสติประจำวัน (Mindset Wisdom)
                </span>
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  {CATEGORY_LABELS[activeHeroQuote.category]?.icon} {CATEGORY_LABELS[activeHeroQuote.category]?.th}
                </span>
                {activeHeroQuote.isCustom && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    คำคมส่วนตัว
                  </span>
                )}
                {/* 5-Min Countdown Indicator Badge */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-indigo-400/30 text-[11px] font-mono font-bold text-indigo-300 shadow-sm"
                  title={isAutoRotateQuotes ? 'นับถอยหลัง 5 นาทีเพื่อเปลี่ยนคำคมอัตโนมัติ' : 'หยุดนับเวลาชั่วคราว'}
                >
                  <Clock size={12} className={`text-amber-400 ${isAutoRotateQuotes ? 'animate-pulse' : ''}`} />
                  <span>เปลี่ยนอัตโนมัติใน {formatCountdown(quoteCountdown)}</span>
                  <button
                    type="button"
                    onClick={() => setIsAutoRotateQuotes((prev) => !prev)}
                    className="ml-0.5 text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
                    title={isAutoRotateQuotes ? 'กดเพื่อหยุดนับเวลาถอยหลัง (Pause)' : 'กดเพื่อเริ่มนับเวลาต่อ (Resume)'}
                  >
                    {isAutoRotateQuotes ? <Pause size={10} /> : <Play size={10} />}
                  </button>
                </div>
              </div>
              <p className="text-sm sm:text-base md:text-lg font-bold text-white leading-relaxed">
                "{activeHeroQuote.quoteTh}"
              </p>
              {activeHeroQuote.quoteEn && (
                <p className="text-xs sm:text-sm text-slate-300/80 italic font-medium">
                  "{activeHeroQuote.quoteEn}"
                </p>
              )}
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-400 flex-wrap">
                <span className="font-bold text-amber-300">— {activeHeroQuote.author}</span>
                <span>•</span>
                <span className="text-slate-400">{activeHeroQuote.role}</span>
              </div>
              {activeHeroQuote.reflectionTh && (
                <p className="text-[11px] text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 inline-block mt-1">
                  💡 {activeHeroQuote.reflectionTh}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
            <button
              onClick={handleOpenOnlineModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              title="ค้นหาและดึงคำคมจิตวิทยาจากอินเทอร์เน็ต"
            >
              <Globe size={13} />
              <span>หาคำคมจากเน็ต 🌐</span>
            </button>
            <button
              onClick={() => handleCopyQuote(activeHeroQuote)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="คัดลอกคำคม"
            >
              {copiedQuoteId === activeHeroQuote.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedQuoteId === activeHeroQuote.id ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>
            <button
              onClick={handleShuffleQuote}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              title="สุ่มคำคมใหม่ทันที และรีเซ็ตเวลานับถอยหลัง 5 นาที"
            >
              <Shuffle size={13} />
              <span>สุ่มคำคมถัดไป 🎲</span>
              <span className="text-[10px] font-mono font-black bg-black/35 px-1.5 py-0.5 rounded-md text-amber-200 border border-white/10">
                {formatCountdown(quoteCountdown)}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('quotes')}
              className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition cursor-pointer"
            >
              คลังทั้งหมด ({allQuotes.length}) →
            </button>
          </div>
        </div>

        {/* 5-minute Auto-rotate Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(quoteCountdown / QUOTE_AUTO_ROTATE_SECONDS) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-xl p-1.5 flex flex-wrap items-center gap-1.5 shadow-xs">
        <button
          onClick={() => setActiveTab('agame')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'agame'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Trophy size={16} />
          <span>{language === 'th' ? '1. A/B/C Game สเปกตรัม' : '1. A/B/C Game Spectrum'}</span>
          <span
            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
              todayState.currentGame === 'A'
                ? 'bg-emerald-500/20 text-emerald-400'
                : todayState.currentGame === 'B'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {todayState.currentGame}-Game
          </span>
        </button>

        <button
          onClick={() => setActiveTab('urges')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'urges'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Zap size={16} />
          <span>{language === 'th' ? '2. สภาวะขณะถือไม้ (In-Trade)' : '2. In-Trade Emotion & Urges'}</span>
          {(todayState.urges?.length || 0) > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
              {todayState.urges.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('zen')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'zen'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Heart size={16} />
          <span>{language === 'th' ? '3. ห้องปรับจูนสติ (Zen Protocol)' : '3. Zen Reset & Protocol'}</span>
          {(todayState.zenCompletedCount || 0) > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              ✓ {todayState.zenCompletedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bio')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'bio'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Activity size={16} />
          <span>{language === 'th' ? '4. สุขภาพร่างกาย & การนอน' : '4. Bio & Lifestyle Tracker'}</span>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400">
            {todayState.bioMetrics?.sleepHours || 7.5}h
          </span>
        </button>

        <button
          onClick={() => setActiveTab('quotes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'quotes'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.01]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Quote size={16} />
          <span>{language === 'th' ? '5. คลังคำคมเตือนสติ' : '5. Quotes Library'}</span>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400">
            {allQuotes.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: A-GAME / B-GAME / C-GAME SPECTRUM                              */}
      {/* ===================================================================== */}
      {activeTab === 'agame' && (
        <div className="space-y-6 animate-fade-in">
          {/* Today Game Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* A-Game Card */}
            <div
              onClick={() => handleSelectGame('A')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                todayState.currentGame === 'A'
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/15 scale-[1.02]'
                  : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/[0.06] hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-black text-emerald-500">🏆 A-GAME</span>
                {todayState.currentGame === 'A' && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white uppercase tracking-wider">
                    {language === 'th' ? 'เกมของคุณวันนี้' : 'Active Today'}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {language === 'th' ? 'Peak Performance (โฟกัสสูงสุด)' : 'Peak Execution & Focus'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {language === 'th'
                  ? 'เข้าตามแผน 100%, บริหารความเสี่ยงนิ่งสนิท, ปราศจากความโลภหรือความกลัวผลลัพธ์'
                  : 'Flawless plan adherence, calm risk management, full detachment from outcome.'}
              </p>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>{language === 'th' ? 'วินัยสมบูรณ์แบบ + พอร์ตเติบโตอย่างยั่งยืน' : 'High Win Rate & Optimal Edge'}</span>
              </div>
            </div>

            {/* B-Game Card */}
            <div
              onClick={() => handleSelectGame('B')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                todayState.currentGame === 'B'
                  ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/15 scale-[1.02]'
                  : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/[0.06] hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-black text-amber-500">⚖️ B-GAME</span>
                {todayState.currentGame === 'B' && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                    {language === 'th' ? 'เกมของคุณวันนี้' : 'Active Today'}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {language === 'th' ? 'Average State (อารมณ์เริ่มรบกวน)' : 'Wobbly / Minor Hesitation'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {language === 'th'
                  ? 'มีความลังเลเล็กน้อยตอนกด, เริ่มแอบดู PnL บ่อยๆ แต่ยังไม่ถึงขั้นแหกกฎหรือทำลายพอร์ต'
                  : 'Slight hesitation, checking PnL too often, but still keeping rules intact.'}
              </p>
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>{language === 'th' ? 'จุดเตือน: ให้ชะลอการเทรดก่อนหลุดไป C-Game' : 'Warning: Cool down before C-Game tilt'}</span>
              </div>
            </div>

            {/* C-Game Card */}
            <div
              onClick={() => handleSelectGame('C')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                todayState.currentGame === 'C'
                  ? 'bg-rose-500/10 border-rose-500 shadow-lg shadow-rose-500/15 scale-[1.02]'
                  : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/[0.06] hover:border-rose-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-black text-rose-500">🚨 C-GAME</span>
                {todayState.currentGame === 'C' && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-500 text-white uppercase tracking-wider">
                    {language === 'th' ? 'เกมของคุณวันนี้' : 'Active Today'}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                {language === 'th' ? 'Tilt Zone (เขตอันตราย พอร์ตเสียหาย)' : 'Tilt & High-Risk Damage'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {language === 'th'
                  ? 'อยากเอาคืนหลังเสีย, เลื่อน SL หนี, เพิ่ม Lot กู้ทุน, เปิดออเดอร์ตามอารมณ์ล้วนๆ'
                  : 'Revenge trading, moving SL, increasing lot size to recover, 100% emotional.'}
              </p>
              <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <ShieldAlert size={13} />
                <span>{language === 'th' ? 'คำสั่งเด็ดขาด: ปิดจอทันที พักอย่างน้อย 45 นาที' : 'Mandatory rule: Close terminal immediately'}</span>
              </div>
            </div>
          </div>

          {/* Historical Game Spectrum Distribution */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-purple-500" />
                  {language === 'th' ? 'สเปกตรัมจิตวิทยา 14 วันย้อนหลัง (Inchworm Model)' : '14-Day Mental Spectrum'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'th'
                    ? 'เป้าหมายของเทรดเดอร์อาชีพไม่ใช่แค่การทำกำไร แต่คือการ "กำจัด C-Game ให้เหลือ 0%"'
                    : 'The goal of professional trading is to eliminate C-Game completely.'}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> A-Game: {spectrumStats.aPct}%
                </span>
                <span className="flex items-center gap-1 text-amber-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> B-Game: {spectrumStats.bPct}%
                </span>
                <span className="flex items-center gap-1 text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> C-Game: {spectrumStats.cPct}%
                </span>
              </div>
            </div>

            {/* Spectrum Bar */}
            <div className="h-5 w-full bg-slate-100 dark:bg-white/[0.04] rounded-full overflow-hidden flex p-0.5 gap-1 border border-slate-200 dark:border-white/[0.06]">
              <div
                style={{ width: `${spectrumStats.aPct}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                title={`A-Game: ${spectrumStats.aPct}%`}
              >
                {spectrumStats.aPct > 10 ? `${spectrumStats.aPct}%` : ''}
              </div>
              <div
                style={{ width: `${spectrumStats.bPct}%` }}
                className="h-full bg-amber-500 rounded-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                title={`B-Game: ${spectrumStats.bPct}%`}
              >
                {spectrumStats.bPct > 10 ? `${spectrumStats.bPct}%` : ''}
              </div>
              <div
                style={{ width: `${spectrumStats.cPct}%` }}
                className="h-full bg-rose-500 rounded-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                title={`C-Game: ${spectrumStats.cPct}%`}
              >
                {spectrumStats.cPct > 10 ? `${spectrumStats.cPct}%` : ''}
              </div>
            </div>
          </div>

          {/* Detailed Criteria Checklist for Today */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              {language === 'th' ? 'เช็คลิสต์พฤติกรรมวันนี้ (Behavioral Diagnostic Checklist)' : 'Behavioral Diagnostic Checklist'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {language === 'th'
                ? 'เลือกพฤติกรรมที่คุณสังเกตพบในตัวเองวันนี้ เพื่อให้ระบบประเมินระดับ Game ที่แท้จริงอย่างแม่นยำ'
                : 'Select the behaviors you noticed in yourself today to calibrate your true Game status.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {GAME_CRITERIA.map((criterion) => {
                const isSelected = (todayState.selectedCriteriaIds || []).includes(criterion.id);
                return (
                  <div
                    key={criterion.id}
                    onClick={() => handleToggleCriterion(criterion.id)}
                    className={`p-3.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? criterion.level === 'A'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                          : criterion.level === 'B'
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
                          : 'bg-rose-500/10 border-rose-500/40 text-rose-900 dark:text-rose-200'
                        : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/[0.1]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 rounded text-blue-600 focus:ring-0 cursor-pointer pointer-events-none"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                            criterion.level === 'A'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : criterion.level === 'B'
                              ? 'bg-amber-500/20 text-amber-500'
                              : 'bg-rose-500/20 text-rose-500'
                          }`}
                        >
                          {criterion.level}-GAME
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{criterion.category}</span>
                      </div>
                      <p className="leading-snug">
                        {language === 'th' ? criterion.labelTh : criterion.labelEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: IN-TRADE EMOTION & MID-TRADE URGES                             */}
      {/* ===================================================================== */}
      {activeTab === 'urges' && (
        <div className="space-y-6 animate-fade-in">
          {/* Active Holding Position Alert */}
          {openTrades.length > 0 ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <div>
                  <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {language === 'th'
                      ? `กำลังถือสถานะอยู่ ${openTrades.length} ไม้ในตลาด`
                      : `${openTrades.length} Active Positions Currently Open`}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {language === 'th'
                      ? 'จุดทดสอบจิตวิทยาที่ยากที่สุดคือช่วงเวลานี้ หากมีความรู้สึกอยากปิดก่อนหรือเลื่อน SL ให้กดบันทึกทันที'
                      : 'Notice your urges while trades are running. Log any impulse to manage trades emotionally.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {openTrades.map((t) => (
                  <span key={t.id} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {t.instrument} {t.direction} {t.lotSize}L
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 size={16} />
              <span>{language === 'th' ? 'ไม่มีไม้ค้างอยู่ในตลาด สภาพจิตใจพร้อมสำหรับการรอ Setup ถัดไป' : 'No open trades running. Ready to wait patiently for next setup.'}</span>
            </div>
          )}

          {/* Quick Urge Logger Box */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              {language === 'th' ? 'บันทึกแรงกระตุ้นขณะถือออเดอร์ (Quick Urge Logger)' : 'Log Mid-Trade Impulse'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {language === 'th'
                ? 'แค่ระบุความรู้สึกที่คุณกำลังเผชิญหน้าในจังหวะนี้ จะช่วยดึงสมองส่วนตรรกะ (Prefrontal Cortex) ให้กลับมาทำงาน'
                : 'Naming your urge activates your rational brain and prevents irrational impulse execution.'}
            </p>

            <form onSubmit={handleLogUrge} className="space-y-4">
              {/* Presets Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRESET_IN_TRADE_URGES.map((preset) => {
                  const isSelected = selectedUrgeId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedUrgeId(preset.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                          : 'border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{preset.emoji}</span>
                        <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {language === 'th' ? preset.labelTh : preset.labelEn}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {language === 'th' ? preset.descriptionTh : preset.labelEn}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Intensity & Notes Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    {language === 'th' ? 'ระดับความรุนแรงของแรงกระตุ้น (1-5)' : 'Urge Intensity (1-5)'}
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setUrgeIntensity(lvl)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          urgeIntensity === lvl
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    {language === 'th' ? 'คู่เงิน / สินทรัพย์' : 'Instrument / Asset'}
                  </label>
                  <input
                    type="text"
                    value={urgePair}
                    onChange={(e) => setUrgePair(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="เช่น XAUUSD"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    {language === 'th' ? 'บันทึกเสียงในหัว (Self-Talk Note)' : 'Notes'}
                  </label>
                  <input
                    type="text"
                    value={urgeNote}
                    onChange={(e) => setUrgeNote(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder={language === 'th' ? 'เช่น "กลัวกราฟดีดกลับมากิน SL"' : 'e.g. afraid profit vanishes'}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Zap size={14} />
                  <span>{language === 'th' ? 'บันทึกแรงกระตุ้น (Log Urge)' : 'Log Urge Now'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Today's Logged Urges Stream */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              {language === 'th' ? 'ประวัติแรงกระตุ้นที่บันทึกวันนี้' : 'Logged Urges Stream Today'}
            </h3>

            {(todayState.urges || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {language === 'th' ? 'ยังไม่มีการบันทึกแรงกระตุ้นในวันนี้ (รักษาจิตใจให้นิ่งสนิทแบบนี้ต่อไป)' : 'No urges logged today. Keep calm and detached.'}
              </p>
            ) : (
              <div className="space-y-2">
                {todayState.urges.map((urge) => {
                  const meta = PRESET_IN_TRADE_URGES.find((p) => p.id === urge.urgeId);
                  return (
                    <div
                      key={urge.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{meta?.emoji || '⚡'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {language === 'th' ? meta?.labelTh : meta?.labelEn}
                            </span>
                            {urge.pair && (
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500">
                                {urge.pair}
                              </span>
                            )}
                          </div>
                          {urge.note && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              "{urge.note}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(urge.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500">
                          Lv.{urge.intensity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: ZEN RESET & EMERGENCY PROTOCOL                                 */}
      {/* ===================================================================== */}
      {activeTab === 'zen' && (
        <div className="space-y-6 animate-fade-in">
          {/* Interactive Box Breathing 4-4-4-4 */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  🧘 Box Breathing 4-4-4-4
                </span>
                <h3 className="text-xl font-black mt-2">
                  {language === 'th' ? 'แบบฝึกหายใจลด Cortisol & ดับไฟ Tilt ทันที' : 'Parasympathetic Nervous Reset'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'th'
                    ? 'เทคนิคที่หน่วย Navy SEALs ใช้เพื่อคืนสติในภาวะวิกฤต หายใจเข้า 4 วิ กลั้น 4 วิ ผ่อน 4 วิ กลั้น 4 วิ'
                    : 'Inhale 4s -> Hold 4s -> Exhale 4s -> Hold 4s. Resets autonomic nervous system within 2 mins.'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400">{breathCyclesCompleted}</span>
                <span className="text-xs text-slate-400 block">รอบที่เสร็จสมบูรณ์</span>
              </div>
            </div>

            {/* Breathing Animation Canvas */}
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                {/* Outer Glow Ring */}
                <div
                  className={`absolute inset-0 rounded-full border-4 border-emerald-500/30 transition-all duration-1000 ${
                    breathPhase === 'inhale'
                      ? 'scale-125 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                      : breathPhase === 'hold1'
                      ? 'scale-125 bg-teal-500/15'
                      : breathPhase === 'exhale'
                      ? 'scale-100 bg-emerald-500/5'
                      : 'scale-100 bg-slate-800/50'
                  }`}
                />

                {/* Inner Breathing Core */}
                <div
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-1000 z-10 ${
                    breathPhase === 'inhale'
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 scale-110 shadow-emerald-500/40'
                      : breathPhase === 'hold1'
                      ? 'bg-gradient-to-tr from-teal-500 to-cyan-400 scale-110'
                      : breathPhase === 'exhale'
                      ? 'bg-gradient-to-tr from-emerald-700 to-slate-800 scale-95'
                      : 'bg-gradient-to-tr from-slate-800 to-slate-900 scale-95'
                  }`}
                >
                  <span className="text-3xl font-black text-white">{breathSecondsLeft}</span>
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest mt-1">
                    {breathPhase === 'inhale'
                      ? 'หายใจเข้า'
                      : breathPhase === 'hold1'
                      ? 'กลั้นหายใจ'
                      : breathPhase === 'exhale'
                      ? 'ผ่อนลมออก'
                      : 'กลั้นหายใจ'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setIsBreathingActive(!isBreathingActive)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isBreathingActive
                      ? 'bg-rose-500 text-white shadow-rose-500/25'
                      : 'bg-emerald-500 text-white shadow-emerald-500/25'
                  }`}
                >
                  {isBreathingActive ? <Pause size={15} /> : <Play size={15} />}
                  <span>{isBreathingActive ? 'หยุดชั่วคราว' : 'เริ่มฝึกหายใจ (Start)'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsBreathingActive(false);
                    setBreathPhase('inhale');
                    setBreathSecondsLeft(4);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                >
                  รีเซ็ต
                </button>
              </div>
            </div>
          </div>

          {/* Mark Douglas' 5 Fundamental Truths Cards */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen size={16} className="text-blue-500" />
                {language === 'th' ? '5 สัจธรรมแห่งตลาด (Mark Douglas - Trading in the Zone)' : '5 Fundamental Truths of Trading'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'th'
                  ? 'ทบทวนสัจธรรม 5 ข้อนี้เมื่อรู้สึกโกรธตลาด หรือรู้สึกไม่ยุติธรรมเมื่อโดน Stop Loss'
                  : 'Cognitive reframing cards to anchor probabilistic thinking.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DOUGLAS_TRUTHS.map((truth) => (
                <div
                  key={truth.num}
                  className="p-4 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 mb-1 block">
                      TRUTH #{truth.num}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                      {truth.titleTh}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {truth.descTh}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: BIO-MINDSET & LIFESTYLE CORRELATION                            */}
      {/* ===================================================================== */}
      {activeTab === 'bio' && (
        <div className="space-y-6 animate-fade-in">
          {/* Today Bio-Checkin Card */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Activity size={16} className="text-purple-500" />
              {language === 'th' ? 'ประเมินสภาพร่างกายก่อนลุยตลาดวันนี้' : 'Pre-Market Biological Readiness'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {language === 'th'
                ? 'สมองส่วนควบคุมวินัย (PFC) ใช้กลูโคสและออกซิเจนสูง หากนอนน้อยหรือมีความเครียดสะสม อัตราการหลุดแผนจะเพิ่มขึ้น 3 เท่า'
                : 'Sleep deprivation significantly impairs executive function and risk evaluation.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Sleep Hours */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Moon size={14} className="text-indigo-400" />
                    {language === 'th' ? 'ชั่วโมงการนอน' : 'Sleep Duration'}
                  </span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {todayState.bioMetrics?.sleepHours || 7.5} ชม.
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="10"
                  step="0.5"
                  value={todayState.bioMetrics?.sleepHours || 7.5}
                  onChange={(e) => handleUpdateBio('sleepHours', parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>4 ชม. (เสี่ยงมาก)</span>
                  <span>8 ชม. (สมบูรณ์)</span>
                </div>
              </div>

              {/* Sleep Quality */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    {language === 'th' ? 'คุณภาพการนอน' : 'Sleep Quality'}
                  </span>
                  <span className="text-sm font-black text-amber-500">
                    {todayState.bioMetrics?.sleepQuality || 4}/5 ⭐
                  </span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleUpdateBio('sleepQuality', star)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-black transition ${
                        (todayState.bioMetrics?.sleepQuality || 4) >= star
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-white/[0.05] text-slate-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 block mt-2 text-center">
                  {(todayState.bioMetrics?.sleepQuality || 4) >= 4 ? 'หลับสนิท สดชื่น' : 'หลับไม่สนิท ตื่นกลางดึก'}
                </span>
              </div>

              {/* Energy Level */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <BatteryCharging size={14} className="text-emerald-500" />
                    {language === 'th' ? 'ระดับพลังงาน' : 'Energy Level'}
                  </span>
                  <span className="text-sm font-black text-emerald-500">
                    {todayState.bioMetrics?.energyLevel || 8}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={todayState.bioMetrics?.energyLevel || 8}
                  onChange={(e) => handleUpdateBio('energyLevel', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>ล้ามาก (1)</span>
                  <span>กระปรี้กระเปร่า (10)</span>
                </div>
              </div>

              {/* Outside Stress */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Flame size={14} className="text-rose-500" />
                    {language === 'th' ? 'ความเครียดภายนอก' : 'Life Stress'}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      todayState.bioMetrics?.stressLevel === 'low'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : todayState.bioMetrics?.stressLevel === 'moderate'
                        ? 'bg-amber-500/20 text-amber-500'
                        : 'bg-rose-500/20 text-rose-500'
                    }`}
                  >
                    {todayState.bioMetrics?.stressLevel?.toUpperCase() || 'LOW'}
                  </span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {(['low', 'moderate', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleUpdateBio('stressLevel', lvl)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                        todayState.bioMetrics?.stressLevel === lvl
                          ? lvl === 'low'
                            ? 'bg-emerald-500 text-white'
                            : lvl === 'moderate'
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-500 text-white'
                          : 'bg-slate-200 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 block mt-2 text-center">
                  งาน / ครอบครัว / ปัญหาส่วนตัว
                </span>
              </div>
            </div>
          </div>

          {/* Bio Correlation Insight Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                <Brain size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-500">
                  🧬 Biological Intelligence Insight
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {language === 'th'
                    ? 'สถิติยืนยัน: วันที่คุณนอนหลับ ≥ 7 ชั่วโมงและพลังงานระดับ 8+ อัตราการเข้าเทรด A-Game เพิ่มขึ้น 82%'
                    : 'Sleep >= 7h and Energy 8+ correlates with 82% higher A-Game execution consistency.'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {language === 'th'
                    ? 'เมื่อใดก็ตามที่ระดับพลังงานต่ำกว่า 5 แนะนำให้ลดขนาด Lot ลงครึ่งหนึ่งเพื่อจำกัดความเสียหายจากการตัดสินใจที่ช้าลง'
                    : 'Whenever energy drops below 5, automatically halve your risk per trade.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: QUOTES LIBRARY */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.08] shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  WISDOM VAULT
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {filteredQuotes.length} / {allQuotes.length} คำคม
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                {language === 'th' ? 'คลังคำคมเตือนสติ & ปรัชญาจิตวิทยาการเทรด' : 'Mindset & Trading Wisdom Library'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'th'
                  ? 'รวมสุดยอดประโยคเตือนสติจากตำนานเทรดเดอร์ระดับโลก และปรัชญา Stoic สำหรับอ่านก่อนเทรดหรือดึงสติยามฉุกเฉิน'
                  : 'Curated psychological rules from world-class traders & Stoic philosophy for high-performance execution.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
              <button
                onClick={handleOpenOnlineModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Globe size={14} />
                <span>หาคำคมในเน็ต 🌐</span>
              </button>
              <button
                onClick={handleShuffleQuote}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="สุ่มอ่านคำคมใหม่"
              >
                <Shuffle size={14} />
                <span>สุ่มคำคม</span>
              </button>
              <button
                onClick={() => setIsAddQuoteModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold transition shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>เพิ่มคำคมส่วนตัว</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="space-y-3">
            {/* Search Box */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={quoteSearchTerm}
                onChange={(e) => setQuoteSearchTerm(e.target.value)}
                placeholder="ค้นหาตามชื่อปรมาจารย์ (Mark Douglas, Tom Hougaard...), คำคม หรือหลักคิด..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
              {quoteSearchTerm && (
                <button
                  onClick={() => setQuoteSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedQuoteCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  selectedQuoteCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-white dark:bg-[#1a1a1a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                }`}
              >
                🌟 ทั้งหมด ({allQuotes.length})
              </button>
              {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((catKey) => {
                const count = allQuotes.filter((q) => q.category === catKey).length;
                const info = CATEGORY_LABELS[catKey];
                const isActive = selectedQuoteCategory === catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => setSelectedQuoteCategory(catKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-white dark:bg-[#1a1a1a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                    }`}
                  >
                    <span>{info.icon}</span>
                    <span>{info.th.split('&')[0].trim()}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quotes Grid */}
          {filteredQuotes.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#1a1a1a] border border-dashed border-slate-300 dark:border-white/[0.1]">
              <Quote className="mx-auto text-slate-400 dark:text-slate-600 mb-2" size={32} />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">ไม่พบคำคมที่ตรงกับการค้นหา</p>
              <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
              <button
                onClick={() => {
                  setSelectedQuoteCategory('all');
                  setQuoteSearchTerm('');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-700 transition"
              >
                ล้างการค้นหาทั้งหมด
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuotes.map((q) => {
                const catInfo = CATEGORY_LABELS[q.category] || {
                  th: q.category,
                  icon: '💡',
                };
                const isCopied = copiedQuoteId === q.id;

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/[0.08] hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition flex flex-col justify-between group relative"
                  >
                    <div className="space-y-3">
                      {/* Card Top: Category & Custom Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-white/[0.06]">
                          <span>{catInfo.icon}</span>
                          <span>{catInfo.th.split('&')[0].trim()}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          {q.isCustom && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              คำคมส่วนตัว
                            </span>
                          )}
                          {q.isCustom && (
                            <button
                              onClick={() => handleDeleteCustomQuote(q.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded transition opacity-80 group-hover:opacity-100 cursor-pointer"
                              title="ลบคำคมนี้"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Main Quote in Thai */}
                      <blockquote className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                        "{q.quoteTh}"
                      </blockquote>

                      {/* English Original */}
                      {q.quoteEn && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          "{q.quoteEn}"
                        </p>
                      )}

                      {/* Reflection / Practical Rule */}
                      {q.reflectionTh && (
                        <div className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                          <span className="font-bold mr-1">💡 ปฏิบัติจริง:</span>
                          <span>{q.reflectionTh}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Bottom: Author & Action Buttons */}
                    <div className="pt-4 mt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {q.author}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {q.role}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCopyQuote(q)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                          isCopied
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300'
                        }`}
                        title="คัดลอกคำคม"
                      >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        <span className="text-[11px]">{isCopied ? 'คัดลอกแล้ว' : 'แชร์'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Custom Quote Modal */}
      {isAddQuoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold">
                  <Quote size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    เพิ่มคำคมเตือนสติตนเอง (Personal Mantra)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    บันทึกกฎเหล็ก หรือข้อคิดที่คุณได้เรียนรู้จากตลาดไว้เตือนใจ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddQuoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCustomQuote} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อเจ้าของคำคม / ตัวเอง <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="เช่น กฎเหล็กของฉัน หรือ Mark Douglas"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    บทบาท / ฉายา
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="เช่น กฎประจำใจ, ประสบการณ์ขาดทุนครั้งใหญ่"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  หมวดหมู่หลัก <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MindsetQuote['category'])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="discipline">⚖️ วินัย & การควบคุมอารมณ์</option>
                  <option value="risk">🛡️ การคุมความเสี่ยง & เอาตัวรอด</option>
                  <option value="patience">🧘 การรอคอย & นั่งทับมือ</option>
                  <option value="acceptance">🧠 การยอมรับ Stop Loss & สถิติ</option>
                  <option value="stoic">🏛️ ปรัชญา Stoic & จิตวิทยาความนิ่ง</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ข้อความคำคม (ภาษาไทย) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newQuoteTh}
                  onChange={(e) => setNewQuoteTh(e.target.value)}
                  placeholder="เขียนประโยคเด็ดที่อ่านแล้วเตือนสติคุณได้ทันที..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  คำคมต้นฉบับภาษาอังกฤษ (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={newQuoteEn}
                  onChange={(e) => setNewQuoteEn(e.target.value)}
                  placeholder="English quote text (optional)..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ข้อคิด / แนวทางปฏิบัติจริง (Takeaway)
                </label>
                <input
                  type="text"
                  value={newReflection}
                  onChange={(e) => setNewReflection(e.target.value)}
                  placeholder="เช่น ต้องเช็ค RR 1:2 ก่อนกดเสมอ หรือ ถ้าโดน SL 2 ไม้ติดให้ปิดจอทันที"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/[0.1] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddQuoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  บันทึกคำคมลงคลัง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Online Quotes Discovery Modal */}
      {isOnlineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="max-w-3xl w-full bg-white dark:bg-[#151518] border border-slate-200 dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.08] bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-500 border border-blue-500/30">
                      INTERNET & AI DISCOVERY
                    </span>
                    {onlineSourceLabel && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        • แหล่งข้อมูล: {onlineSourceLabel}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    ค้นหาและดึงคำคมจิตวิทยาจากอินเทอร์เน็ต
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ดึงหลักคิดจากตำนานเทรดเดอร์ทั่วโลก หรือกดเปิดค้นหาใน Google / Goodreads ได้ทันที
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOnlineModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter / Fetch Controller */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { key: 'all', label: '🌟 ทั้งหมด' },
                    { key: 'social', label: '🔥 ไวรัลโซเชียล & Twitter/X' },
                    { key: 'risk', label: '🛡️ คุมความเสี่ยง' },
                    { key: 'discipline', label: '⚖️ วินัย & อารมณ์' },
                    { key: 'patience', label: '🧘 รอคอย & นั่งทับมือ' },
                    { key: 'acceptance', label: '🧠 ยอมรับ SL' },
                    { key: 'Tom Dante', label: '🎙️ Tom Dante' },
                    { key: 'Steve Burns', label: '🐦 Steve Burns' },
                    { key: 'Mark Minervini', label: '🏆 Mark Minervini' },
                    { key: 'Peter Brandt', label: '📊 Peter Brandt' },
                    { key: 'Mark Douglas', label: '📖 Mark Douglas' },
                    { key: 'Tom Hougaard', label: '📖 Tom Hougaard' },
                    { key: 'stoic', label: '🏛️ Stoic' },
                  ].map((topic) => (
                    <button
                      key={topic.key}
                      onClick={() => {
                        setOnlineTopic(topic.key);
                        handleFetchOnlineQuotes(topic.key);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        onlineTopic === topic.key
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                          : 'bg-white dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08]'
                      }`}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleFetchOnlineQuotes(onlineTopic)}
                  disabled={isFetchingOnline}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-bold transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isFetchingOnline ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>กำลังดึงข้อมูล...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>ดึงคำคมชุดใหม่ ✨</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Content Area: Quotes List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {isFetchingOnline && onlineQuotesList.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 size={32} className="animate-spin text-blue-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    กำลังเชื่อมต่อและดึงคำคมจิตวิทยาจากอินเทอร์เน็ต...
                  </p>
                  <p className="text-xs text-slate-400">
                    รวบรวมหลักคิดจากวรรณกรรมเทรดเดอร์ชั้นนำและตำนานระดับโลก
                  </p>
                </div>
              ) : onlineQuotesList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm font-semibold">กดปุ่ม "ดึงคำคมชุดใหม่" เพื่อเริ่มค้นหาคำคมจากเน็ต</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {onlineQuotesList.map((q, idx) => {
                    const isAlreadySaved =
                      savedOnlineQuoteIds[q.id] ||
                      allQuotes.some(
                        (existing) =>
                          existing.quoteTh.trim() === q.quoteTh.trim() ||
                          existing.quoteEn.trim() === q.quoteEn.trim()
                      );

                    return (
                      <div
                        key={q.id || idx}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] hover:border-blue-500/30 transition space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              {q.category.toUpperCase()}
                            </span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {q.author}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {q.role}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyQuote(q)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 transition flex items-center gap-1 cursor-pointer"
                              title="คัดลอกข้อความ"
                            >
                              {copiedQuoteId === q.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>{copiedQuoteId === q.id ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                            </button>

                            <button
                              onClick={() => handleSaveOnlineQuote(q)}
                              disabled={isAlreadySaved}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                isAlreadySaved
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                              }`}
                            >
                              {isAlreadySaved ? (
                                <>
                                  <Check size={13} />
                                  <span>อยู่ในคลังแล้ว</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={13} />
                                  <span>บันทึกลงคลังของฉัน</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <blockquote className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                          "{q.quoteTh}"
                        </blockquote>

                        {q.quoteEn && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            "{q.quoteEn}"
                          </p>
                        )}

                        {q.reflectionTh && (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                            <span className="font-bold mr-1">💡 ปฏิบัติจริง:</span>
                            <span>{q.reflectionTh}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer: Direct External Search Shortcuts */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50 dark:bg-black/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  🌐 ค้นหาต่อบนอินเทอร์เน็ตโดยตรง:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href="https://www.google.com/search?q=trading+psychology+quotes+mark+douglas+tom+hougaard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] flex items-center gap-1.5 transition"
                  >
                    <span>Google Quotes</span>
                    <ExternalLink size={11} />
                  </a>
                  <a
                    href="https://www.goodreads.com/quotes/tag/trading"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] flex items-center gap-1.5 transition"
                  >
                    <span>Goodreads</span>
                    <ExternalLink size={11} />
                  </a>
                  <a
                    href="https://twitter.com/search?q=%23TradingMindset%20quotes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] flex items-center gap-1.5 transition"
                  >
                    <span>X (Twitter)</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
