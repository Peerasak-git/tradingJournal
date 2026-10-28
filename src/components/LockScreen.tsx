'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Lock, Delete, ShieldAlert, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LockScreen() {
  const pathname = usePathname();
  const { hasPin, isLocked, unlockWithPin, setPin, removePin, skipPinSetup } = useAuth();
  
  // State for PIN entry
  const [pin, setPinState] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // State for First-Time Setup
  const [setupStep, setSetupStep] = useState<'ENTER' | 'CONFIRM'>('ENTER');
  const [firstPin, setFirstPin] = useState('');

  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          handleDigitPress(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isLocked, hasPin, setupStep, firstPin]);

  if (pathname === '/login' || !isLocked) return null;

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 6) return;
    setError(false);
    setErrorMessage('');
    const newPin = pin + digit;
    setPinState(newPin);

    // Auto submit in Unlock mode if 4 to 6 digits
    if (hasPin) {
      if (newPin.length >= 4) {
        const success = unlockWithPin(newPin);
        if (success) {
          setPinState('');
        } else if (newPin.length === 6) {
          triggerError('รหัส PIN ไม่ถูกต้อง โปรดลองอีกครั้ง');
        }
      }
    } else {
      // In Setup Mode: auto-advance when 4 digits or manual
      if (setupStep === 'ENTER' && newPin.length === 4) {
        // Let user continue typing or press next
      }
    }
  };

  const handleDelete = () => {
    setPinState(prev => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
  };

  const triggerError = (msg: string) => {
    setError(true);
    setErrorMessage(msg);
    setTimeout(() => {
      setPinState('');
      setError(false);
    }, 800);
  };

  const handleSubmit = () => {
    if (hasPin) {
      // Unlock Mode
      const success = unlockWithPin(pin);
      if (!success) {
        triggerError('รหัส PIN ไม่ถูกต้อง โปรดลองอีกครั้ง');
      } else {
        setPinState('');
      }
    } else {
      // Setup Mode
      if (setupStep === 'ENTER') {
        if (pin.length < 4 || pin.length > 6) {
          triggerError('รหัส PIN ต้องมีความยาว 4 - 6 ตัวเลข');
          return;
        }
        setFirstPin(pin);
        setPinState('');
        setSetupStep('CONFIRM');
      } else {
        // Confirm step
        if (pin !== firstPin) {
          triggerError('รหัส PIN ไม่ตรงกัน กรุณาเริ่มใหม่อีกครั้ง');
          setTimeout(() => {
            setSetupStep('ENTER');
            setFirstPin('');
          }, 900);
          return;
        }
        // Success setting PIN
        setPin(pin);
        setPinState('');
      }
    }
  };

  const handleResetPin = () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตรหัสผ่าน PIN? ข้อมูลการเทรดทั้งหมดของคุณจะยังอยู่ครบถ้วน')) {
      removePin();
      setShowForgotModal(false);
      setPinState('');
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 select-none animate-fade-in text-white">
      {/* Container */}
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* App Icon */}
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 shadow-2xl shadow-emerald-500/10">
          <Lock size={36} strokeWidth={2.5} className="animate-pulse" />
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-2xl font-black tracking-tight text-white mb-2 text-center">
          {hasPin
            ? 'Trading Journal Lock'
            : setupStep === 'ENTER'
            ? 'ตั้งรหัส PIN ป้องกันหน้าจอ'
            : 'ยืนยันรหัส PIN อีกครั้ง'}
        </h1>
        <p className="text-sm font-medium text-slate-400 mb-8 text-center leading-relaxed">
          {hasPin
            ? 'ใส่รหัส PIN เพื่อเข้าสู่หน้าแดชบอร์ดส่วนตัว'
            : setupStep === 'ENTER'
            ? 'กรุณาตั้งรหัสตัวเลข 4 - 6 หลัก เพื่อความปลอดภัยของข้อมูล'
            : 'กดรหัส PIN เดิมซ้ำอีกครั้งเพื่อยืนยัน'}
        </p>

        {/* PIN Indicators */}
        <div className={`flex items-center gap-4 mb-8 transition-transform ${error ? 'animate-bounce text-rose-500' : ''}`}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                idx < pin.length
                  ? error
                    ? 'bg-rose-500 border-rose-500 scale-125'
                    : 'bg-emerald-500 border-emerald-500 scale-125 shadow-lg shadow-emerald-500/50'
                  : 'border-slate-600 bg-slate-800/40'
              }`}
            />
          ))}
          {pin.length > 4 && (
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              pin.length >= 5 ? 'bg-emerald-500 border-emerald-500 scale-125 shadow-lg shadow-emerald-500/50' : 'border-slate-600'
            }`} />
          )}
          {pin.length > 5 && (
            <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              pin.length >= 6 ? 'bg-emerald-500 border-emerald-500 scale-125 shadow-lg shadow-emerald-500/50' : 'border-slate-600'
            }`} />
          )}
        </div>

        {/* Error message */}
        <div className="h-6 mb-3">
          {error && (
            <p className="text-rose-400 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
              <ShieldAlert size={14} />
              <span>{errorMessage || 'รหัส PIN ไม่ถูกต้อง โปรดลองอีกครั้ง'}</span>
            </p>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigitPress(digit)}
              className="h-16 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] border border-white/[0.08] text-2xl font-black text-white transition-all active:scale-95 flex items-center justify-center shadow-lg cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Extra action, 0, Backspace */}
          {hasPin ? (
            <button
              onClick={() => setShowForgotModal(true)}
              className="h-16 rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
            >
              ลืมรหัส?
            </button>
          ) : (
            <button
              onClick={skipPinSetup}
              className="h-16 rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
            >
              ข้ามไปก่อน
            </button>
          )}

          <button
            onClick={() => handleDigitPress('0')}
            className="h-16 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] border border-white/[0.08] text-2xl font-black text-white transition-all active:scale-95 flex items-center justify-center shadow-lg cursor-pointer"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] border border-white/[0.08] text-slate-300 transition-all active:scale-95 flex items-center justify-center shadow-lg cursor-pointer"
          >
            <Delete size={22} />
          </button>
        </div>

        {/* Action Button */}
        {pin.length >= 4 && (
          <button
            onClick={handleSubmit}
            className="w-full max-w-[280px] py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white shadow-xl shadow-emerald-600/30 transition active:scale-95 flex items-center justify-center gap-2 mb-3 cursor-pointer"
          >
            {hasPin ? (
              <>
                <KeyRound size={16} />
                <span>ปลดล็อก</span>
              </>
            ) : setupStep === 'ENTER' ? (
              <>
                <span>ถัดไป</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>ยืนยันและเข้าใช้งาน</span>
              </>
            )}
          </button>
        )}

        {/* Skip button for first-time */}
        {!hasPin && (
          <button
            onClick={skipPinSetup}
            className="text-xs text-slate-500 hover:text-slate-300 transition font-medium mt-2 cursor-pointer"
          >
            ข้ามการตั้งรหัสผ่านไปก่อน (เข้าใช้งานทันที)
          </button>
        )}
      </div>

      {/* Forgot PIN Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl border border-slate-700 bg-slate-900 text-left shadow-2xl">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <KeyRound size={20} className="text-amber-400" />
              <span>รีเซ็ตรหัส PIN</span>
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              หากคุณลืมรหัสผ่าน PIN ระบบจะทำการปลดล็อกและยกเลิกรหัส PIN ให้คุณทันที โดยข้อมูลการเทรด พอร์ต และรีวิวทั้งหมดของคุณจะไม่สูญหาย
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowForgotModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleResetPin}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                ยืนยันรีเซ็ต
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
