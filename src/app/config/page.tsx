'use client';

import React from 'react';
import { useConfig } from '@/context/ConfigContext';
import { Settings2, Palette, CheckCircle2, Database, Download, Upload, RotateCcw } from 'lucide-react';
import ColorPicker from '@/components/ColorPicker';
import { exportAllData, importAllData } from '@/lib/clientStorage';

export default function ConfigPage() {
  const { colorScheme, setColorScheme, customWinColor, setCustomWinColor, customLossColor, setCustomLossColor } = useConfig();

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
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importAllData(content);
      if (res.success) {
        alert('Import successful! Reloading data...');
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
    </main>
  );
}
