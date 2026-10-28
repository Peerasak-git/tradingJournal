'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  TrendingUp, Lock, Mail, User as UserIcon,
  Eye, EyeOff, AlertCircle, CheckCircle2,
  ArrowRight, ShieldCheck, Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage(t('loginFailed'));
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMessage(language === 'th' ? 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(t('passwordsDoNotMatch'));
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMessage(error.message || t('loginFailed'));
        } else {
          setSuccessMessage(t('loginSuccess'));
          setTimeout(() => router.push('/'), 400);
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          setErrorMessage(error.message || t('registerFailed'));
        } else {
          setSuccessMessage(t('registerSuccess'));
          setTimeout(() => router.push('/'), 600);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-gradient-to-br from-slate-900 via-[#0f172a] to-black text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Language Toggle in Top Right */}
      <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
        <button
          onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 transition cursor-pointer"
        >
          {language === 'en' ? '🇹🇭 ภาษาไทย' : '🇬🇧 English'}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/25 mb-4 border border-blue-400/30">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            CFD Trading Journal
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1.5 font-medium">
            {t('startYourJournal')}
          </p>
        </div>

        {/* Card Container */}
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-black/40 rounded-2xl mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('signIn')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('signUp')}
            </button>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name (Only in SignUp) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('displayName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น Alex Trader"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t('email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Only in SignUp) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('confirmPassword')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}
            >
              {submitting ? (
                <span>{mode === 'signin' ? t('loggingIn') : t('creatingAccount')}</span>
              ) : (
                <>
                  <span>{mode === 'signin' ? t('signIn') : t('signUp')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Switch mode hint */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {mode === 'signin' ? (
              <p>
                {t('dontHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="text-blue-400 hover:text-blue-300 font-bold ml-1 hover:underline cursor-pointer"
                >
                  {t('signUp')}
                </button>
              </p>
            ) : (
              <p>
                {t('alreadyHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMessage(''); setSuccessMessage(''); }}
                  className="text-blue-400 hover:text-blue-300 font-bold ml-1 hover:underline cursor-pointer"
                >
                  {t('signIn')}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security / Privacy notice */}
        <p className="text-center text-[11px] text-slate-500 mt-6 flex items-center justify-center gap-1.5 font-medium">
          <Sparkles size={12} className="text-blue-500" />
          <span>Cloud Auth via Supabase • Isolated Trading Data</span>
        </p>
      </div>
    </div>
  );
}
