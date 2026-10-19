'use client';

import { X, Save, FileText, Calendar, Plus } from 'lucide-react';
import { JournalEntry } from '@/types/journal';
import { useEffect, useState } from 'react';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (journal: JournalEntry) => void;
  initialData?: JournalEntry | null;
}

export default function JournalModal({ isOpen, onClose, onSave, initialData }: JournalModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().slice(0, 16),
    type: 'GENERAL' as JournalEntry['type'],
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        date: initialData.date.slice(0, 16),
        type: initialData.type,
        tags: initialData.tags,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().slice(0, 16),
        type: 'GENERAL',
        tags: [],
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...initialData,
      ...formData,
      id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9),
      accountId: '', // Will be set by parent
    } as JournalEntry);
    onClose();
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-semibold";
  const labelClasses = "block text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 mb-2 ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800/50 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500 text-white">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {initialData ? 'แก้ไขบันทึก' : 'เพิ่มบันทึกใหม่'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            <div>
              <label className={labelClasses}>หัวข้อบันทึก</label>
              <input
                type="text"
                required
                className={inputClasses}
                placeholder="ระบุหัวข้อที่ต้องการจดบันทึก..."
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClasses}>ประเภท</label>
                <select
                  className={inputClasses}
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as JournalEntry['type'] })}
                >
                  <option value="GENERAL">ทั่วไป</option>
                  <option value="PLAN">แผนการเทรด</option>
                  <option value="LEARNING">บทเรียน/ความรู้</option>
                  <option value="MARKET_REVIEW">สรุปภาวะตลาด</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>วันที่</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="datetime-local"
                    className={`${inputClasses} pl-12`}
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClasses}>เนื้อหาบันทึก</label>
              <textarea
                required
                className={`${inputClasses} min-h-[200px] resize-none py-4 leading-relaxed`}
                placeholder="เขียนรายละเอียดบันทึกของคุณที่นี่..."
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClasses}>แท็ก (Tags)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[10px] font-bold border border-blue-100 dark:border-blue-500/20">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-loss-500"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`${inputClasses} py-2`}
                  placeholder="เพิ่มแท็ก..."
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-black text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-[2] flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm text-white shadow-xl"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
            >
              <Save size={20} strokeWidth={2.5} />
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
