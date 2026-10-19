'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ListChecks } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChecklistModal({ isOpen, onClose }: ChecklistModalProps) {
  const { t } = useLanguage();
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('tradeChecklist');
      if (saved) {
        try {
          setItems(JSON.parse(saved));
        } catch (e) {
          console.error('Error loading checklist', e);
        }
      }
    }
  }, [isOpen]);

  const handleSave = (newItems: string[]) => {
    setItems(newItems);
    localStorage.setItem('tradeChecklist', JSON.stringify(newItems));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim() && !items.includes(newItem.trim())) {
      const updated = [...items, newItem.trim()];
      handleSave(updated);
      setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    handleSave(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border-slate-200/50 dark:border-slate-800/50">
        <div className="relative px-6 py-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-win-500 to-teal-500" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-win-500 to-teal-600 rounded-xl text-white shadow-lg shadow-win-500/20">
                <ListChecks size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Pre-Trade Checklist
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleAdd} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Add new checklist item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-win-500/50"
            />
            <button
              type="submit"
              disabled={!newItem.trim()}
              className="p-2.5 bg-win-500 hover:bg-win-600 disabled:opacity-50 text-white rounded-xl transition-colors"
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {items.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-4">No checklist items yet.</p>
            ) : (
              items.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item}</span>
                  <button
                    onClick={() => handleRemove(index)}
                    className="text-slate-400 hover:text-loss-500 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
