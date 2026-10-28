'use client';

import { useState } from 'react';
import { useAccount } from '@/context/AccountContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { 
  PlusCircle, 
  Wallet, 
  Trash2, 
  BadgeDollarSign, 
  TrendingUp, 
  Briefcase,
  AlertCircle,
  ArrowDownUp
} from 'lucide-react';
import { AccountType } from '@/types/account';
import { addAccount, deleteAccount, updateAccount } from '@/lib/clientStorage';

export default function PortfoliosPage() {
  const { accounts, refreshAccounts, selectedAccount, setSelectedAccount } = useAccount();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'STANDARD' as AccountType,
    broker: '',
    balance: 0,
    currency: 'USD',
    leverage: '1:500'
  });

  const [adjustingAccount, setAdjustingAccount] = useState<AccountType | any>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<'ADD'|'SUBTRACT'>('ADD');

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const createdAccount = {
        ...newAccount,
        id: 'acc-' + Math.random().toString(36).substr(2, 9),
        userId: user?.id || undefined,
        createdAt: new Date().toISOString()
      };
      await addAccount(createdAccount as any);
      await refreshAccounts();
      setIsAdding(false);
      setNewAccount({
        name: '',
        type: 'STANDARD',
        broker: '',
        balance: 0,
        currency: 'USD',
        leverage: '1:500'
      });
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (accounts.length <= 1) {
      alert('You must have at least one account.');
      return;
    }
    if (!confirm('Are you sure? All trades associated with this account will remain in the database but won\'t be visible here.')) return;
    
    try {
      await deleteAccount(id);
      await refreshAccounts();
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingAccount || adjustmentAmount <= 0) return;

    const newBalance = adjustmentType === 'ADD' 
      ? adjustingAccount.balance + adjustmentAmount 
      : adjustingAccount.balance - adjustmentAmount;

    try {
      await updateAccount(adjustingAccount.id, { balance: newBalance });
      await refreshAccounts();
      setAdjustingAccount(null);
      setAdjustmentAmount(0);
    } catch (error) {
      console.error('Error adjusting balance:', error);
    }
  };

  return (
    <main className="p-6 md:p-10 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            My Portfolios
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage your Standard and Cent accounts
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white transition-all active:scale-95 shadow-xl hover:shadow-blue-500/20"
          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
        >
          <PlusCircle size={18} strokeWidth={2.5} />
          Create Portfolio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {accounts.map((acc) => (
          <div 
            key={acc.id}
            className={`glass-card rounded-[2rem] p-6 border-2 transition-all cursor-pointer relative group ${selectedAccount?.id === acc.id ? 'border-blue-500 shadow-blue-500/10' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'}`}
            onClick={() => setSelectedAccount(acc)}
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl ${acc.type === 'STANDARD' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' : 'bg-win-50 dark:bg-win-500/10 text-win-500'}`}>
                <Wallet size={24} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${acc.type === 'STANDARD' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-win-100 dark:bg-win-900/30 text-win-600 dark:text-win-400'}`}>
                  {acc.type}
                </span>
                <p className="text-[10px] font-bold text-slate-400 mt-2">{acc.broker}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{acc.name}</h3>
              <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-slate-400 font-bold uppercase">{acc.currency}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-6 border-t border-slate-100 dark:border-slate-800/50">
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leverage</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{acc.leverage}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setAdjustingAccount(acc); setAdjustmentType('ADD'); setAdjustmentAmount(0); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-all"
              >
                <ArrowDownUp size={14} />
                Adjust Balance
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteAccount(acc.id); }}
                className="p-2.5 rounded-xl text-slate-300 hover:text-loss-500 hover:bg-loss-50 dark:hover:bg-loss-500/10 transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl p-8 border-slate-200/50 dark:border-slate-800/50">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">New Portfolio</h2>
            <form onSubmit={handleAddAccount} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Account Name</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 font-bold"
                  value={newAccount.name}
                  onChange={e => setNewAccount({...newAccount, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Type</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 font-bold appearance-none"
                    value={newAccount.type}
                    onChange={e => setNewAccount({...newAccount, type: e.target.value as AccountType})}
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="CENT">Cent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Currency</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 font-bold"
                    value={newAccount.currency}
                    onChange={e => setNewAccount({...newAccount, currency: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  type="button" onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 rounded-2xl font-black text-sm text-slate-500 bg-slate-100 dark:bg-slate-900 uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 rounded-2xl font-black text-sm text-white uppercase tracking-widest"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
                >
                  Save Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjustingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl p-8 border-slate-200/50 dark:border-slate-800/50">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Adjust Balance</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6">
              Update balance for <strong>{adjustingAccount.name}</strong>
            </p>
            <form onSubmit={handleAdjustBalance} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('ADD')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${adjustmentType === 'ADD' ? 'bg-win-500 text-white shadow-md shadow-win-500/20' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Deposit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('SUBTRACT')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${adjustmentType === 'SUBTRACT' ? 'bg-loss-500 text-white shadow-md shadow-loss-500/20' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Withdraw/Loss (-)
                </button>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Amount ({adjustingAccount.currency})</label>
                <input 
                  type="number" step="0.01" min="0.01" required
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 font-black text-lg focus:ring-2 focus:ring-blue-500/40 outline-none"
                  value={adjustmentAmount || ''}
                  onChange={e => setAdjustmentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  type="button" onClick={() => setAdjustingAccount(null)}
                  className="flex-1 py-3.5 rounded-2xl font-black text-xs text-slate-500 bg-slate-100 dark:bg-slate-900 uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`flex-[2] py-3.5 rounded-2xl font-black text-xs text-white uppercase tracking-widest shadow-lg ${adjustmentType === 'ADD' ? 'bg-win-500 shadow-win-500/30' : 'bg-loss-500 shadow-loss-500/30'}`}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
