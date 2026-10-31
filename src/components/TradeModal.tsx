'use client';

import { X, Save, TrendingUp, TrendingDown, Clock, Target, ShieldCheck, Info, BarChart3, Calendar, Plus, Minus, Brain, Smile, Activity, ChevronDown, Search, FileText, ListChecks, CheckCircle2, AlertTriangle, Star, ClipboardPaste, Camera, Loader2, Link2, ExternalLink, Sparkles } from 'lucide-react';
import { Direction, TradeStatus, Trade } from '@/types/trade';
import { useLanguage } from '@/context/LanguageContext';
import { useAccount } from '@/context/AccountContext';
import { getTrades } from '@/lib/clientStorage';
import { useEffect, useState, useRef } from 'react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Trade) => void;
  initialData?: Trade | null;
}

export default function TradeModal({ isOpen, onClose, onSave, initialData }: TradeModalProps) {
  const { t } = useLanguage();
  const { selectedAccount } = useAccount();
  const [strategies, setStrategies] = useState<string[]>(['โซนอุปสงค์/อุปทาน (S/D)', 'จุดตัดเส้นแนวโน้ม', 'SMC', 'EMA Cross', 'Price Action', 'โซนแนวรับ/แนวต้าน']);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [strategySearch, setStrategySearch] = useState('');
  const strategyRef = useRef<HTMLDivElement>(null);

  const [instruments, setInstruments] = useState<string[]>(['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSDT', 'ETHUSDT']);
  const [isInstrumentOpen, setIsInstrumentOpen] = useState(false);
  const [instrumentSearch, setInstrumentSearch] = useState('');
  const instrumentRef = useRef<HTMLDivElement>(null);

  // Psychology States
  const [feelings, setFeelings] = useState({
    before: ['มั่นใจ', 'กลัว', 'FOMO', 'สงบนิ่ง', 'เบื่อ', 'กังวล', 'ใจร้อน'],
    during: ['อดทน', 'โลภ', 'ลังเล', 'เครียด', 'มีสมาธิ', 'วอกแวก'],
    after: ['พอใจ', 'เสียดาย', 'โล่งอก', 'ผิดหวัง', 'เฉยๆ', 'ได้เรียนรู้']
  });
  const [openPsych, setOpenPsych] = useState<'before' | 'during' | 'after' | null>(null);
  const [psychSearch, setPsychSearch] = useState('');
  const psychRef = useRef<HTMLDivElement>(null);

  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [pasteText, setPasteText] = useState('');
  
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  const [apiKeySuccess, setApiKeySuccess] = useState('');
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isZoomImageOpen, setIsZoomImageOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    instrument: '',
    direction: 'LONG' as Direction,
    lotSize: 0.01,
    status: 'OPEN' as TradeStatus,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    exitPrice: 0,
    strategy: '',
    entryDate: new Date().toISOString().slice(0, 16),
    netPnL: 0,
    preTrade: '',
    duringTrade: '',
    postTrade: '',
    notes: '',
    selfAssessment: 0,
    tradingViewUrl: '',
    exitTradingViewUrl: '',
    entryImage: '',
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (strategyRef.current && !strategyRef.current.contains(event.target as Node)) {
        setIsStrategyOpen(false);
      }
      if (instrumentRef.current && !instrumentRef.current.contains(event.target as Node)) {
        setIsInstrumentOpen(false);
      }
      if (psychRef.current && !psychRef.current.contains(event.target as Node)) {
        setOpenPsych(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch unique strategies from existing trades if possible
    const savedTrades = localStorage.getItem('trades');
    if (savedTrades) {
      try {
        const trades: Trade[] = JSON.parse(savedTrades);
        const uniqueStrategies = Array.from(new Set([
          ...strategies,
          ...trades.map(t => t.analysis.strategy).filter((s): s is string => !!s)
        ]));
        setStrategies(uniqueStrategies);
        
        const uniqueInstruments = Array.from(new Set([
          ...instruments,
          ...trades.map(t => t.instrument).filter((s): s is string => !!s)
        ]));
        setInstruments(uniqueInstruments);
      } catch (e) {
        console.error('Error parsing trades from localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const savedChecklist = localStorage.getItem('tradeChecklist');
      if (savedChecklist) {
        try {
          const items = JSON.parse(savedChecklist);
          setChecklistItems(items);
        } catch (e) {
          console.error('Error loading checklist', e);
        }
      }
    } else {
      // Reset checklist when modal closes
      setCheckedItems({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !initialData) {
      getTrades()
        .then(trades => {
          if (trades && trades.length > 0) {
            const completedTrades = trades
              .filter((t: Trade) => t.status !== 'OPEN')
              .sort((a: Trade, b: Trade) => new Date(b.exitDate || b.entryDate).getTime() - new Date(a.exitDate || a.entryDate).getTime());
            
            let losses = 0;
            for (const trade of completedTrades) {
              if (trade.status === 'LOSS') {
                losses++;
              } else if (trade.status === 'WIN') {
                break;
              }
            }
            setConsecutiveLosses(losses);
          }
        })
        .catch(err => console.error('Error fetching trades for loss check', err));
    } else {
      setConsecutiveLosses(0);
    }

    if (initialData) {
      setFormData({
        instrument: initialData.instrument,
        direction: initialData.direction,
        lotSize: initialData.lotSize,
        status: initialData.status,
        entryPrice: initialData.entryPrice,
        stopLoss: initialData.stopLoss || 0,
        takeProfit: initialData.takeProfit || 0,
        exitPrice: initialData.exitPrice || 0,
        strategy: initialData.analysis.strategy || '',
        entryDate: initialData.entryDate.slice(0, 16),
        netPnL: initialData.financials.netPnL || 0,
        preTrade: initialData.notes.preTrade || '',
        duringTrade: initialData.notes.duringTrade || '',
        postTrade: initialData.notes.postTrade || '',
        notes: initialData.notes.detailedNotes || '',
        selfAssessment: initialData.notes.selfAssessment || 0,
        tradingViewUrl: initialData.notes.tradingViewUrl || '',
        exitTradingViewUrl: initialData.notes.exitTradingViewUrl || '',
        entryImage: initialData.notes.entryImage || '',
      });
    } else {
      setFormData({
        instrument: '',
        direction: 'LONG',
        lotSize: 0.01,
        status: 'OPEN',
        entryPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        exitPrice: 0,
        strategy: '',
        entryDate: new Date().toISOString().slice(0, 16),
        netPnL: 0,
        preTrade: '',
        duringTrade: '',
        postTrade: '',
        notes: '',
        selfAssessment: 0,
        tradingViewUrl: '',
        exitTradingViewUrl: '',
        entryImage: '',
      });
    }
  }, [initialData, isOpen]);

  // Auto PnL Calculation
  useEffect(() => {
    if (formData.status !== 'OPEN' && formData.exitPrice > 0 && formData.entryPrice > 0 && formData.lotSize > 0) {
      const diff = formData.direction === 'LONG' 
        ? formData.exitPrice - formData.entryPrice 
        : formData.entryPrice - formData.exitPrice;
      
      let multiplier = 1;
      const inst = formData.instrument.toUpperCase();
      
      // Smart Multiplier Detection based on instrument
      if (inst.includes('XAU') || inst.includes('GOLD')) multiplier = 100;
      else if (inst.includes('XAG') || inst.includes('SILVER')) multiplier = 5000;
      else if (inst.length === 6 && !inst.includes('BTC') && !inst.includes('ETH') && !inst.includes('USDT')) {
        // Standard Forex pairs (e.g. EURUSD, GBPJPY)
        multiplier = 100000;
      }
      
      const calcPnL = Number((diff * formData.lotSize * multiplier).toFixed(2));
      
      setFormData(prev => ({ ...prev, netPnL: calcPnL }));
    }
  }, [formData.exitPrice, formData.entryPrice, formData.direction, formData.lotSize, formData.instrument, formData.status]);

  if (!isOpen) return null;

  const filteredStrategies = strategies.filter(s => 
    s.toLowerCase().includes(strategySearch.toLowerCase())
  );

  const handleAddStrategy = () => {
    if (strategySearch && !strategies.includes(strategySearch)) {
      setStrategies([...strategies, strategySearch]);
      setFormData({...formData, strategy: strategySearch});
      setIsStrategyOpen(false);
      setStrategySearch('');
    }
  };

  const handleAddFeeling = (type: 'before' | 'during' | 'after') => {
    if (psychSearch && !feelings[type].includes(psychSearch)) {
      setFeelings({
        ...feelings,
        [type]: [...feelings[type], psychSearch]
      });
      const field = type === 'before' ? 'preTrade' : type === 'during' ? 'duringTrade' : 'postTrade';
      setFormData({...formData, [field]: psychSearch});
      setOpenPsych(null);
      setPsychSearch('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if checklist is complete
    if (checklistItems.length > 0 && !initialData) {
      const checkedCount = Object.keys(checkedItems).filter(k => checkedItems[k]).length;
      if (checkedCount < checklistItems.length) {
        alert('กรุณาติ๊ก Checklist ก่อนเข้าออร์เดอร์ให้ครบทุกข้อก่อนบันทึกครับ');
        return;
      }
    }

    let finalNetPnL = formData.netPnL;
    if (formData.status === 'WIN' && finalNetPnL < 0) finalNetPnL = Math.abs(finalNetPnL);
    if (formData.status === 'LOSS' && finalNetPnL > 0) finalNetPnL = -finalNetPnL;
    if (formData.status === 'OPEN') finalNetPnL = 0;

    const isLong = formData.direction === 'LONG';
    const risk = isLong 
      ? formData.entryPrice - formData.stopLoss 
      : formData.stopLoss - formData.entryPrice;
      
    const plannedReward = isLong 
      ? formData.takeProfit - formData.entryPrice 
      : formData.entryPrice - formData.takeProfit;
      
    const plannedRR = risk > 0 && plannedReward > 0 
      ? parseFloat((plannedReward / risk).toFixed(2)) 
      : 0;

    const actualReward = isLong
      ? formData.exitPrice - formData.entryPrice
      : formData.entryPrice - formData.exitPrice;
      
    const actualRR = formData.status !== 'OPEN' && risk > 0 
      ? parseFloat((actualReward / risk).toFixed(2))
      : null;

    onSave({
      ...initialData,
      ...formData,
      id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9),
      accountId: initialData?.accountId || selectedAccount?.id || 'acc-1',
      financials: {
        ...(initialData ? initialData.financials : {
          grossPnL: null,
          commission: 0,
          swap: 0,
          currency: 'USD'
        }),
        netPnL: formData.status === 'OPEN' ? null : finalNetPnL,
      },
      analysis: {
        timeframe: null,
        ...(initialData ? initialData.analysis : {}),
        strategy: formData.strategy,
        plannedRR: plannedRR > 0 ? plannedRR : null,
        actualRR: actualRR
      },
      notes: {
        ...(initialData ? initialData.notes : {
          entryImage: null,
          exitImage: null
        }),
        preTrade: formData.preTrade,
        duringTrade: formData.duringTrade,
        postTrade: formData.postTrade,
        detailedNotes: formData.notes,
        selfAssessment: formData.selfAssessment > 0 ? formData.selfAssessment : null,
        tradingViewUrl: formData.tradingViewUrl?.trim() || null,
        exitTradingViewUrl: formData.exitTradingViewUrl?.trim() || null,
        entryImage: formData.entryImage || formData.tradingViewUrl?.trim() || initialData?.notes?.entryImage || null,
        exitImage: formData.exitTradingViewUrl?.trim() || initialData?.notes?.exitImage || null,
      },
      exitDate: initialData ? initialData.exitDate : (formData.status !== 'OPEN' ? new Date().toISOString() : null),
      exitPrice: formData.status === 'OPEN' ? null : formData.exitPrice
    });
    onClose();
  };

  const inputClasses = "w-full bg-slate-50/80 dark:bg-slate-900/30 border border-slate-200/70 dark:border-white/[0.07] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300/40 dark:focus:ring-slate-600/40 focus:border-slate-300 dark:focus:border-slate-600 transition-colors font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600";
  const labelClasses = "block text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1.5 ml-0.5";
  const sectionHeaderClasses = "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5";
  const textareaClasses = `${inputClasses} min-h-[100px] resize-none py-4 leading-relaxed`;

  const adjustLotSize = (delta: number) => {
    const newSize = Math.max(0.01, parseFloat((formData.lotSize + delta).toFixed(2)));
    setFormData({...formData, lotSize: newSize});
  };

  const handleSmartPasteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setPasteText(text);
    
    if (!text) return;

    let entryPrice = formData.entryPrice;
    let stopLoss = formData.stopLoss;
    let takeProfit = formData.takeProfit;

    // Clean text: remove commas so parseFloat works correctly (e.g. 1,950.50 -> 1950.50)
    const cleanText = text.replace(/,/g, '');

    // Extract Entry
    const entryMatch = cleanText.match(/(?:entry|ep|open|buy|sell|ราคาเข้า)[\s\:\@\=]*([\d\.]+)/i) || cleanText.match(/([\d\.]+)\s*(?:entry|ep)/i);
    if (entryMatch) entryPrice = parseFloat(entryMatch[1]);

    // Extract SL
    const slMatch = cleanText.match(/(?:sl|stop\s*loss|stop\s*level|stop)[\s\:\@\=]*([\d\.]+)/i) || cleanText.match(/([\d\.]+)\s*(?:sl|stop)/i);
    if (slMatch) stopLoss = parseFloat(slMatch[1]);

    // Extract TP
    const tpMatch = cleanText.match(/(?:tp|target|take\s*profit|profit\s*level|profit)[\s\:\@\=]*([\d\.]+)/i) || cleanText.match(/([\d\.]+)\s*(?:tp|target)/i);
    if (tpMatch) takeProfit = parseFloat(tpMatch[1]);

    // If it's a simple 3 numbers separated by spaces or newlines: e.g. "1.123 1.120 1.130"
    if (!entryMatch && !slMatch && !tpMatch) {
      // Find numbers that look like prices
      const numbers = cleanText.match(/\b\d+(?:\.\d+)?\b/g);
      if (numbers && numbers.length >= 3) {
         entryPrice = parseFloat(numbers[0]);
         stopLoss = parseFloat(numbers[1]);
         takeProfit = parseFloat(numbers[2]);
      }
    }

    setFormData(prev => {
      const newEntry = entryPrice || prev.entryPrice;
      const newSL = stopLoss || prev.stopLoss;
      const newTP = takeProfit || prev.takeProfit;
      
      let autoDirection = prev.direction;
      if (newEntry > 0 && newTP > 0) {
        if (newTP > newEntry) autoDirection = 'LONG';
        else if (newTP < newEntry) autoDirection = 'SHORT';
      } else if (newEntry > 0 && newSL > 0) {
        if (newSL < newEntry) autoDirection = 'LONG';
        else if (newSL > newEntry) autoDirection = 'SHORT';
      }

      return {
        ...prev,
        entryPrice: newEntry,
        stopLoss: newSL,
        takeProfit: newTP,
        direction: autoDirection
      };
    });

    // Clear input after a short delay so user sees it worked
    setTimeout(() => setPasteText(''), 500);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleTestApiKey = async () => {
    if (!geminiApiKeyInput.trim()) {
      setApiKeyError('กรุณากรอก API Key ก่อนทดสอบ');
      return;
    }
    setIsTestingApiKey(true);
    setApiKeyError('');
    setApiKeySuccess('');
    try {
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKeyInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApiKeySuccess(data.message || 'เชื่อมต่อ Gemini API สำเร็จ!');
      } else {
        setApiKeyError(data.message || 'ทดสอบ Key ไม่สำเร็จ');
      }
    } catch (err: any) {
      setApiKeyError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const processImage = async (file: File, overrideKey?: string) => {
    try {
      const base64 = await fileToBase64(file);
      // Set image preview immediately so the user sees their chart right away
      setFormData(prev => ({
        ...prev,
        entryImage: base64
      }));

      const key = overrideKey !== undefined ? overrideKey : ((typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : '') || '');

      setIsOcrLoading(true);
      setScanStatusMessage('กำลังส่งภาพชาร์ต TradingView ให้ AI Gemini Vision วิเคราะห์ราคา...');
      
      const res = await fetch('/api/ai/vision-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          apiKey: key
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.error === 'NO_API_KEY' || json.error === 'INVALID_API_KEY' || json.error === 'PERMISSION_DENIED') {
          setPendingImageFile(file);
          setApiKeyError(json.message || 'Gemini API Key ไม่ถูกต้อง โปรดตรวจสอบอีกครั้ง');
          setGeminiApiKeyInput(key);
          setIsApiKeyModalOpen(true);
          setScanStatusMessage(null);
          return;
        }
        setScanStatusMessage(`❌ ${json.message || 'AI Vision ไม่สามารถวิเคราะห์รูปได้'}`);
        return;
      }

      const { data } = json;
      let newInstrument = data.instrument || formData.instrument;
      if (newInstrument) {
        newInstrument = newInstrument.toUpperCase().trim();
        if (!instruments.includes(newInstrument)) {
          setInstruments(prev => [...prev, newInstrument]);
        }
      }

      setFormData(prev => ({
        ...prev,
        instrument: newInstrument || prev.instrument,
        direction: (data.direction === 'SHORT' ? 'SHORT' : 'LONG') as Direction,
        lotSize: data.lotSize > 0 ? data.lotSize : prev.lotSize,
        entryPrice: data.entryPrice > 0 ? data.entryPrice : prev.entryPrice,
        exitPrice: data.exitPrice > 0 ? data.exitPrice : prev.exitPrice,
        stopLoss: data.stopLoss > 0 ? data.stopLoss : prev.stopLoss,
        takeProfit: data.takeProfit > 0 ? data.takeProfit : prev.takeProfit,
        netPnL: data.netPnL !== null && data.netPnL !== undefined ? data.netPnL : prev.netPnL,
        status: data.status || prev.status,
        entryDate: data.entryDate ? data.entryDate.slice(0, 16) : prev.entryDate,
        notes: data.notes ? (prev.notes ? `${prev.notes}\n${data.notes}` : data.notes) : prev.notes
      }));

      const msg = `✨ ดึงข้อมูลออเดอร์สำเร็จ! [${newInstrument || 'สินทรัพย์'} ${data.direction} ${data.lotSize ? data.lotSize + ' Lots' : ''}] เข้า: ${data.entryPrice} | ออก: ${data.exitPrice || '-'} | P&L: ${data.netPnL !== null && data.netPnL !== undefined ? (data.netPnL >= 0 ? '+' : '') + data.netPnL + ' USD' : '-'}`;
      setScanStatusMessage(msg);
      setTimeout(() => setScanStatusMessage(null), 8000);
    } catch (err: any) {
      console.error('AI Vision error:', err);
      setScanStatusMessage(`❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI: ${err.message || 'โปรดตรวจสอบเครือข่าย'}`);
    } finally {
      setIsOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleGlobalPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          processImage(file);
        }
        break;
      }
    }
  };

  const renderPsychologySelect = (type: 'before' | 'during' | 'after', label: string, icon: React.ReactNode, value: string, field: 'preTrade' | 'duringTrade' | 'postTrade') => {
    const isOpen = openPsych === type;
    const filteredFeelings = feelings[type].filter(f => f.toLowerCase().includes(psychSearch.toLowerCase()));

    return (
      <div className="relative">
        <label className={labelClasses}>
          <div className="flex items-center gap-2">
            {icon}
            {label}
          </div>
        </label>
        <button
          type="button"
          onClick={() => {
            setOpenPsych(isOpen ? null : type);
            setPsychSearch('');
          }}
          className={`${inputClasses} flex items-center justify-between text-left group min-h-[50px]`}
        >
          <span className={value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}>
            {value || `เลือกหรือเพิ่มความรู้สึก`}
          </span>
          <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-slate-600'}`} />
        </button>

        {isOpen && (
          <div className="absolute z-20 bottom-full mb-2 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/20 overflow-hidden animate-fade-in">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800/60">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาหรือเพิ่มความรู้สึก..."
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                  value={psychSearch}
                  onChange={(e) => setPsychSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredFeelings.length === 0 && psychSearch) {
                        handleAddFeeling(type);
                      } else if (filteredFeelings.length > 0) {
                        setFormData({...formData, [field]: filteredFeelings[0]});
                        setOpenPsych(null);
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {filteredFeelings.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setFormData({...formData, [field]: f});
                    setOpenPsych(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                    value === f 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {f}
                </button>
              ))}
              
              {psychSearch && !feelings[type].includes(psychSearch) && (
                <button
                  type="button"
                  onClick={() => handleAddFeeling(type)}
                  className="w-full text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2"
                >
                  <Plus size={14} strokeWidth={3} />
                  เพิ่ม &quot;{psychSearch}&quot;
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onPaste={handleGlobalPaste}
    >
      <div className="glass-card w-full max-w-3xl rounded-2xl overflow-hidden shadow-xl border-slate-200/40 dark:border-white/[0.05]">

        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-white/[0.06] rounded-lg text-slate-500 dark:text-slate-400">
              <BarChart3 size={18} strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {initialData ? t('recentTrades') : t('newTradeEntry')}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('recordExecution')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!initialData && (
              <button
                type="button"
                onClick={() => setConsecutiveLosses(3)}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-white/[0.07]"
              >
                Test SL Warning
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Loss Warning Banner */}
        {consecutiveLosses >= 3 && !initialData && (
          <div className="mx-7 mt-5 px-4 py-3.5 rounded-xl bg-loss-50 dark:bg-loss-950/30 border border-loss-100 dark:border-loss-900/40 flex gap-3 animate-fade-in">
            <AlertTriangle size={16} strokeWidth={1.75} className="text-loss-400 dark:text-loss-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-loss-700 dark:text-loss-300">แจ้งเตือนความเสี่ยง</p>
              <p className="text-xs text-loss-500 dark:text-loss-400/70 mt-0.5 leading-relaxed">
                Stop Loss ติดต่อกัน {consecutiveLosses} ครั้ง — แนะนำให้หยุดพักและทบทวนระบบเทรดก่อน
              </p>
            </div>
          </div>
        )}

        {/* AI Scan Status Banner */}
        {scanStatusMessage && (
          <div className="mx-7 mt-3 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-500 shrink-0 animate-pulse" />
              <span className="font-medium">{scanStatusMessage}</span>
            </div>
            <button onClick={() => setScanStatusMessage(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left Section: Price & Result (fill first) */}
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className={sectionHeaderClasses.replace('mb-5', 'mb-0')}>
                  <Target size={12} strokeWidth={2} />
                  Price & Result
                </div>
                <div className="relative w-full sm:w-auto flex items-center gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <ClipboardPaste size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="วางข้อมูล TradingView..."
                      value={pasteText}
                      onChange={handleSmartPasteInput}
                      className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07] rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-slate-300/40 dark:focus:ring-slate-600/40 focus:outline-none transition-colors"
                    />
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isOcrLoading}
                    className="p-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-500/30 rounded-lg transition-colors shrink-0 shadow-sm"
                    title="สแกนออเดอร์จากรูปภาพสลิปหรือชาร์ต TradingView (AI Vision)"
                  >
                    {isOcrLoading ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <Camera size={14} />}
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {/* Image Preview if user pasted / uploaded an image */}
                {formData.entryImage && (
                  <div className="relative rounded-2xl overflow-hidden border border-blue-200/80 dark:border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 p-2.5 animate-fade-in space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <Sparkles size={13} className="shrink-0" />
                        รูปชาร์ต TradingView ที่นำเข้า
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setIsZoomImageOpen(true)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.08] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Search size={11} />
                          ดูรูปขยาย
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, entryImage: '' }))}
                          className="px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <X size={11} />
                          ลบรูป
                        </button>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setIsZoomImageOpen(true)}
                      className="relative w-full max-h-48 rounded-xl overflow-hidden cursor-pointer bg-slate-900/5 dark:bg-black/40 flex items-center justify-center group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.entryImage}
                        alt="TradingView Chart"
                        className="w-full h-auto max-h-48 object-contain rounded-xl group-hover:scale-[1.01] transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                        <Search size={14} />
                        คลิกเพื่อดูภาพขยาย
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className={labelClasses}>{t('entryPrice')}</label>
                  <input
                    type="number"
                    step="0.00001"
                    className={`${inputClasses} font-mono`}
                    placeholder="0.00000"
                    value={formData.entryPrice}
                    onChange={e => setFormData({...formData, entryPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className={labelClasses}>{t('stopLoss')}</label>
                    <div className="relative">
                      <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-loss-500/70" />
                      <input
                        type="number"
                        step="0.00001"
                        className={`${inputClasses} pl-12 font-mono text-loss-600 dark:text-loss-400`}
                        placeholder="SL"
                        value={formData.stopLoss}
                        onChange={e => setFormData({...formData, stopLoss: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>{t('takeProfit')}</label>
                    <div className="relative">
                      <Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-win-500/70" />
                      <input
                        type="number"
                        step="0.00001"
                        className={`${inputClasses} pl-12 font-mono text-win-600 dark:text-win-400`}
                        placeholder="TP"
                        value={formData.takeProfit}
                        onChange={e => setFormData({...formData, takeProfit: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>{t('status')}</label>
                  <div className="relative grid grid-cols-4 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200/70 dark:border-white/[0.07] overflow-hidden">
                    <div
                      className={`absolute top-1 bottom-1 w-[calc(25%-2px)] rounded-lg transition-all duration-200 ease-out ${
                        formData.status === 'OPEN' ? 'left-1 bg-slate-500 dark:bg-slate-600' :
                        formData.status === 'WIN' ? 'left-[calc(25%+0.5px)] bg-win-600 dark:bg-win-700' :
                        formData.status === 'LOSS' ? 'left-[calc(50%+0.5px)] bg-loss-500 dark:bg-loss-700' :
                        'left-[calc(75%+0.5px)] bg-slate-500 dark:bg-slate-600'
                      }`}
                    />
                    {(['OPEN', 'WIN', 'LOSS', 'BREAK_EVEN'] as TradeStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          let newExitPrice = formData.exitPrice;
                          if (s === 'WIN') newExitPrice = formData.takeProfit;
                          else if (s === 'LOSS') newExitPrice = formData.stopLoss;
                          else if (s === 'BREAK_EVEN') newExitPrice = formData.entryPrice;
                          setFormData({ ...formData, status: s, exitPrice: newExitPrice });
                        }}
                        className={`relative z-10 py-2 rounded-lg text-[11px] font-medium transition-colors duration-200 ${
                          formData.status === s ? 'text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                        }`}
                      >
                        {s === 'BREAK_EVEN' ? 'B/E' : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk/Reward Indicator */}
                {formData.entryPrice > 0 && formData.stopLoss > 0 && formData.takeProfit > 0 && (() => {
                  const risk = formData.direction === 'LONG' ? formData.entryPrice - formData.stopLoss : formData.stopLoss - formData.entryPrice;
                  const reward = formData.direction === 'LONG' ? formData.takeProfit - formData.entryPrice : formData.entryPrice - formData.takeProfit;
                  const rr = risk > 0 && reward > 0 ? reward / risk : null;
                  const tier = rr === null ? 'invalid' : rr >= 2 ? 'good' : rr >= 1 ? 'ok' : 'poor';
                  const styles = {
                    good: { wrap: 'bg-win-50/60 dark:bg-win-950/20 border-win-100 dark:border-win-900/30', label: 'text-win-600 dark:text-win-500', value: 'text-win-700 dark:text-win-400' },
                    ok:   { wrap: 'bg-slate-50/80 dark:bg-white/[0.03] border-slate-200/60 dark:border-white/[0.06]', label: 'text-slate-500 dark:text-slate-400', value: 'text-slate-700 dark:text-slate-300' },
                    poor: { wrap: 'bg-loss-50/50 dark:bg-loss-950/20 border-loss-100 dark:border-loss-900/30', label: 'text-loss-500 dark:text-loss-500', value: 'text-loss-600 dark:text-loss-400' },
                    invalid: { wrap: 'bg-slate-50/60 dark:bg-white/[0.03] border-slate-200/60 dark:border-white/[0.06]', label: 'text-slate-400 dark:text-slate-500', value: 'text-slate-500 dark:text-slate-400' },
                  }[tier];
                  return (
                    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border animate-fade-in ${styles.wrap}`}>
                      <span className={`flex items-center gap-1.5 text-xs font-medium ${styles.label}`}>
                        <BarChart3 size={13} strokeWidth={1.75} />
                        Risk / Reward
                      </span>
                      <span className={`text-sm font-semibold tabular-nums ${styles.value}`}>
                        {rr === null ? (risk <= 0 ? 'Invalid SL' : 'Invalid TP') : `1 : ${rr.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })()}

                {formData.status !== 'OPEN' && (
                  <div className="animate-fade-in space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className={labelClasses}>{t('exitPrice')}</label>
                        <input
                          type="number"
                          step="0.00001"
                          className={`${inputClasses} font-mono`}
                          placeholder="0.00000"
                          value={formData.exitPrice}
                          onChange={e => setFormData({...formData, exitPrice: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={labelClasses}>{t('pnl')} (USD)</label>
                        <div className="relative">
                          <div className={`absolute left-4 top-1/2 -translate-y-1/2 font-semibold ${formData.netPnL >= 0 ? 'text-win-600 dark:text-win-500' : 'text-loss-500 dark:text-loss-500'}`}>$</div>
                          <input
                            type="number"
                            step="0.01"
                            className={`${inputClasses} pl-10 font-semibold tabular-nums ${formData.netPnL >= 0 ? 'text-win-700 dark:text-win-400' : 'text-loss-600 dark:text-loss-400'}`}
                            value={formData.netPnL}
                            onChange={e => setFormData({...formData, netPnL: parseFloat(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Section: Trade Details (สินทรัพย์ → ทิศทาง → ล็อต → กลยุทธ์ → วันที่) */}
            <div className="space-y-5">
              <div className={sectionHeaderClasses}>
                <Info size={12} strokeWidth={2} />
                Trade Details
              </div>

              <div className="space-y-4">
                <div ref={instrumentRef} className="relative z-[60]">
                  <label className={labelClasses}>{t('instrument')}</label>
                  <button
                    type="button"
                    onClick={() => setIsInstrumentOpen(!isInstrumentOpen)}
                    className={`${inputClasses} flex items-center justify-between text-left group min-h-[50px] w-full`}
                  >
                    <span className={formData.instrument ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-400 dark:text-slate-600 font-medium'}>
                      {formData.instrument || `เลือกหรือเพิ่มสินทรัพย์ (เช่น XAUUSD)`}
                    </span>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isInstrumentOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-slate-600'}`} />
                  </button>

                  {isInstrumentOpen && (
                    <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/20 overflow-hidden animate-fade-in">
                      <div className="p-3 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="ค้นหาหรือเพิ่มสินทรัพย์ใหม่..."
                            className="w-full bg-slate-50 dark:bg-white/[0.04] border-none rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-slate-300/40 dark:focus:ring-slate-600/40 focus:outline-none uppercase font-semibold text-slate-700 dark:text-slate-300"
                            autoFocus
                            value={instrumentSearch}
                            onChange={(e) => setInstrumentSearch(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const searchUpper = instrumentSearch.toUpperCase();
                                if (searchUpper) {
                                  setFormData({...formData, instrument: searchUpper});
                                  if (!instruments.includes(searchUpper)) {
                                    setInstruments([...instruments, searchUpper]);
                                  }
                                  setIsInstrumentOpen(false);
                                  setInstrumentSearch('');
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {instruments.filter(s => s.toLowerCase().includes(instrumentSearch.toLowerCase())).map((inst) => (
                          <button
                            key={inst}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, instrument: inst});
                              setIsInstrumentOpen(false);
                              setInstrumentSearch('');
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors uppercase ${
                              formData.instrument === inst
                                ? 'bg-slate-100 dark:bg-white/[0.07] text-slate-800 dark:text-slate-200'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                            }`}
                          >
                            {inst}
                          </button>
                        ))}

                        {instrumentSearch && !instruments.some(s => s.toLowerCase() === instrumentSearch.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => {
                              const searchUpper = instrumentSearch.toUpperCase();
                              setFormData({...formData, instrument: searchUpper});
                              setInstruments([...instruments, searchUpper]);
                              setIsInstrumentOpen(false);
                              setInstrumentSearch('');
                            }}
                            className="w-full text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2"
                          >
                            <Plus size={14} strokeWidth={3} />
                            เพิ่ม "{instrumentSearch}"
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>{t('direction')}</label>
                  <div className="relative flex p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl border border-slate-200/70 dark:border-white/[0.07] overflow-hidden">
                    <div
                      className={`absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-lg transition-all duration-200 ease-out ${
                        formData.direction === 'LONG'
                          ? 'left-1 bg-win-600 dark:bg-win-700'
                          : 'left-[calc(50%+1px)] bg-loss-500 dark:bg-loss-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, direction: 'LONG'})}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors duration-200 ${
                        formData.direction === 'LONG' ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <TrendingUp size={13} strokeWidth={2} /> {t('long')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, direction: 'SHORT'})}
                      className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors duration-200 ${
                        formData.direction === 'SHORT' ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <TrendingDown size={13} strokeWidth={2} /> {t('short')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>{t('lot')}</label>
                  <div className="flex items-center bg-slate-50/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.07] rounded-xl px-1.5 py-1 focus-within:ring-2 focus-within:ring-slate-300/40 dark:focus-within:ring-slate-600/40 transition-colors">
                    <button
                      type="button"
                      onClick={() => adjustLotSize(-0.01)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg"
                    >
                      <Minus size={16} strokeWidth={2} />
                    </button>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-transparent border-none text-center text-base font-semibold focus:ring-0 p-0 text-slate-800 dark:text-slate-200"
                      value={formData.lotSize}
                      onChange={e => setFormData({...formData, lotSize: parseFloat(e.target.value) || 0})}
                    />
                    <button
                      type="button"
                      onClick={() => adjustLotSize(0.01)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg"
                    >
                      <Plus size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <div ref={strategyRef} className="relative">
                  <label className={labelClasses}>{t('strategy')}</label>
                  <button
                    type="button"
                    onClick={() => setIsStrategyOpen(!isStrategyOpen)}
                    className={`${inputClasses} flex items-center justify-between text-left group`}
                  >
                    <span className={formData.strategy ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}>
                      {formData.strategy || 'เลือกหรือเพิ่มกลยุทธ์'}
                    </span>
                    <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isStrategyOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-slate-600'}`} />
                  </button>

                  {isStrategyOpen && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/20 overflow-hidden animate-fade-in">
                      <div className="p-3 border-b border-slate-100 dark:border-slate-800/60">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="ค้นหาหรือเพิ่มกลยุทธ์..."
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20"
                            value={strategySearch}
                            onChange={(e) => setStrategySearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (filteredStrategies.length === 0 && strategySearch) {
                                  handleAddStrategy();
                                } else if (filteredStrategies.length > 0) {
                                  setFormData({...formData, strategy: filteredStrategies[0]});
                                  setIsStrategyOpen(false);
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredStrategies.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, strategy: s});
                              setIsStrategyOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                              formData.strategy === s
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            {s}
                          </button>
                        ))}

                        {strategySearch && !strategies.includes(strategySearch) && (
                          <button
                            type="button"
                            onClick={handleAddStrategy}
                            className="w-full text-left px-4 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2"
                          >
                            <Plus size={14} strokeWidth={3} />
                            เพิ่ม &quot;{strategySearch}&quot;
                          </button>
                        )}

                        {filteredStrategies.length === 0 && !strategySearch && (
                          <div className="px-4 py-8 text-center text-xs text-slate-400 italic">
                            ไม่พบกลยุทธ์
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>{t('date')}</label>
                  <div className="relative group">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                    <input
                      type="datetime-local"
                      className={`${inputClasses} pl-12`}
                      value={formData.entryDate}
                      onChange={e => setFormData({...formData, entryDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Psychology Section */}
          <div ref={psychRef} className="mt-8 pt-6 border-t border-slate-100 dark:border-white/[0.06]">
            <div className={sectionHeaderClasses}>
              <Brain size={12} strokeWidth={2} />
              {t('psychology')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderPsychologySelect('before', t('beforeFeeling'), <Smile size={12} className="text-slate-400" />, formData.preTrade, 'preTrade')}
              {renderPsychologySelect('during', t('duringFeeling'), <Activity size={12} className="text-slate-400" />, formData.duringTrade, 'duringTrade')}
              {renderPsychologySelect('after', t('afterFeeling'), <Save size={12} className="text-slate-400" />, formData.postTrade, 'postTrade')}
            </div>
          </div>

          {/* Pre-trade Checklist Section */}
          {checklistItems.length > 0 && !initialData && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/[0.06]">
              <div className={sectionHeaderClasses}>
                <ListChecks size={12} strokeWidth={2} />
                Pre-Trade Checklist
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {checklistItems.map((item, idx) => {
                  const isChecked = !!checkedItems[item];
                  return (
                    <div
                      key={idx}
                      onClick={() => setCheckedItems(prev => ({...prev, [item]: !isChecked}))}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-win-50 dark:bg-win-950/30 border-win-100 dark:border-win-900/40'
                          : 'bg-slate-50/60 dark:bg-white/[0.03] border-slate-200/70 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors shrink-0 ${
                        isChecked
                          ? 'border-win-500 bg-win-500 dark:bg-win-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isChecked && <CheckCircle2 size={12} strokeWidth={2.5} />}
                      </div>
                      <span className={`text-sm transition-colors ${
                        isChecked
                          ? 'text-win-700 dark:text-win-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TradingView Charts Section (Zero Cloud Storage) */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/[0.06]">
            <div className={sectionHeaderClasses}>
              <Link2 size={12} strokeWidth={2} />
              TradingView Charts (คลาวด์ลิงก์ - ไม่กินพื้นที่ DB)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClasses}>ลิงก์กราฟจุดเข้า (Entry Chart)</label>
                  {formData.tradingViewUrl && (
                    <a
                      href={formData.tradingViewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      เปิดดูกราฟ <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <div className="relative group">
                  <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
                  <input
                    type="url"
                    className={`${inputClasses} pl-10 text-xs font-mono`}
                    placeholder="https://www.tradingview.com/x/.../"
                    value={formData.tradingViewUrl}
                    onChange={e => setFormData({ ...formData, tradingViewUrl: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClasses}>ลิงก์กราฟจุดออก / ผลลัพธ์ (Exit Chart)</label>
                  {formData.exitTradingViewUrl && (
                    <a
                      href={formData.exitTradingViewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                    >
                      เปิดดูกราฟ <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <div className="relative group">
                  <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
                  <input
                    type="url"
                    className={`${inputClasses} pl-10 text-xs font-mono`}
                    placeholder="https://www.tradingview.com/x/.../"
                    value={formData.exitTradingViewUrl}
                    onChange={e => setFormData({ ...formData, exitTradingViewUrl: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5">
              💡 <strong>วิธีแชร์:</strong> ใน TradingView กดปุ่มรูปกล้องถ่ายรูปมุมขวาบน ➔ เลือก <strong>&quot;Copy link to the chart image&quot;</strong> แล้วนำมาวางได้เลยครับ (ประหยัดพื้นที่ Cloud 100%)
            </p>
          </div>

          {/* Journal Section */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/[0.06]">
            <div className={sectionHeaderClasses}>
              <FileText size={12} strokeWidth={2} />
              Trade Journal
            </div>

            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">การประเมินตนเอง</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">วินัยและการทำตามแผนสำหรับไม้นี้</p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({...formData, selfAssessment: star === formData.selfAssessment ? 0 : star})}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      size={22}
                      className={`transition-colors ${
                        star <= formData.selfAssessment
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200 dark:text-slate-700 hover:text-amber-300 dark:hover:text-amber-700'
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className={textareaClasses}
              placeholder="บันทึกรายละเอียด แผนการเทรด หรือสิ่งที่ได้เรียนรู้จากไม้นี้..."
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.07] border border-slate-200/60 dark:border-white/[0.06] transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 transition-colors"
            >
              <Save size={16} strokeWidth={2} />
              {t('saveRecord')}
            </button>
          </div>
        </form>
      </div>

      {/* Gemini API Key Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-md w-full border border-slate-200 dark:border-white/[0.08] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">ระบบสแกน TradingView ด้วย AI</h3>
                  <p className="text-xs text-slate-400">ดึงราคา Entry, SL, TP และคู่เงินอัตโนมัติ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsApiKeyModalOpen(false); setPendingImageFile(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                📌 วิธีรับ Gemini API Key ฟรี (ไม่เสียค่าใช้จ่าย):
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-500 dark:text-slate-400 leading-relaxed">
                <li>
                  เปิดไปที่{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 font-bold underline inline-flex items-center gap-0.5"
                  >
                    Google AI Studio <ExternalLink size={11} />
                  </a>
                </li>
                <li>กดปุ่ม <b>&quot;Create API Key&quot;</b></li>
                <li>คัดลอก Key (ขึ้นต้นด้วย AIzaSy...) มาวางในช่องด้านล่าง</li>
              </ol>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gemini API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiApiKeyInput}
                  onChange={(e) => { 
                    setGeminiApiKeyInput(e.target.value); 
                    setApiKeyError('');
                    setApiKeySuccess('');
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.1] text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={isTestingApiKey}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {isTestingApiKey ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>กำลังทดสอบ...</span>
                    </>
                  ) : (
                    <span>ทดสอบ Key</span>
                  )}
                </button>
              </div>

              {apiKeySuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 animate-fade-in">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{apiKeySuccess}</span>
                </div>
              )}

              {apiKeyError && (
                <div className="flex items-start gap-1.5 text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-800/40 animate-fade-in">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{apiKeyError}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
                💡 ระบบจะเชื่อมต่อ Google Gemini Vision โดยตรงเพื่ออ่านราคา Long / Short Position บน TradingView
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => { setIsApiKeyModalOpen(false); setPendingImageFile(null); }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!geminiApiKeyInput.trim()) {
                    setApiKeyError('กรุณากรอก API Key');
                    return;
                  }
                  const key = geminiApiKeyInput.trim();
                  localStorage.setItem('gemini_api_key', key);
                  setIsApiKeyModalOpen(false);
                  if (pendingImageFile) {
                    const file = pendingImageFile;
                    setPendingImageFile(null);
                    await processImage(file, key);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                บันทึกและสแกนรูป
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Image Lightbox Modal */}
      {isZoomImageOpen && formData.entryImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setIsZoomImageOpen(false)}
        >
          <div className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center">
            <button
              onClick={() => setIsZoomImageOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X size={22} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={formData.entryImage}
              alt="TradingView Chart Full"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
