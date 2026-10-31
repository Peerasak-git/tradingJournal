'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Layers,
  Key,
  ShieldAlert,
  Search,
  ExternalLink,
  RotateCcw,
  PlusCircle,
  Clock,
  Ticket,
  Zap,
  Cpu
} from 'lucide-react';
import { Trade, Direction, TradeStatus } from '@/types/trade';
import { useAccount } from '@/context/AccountContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { addOrUpdateTrade } from '@/lib/clientStorage';

interface AutoOrderScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTradeSaved?: (trade: Trade) => void;
}

type ScanEngine = 'local' | 'ai';

export default function AutoOrderScanModal({
  isOpen,
  onClose,
  onTradeSaved,
}: AutoOrderScanModalProps) {
  const { selectedAccount } = useAccount();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [scanEngine, setScanEngine] = useState<ScanEngine>('local'); // Default to Local OCR (No AI needed)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [scannedTrade, setScannedTrade] = useState<any>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [savedTradeData, setSavedTradeData] = useState<Trade | null>(null);

  // Gemini API Key Modal
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [apiKeySuccess, setApiKeySuccess] = useState('');
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      resetScanState();
    }
  }, [isOpen]);

  // Global Paste handler when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            handleSelectedFile(file);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, autoSaveEnabled, scanEngine]);

  const resetScanState = () => {
    setImageFile(null);
    setImagePreview('');
    setIsScanning(false);
    setStatusMessage('');
    setErrorMessage('');
    setScannedTrade(null);
    setSavedSuccess(false);
    setSavedTradeData(null);
  };

  if (!isOpen) return null;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const saveTradeToDatabase = async (tradeRaw: any, previewBase64: string) => {
    try {
      const newTradeId = 'trade_' + Math.random().toString(36).substring(2, 11);
      const isLong = tradeRaw.direction === 'LONG';
      const risk = tradeRaw.entryPrice && tradeRaw.stopLoss 
        ? Math.abs(tradeRaw.entryPrice - tradeRaw.stopLoss) 
        : 0;
      const plannedReward = tradeRaw.entryPrice && tradeRaw.takeProfit
        ? (isLong ? tradeRaw.takeProfit - tradeRaw.entryPrice : tradeRaw.entryPrice - tradeRaw.takeProfit)
        : 0;
      const plannedRR = risk > 0 && plannedReward > 0 ? parseFloat((plannedReward / risk).toFixed(2)) : null;

      const actualReward = tradeRaw.entryPrice && tradeRaw.exitPrice
        ? (isLong ? tradeRaw.exitPrice - tradeRaw.entryPrice : tradeRaw.entryPrice - tradeRaw.exitPrice)
        : 0;
      const actualRR = risk > 0 && actualReward > 0 ? parseFloat((actualReward / risk).toFixed(2)) : null;

      const tradeToSave: Trade = {
        id: newTradeId,
        userId: user?.id,
        accountId: selectedAccount?.id || 'acc-1',
        instrument: tradeRaw.instrument || 'XAUUSD',
        direction: (tradeRaw.direction === 'SHORT' ? 'SHORT' : 'LONG') as Direction,
        lotSize: tradeRaw.lotSize || 0.01,
        status: (tradeRaw.status || (tradeRaw.netPnL >= 0 ? 'WIN' : 'LOSS')) as TradeStatus,
        entryPrice: tradeRaw.entryPrice || 0,
        exitPrice: tradeRaw.exitPrice || null,
        stopLoss: tradeRaw.stopLoss || null,
        takeProfit: tradeRaw.takeProfit || null,
        entryDate: tradeRaw.entryDate || new Date().toISOString(),
        exitDate: tradeRaw.exitDate || (tradeRaw.status !== 'OPEN' ? new Date().toISOString() : null),
        financials: {
          grossPnL: tradeRaw.grossPnL !== undefined ? tradeRaw.grossPnL : tradeRaw.netPnL,
          commission: tradeRaw.commission || 0,
          swap: tradeRaw.swap || 0,
          netPnL: tradeRaw.netPnL !== undefined ? tradeRaw.netPnL : 0,
          currency: tradeRaw.currency || 'USD',
        },
        analysis: {
          strategy: tradeRaw.engine === 'LOCAL_OCR' ? 'Local OCR (No AI)' : 'AI Slip Vision',
          timeframe: tradeRaw.timeframe || null,
          plannedRR,
          actualRR,
        },
        notes: {
          preTrade: null,
          duringTrade: null,
          postTrade: null,
          detailedNotes: tradeRaw.notes || (tradeRaw.ticket ? `Ticket #${tradeRaw.ticket}` : 'Auto-imported from order slip'),
          entryImage: previewBase64 || null,
          exitImage: null,
          tradingViewUrl: null,
          exitTradingViewUrl: null,
          selfAssessment: 5,
        },
      };

      const saved = await addOrUpdateTrade(tradeToSave);
      setSavedTradeData(saved);
      setSavedSuccess(true);
      if (onTradeSaved) {
        onTradeSaved(saved);
      }
    } catch (err: any) {
      console.error('Error saving trade:', err);
      setErrorMessage(`บันทึกไม่สำเร็จ: ${err.message || 'เกิดข้อผิดพลาดในการบันทึก'}`);
    }
  };

  const processWithLocalOcr = async (base64: string) => {
    setStatusMessage('⚡ กำลังอ่านข้อความจากสลิปด้วย Local OCR (ไม่ต้องใช้ AI / ไม่ต้องใช้ Key)...');
    const res = await fetch('/api/ocr/local-slip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64 }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Local OCR ไม่สามารถอ่านข้อความจากรูปภาพได้');
    }
    return json.data;
  };

  const processWithAi = async (base64: string, overrideKey?: string) => {
    const key =
      overrideKey !== undefined
        ? overrideKey
        : (typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : '') || '';

    if (!key) {
      // If no key provided, seamlessly fallback to Local OCR
      return await processWithLocalOcr(base64);
    }

    setStatusMessage('🤖 กำลังส่งรูปภาพให้ AI Gemini Vision วิเคราะห์ข้อมูล...');
    const res = await fetch('/api/ai/vision-trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        apiKey: key,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      // If AI fails, fallback to Local OCR so the user is never blocked!
      console.warn('AI failed, falling back to Local OCR:', json.message);
      return await processWithLocalOcr(base64);
    }
    return json.data;
  };

  const processImageScan = async (file: File, overrideKey?: string) => {
    try {
      setIsScanning(true);
      setErrorMessage('');
      setSavedSuccess(false);

      const base64 = await fileToBase64(file);
      setImagePreview(base64);

      let extractedData: any = null;

      if (scanEngine === 'local') {
        extractedData = await processWithLocalOcr(base64);
      } else {
        extractedData = await processWithAi(base64, overrideKey);
      }

      setScannedTrade(extractedData);
      setStatusMessage('✨ สแกนและอ่านข้อมูลออเดอร์สำเร็จ!');

      // If Auto-Save is enabled, automatically save to database immediately!
      if (autoSaveEnabled) {
        setStatusMessage('⚡ กำลังเพิ่มข้อมูลเข้าพอร์ตอัตโนมัติ...');
        await saveTradeToDatabase(extractedData, base64);
        setStatusMessage('🎉 บันทึกออเดอร์เข้าพอร์ตเรียบร้อยแล้ว!');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      // As a last-ditch effort, try local OCR if not already tried
      if (scanEngine === 'ai') {
        try {
          const base64 = await fileToBase64(file);
          const fallbackData = await processWithLocalOcr(base64);
          setScannedTrade(fallbackData);
          if (autoSaveEnabled) {
            await saveTradeToDatabase(fallbackData, base64);
          }
          return;
        } catch {}
      }
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectedFile = (file: File) => {
    setImageFile(file);
    processImageScan(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleSelectedFile(file);
    }
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
        body: JSON.stringify({ apiKey: geminiApiKeyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApiKeySuccess(data.message || 'เชื่อมต่อ Gemini API สำเร็จ!');
      } else {
        setApiKeyError(data.message || 'ทดสอบ Key ไม่สำเร็จ');
      }
    } catch (err: any) {
      setApiKeyError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsTestingApiKey(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {language === 'th' ? 'สแกนออเดอร์อัตโนมัติจากรูปสลิป' : 'Auto Order Slip Scanner'}
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {scanEngine === 'local' ? 'Local OCR (ไม่ต้องใช้ AI)' : 'AI Vision'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'th'
                  ? 'อ่านข้อมูลสลิป IUX, Exness, MT4/MT5, cTrader ฟรี 100% ไม่ต้องใช้ API Key'
                  : 'Reads mobile broker order tickets without requiring an external AI API key'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Engine Selector & Auto-Save Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Engine Switch */}
              <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-white/[0.05] p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setScanEngine('local')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    scanEngine === 'local'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Zap size={13} className="text-emerald-500" />
                  <span>{language === 'th' ? '⚡ Local OCR (ไม่ต้องใช้ AI / ฟรี)' : '⚡ Local OCR (No AI)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScanEngine('ai')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    scanEngine === 'ai'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Cpu size={13} className="text-blue-500" />
                  <span>{language === 'th' ? '🤖 Gemini AI Vision' : '🤖 Gemini AI Vision'}</span>
                </button>
              </div>

              {scanEngine === 'ai' && (
                <button
                  onClick={() => {
                    setGeminiApiKeyInput(localStorage.getItem('gemini_api_key') || '');
                    setIsApiKeyModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Key size={13} />
                  {language === 'th' ? 'ตั้งค่า Gemini API Key' : 'Configure API Key'}
                </button>
              )}
            </div>

            {/* Auto-Save Checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200 pt-1 border-t border-slate-200/50 dark:border-white/[0.04]">
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
              />
              <span>
                {language === 'th'
                  ? '⚡ บันทึกข้อมูลเข้าพอร์ตทันทีอัตโนมัติเมื่ออ่านเสร็จ (Auto-Save)'
                  : '⚡ Auto-Save order directly into portfolio on scan'}
              </span>
            </label>
          </div>

          {/* Upload Dropzone */}
          {!imagePreview && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-white/[0.12] hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-white/[0.01] hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 group flex flex-col items-center justify-center gap-3"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {language === 'th'
                    ? 'คลิกเพื่อเลือกรูปสลิป หรือลากไฟล์มาวางที่นี่'
                    : 'Click to upload or drag and drop order slip here'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'th'
                    ? '💡 หรือกดปุ่ม Ctrl + V (Cmd + V) เพื่อวางรูปภาพสลิปจากคลิปบอร์ดได้ทันที'
                    : '💡 Or press Ctrl + V (Cmd + V) to paste screenshot directly'}
                </p>
              </div>
            </div>
          )}

          {/* Status / Loading Banner */}
          {isScanning && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex items-center gap-3 animate-pulse">
              <Loader2 size={20} className="animate-spin text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {statusMessage}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
              <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 dark:text-rose-300 font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Scanned Result Preview */}
          {imagePreview && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Slip Image Preview on Left */}
              <div className="md:col-span-5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>{language === 'th' ? 'รูปสลิปต้นฉบับ' : 'Original Slip Image'}</span>
                  <button
                    onClick={resetScanState}
                    className="text-rose-500 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <RotateCcw size={11} />
                    {language === 'th' ? 'เปลี่ยนรูปใหม่' : 'Change Image'}
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.08] bg-black/20 flex items-center justify-center max-h-72">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Slip preview"
                    className="w-full h-auto max-h-72 object-contain"
                  />
                </div>
              </div>

              {/* Extracted Details on Right */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                {scannedTrade ? (
                  <div className="space-y-4">
                    {/* Header info card */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-slate-900 dark:text-white">
                              {scannedTrade.instrument}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md ${
                                scannedTrade.direction === 'LONG'
                                  ? 'bg-win-50 text-win-700 dark:bg-win-500/10 dark:text-win-400'
                                  : 'bg-loss-50 text-loss-700 dark:bg-loss-500/10 dark:text-loss-400'
                              }`}
                            >
                              {scannedTrade.direction === 'LONG' ? (
                                <ArrowUpRight size={12} />
                              ) : (
                                <ArrowDownLeft size={12} />
                              )}
                              {scannedTrade.direction} {scannedTrade.lotSize} Lots
                            </span>
                          </div>
                          {scannedTrade.ticket && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              <Ticket size={11} /> Ticket #{scannedTrade.ticket}
                            </p>
                          )}
                        </div>

                        {/* Net P&L badge */}
                        <div className="text-right">
                          <span
                            className={`inline-block text-base font-black px-3 py-1 rounded-xl ${
                              scannedTrade.netPnL >= 0
                                ? 'bg-win-50 text-win-700 dark:bg-win-500/10 dark:text-win-400 border border-win-200 dark:border-win-500/30'
                                : 'bg-loss-50 text-loss-700 dark:bg-loss-500/10 dark:text-loss-400 border border-loss-200 dark:border-loss-500/30'
                            }`}
                          >
                            {scannedTrade.netPnL >= 0 ? '+' : ''}${scannedTrade.netPnL?.toFixed(2)} USD
                          </span>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                            {scannedTrade.status}
                          </span>
                        </div>
                      </div>

                      {/* 4-Box Price Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.05]">
                        <div className="bg-white dark:bg-black/30 p-2 rounded-lg border border-slate-100 dark:border-white/[0.04]">
                          <span className="text-[10px] text-slate-400 font-medium">ราคาเปิด (Open)</span>
                          <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {scannedTrade.entryPrice || '-'}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-black/30 p-2 rounded-lg border border-slate-100 dark:border-white/[0.04]">
                          <span className="text-[10px] text-slate-400 font-medium">ราคาปิด (Close)</span>
                          <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {scannedTrade.exitPrice || '-'}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-black/30 p-2 rounded-lg border border-slate-100 dark:border-white/[0.04]">
                          <span className="text-[10px] text-rose-500 font-medium">Stop Loss</span>
                          <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {scannedTrade.stopLoss || '-'}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-black/30 p-2 rounded-lg border border-slate-100 dark:border-white/[0.04]">
                          <span className="text-[10px] text-emerald-500 font-medium">Take Profit</span>
                          <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {scannedTrade.takeProfit || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> Open: {scannedTrade.entryDate?.replace('T', ' ')}
                        </span>
                        {scannedTrade.exitDate && (
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> Close: {scannedTrade.exitDate?.replace('T', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Success Notice if saved */}
                    {savedSuccess ? (
                      <div className="p-4 rounded-xl bg-win-50 dark:bg-win-950/30 border border-win-200 dark:border-win-900/40 space-y-2 animate-fade-in">
                        <div className="flex items-center gap-2 text-win-700 dark:text-win-400 font-bold text-sm">
                          <CheckCircle2 size={18} />
                          <span>
                            {language === 'th'
                              ? 'เพิ่มข้อมูลเข้าพอร์ตสำเร็จเรียบร้อยแล้ว!'
                              : 'Order successfully saved into your portfolio!'}
                          </span>
                        </div>
                        <p className="text-xs text-win-600 dark:text-win-300">
                          {language === 'th'
                            ? `ระบบได้อัปเดตยอด Balance และคำนวณสถิติในแดชบอร์ด/ปฏิทินเรียบร้อยแล้ว`
                            : 'Your account balance and metrics have been recalculated automatically.'}
                        </p>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={resetScanState}
                            className="px-3 py-1.5 rounded-lg bg-win-600 hover:bg-win-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <PlusCircle size={13} />
                            {language === 'th' ? 'สแกนสลิปออเดอร์ถัดไป' : 'Scan Next Order Slip'}
                          </button>
                          <button
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer"
                          >
                            {language === 'th' ? 'เสร็จสิ้น / ปิดหน้าต่าง' : 'Done / Close'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Manual Save Button if Auto-save was disabled */
                      <div className="pt-2">
                        <button
                          onClick={() => saveTradeToDatabase(scannedTrade, imagePreview)}
                          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 size={16} />
                          <span>
                            {language === 'th'
                              ? '💾 ยืนยันบันทึกออเดอร์นี้เข้าพอร์ต'
                              : 'Confirm & Save Order to Portfolio'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-8 text-center text-xs text-slate-400">
                    {isScanning
                      ? 'กำลังประมวลผลข้อมูล...'
                      : 'ข้อมูลออเดอร์ที่แยกแยะได้จะปรากฏขึ้นที่นี่'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            {language === 'th' ? 'พอร์ตที่กำลังบันทึก:' : 'Target Portfolio:'}{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {selectedAccount?.name || 'Default Account'}
            </strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/[0.06] font-semibold transition cursor-pointer"
          >
            {language === 'th' ? 'ปิด' : 'Close'}
          </button>
        </div>
      </div>

      {/* Gemini API Key Configuration Sub-Modal */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Key size={16} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'th' ? 'ตั้งค่า Google Gemini API Key' : 'Configure Gemini API Key'}
                </h3>
              </div>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {language === 'th'
                ? 'ระบบใช้ Gemini Vision ในการอ่านภาพสลิปออเดอร์ สามารถรับ API Key ฟรีได้จาก Google AI Studio'
                : 'Free Gemini API Key from Google AI Studio is required for AI slip reading.'}
            </p>

            <div className="space-y-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiApiKeyInput}
                onChange={(e) => setGeminiApiKeyInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink size={10} />
                  {language === 'th' ? 'รับ API Key ฟรีที่ Google AI Studio' : 'Get free API Key'}
                </a>
                <button
                  type="button"
                  onClick={handleTestApiKey}
                  disabled={isTestingApiKey}
                  className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1"
                >
                  {isTestingApiKey && <Loader2 size={10} className="animate-spin" />}
                  {language === 'th' ? 'ทดสอบ Key' : 'Test Key'}
                </button>
              </div>
            </div>

            {apiKeyError && (
              <p className="text-xs text-rose-500 font-semibold bg-rose-50 dark:bg-rose-500/10 p-2.5 rounded-lg border border-rose-200 dark:border-rose-500/20">
                {apiKeyError}
              </p>
            )}

            {apiKeySuccess && (
              <p className="text-xs text-win-600 font-semibold bg-win-50 dark:bg-win-500/10 p-2.5 rounded-lg border border-win-200 dark:border-win-500/20">
                {apiKeySuccess}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const cleanKey = geminiApiKeyInput.trim();
                  if (cleanKey) {
                    localStorage.setItem('gemini_api_key', cleanKey);
                  }
                  setIsApiKeyModalOpen(false);
                  if (imageFile) {
                    processImageScan(imageFile, cleanKey);
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
              >
                {language === 'th' ? 'บันทึกและดำเนินการต่อ' : 'Save & Continue'}
              </button>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
