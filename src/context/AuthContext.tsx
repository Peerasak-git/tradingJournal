'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types/user';
import { getUser } from '@/lib/clientStorage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  hasPin: boolean;
  isLocked: boolean;
  setPin: (pin: string) => void;
  removePin: () => void;
  unlockWithPin: (pin: string) => boolean;
  lockSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    getUser()
      .then(u => {
        setUser(u);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Check PIN status
    if (typeof window !== 'undefined') {
      const savedPin = localStorage.getItem('tj_security_pin');
      if (savedPin) {
        setHasPin(true);
        const isSessionUnlocked = sessionStorage.getItem('tj_unlocked') === 'true';
        if (!isSessionUnlocked) {
          setIsLocked(true);
        }
      }
    }
  }, []);

  const unlockWithPin = (inputPin: string): boolean => {
    if (typeof window === 'undefined') return false;
    const savedPin = localStorage.getItem('tj_security_pin');
    if (!savedPin || inputPin === savedPin) {
      sessionStorage.setItem('tj_unlocked', 'true');
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const setPin = (newPin: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('tj_security_pin', newPin);
    sessionStorage.setItem('tj_unlocked', 'true');
    setHasPin(true);
    setIsLocked(false);
  };

  const removePin = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('tj_security_pin');
    sessionStorage.removeItem('tj_unlocked');
    setHasPin(false);
    setIsLocked(false);
  };

  const lockSession = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('tj_unlocked');
    setIsLocked(true);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      hasPin,
      isLocked,
      setPin,
      removePin,
      unlockWithPin,
      lockSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
