'use client';

import { useEffect, useState, useMemo } from 'react';
import { FinanceEntry, FinanceType } from '@/types/finance';
import { useAccount } from '@/context/AccountContext';
import { useLanguage } from '@/context/LanguageContext';
import { getFinances, addFinance } from '@/lib/clientStorage';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  X,
  Banknote
} from 'lucide-react';

export default function FinancesPage() {
  const [finances, setFinances] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { selectedAccount } = useAccount();
  const { t, language } = useLanguage();

  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const [formData, setFormData] = useState<Partial<FinanceEntry>>({
    type: 'EXPENSE',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: ''
  });

  useEffect(() => {
    getFinances()
      .then(data => {
        setFinances(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching finances:', err);
        setLoading(false);
      });

    const storedCats = localStorage.getItem('financeCategories');
    if (storedCats) {
      setSavedCategories(JSON.parse(storedCats));
    } else {
      setSavedCategories(['Salary', 'Food', 'Transport', 'Utilities', 'Entertainment']);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const entry = {
      ...formData,
      id: Date.now().toString(),
      accountId: selectedAccount?.id || ''
    };

    try {
      await addFinance(entry as FinanceEntry);
      setFinances([entry as FinanceEntry, ...finances]);
      setIsModalOpen(false);
      setFormData({
          type: 'EXPENSE',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: '',
          category: savedCategories.length > 0 ? savedCategories[0] : ''
        });
    } catch (err) {
      console.error('Error saving finance entry:', err);
    }
  };

  const filteredFinances = useMemo(() => finances.filter(f => {
    const isSameAccount = !selectedAccount || f.accountId === selectedAccount.id;
    if (!isSameAccount) return false;

    const matchSearch =
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'ALL' || f.type === typeFilter;
    return matchSearch && matchType;
  }), [finances, searchTerm, typeFilter, selectedAccount]);

  const totalIncome = filteredFinances.filter(f => f.type === 'INCOME').reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalExpense = filteredFinances.filter(f => f.type === 'EXPENSE').reduce((sum, f) => sum + (f.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const expensesByCategory = useMemo(() => {
    const expenses = filteredFinances.filter(f => f.type === 'EXPENSE');
    const grouped = expenses.reduce((acc, curr) => {
      const cat = curr.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + (curr.amount || 0);
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1]) // sort by amount descending
      .slice(0, 5); // top 5
  }, [filteredFinances]);

  if (loading) return (
    <main className="p-6 md:p-8 animate-pulse">
      <div className="mb-6 space-y-3">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>
    </main>
  );

  return (
    <main className="p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {t('finances') || 'Finances'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Track your daily, monthly, and yearly income & expenses
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95 shadow-lg whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
          }}
        >
          <PlusCircle size={16} strokeWidth={2.5} />
          {t('addFinance') || 'Add Record'}
        </button>
      </div>

      {/* Quick stat pills */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Banknote size={48} />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Net Balance</p>
          <p className={`text-3xl font-black tracking-tight ${netBalance >= 0 ? 'text-win-500' : 'text-loss-500'}`}>
            ${netBalance.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 glass-card p-5 rounded-2xl border border-win-200 dark:border-win-800/60 bg-win-50/50 dark:bg-win-900/20">
          <p className="text-xs font-bold text-win-600 dark:text-win-400 uppercase tracking-widest mb-1">{t('income') || 'Income'}</p>
          <p className="text-2xl font-black text-win-700 dark:text-win-300">
            +${totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 glass-card p-5 rounded-2xl border border-loss-200 dark:border-loss-800/60 bg-loss-50/50 dark:bg-loss-900/20">
          <p className="text-xs font-bold text-loss-600 dark:text-loss-400 uppercase tracking-widest mb-1">{t('expense') || 'Expense'}</p>
          <p className="text-2xl font-black text-loss-700 dark:text-loss-300">
            -${totalExpense.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Visual Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Expenses by Category */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-widest">
            Top Expenses by Category
          </h3>
          <div className="space-y-4">
            {expensesByCategory.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">No expenses recorded yet.</p>
            ) : expensesByCategory.map(([cat, amount]) => {
              const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                    <span className="text-loss-500">${amount.toFixed(2)} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-loss-400 to-loss-600 h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Savings Health */}
        <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 flex flex-col justify-center items-center text-center">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">
            Savings Health
          </h3>
          <div className="relative w-36 h-36 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-800/50" />
              <circle 
                cx="50" cy="50" r="42" 
                stroke="currentColor" 
                strokeWidth="12" 
                fill="transparent" 
                strokeDasharray="263.89" 
                strokeDashoffset={263.89 - (263.89 * Math.max(0, Math.min(100, savingsRate))) / 100}
                className={`${savingsRate >= 20 ? 'text-win-500' : savingsRate > 0 ? 'text-amber-500' : 'text-loss-500'} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {savingsRate > 0 ? savingsRate.toFixed(0) : 0}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Saved</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-2 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg">
            {savingsRate >= 20 
              ? '✨ Great job! You are saving well.' 
              : savingsRate > 0 
                ? '👍 Good, but try to save a bit more.' 
                : '⚠️ Warning: Spending exceeds income!'}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search descriptions, categories..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-win-500/40 focus:border-win-500 outline-none transition-all text-sm font-medium placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map(s => (
            <button
              key={s}
              onClick={() => setTypeFilter(s)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                typeFilter === s
                  ? 'bg-win-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s === 'ALL' ? 'ALL' : t(s.toLowerCase() as any) || s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-900/70 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">{t('category') || 'Category'}</th>
                <th className="px-5 py-3.5">{t('description') || 'Description'}</th>
                <th className="px-5 py-3.5 text-right">{t('amount') || 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredFinances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center text-sm text-slate-400 font-medium">
                    No records found.
                  </td>
                </tr>
              ) : filteredFinances.map((f) => (
                <tr
                  key={f.id}
                  className="border-t border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      <Calendar size={11} />
                      {new Date(f.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg
                      ${f.type === 'INCOME'
                        ? 'bg-win-50 text-win-700 dark:bg-win-500/10 dark:text-win-400'
                        : 'bg-loss-50 text-loss-700 dark:bg-loss-500/10 dark:text-loss-400'}`}>
                      {f.type === 'INCOME'
                        ? <ArrowUpRight size={11} strokeWidth={2.5} />
                        : <ArrowDownLeft size={11} strokeWidth={2.5} />}
                      {t(f.type.toLowerCase() as any) || f.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                    {f.category || '—'}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {f.description || '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`font-black text-sm ${f.type === 'INCOME' ? 'text-win-500 dark:text-win-400' : 'text-loss-500 dark:text-loss-400'}`}>
                      {f.type === 'INCOME' ? '+' : '-'}${Number(f.amount).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-[24px] p-8 md:p-10 shadow-2xl border border-slate-200 dark:border-zinc-800/50 relative transform transition-all">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white transition-colors"
            >
              <X size={24} strokeWidth={2} />
            </button>
            
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                {t('addFinance') || 'เพิ่มรายการธุรกรรม'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                บันทึกรายรับหรือรายจ่ายใหม่ของคุณ
              </p>
            </div>
            
            <form onSubmit={handleSave} className="space-y-8">
              
              {/* Type Toggle */}
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-zinc-800/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    formData.type === 'INCOME'
                      ? 'bg-white dark:bg-zinc-700 text-win-500 shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {t('income') || 'INCOME'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    formData.type === 'EXPENSE'
                      ? 'bg-white dark:bg-zinc-700 text-loss-500 shadow-sm'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {t('expense') || 'EXPENSE'}
                </button>
              </div>

              {/* Amount - Prominent */}
              <div className="text-center group">
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
                  {t('amount') || 'Amount'}
                </label>
                <div className="relative inline-flex items-center justify-center">
                  <span className="text-3xl font-light text-slate-400 dark:text-zinc-400 absolute left-0 transform -translate-x-full pr-2">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount || ''}
                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="w-48 text-center text-5xl font-light bg-transparent border-none text-slate-900 dark:text-white focus:outline-none focus:ring-0 p-0"
                    placeholder="0.00"
                  />
                </div>
                <div className={`w-32 h-[1px] mx-auto mt-2 transition-all duration-300 group-focus-within:w-48 ${formData.type === 'INCOME' ? 'bg-slate-300 dark:bg-zinc-700 group-focus-within:bg-win-500' : 'bg-slate-300 dark:bg-zinc-700 group-focus-within:bg-[#EF4444]'}`}></div>
              </div>

              <div className="h-2"></div>

              {/* Date */}
              <div className="relative">
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 rounded-none px-0 py-2.5 text-base text-slate-900 dark:text-white focus:outline-none focus:ring-0 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {/* Category */}
              <div className="relative">
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                  {t('category') || 'Category'}
                </label>
                {!isAddingCategory ? (
                  <div className="flex gap-4 items-end">
                    <select
                      value={formData.category || ''}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="flex-1 bg-transparent border-b border-slate-300 dark:border-zinc-700 rounded-none px-0 py-2.5 text-base text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                    >
                      <option value="" disabled className="bg-white dark:bg-[#1a1a1a]">-- Select Category --</option>
                      {savedCategories.map(c => (
                        <option key={c} value={c} className="bg-white dark:bg-[#1a1a1a]">{c}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="mb-1 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      <PlusCircle size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4 items-end">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="flex-1 bg-transparent border-b border-slate-300 dark:border-zinc-700 rounded-none px-0 py-2.5 text-base text-slate-900 dark:text-white focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                      placeholder="New category..."
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCategory.trim()) {
                            const updated = [...new Set([...savedCategories, newCategory.trim()])];
                            setSavedCategories(updated);
                            localStorage.setItem('financeCategories', JSON.stringify(updated));
                            setFormData({ ...formData, category: newCategory.trim() });
                            setNewCategory('');
                          }
                          setIsAddingCategory(false);
                        }
                      }}
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategory.trim()) {
                            const updated = [...new Set([...savedCategories, newCategory.trim()])];
                            setSavedCategories(updated);
                            localStorage.setItem('financeCategories', JSON.stringify(updated));
                            setFormData({ ...formData, category: newCategory.trim() });
                            setNewCategory('');
                          }
                          setIsAddingCategory(false);
                        }}
                        className="text-win-500 font-bold text-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="text-slate-400"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
                  {t('description') || 'Description'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-transparent border-b border-slate-300 dark:border-zinc-700 rounded-none px-0 py-2.5 text-base text-slate-900 dark:text-white focus:outline-none focus:ring-0 focus:border-blue-500 transition-colors"
                  placeholder="Details..."
                />
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full py-4 text-white rounded-2xl font-bold text-lg tracking-wide transition-all active:scale-[0.98]"
                  style={{
                    backgroundColor: formData.type === 'INCOME' ? '#10B981' : '#EF4444',
                    boxShadow: formData.type === 'INCOME'
                      ? '0 0 20px rgba(16, 185, 129, 0.3)'
                      : '0 0 20px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  Save {formData.type === 'INCOME' ? t('income') || 'Income' : t('expense') || 'Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
