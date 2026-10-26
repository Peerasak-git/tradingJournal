'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Key,
  Database,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection,
  isSupabaseConfigured,
  SupabaseConfigInfo,
} from '@/lib/supabase';
import { syncAllLocalToSupabase, syncAllSupabaseToLocal } from '@/lib/clientStorage';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupabaseSyncModal({ isOpen, onClose }: SupabaseSyncModalProps) {
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

  useEffect(() => {
    if (isOpen) {
      refreshConfig();
      setStatusMessage(null);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

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
    setStatusMessage({
      type: 'success',
      text: 'บันทึกการตั้งค่าเรียบร้อย! ระบบจะซิงค์ข้อมูลกับ Supabase อัตโนมัติ',
    });
  };

  const handleDisconnect = () => {
    if (confirm('คุณต้องการยกเลิกการเชื่อมต่อ Supabase ในเบราว์เซอร์นี้ใช่หรือไม่? (ข้อมูลในฐานข้อมูลจะไม่ถูกลบ)')) {
      clearCustomSupabaseCredentials();
      refreshConfig();
      setStatusMessage({ type: 'info', text: 'ยกเลิกการเชื่อมต่อแล้ว กลับสู่โหมด Local Storage' });
    }
  };

  const handleUploadAll = async () => {
    setSyncingUp(true);
    setStatusMessage({ type: 'info', text: 'กำลังส่งข้อมูลทั้งหมดขึ้นสู่ Cloud...' });

    const res = await syncAllLocalToSupabase();
    setSyncingUp(false);

    if (res.success) {
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

  return (
    <div className="fixed inset-0 z-[100000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="glass-card max-w-xl w-full p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Cloud size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Supabase Cloud Sync
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
              ซิงค์ข้อมูล Trades, Accounts, PIN, และ Journal แบบ Real-time ข้ามทุก Domain และมือถือ
            </p>
          </div>
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

        {/* Cloud Actions when Configured */}
        {config.isConfigured ? (
          <div className="space-y-4 mb-6">
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

        {/* Credentials Form (Shown when not connected OR when user wants to configure manually) */}
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
    </div>
  );
}
