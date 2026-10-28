'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/user';
import { getSupabase } from '@/lib/supabase';
import { getCloudPin, setCloudPin, removeCloudPin } from '@/lib/clientStorage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  hasPin: boolean;
  isLocked: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  setPin: (pin: string) => void;
  removePin: () => void;
  unlockWithPin: (pin: string) => boolean;
  lockSession: () => void;
  skipPinSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUserToAppUser(sbUser: any): User {
  const meta = sbUser.user_metadata || {};
  const name = meta.displayName || meta.name || meta.full_name || (sbUser.email ? sbUser.email.split('@')[0] : 'Trader');
  const avatar = meta.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sbUser.id || name)}`;
  const role: UserRole = meta.role === 'USER' ? 'USER' : 'ADMIN';

  return {
    id: sbUser.id,
    email: sbUser.email || '',
    name,
    role,
    avatar,
    createdAt: sbUser.created_at || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Initialize Supabase Auth & PIN state
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();

    async function initAuth() {
      try {
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user && mounted) {
            const mapped = mapSupabaseUserToAppUser(session.user);
            setUser(mapped);
            if (typeof window !== 'undefined') {
              localStorage.setItem('tj_user', JSON.stringify(mapped));
            }
          } else if (mounted) {
            setUser(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('tj_user');
            }
          }
        } else if (mounted) {
          // If Supabase is not configured, check local storage
          const localUser = localStorage.getItem('tj_user');
          if (localUser) {
            try {
              setUser(JSON.parse(localUser));
            } catch {
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching Supabase session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase Auth state changes
    let subscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          const mapped = mapSupabaseUserToAppUser(session.user);
          setUser(mapped);
          localStorage.setItem('tj_user', JSON.stringify(mapped));
        } else {
          setUser(null);
          localStorage.removeItem('tj_user');
        }
        setLoading(false);
      });
      subscription = data.subscription;
    }

    // Check PIN status on load
    if (typeof window !== 'undefined') {
      const isSkipped = sessionStorage.getItem('tj_pin_skipped') === 'true';
      const isSessionUnlocked = sessionStorage.getItem('tj_unlocked') === 'true';

      const localPin = localStorage.getItem('tj_security_pin');
      if (localPin) {
        setHasPin(true);
        setIsLocked(!isSessionUnlocked);
      } else if (!isSkipped) {
        setHasPin(false);
        setIsLocked(false);
      }

      getCloudPin().then((cloudPin) => {
        if (cloudPin && mounted) {
          setHasPin(true);
          const unlocked = sessionStorage.getItem('tj_unlocked') === 'true';
          setIsLocked(!unlocked);
        }
      }).catch(console.error);
    }

    return () => {
      mounted = false;
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please check settings.') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data?.user) {
        const mapped = mapSupabaseUserToAppUser(data.user);
        setUser(mapped);
        localStorage.setItem('tj_user', JSON.stringify(mapped));
      }
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string): Promise<{ error: Error | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please check settings.') };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            displayName: displayName?.trim() || email.split('@')[0],
            role: 'ADMIN',
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data?.user) {
        const mapped = mapSupabaseUserToAppUser(data.user);
        setUser(mapped);
        localStorage.setItem('tj_user', JSON.stringify(mapped));
      }
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out of Supabase:', err);
      }
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tj_user');
      sessionStorage.removeItem('tj_unlocked');
      sessionStorage.removeItem('tj_pin_skipped');
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
    setCloudPin(newPin).catch(console.error);
    sessionStorage.setItem('tj_unlocked', 'true');
    setHasPin(true);
    setIsLocked(false);
  };

  const removePin = () => {
    if (typeof window === 'undefined') return;
    removeCloudPin().catch(console.error);
    sessionStorage.removeItem('tj_unlocked');
    setHasPin(false);
    setIsLocked(false);
  };

  const lockSession = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('tj_unlocked');
    sessionStorage.removeItem('tj_pin_skipped');
    setIsLocked(true);
  };

  const skipPinSetup = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('tj_pin_skipped', 'true');
    setIsLocked(false);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      hasPin,
      isLocked,
      signIn,
      signUp,
      signOut,
      setPin,
      removePin,
      unlockWithPin,
      lockSession,
      skipPinSetup,
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
