'use client';

import { useEffect, useState, useMemo } from 'react';
import { Trade } from '@/types/trade';
import { JournalEntry } from '@/types/journal';
import { useAccount } from '@/context/AccountContext';
import { getTrades, getJournals, addOrUpdateJournal, deleteJournal } from '@/lib/clientStorage';
import JournalModal from '@/components/JournalModal';
import {
  BookOpen,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Tag as TagIcon,
  Quote,
  PlusCircle,
  Edit2,
  Trash2
} from 'lucide-react';

type UnifiedEntry = {
  id: string;
  date: string;
  type: 'TRADE' | 'STANDALONE';
  title?: string;
  instrument?: string;
  status?: string;
  pnl?: number;
  direction?: string;
  content: string;
  tags: string[];
  strategy?: string;
  feelings?: {
    pre?: string;
    during?: string;
    post?: string;
  };
  originalJournal?: JournalEntry;
};

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const { selectedAccount } = useAccount();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tradesData, journalsData] = await Promise.all([
          getTrades(),
          getJournals()
        ]);
        setTrades(tradesData);
        setJournals(journalsData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveJournal = async (entry: JournalEntry) => {
    const isEditing = !!selectedJournal;
    const journalWithAccount = { ...entry, accountId: entry.accountId || selectedAccount?.id || '' };

    try {
      await addOrUpdateJournal(journalWithAccount);
      if (isEditing) {
        setJournals(journals.map(j => j.id === entry.id ? journalWithAccount : j));
      } else {
        setJournals([journalWithAccount, ...journals]);
      }
    } catch (err) {
      console.error('Error saving journal:', err);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!confirm('ต้องการลบบันทึกนี้ใช่หรือไม่?')) return;

    try {
      await deleteJournal(id);
      setJournals(journals.filter(j => j.id !== id));
    } catch (err) {
      console.error('Error deleting journal:', err);
    }
  };

  const openAddModal = () => {
    setSelectedJournal(null);
    setIsModalOpen(true);
  };

  const openEditModal = (journal: JournalEntry) => {
    setSelectedJournal(journal);
    setIsModalOpen(true);
  };

  const unifiedEntries = useMemo(() => {
    const tradeEntries: UnifiedEntry[] = trades
      .filter(t => !selectedAccount || t.accountId === selectedAccount.id)
      .map(t => ({
        id: t.id,
        date: t.entryDate,
        type: 'TRADE',
        instrument: t.instrument,
        status: t.status,
        pnl: t.financials.netPnL || 0,
        direction: t.direction,
        content: t.notes.detailedNotes || '',
        strategy: t.analysis.strategy || '',
        tags: [],
        feelings: {
          pre: t.notes.preTrade || undefined,
          during: t.notes.duringTrade || undefined,
          post: t.notes.postTrade || undefined,
        }
      }));

    const standaloneEntries: UnifiedEntry[] = journals
      .filter(j => !selectedAccount || j.accountId === selectedAccount.id)
      .map(j => ({
        id: j.id,
        date: j.date,
        type: 'STANDALONE',
        title: j.title,
        content: j.content,
        tags: j.tags,
        originalJournal: j,
      }));

    return [...tradeEntries, ...standaloneEntries]
      .filter(e => {
        const matchSearch =
          (e.instrument || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.strategy || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Only show trade entries if they have content or feelings, or if it's a search
        const hasContent = e.type === 'STANDALONE' || e.content || e.feelings?.pre || e.feelings?.during || e.feelings?.post;
        
        return matchSearch && hasContent;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trades, journals, searchTerm, selectedAccount]);

  if (loading) return (
    <main className="p-6 md:p-8 animate-pulse">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card rounded-2xl p-6 h-64 bg-slate-200/50 dark:bg-slate-800/50"></div>
        ))}
      </div>
    </main>
  );

  return (
    <main className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Trading Journal</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            ทบทวนบันทึกและบทเรียนจากการเทรดที่ผ่านมาของคุณ
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white shadow-xl hover:shadow-blue-500/20 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
        >
          <PlusCircle size={18} strokeWidth={2.5} />
          เพิ่มบันทึกใหม่
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อคู่เงิน, กลยุทธ์ หรือเนื้อหาในบันทึก..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Journal List */}
      <div className="space-y-8">
        {unifiedEntries.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">ไม่พบเนื้อหาในบันทึกของคุณ</p>
            <p className="text-slate-400 text-sm">ลองจดบันทึกในรายการเทรด หรือเพิ่มบันทึกใหม่ที่นี่</p>
          </div>
        ) : (
          unifiedEntries.map((entry) => (
            <div key={entry.id} className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-950">
              {/* Card Header */}
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {entry.type === 'TRADE' ? (
                    <>
                      <div className={`p-2 rounded-xl ${entry.status === 'WIN' ? 'bg-win-500/10 text-win-500' : entry.status === 'LOSS' ? 'bg-loss-500/10 text-loss-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {entry.direction === 'LONG' ? <ArrowUpRight size={18} strokeWidth={3} /> : <ArrowDownLeft size={18} strokeWidth={3} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 dark:text-white leading-tight">{entry.instrument}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest">Trade</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <Calendar size={10} />
                          {new Date(entry.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          {entry.strategy || 'No Strategy'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
                        <FileText size={18} strokeWidth={3} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 dark:text-white leading-tight">{entry.title}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/30 text-[9px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-widest">Journal</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <Calendar size={10} />
                          {new Date(entry.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {entry.type === 'TRADE' ? (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      entry.status === 'WIN' ? 'bg-win-500 text-white' : entry.status === 'LOSS' ? 'bg-loss-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {entry.status}
                    </span>
                    <span className={`text-sm font-black ${entry.pnl && entry.pnl >= 0 ? 'text-win-500' : 'text-loss-500'}`}>
                      {entry.pnl !== undefined ? `${entry.pnl >= 0 ? '+' : ''}$${entry.pnl.toFixed(2)}` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal(entry.originalJournal as JournalEntry)}
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteJournal(entry.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-loss-500 hover:bg-loss-50 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Tags / Feelings */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {entry.type === 'TRADE' ? (
                    <>
                      {entry.feelings?.pre && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-100 dark:border-blue-500/20">
                          <TagIcon size={10} /> {entry.feelings.pre}
                        </div>
                      )}
                      {entry.feelings?.during && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-100 dark:border-amber-500/20">
                          <TagIcon size={10} /> {entry.feelings.during}
                        </div>
                      )}
                      {entry.feelings?.post && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-win-50 dark:bg-win-500/10 text-win-600 dark:text-win-400 text-[10px] font-bold border border-win-100 dark:border-win-500/20">
                          <TagIcon size={10} /> {entry.feelings.post}
                        </div>
                      )}
                    </>
                  ) : (
                    entry.tags.map(tag => (
                      <div key={tag} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold border border-violet-100 dark:border-violet-500/20">
                        <TagIcon size={10} /> {tag}
                      </div>
                    ))
                  )}
                </div>

                {/* Content */}
                {entry.content ? (
                  <div className="relative pl-10">
                    <Quote className="absolute left-0 top-0 text-slate-200 dark:text-slate-800" size={32} />
                    <div className="ploss ploss-slate dark:ploss-invert max-w-none">
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic text-center py-4">ไม่มีเนื้อหาในบันทึกนี้</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <JournalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveJournal}
        initialData={selectedJournal}
      />
    </main>
  );
}
