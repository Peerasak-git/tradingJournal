'use client';

import React, { useState } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { useAuth } from '@/context/AuthContext';
import { Settings2, Palette, CheckCircle2, Database, Download, Upload, RotateCcw, Lock, KeyRound, ShieldCheck, ShieldAlert, X, Cloud, RefreshCw } from 'lucide-react';
import ColorPicker from '@/components/ColorPicker';
import { exportAllData, importAllData } from '@/lib/clientStorage';
import { isSupabaseConfigured, getSupabaseCredentials } from '@/lib/supabase';
import SupabaseSyncModal from '@/components/SupabaseSyncModal';

export default function ConfigPage() {
  const { colorScheme, setColorScheme, customWinColor, setCustomWinColor, customLossColor, setCustomLossColor } = useConfig();
  const { hasPin, setPin, removePin, lockSession } = useAuth();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncModalTab, setSyncModalTab] = useState<'sync' | 'storage' | 'backup'>('sync');
  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    if (pinInput.length < 4 || pinInput.length > 6) {
      setPinError('รหัส PIN ต้องมีความยาว 4 - 6 ตัวเลข');
      return;
    }
    if (!/^\d+$/.test(pinInput)) {
      setPinError('รหัส PIN ต้องเป็นตัวเลขเท่านั้น');
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinError('รหัส PIN ทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setPin(pinInput);
    setIsPinModalOpen(false);
    setPinInput('');
    setPinConfirm('');
    alert('บันทึกรหัสผ่าน PIN เรียบร้อยแล้ว!');
  };

  const handleExport = async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trading-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed: ' + e);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importAllData(content);
      if (res.success) {
        alert(res.message || 'Import successful! Reloading data...');
        window.location.reload();
      } else {
        alert('Import failed: ' + res.message);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (!confirm('Are you sure you want to reset all data to default seed data? All custom trades and changes will be cleared.')) return;
    ['tj_trades', 'tj_accounts', 'tj_journals', 'tj_finances', 'tj_reviews', 'tj_user'].forEach(k => {
      localStorage.removeItem(k);
    });
    alert('Reset complete! Reloading...');
    window.location.reload();
  };

  const schemes = [
    {
      id: 'default',
      name: 'Classic (Green / Red)',
      description: 'The standard trading colors. Green for wins, red for losses.',
      winColor: 'bg-[#10b981]',
      lossColor: 'bg-[#f43f5e]'
    },
    {
      id: 'blue-orange',
      name: 'Colorblind Friendly (Blue / Orange)',
      description: 'Easier to distinguish for red-green colorblindness.',
      winColor: 'bg-[#3b82f6]',
      lossColor: 'bg-[#f97316]'
    },
    {
      id: 'purple-yellow',
      name: 'Royal (Purple / Yellow)',
      description: 'A vibrant alternative high-contrast theme.',
      winColor: 'bg-[#a855f7]',
      lossColor: 'bg-[#eab308]'
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Choose your own hex colors using the color picker.',
      winColor: 'bg-slate-300 dark:bg-slate-700',
      lossColor: 'bg-slate-300 dark:bg-slate-700'
    }
  ] as const;

  return (
    <main className="p-6 md:p-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Settings2 size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Customize your trading journal experience
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Colors Section */}
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <Palette className="text-slate-400" size={20} />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Win / Loss Color Theme</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schemes.map((scheme) => {
              const isSelected = colorScheme === scheme.id;
              
              return (
                <button
                  key={scheme.id}
                  onClick={() => setColorScheme(scheme.id)}
                  className={`relative text-left p-5 rounded-2xl border transition-all duration-300 group ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 text-blue-500 animate-fade-in">
                      <CheckCircle2 size={20} className="fill-blue-100 dark:fill-blue-900" />
                    </div>
                  )}
                  
                  <div className="flex gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-full shadow-sm ${scheme.winColor}`} />
                    <div className={`w-8 h-8 rounded-full shadow-sm ${scheme.lossColor}`} />
                  </div>
                  
                  <h3 className={`font-bold mb-1 ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {scheme.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {scheme.description}
                  </p>
                </button>
              );
            })}
          </div>
          
          {/* Custom Color Pickers */}
          {colorScheme === 'custom' && (
            <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 animate-fade-in flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <ColorPicker 
                  label="Win Color" 
                  color={customWinColor} 
                  onChange={setCustomWinColor} 
                />
              </div>
              <div className="flex-1">
                <ColorPicker 
                  label="Loss Color" 
                  color={customLossColor} 
                  onChange={setCustomLossColor} 
                />
              </div>
            </div>
          )}
          
          {/* Live Preview */}
          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Preview</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-win-50 dark:bg-win-500/10 rounded-xl border border-win-200 dark:border-win-500/20">
                <span className="w-2 h-2 rounded-full bg-win-500 animate-pulse" />
                <span className="text-sm font-black text-win-600 dark:text-win-400">WIN (+$500.00)</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-loss-50 dark:bg-loss-500/10 rounded-xl border border-loss-200 dark:border-loss-500/20">
                <span className="w-2 h-2 rounded-full bg-loss-500 animate-pulse" />
                <span className="text-sm font-black text-loss-600 dark:text-loss-400">LOSS (-$250.00)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Passcode Lock Section */}
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Lock size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Security & Passcode Lock</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                ปกป้องข้อมูลการเทรดและพอร์ตของคุณด้วยรหัสผ่าน PIN 4-6 หลัก
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07]">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                hasPin ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                {hasPin ? <ShieldCheck size={24} /> : <Lock size={24} />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {hasPin ? 'เปิดใช้งานรหัสผ่าน PIN แล้ว' : 'ยังไม่ได้ตั้งรหัสผ่าน PIN'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {hasPin ? 'ระบบจะล็อกหน้าจอเมื่อเปิดเบราว์เซอร์ใหม่ หรือเมื่อกดปุ่มล็อกหน้าจอ' : 'ตั้งรหัส PIN เพื่อป้องกันไม่ให้ผู้อื่นเข้าดูข้อมูลการเทรดของคุณ'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {hasPin ? (
                <>
                  <button
                    onClick={lockSession}
                    className="flex-1 md:flex-none py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Lock size={14} />
                    <span>ล็อกหน้าจอทันที</span>
                  </button>
                  <button
                    onClick={() => {
                      setPinInput('');
                      setPinConfirm('');
                      setPinError('');
                      setIsPinModalOpen(true);
                    }}
                    className="flex-1 md:flex-none py-2.5 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound size={14} />
                    <span>เปลี่ยน PIN</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการล็อกหน้าจอด้วยรหัส PIN?')) {
                        removePin();
                      }
                    }}
                    className="py-2.5 px-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ยกเลิก PIN
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setPinInput('');
                    setPinConfirm('');
                    setPinError('');
                    setIsPinModalOpen(true);
                  }}
                  className="w-full md:w-auto py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <KeyRound size={15} />
                  <span>ตั้งรหัส PIN ตอนนี้</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Supabase Cloud Database Sync Section */}
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Cloud size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Supabase Cloud Sync</h2>
                  {isSupabaseConfigured() ? (
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
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  เชื่อมต่อฐานข้อมูล Supabase เพื่อซิงค์ข้อมูล Trades, Accounts และ PIN ข้ามทุกโดเมนและมือถือ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => {
                  setSyncModalTab('storage');
                  setIsSyncModalOpen(true);
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>จัดการพื้นที่ (ใช้ฟรี)</span>
              </button>

              <button
                onClick={() => {
                  setSyncModalTab('sync');
                  setIsSyncModalOpen(true);
                }}
                className="py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Cloud size={15} />
                <span>{isSupabaseConfigured() ? 'จัดการการซิงค์ Cloud' : 'เชื่อมต่อ Supabase'}</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white">สถานะปัจจุบัน: </span>
              {isSupabaseConfigured() ? (
                <span>ซิงค์ข้อมูลผ่าน Supabase แบบ Real-time ข้อมูลจะอัปเดตตรงกันทุกอุปกรณ์ทันที</span>
              ) : (
                <span>เก็บข้อมูลเฉพาะในบราวเซอร์นี้ (Local Storage) หากต้องการให้ข้อมูลตรงกันข้ามโดเมน กรุณาเชื่อมต่อ Supabase</span>
              )}
            </div>
            <button
              onClick={() => {
                setSyncModalTab('sync');
                setIsSyncModalOpen(true);
              }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              ดูรายละเอียด &amp; วิธีตั้งค่า &rarr;
            </button>
          </div>
        </section>

        {/* Data & Backup Section (Local Persistence) */}
        <section className="glass-card rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Database size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Data Management & Backup</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Local-first persistence. Your data stays in your browser with zero external server dependencies.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-1.5">
                  <Download size={16} className="text-emerald-500" />
                  <span>Export Backup</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Download all your trades, accounts, journals, and reviews as a portable JSON file.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </button>
            </div>

            {/* Import */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-1.5">
                  <Upload size={16} className="text-blue-500" />
                  <span>Restore / Import</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Restore your journal data from a previously exported JSON backup file.
                </p>
              </div>
              <label className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm text-center">
                <Upload size={14} />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset */}
            <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-white/[0.07] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm mb-1.5">
                  <RotateCcw size={16} className="text-rose-500" />
                  <span>Reset Data</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  Clear local cache and restore the initial default seed data.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-2.5 px-4 bg-slate-200 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                <span>Reset to Seed Data</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* PIN Setup Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card max-w-sm w-full p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl relative">
            <button
              onClick={() => setIsPinModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <KeyRound size={24} />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              {hasPin ? 'เปลี่ยนรหัสผ่าน PIN' : 'ตั้งรหัสผ่าน PIN ใหม่'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed font-medium">
              กรอกรหัสตัวเลข 4 - 6 หลัก เพื่อใช้ในการปลดล็อกหน้าจอ Trading Journal
            </p>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  รหัส PIN (4 - 6 ตัวเลข)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="เช่น 1234 หรือ 123456"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  ยืนยันรหัส PIN อีกครั้ง
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="กรอกรหัสเดิมอีกครั้ง"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  required
                />
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-white transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  บันทึกรหัส PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Cloud Sync Modal */}
      <SupabaseSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        defaultTab={syncModalTab}
      />
    </main>
  );
}
