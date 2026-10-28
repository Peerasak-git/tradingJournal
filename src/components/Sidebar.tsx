'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useAccount } from '@/context/AccountContext';
import {
  BookOpen,
  LayoutDashboard,
  History,
  BarChart2,
  Settings,
  PlusCircle,
  Menu,
  X,
  TrendingUp,
  Zap,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Wallet,
  LogOut,
  LogIn,
  User as UserIcon,
  Briefcase,
  Cat,
  Banknote,
  Star,
  Lock,
  Cloud
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import SupabaseSyncModal from './SupabaseSyncModal';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut, hasPin, lockSession } = useAuth();
  const { accounts, selectedAccount, setSelectedAccount } = useAccount();
  const [petEnabled, setPetEnabled] = useState(true);

  if (pathname === '/login') return null;

  useEffect(() => {
    setIsCloudConnected(isSupabaseConfigured());
    const saved = localStorage.getItem('petEnabled');
    if (saved === 'false') setPetEnabled(false);

    const handleToggle = () => {
      const current = localStorage.getItem('petEnabled');
      setPetEnabled(current !== 'false');
    };

    window.addEventListener('petToggle', handleToggle);
    return () => window.removeEventListener('petToggle', handleToggle);
  }, []);

  const menuGroups = [
    {
      label: 'TRADING',
      items: [
        { name: t('dashboard'), icon: LayoutDashboard, href: '/' },
        { name: 'Trade History', icon: History, href: '/history' },
        { name: t('analysis') || 'Analysis', icon: BarChart2, href: '/analysis' },
      ],
    },
    {
      label: 'REVIEW',
      items: [
        { name: 'Journal', icon: BookOpen, href: '/journal' },
        { name: t('dailyReviews') || 'Daily Reviews', icon: Star, href: '/reviews' },
      ],
    },
    {
      label: 'FINANCE',
      items: [
        { name: t('finances') || 'Finances', icon: Banknote, href: '/finances' },
        { name: t('portfolios'), icon: Briefcase, href: '/portfolios' },
      ],
    },
    {
      label: 'OTHER',
      items: [
        { name: 'Cat Room', icon: Cat, href: '/cat-room' },
        { name: 'Settings', icon: Settings, href: '/config' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg border border-slate-200 dark:border-zinc-800 transition-all active:scale-95"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-40 w-64 transition-transform duration-300 transform
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-white dark:bg-[#121212] border-r border-slate-200 dark:border-zinc-800/60
      `}>
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)'}} />

        <div className="flex flex-col h-full p-5">
          {/* User Profile Section */}
          <div className="flex items-center gap-3 mb-6 p-2 bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-zinc-800/80">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-500">
                  <UserIcon size={20} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.name || t('guestUser')}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || (user?.role === 'ADMIN' ? t('admin') : t('user'))}
              </p>
            </div>
            {user ? (
              <button
                onClick={async () => {
                  if (confirm(t('signOutConfirm'))) {
                    await signOut();
                    router.push('/login');
                  }
                }}
                title={t('signOut')}
                className="p-1.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 rounded-lg text-slate-400 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
              </button>
            ) : (
              <Link
                href="/login"
                title={t('signIn')}
                className="p-1.5 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg text-blue-500 transition-colors"
              >
                <LogIn size={15} />
              </Link>
            )}
          </div>

          {/* Account Switcher */}
          <div className="relative mb-6 px-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2 ml-1">
              {t('selectAccount')}
            </label>
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="w-full flex items-center justify-between p-3 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-win-50 dark:bg-win-500/10 flex items-center justify-center text-win-500">
                  <Wallet size={14} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[100px]">
                    {selectedAccount?.name || 'No Account'}
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    {selectedAccount?.type === 'STANDARD' ? t('standard') : t('cent')} • {selectedAccount?.currency}
                  </span>
                </div>
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAccountOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 animate-fade-in">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccount(acc);
                      setIsAccountOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${selectedAccount?.id === acc.id ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedAccount?.id === acc.id ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{acc.name}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">
                        {acc.type === 'STANDARD' ? t('standard') : t('cent')}
                      </p>
                    </div>
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-800 mt-1.5 pt-1.5">
                  <Link
                    href="/portfolios"
                    onClick={() => setIsAccountOpen(false)}
                    className="flex items-center justify-center gap-2 p-2 text-[11px] font-black text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                  >
                    <PlusCircle size={14} />
                    {t('managePortfolios')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-1 mt-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'}}>
              <TrendingUp className="text-white" size={18} strokeWidth={2.5} />
            </div>
            <div className="flex items-baseline gap-0">
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">TRADER</span>
              <span className="text-base font-black tracking-tight text-blue-500">LOG</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-4 overflow-y-auto">
            {menuGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 px-3 mb-1.5">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`
                          relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all text-sm
                          ${isActive
                            ? 'text-white shadow-lg'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'}
                        `}
                        style={isActive ? {background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'} : {}}
                      >
                        <item.icon size={18} />
                        {item.name}
                        {isActive && (
                          <div className="absolute inset-0 rounded-xl"
                            style={{boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)'}} />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-800/60 my-4" />

          {/* Theme, Language & Pet Toggles */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                {theme === 'light' ? 'DARK' : 'LIGHT'}
              </button>
              <button
                onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all uppercase"
              >
                <Globe size={14} />
                {language === 'en' ? 'ไทย' : 'ENG'}
              </button>
            </div>
            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Cloud size={14} className={isCloudConnected ? 'text-emerald-500' : 'text-slate-400'} />
                CLOUD SYNC
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase">
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                {isCloudConnected ? 'CONNECTED' : 'LOCAL'}
              </span>
            </button>
            <button
              onClick={() => {
                const newState = !petEnabled;
                localStorage.setItem('petEnabled', newState ? 'true' : 'false');
                window.dispatchEvent(new Event('petToggle'));
                setPetEnabled(newState);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <Cat size={14} />
              PET: {petEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={lockSession}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all cursor-pointer"
            >
              <Lock size={14} />
              {hasPin ? 'LOCK SCREEN' : 'SET PIN LOCK'}
            </button>
          </div>

          {/* New Trade Button */}
          <Link
            href="/history"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
            }}
          >
            <PlusCircle size={16} strokeWidth={2.5} />
            NEW TRADE
          </Link>

          {/* Footer */}
          <div className="flex items-center gap-2 mt-4 px-1">
            <Zap size={11} className="text-slate-400 dark:text-slate-600" />
            <span className="text-[10px] text-slate-400 dark:text-slate-600 font-medium">CFD Trading Journal v1.0</span>
          </div>
        </div>
      </aside>

      {/* Supabase Sync Modal */}
      <SupabaseSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => {
          setIsSyncModalOpen(false);
          setIsCloudConnected(isSupabaseConfigured());
        }}
      />
    </>
  );
}
