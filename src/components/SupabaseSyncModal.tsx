'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  HelpCircle,
  Trash2,
  HardDrive,
  Image as ImageIcon,
  Clock,
  ShieldAlert,
  Download,
  Upload,
  Layers,
  FileJson,
  Check,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection,
  SupabaseConfigInfo,
} from '@/lib/supabase';
import {
  syncAllLocalToSupabase,
  syncAllSupabaseToLocal,
  exportAllData,
  importAllData,
  getStorageStats,
  stripTradeScreenshots,
  purgeOldClosedTrades,
  clearCollection,
  StorageStats,
} from '@/lib/clientStorage';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'sync' | 'storage' | 'backup';
}

export default function SupabaseSyncModal({ isOpen, onClose, defaultTab = 'sync' }: SupabaseSyncModalProps) {
  const [activeTab, setActiveTab] = useState<'sync' | 'storage' | 'backup'>(defaultTab);
  const [config, setConfig] = useState<SupabaseConfigInfo>({
    url: '',
    key: '',
    source: null,
    isConfigured: false,
  });

  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [syncingUp, setSyncingUp] = useState(false);
  const [syncingDown, setSyncingDown] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Storage Stats State
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [purgeDays, setPurgeDays] = useState<number>(90);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshConfig();
      loadStats();
      setStatusMessage(null);
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const refreshConfig = () => {
    const creds = getSupabaseCredentials();
    setConfig(creds);
    if (creds.source === 'custom') {
      setInputUrl(creds.url);
      setInputKey(creds.key);
    } else if (creds.source === 'env') {
      setInputUrl(creds.url);
      setInputKey('••••••••••••••••••••••••••••••••');
    } else {
      setInputUrl('');
      setInputKey('');
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const s = await getStorageStats();
      setStats(s);
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!isOpen) return null;

  // Auto Backup Helper before destructive operations
  const downloadBackupFile = async (prefix = 'backup') => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-journal-${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setStatusMessage({ type: 'info', text: 'กำลังทดสอบการเชื่อมต่อกับ Supabase...' });

    const targetUrl = config.source === 'env' ? config.url : inputUrl;
    const targetKey = config.source === 'env' ? config.key : inputKey;

    const res = await testSupabaseConnection(targetUrl, targetKey);
    setTesting(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: 'เชื่อมต่อกับ Supabase สำเร็จ พร้อมใช้งาน!' });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl || !inputKey) {
      setStatusMessage({ type: 'error', text: 'กรุณากรอกทั้ง Supabase URL และ Anon Key' });
      return;
    }

    setTesting(true);
    setStatusMessage({ type: 'info', text: 'กำลังตรวจสอบข้อมูล...' });
    const res = await testSupabaseConnection(inputUrl, inputKey);
    setTesting(false);

    if (!res.success) {
      setStatusMessage({ type: 'error', text: `บันทึกไม่สำเร็จ: ${res.message}` });
      return;
    }

    setCustomSupabaseCredentials(inputUrl, inputKey);
    refreshConfig();
    loadStats();
    setStatusMessage({
      type: 'success',
      text: 'บันทึกการตั้งค่าเรียบร้อย! ระบบจะซิงค์ข้อมูลกับ Supabase อัตโนมัติ',
    });
  };

  const handleDisconnect = () => {
    if (confirm('คุณต้องการยกเลิกการเชื่อมต่อ Supabase ในเบราว์เซอร์นี้ใช่หรือไม่? (ข้อมูลในฐานข้อมูลจะไม่ถูกลบ)')) {
      clearCustomSupabaseCredentials();
      refreshConfig();
      loadStats();
      setStatusMessage({ type: 'info', text: 'ยกเลิกการเชื่อมต่อแล้ว กลับสู่โหมด Local Storage' });
    }
  };

  const handleUploadAll = async () => {
    setSyncingUp(true);
    setStatusMessage({ type: 'info', text: 'กำลังส่งข้อมูลทั้งหมดขึ้นสู่ Cloud...' });

    const res = await syncAllLocalToSupabase();
    setSyncingUp(false);

    if (res.success) {
      loadStats();
      setStatusMessage({
        type: 'success',
        text: `ซิงค์สำเร็จ! ส่งข้อมูลขึ้น Supabase จำนวน ${res.count} รายการเรียบร้อยแล้ว`,
      });
    } else {
      setStatusMessage({ type: 'error', text: `เกิดข้อผิดพลาดในการซิงค์: ${res.error}` });
    }
  };

  const handleDownloadAll = async () => {
    if (!confirm('ต้องการดึงข้อมูลล่าสุดจาก Supabase มาแทนที่ข้อมูลในเครื่องใช่หรือไม่?')) return;
    setSyncingDown(true);
    setStatusMessage({ type: 'info', text: 'กำลังดาวน์โหลดข้อมูลล่าสุดจาก Cloud...' });

    const res = await syncAllSupabaseToLocal();
    setSyncingDown(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: 'ดาวน์โหลดข้อมูลล่าสุดสำเร็จ! กำลังรีเฟรชหน้าจอ...',
      });
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } else {
      setStatusMessage({ type: 'error', text: `เกิดข้อผิดพลาด: ${res.error}` });
    }
  };

  // Clean actions
  const handleStripScreenshots = async () => {
    if (!confirm('ต้องการลบรูปภาพแคปหน้าจอออกจากประวัติเทรดใช่หรือไม่? (ข้อมูลสถิติ PnL, Lot, วันที่, และรีวิวจะยังอยู่ครบ และระบบจะดาวน์โหลดไฟล์สำรองให้ก่อน)')) return;

    setStatusMessage({ type: 'info', text: 'กำลังสำรองข้อมูลและล้างรูปภาพเพื่อประหยัดพื้นที่...' });
    await downloadBackupFile('pre-strip-images');

    const res = await stripTradeScreenshots();
    loadStats();

    const savedKb = Math.round(res.savedBytesEstimate / 1024);
    setStatusMessage({
      type: 'success',
      text: `ล้างรูปภาพเรียบร้อย ${res.cleanedCount} รายการ! ประหยัดพื้นที่ได้ประมาณ ~${savedKb} KB`,
    });
  };

  const handlePurgeOldTrades = async () => {
    const daysLabel = purgeDays === 0 ? 'ทั้งหมด' : `เก่ากว่า ${purgeDays} วัน`;
    if (!confirm(`คุณต้องการล้างประวัติเทรดที่ปิดแล้ว (${daysLabel}) ออกจาก Cloud ใช่หรือไม่? (ระบบจะสำรองข้อมูล JSON ลงเครื่องให้อัตโนมัติก่อน)`)) return;

    setStatusMessage({ type: 'info', text: 'กำลังสำรองข้อมูลและล้างประวัติเทรดเก่า...' });
    await downloadBackupFile(`pre-purge-trades-${purgeDays}d`);

    const res = await purgeOldClosedTrades(purgeDays === 0 ? undefined : purgeDays);
    loadStats();

    setStatusMessage({
      type: 'success',
      text: `ล้างประวัติเทรดที่ปิดแล้วสำเร็จ ${res.purgedCount} รายการ (คงเหลือเทรดในระบบ ${res.remainingCount} รายการ)`,
    });
  };

  const handleClearCollection = async (coll: 'trades' | 'journals' | 'finances' | 'reviews' | 'all') => {
    const labelMap = {
      trades: 'รายการเทรดทั้งหมด',
      journals: 'บันทึก Diary ทั้งหมด',
      finances: 'รายการการเงินทั้งหมด',
      reviews: 'รีวิวรายวันทั้งหมด',
      all: 'ข้อมูลทั้งหมดในระบบ (Trades, Journals, Finances, Reviews)',
    };

    if (!confirm(`คำเตือน: คุณต้องการล้าง "${labelMap[coll]}" ออกจาก Cloud และเครื่องใช่หรือไม่? (ระบบจะดาวน์โหลดไฟล์สำรองข้อมูลให้ก่อน)`)) return;

    setStatusMessage({ type: 'info', text: `กำลังสำรองข้อมูลและล้าง ${labelMap[coll]}...` });
    await downloadBackupFile(`pre-clear-${coll}`);

    await clearCollection(coll);
    loadStats();

    setStatusMessage({
      type: 'success',
      text: `ล้าง "${labelMap[coll]}" สำเร็จเรียบร้อย!`,
    });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatusMessage({ type: 'info', text: 'กำลังอ่านไฟล์และนำเข้าข้อมูล...' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importAllData(content, { mode: importMode });
      setImporting(false);

      if (res.success) {
        loadStats();
        setStatusMessage({
          type: 'success',
          text: `${res.message} (Trades: ${res.counts?.trades}, Accounts: ${res.counts?.accounts}) กำลังรีเฟรช...`,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: `นำเข้าไม่สำเร็จ: ${res.message}` });
      }
    };
    reader.readAsText(file);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const freeTierLimitBytes = 500 * 1024 * 1024; // 500 MB Supabase free tier
  const usedBytes = stats?.estimatedBytes || 0;
  const usedPercent = Math.min(100, Math.max(0.01, (usedBytes / freeTierLimitBytes) * 100));

  return (
    <div className="fixed inset-0 z-[100000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="glass-card max-w-2xl w-full p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Cloud size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Supabase Cloud Database
              </h2>
              {config.isConfigured ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Local Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ซิงค์ข้อมูล Trades, Accounts, PIN, และการตั้งค่าข้ามทุกโดเมน พร้อมเครื่องมือจัดการพื้นที่ใช้งานฟรี
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5 gap-2">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'sync'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cloud size={14} />
            <span>เชื่อมต่อ &amp; ซิงค์</span>
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'storage'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <HardDrive size={14} />
            <span>จัดการพื้นที่ Cloud (ใช้ฟรี)</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'backup'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileJson size={14} />
            <span>สำรอง / นำเข้า (JSON)</span>
          </button>
        </div>

        {/* Status Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl mb-5 text-xs font-semibold flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
                : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
            {statusMessage.type === 'error' && <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            {statusMessage.type === 'info' && <RefreshCw size={16} className="shrink-0 mt-0.5 animate-spin" />}
            <span className="flex-1 leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: SYNC & CONNECT */}
        {activeTab === 'sync' && (
          <div>
            {config.isConfigured ? (
              <div className="space-y-4 mb-5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">แหล่งที่มาของการตั้งค่า:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {config.source === 'env' ? 'Environment Variables (Vercel / .env)' : 'การตั้งค่าในเบราว์เซอร์'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Project URL:</span>
                    <span className="text-slate-800 dark:text-slate-200 truncate max-w-[260px]">
                      {config.url}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleUploadAll}
                    disabled={syncingUp || syncingDown}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud size={16} className={syncingUp ? 'animate-bounce' : ''} />
                    {syncingUp ? 'กำลังอัปโหลด...' : 'ส่งข้อมูลขึ้น Cloud'}
                  </button>

                  <button
                    onClick={handleDownloadAll}
                    disabled={syncingUp || syncingDown}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  >
                    <DownloadCloud size={16} className={syncingDown ? 'animate-bounce' : ''} />
                    {syncingDown ? 'กำลังดาวน์โหลด...' : 'ดึงข้อมูลล่าสุด'}
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                    ทดสอบการเชื่อมต่อ
                  </button>

                  {config.source === 'custom' && (
                    <button
                      onClick={handleDisconnect}
                      className="py-2 px-3 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      ตัดการเชื่อมต่อ
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {/* Credentials Form */}
            {(!config.isConfigured || config.source === 'custom') && (
              <form onSubmit={handleSaveCredentials} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Supabase Project URL
                    </label>
                    <span className="text-[10px] text-slate-400">เช่น https://abcdef.supabase.co</span>
                  </div>
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Supabase Anon Key (Public)
                    </label>
                    <span className="text-[10px] text-slate-400">Project Settings &gt; API</span>
                  </div>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={testing}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Database size={15} />
                    {testing ? 'กำลังตรวจสอบ...' : 'เชื่อมต่อ & บันทึก'}
                  </button>
                </div>
              </form>
            )}

            {/* Step-by-step Setup Guide Toggle */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center justify-between w-full text-xs font-bold text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 transition"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle size={14} />
                  วิธีสร้างและเชื่อมต่อ Supabase ฟรี (4 ขั้นตอน)
                </span>
                <span>{showGuide ? 'ซ่อน' : 'ดูวิธีตั้งค่า'}</span>
              </button>

              {showGuide && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      ไปที่{' '}
                      <a
                        href="https://supabase.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-500 underline font-bold inline-flex items-center gap-0.5"
                      >
                        supabase.com <ExternalLink size={10} />
                      </a>{' '}
                      สมัครสมาชิกฟรี แล้วกด <strong>New Project</strong>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      เข้าเมนู <strong>SQL Editor</strong> ด้านซ้าย -&gt; กด <strong>New Query</strong> -&gt; คัดลอกโค้ดจากไฟล์{' '}
                      <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">
                        supabase-schema.sql
                      </code>{' '}
                      ในโปรเจกต์นี้ไปวาง แล้วกด <strong>Run</strong>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      ไปที่ <strong>Project Settings -&gt; API</strong> เพื่อคัดลอก <strong>Project URL</strong> และ <strong>anon / public key</strong>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <p>
                      นำมากรอกในช่องด้านบนนี้แล้วกด <strong>เชื่อมต่อ</strong> หรือใส่ใน <strong>Vercel Settings &gt; Environment Variables</strong> เพื่อให้ใช้ได้ถาวรทุก domain ทันที!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STORAGE MANAGER & FREE TIER CLEANUP */}
        {activeTab === 'storage' && (
          <div className="space-y-5">
            {/* Usage Gauge */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <HardDrive size={14} className="text-emerald-500" />
                  Supabase Free Tier Quota:
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatBytes(usedBytes)} / 500 MB ({usedPercent.toFixed(2)}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(1, usedPercent)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>พื้นที่ฐานข้อมูลฟรี 500 MB รองรับมากกว่า 100,000+ รายการเทรด</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <Check size={12} /> ปลอดภัย ใช้งานฟรีตลอดไป
                </span>
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07]">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Trades ทั้งหมด</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {stats?.tradesCount ?? '-'}
                </p>
                <p className="text-[10px] text-slate-400">
                  (เปิด: {stats?.openTradesCount ?? 0} | ปิด: {stats?.closedTradesCount ?? 0})
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07]">
                <p className="text-[10px] text-slate-400 font-bold uppercase">รูป Screenshots</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {stats?.tradesWithImagesCount ?? 0} <span className="text-xs font-normal text-slate-400">รูป</span>
                </p>
                <p className="text-[10px] text-amber-500 font-medium">กินพื้นที่ 80-90%</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07]">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Accounts</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {stats?.accountsCount ?? '-'}
                </p>
                <p className="text-[10px] text-slate-400">บัญชีเทรด</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07]">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Journals (Diary)</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {stats?.journalsCount ?? '-'}
                </p>
                <p className="text-[10px] text-slate-400">บันทึกความคิด</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07]">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Finances</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {stats?.financesCount ?? '-'}
                </p>
                <p className="text-[10px] text-slate-400">รายรับ-รายจ่าย</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07]">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Daily Reviews</p>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {stats?.reviewsCount ?? '-'}
                </p>
                <p className="text-[10px] text-slate-400">รีวิวรายวัน</p>
              </div>
            </div>

            {/* Clean Action 1: Strip Screenshots */}
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      ลบเฉพาะรูปภาพหน้าจอ (ประหยัดพื้นที่ ~90% ทันที)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      ลบรูปแคปหน้าจอ Base64 ออกจากเทรด เพื่อลดขนาดฐานข้อมูล แต่ <strong>ตัวเลขกำไร/ขาดทุน, Lot, วันที่, และสถิติทั้งหมดจะยังคงอยู่ 100%</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleStripScreenshots}
                  className="py-2 px-3 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white rounded-xl shadow-sm transition shrink-0 cursor-pointer"
                >
                  ลบรูปภาพ
                </button>
              </div>
            </div>

            {/* Clean Action 2: Purge Closed Trades */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      ล้างประวัติเทรดที่ปิดแล้ว (Archive &amp; Purge)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      ระบบจะสำรองข้อมูลลงเครื่องเป็น JSON ให้อัตโนมัติก่อนล้างประวัติเทรดเก่าออกจาก Cloud
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={purgeDays}
                    onChange={(e) => setPurgeDays(Number(e.target.value))}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-bold focus:outline-none"
                  >
                    <option value={30}>เก่ากว่า 1 เดือน</option>
                    <option value={90}>เก่ากว่า 3 เดือน</option>
                    <option value={180}>เก่ากว่า 6 เดือน</option>
                    <option value={0}>ปิดแล้วทั้งหมด</option>
                  </select>

                  <button
                    onClick={handlePurgeOldTrades}
                    className="py-2 px-3 text-xs font-bold bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl shadow-sm transition cursor-pointer"
                  >
                    ล้างประวัติ
                  </button>
                </div>
              </div>
            </div>

            {/* Clean Action 3: Selective Clear */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Trash2 size={14} className="text-rose-500" />
                เลือกล้างข้อมูลเฉพาะหมวด (Selective Clear):
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                เลือกล้างตารางที่ไม่จำเป็นเพื่อคืนพื้นที่ (ระบบจะ Backup ให้ก่อนล้างเสมอ)
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleClearCollection('journals')}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition cursor-pointer"
                >
                  ล้างเฉพาะ Journals
                </button>
                <button
                  onClick={() => handleClearCollection('finances')}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition cursor-pointer"
                >
                  ล้างเฉพาะ Finances
                </button>
                <button
                  onClick={() => handleClearCollection('reviews')}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition cursor-pointer"
                >
                  ล้างเฉพาะ Reviews
                </button>
                <button
                  onClick={() => handleClearCollection('all')}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer ml-auto"
                >
                  ล้างทั้งหมดใน Cloud
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BACKUP & RESTORE */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-1.5">
                  <Download size={16} className="text-emerald-500" />
                  <span>Export ข้อมูลทั้งหมด (JSON Backup)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  ดาวน์โหลดไฟล์สำรองข้อมูลฉบับสมบูรณ์ ประกอบด้วย Trades, บัญชีเทรด, Diary, รายรับ-รายจ่าย, รีวิว, รหัส PIN, Checklist และการตั้งค่าสีทั้งหมด
                </p>
              </div>
              <button
                onClick={() => downloadBackupFile('full-backup')}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Download size={14} />
                <span>ดาวน์โหลดไฟล์สำรอง (.JSON)</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-1.5">
                  <Upload size={16} className="text-blue-500" />
                  <span>นำเข้าข้อมูลจากไฟล์สำรอง (Import JSON)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  กู้คืนหรือนำเข้าข้อมูลจากไฟล์สำรอง JSON โดยข้อมูลจะถูกบันทึกลงในเครื่องและส่งขึ้น Supabase Cloud ทันที
                </p>

                <div className="flex items-center gap-3 mb-4 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">โหมดการนำเข้า:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />
                    <span>เขียนทับข้อมูลเดิม (Replace)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                    />
                    <span>รวมข้อมูลเดิม (Merge)</span>
                  </label>
                </div>
              </div>

              <label className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center">
                <Upload size={14} />
                <span>{importing ? 'กำลังนำเข้าข้อมูล...' : 'เลือกไฟล์ .JSON เพื่อนำเข้า'}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
