'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/user';
import { getSupabase } from '@/lib/supabase';
import {
  getCloudPin, setCloudPin, removeCloudPin,
  getMemberRecord, saveMemberRecord, verifyAndResetPasswordWithMemberInfo,
  migrateAdminDataToActiveUser
} from '@/lib/clientStorage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  hasPin: boolean;
  isLocked: boolean;
  isPasswordRecovery: boolean;
  sessionExpiresAt: number | null;
  sessionDurationDays: number;
  extendSession: (days?: number) => void;
  setSessionDurationDays: (days: number) => void;
  setIsPasswordRecovery: (value: boolean) => void;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updateUserPassword: (password: string) => Promise<{ error: Error | null }>;
  resetPasswordWithMemberInfo: (email: string, displayName: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  setPin: (pin: string) => void;
  removePin: () => void;
  unlockWithPin: (pin: string) => boolean;
  lockSession: () => void;
  skipPinSetup: () => void;
}

const SESSION_KEYS = {
  USER: 'tj_user',
  EXPIRES_AT: 'tj_session_expires_at',
  DURATION_DAYS: 'tj_session_duration_days',
};

const DEFAULT_SESSION_DAYS = 30;

export function getStoredSessionDurationDays(): number {
  if (typeof window === 'undefined') return DEFAULT_SESSION_DAYS;
  const stored = localStorage.getItem(SESSION_KEYS.DURATION_DAYS);
  const parsed = stored ? Number(stored) : DEFAULT_SESSION_DAYS;
  return isNaN(parsed) || parsed <= 0 ? DEFAULT_SESSION_DAYS : parsed;
}

export function setStoredSessionDurationDays(days: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEYS.DURATION_DAYS, String(days));
}

export function calculateSessionExpiry(days?: number): number {
  const d = days || getStoredSessionDurationDays();
  return Date.now() + d * 24 * 60 * 60 * 1000;
}

export function isLocalSessionValid(): boolean {
  if (typeof window === 'undefined') return false;
  const userStr = localStorage.getItem(SESSION_KEYS.USER);
  if (!userStr) return false;

  const expiresStr = localStorage.getItem(SESSION_KEYS.EXPIRES_AT);
  if (!expiresStr) {
    // If user has tj_user but no expires_at (legacy or fresh login), grant default 30 days
    const newExpiry = calculateSessionExpiry();
    localStorage.setItem(SESSION_KEYS.EXPIRES_AT, String(newExpiry));
    return true;
  }

  const expiresAt = Number(expiresStr);
  if (isNaN(expiresAt) || Date.now() >= expiresAt) {
    return false;
  }
  return true;
}

export function extendSessionExpiry(days?: number): number {
  const newExpiry = calculateSessionExpiry(days);
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEYS.EXPIRES_AT, String(newExpiry));
  }
  return newExpiry;
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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [sessionDurationDays, setSessionDurationDaysState] = useState<number>(DEFAULT_SESSION_DAYS);

  // Initialize stored session duration and expiry on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const days = getStoredSessionDurationDays();
      setSessionDurationDaysState(days);
      const exp = localStorage.getItem(SESSION_KEYS.EXPIRES_AT);
      if (exp) {
        setSessionExpiresAt(Number(exp));
      }
    }
  }, []);

  // Auto-migrate admin data when user logs in or session is restored
  useEffect(() => {
    if (user?.id && user?.email) {
      migrateAdminDataToActiveUser(user.id, user.email).catch(console.error);
    }
  }, [user]);

  // Initialize Supabase Auth & PIN state
  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();

    async function initAuth() {
      try {
        // 1. Immediately verify local persistent session to prevent premature logout
        if (typeof window !== 'undefined') {
          if (isLocalSessionValid()) {
            try {
              const localUser = JSON.parse(localStorage.getItem(SESSION_KEYS.USER) || '');
              if (localUser?.id && mounted) {
                setUser(localUser);
                const exp = Number(localStorage.getItem(SESSION_KEYS.EXPIRES_AT)) || extendSessionExpiry();
                setSessionExpiresAt(exp);
              }
            } catch (e) {
              console.error('Error parsing local user session:', e);
            }
          } else {
            // Expired local session
            localStorage.removeItem(SESSION_KEYS.USER);
            localStorage.removeItem(SESSION_KEYS.EXPIRES_AT);
            if (mounted) {
              setUser(null);
              setSessionExpiresAt(null);
            }
          }
        }

        // 2. Sync with Supabase session if configured
        if (supabase) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (!error && session?.user && mounted) {
            const mapped = mapSupabaseUserToAppUser(session.user);
            setUser(mapped);
            if (typeof window !== 'undefined') {
              localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(mapped));
              const newExp = extendSessionExpiry();
              setSessionExpiresAt(newExp);
            }
          } else if (mounted) {
            // Supabase session is null/expired.
            // DO NOT kick user out if local session is still within valid expiry window!
            if (isLocalSessionValid()) {
              // Local session is still active! Keep user logged in.
              const activeEmail = typeof window !== 'undefined'
                ? (JSON.parse(localStorage.getItem(SESSION_KEYS.USER) || '{}')?.email || '')
                : '';
              if (activeEmail) {
                getMemberRecord(activeEmail).then(async (member) => {
                  if (member?.password && supabase) {
                    try {
                      await supabase.auth.signInWithPassword({
                        email: activeEmail,
                        password: member.password,
                      });
                    } catch {}
                  }
                }).catch(() => {});
              }
            } else {
              // Truly expired
              setUser(null);
              setSessionExpiresAt(null);
              if (typeof window !== 'undefined') {
                localStorage.removeItem(SESSION_KEYS.USER);
                localStorage.removeItem(SESSION_KEYS.EXPIRES_AT);
              }
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
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }
        if (session?.user) {
          const mapped = mapSupabaseUserToAppUser(session.user);
          setUser(mapped);
          localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(mapped));
          const exp = extendSessionExpiry();
          setSessionExpiresAt(exp);
        } else if (event === 'SIGNED_OUT') {
          // Only sign out if local session is also invalid or expired
          if (!isLocalSessionValid()) {
            setUser(null);
            setSessionExpiresAt(null);
            localStorage.removeItem(SESSION_KEYS.USER);
            localStorage.removeItem(SESSION_KEYS.EXPIRES_AT);
          }
        }
        setLoading(false);
      });
      subscription = data.subscription;
    }

    // Check PIN status and password recovery URL on load
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        setIsPasswordRecovery(true);
      }

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

  const signIn = useCallback(async (email: string, password: string, rememberMe: boolean = true): Promise<{ error: Error | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabase();
    const sessionDays = rememberMe ? getStoredSessionDurationDays() : 1;

    // 1. Try Supabase Auth
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.user) {
          const mapped = mapSupabaseUserToAppUser(data.user);
          setUser(mapped);
          localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(mapped));
          const exp = extendSessionExpiry(sessionDays);
          setSessionExpiresAt(exp);

          // Keep member record synced
          saveMemberRecord({
            email: cleanEmail,
            displayName: mapped.name,
            password,
            userId: mapped.id,
            createdAt: mapped.createdAt,
          }).catch(console.error);
          return { error: null };
        }

        // --- BYPASS 1: Supabase reports "Email not confirmed" ---
        // In Supabase, this error ONLY occurs if email and password are valid!
        if (error && error.message.toLowerCase().includes('email not confirmed')) {
          const member = await getMemberRecord(cleanEmail);
          const appUser: User = {
            id: member?.userId || 'u_' + btoa(cleanEmail).replace(/=/g, '').slice(0, 16),
            email: cleanEmail,
            name: member?.displayName || cleanEmail.split('@')[0],
            role: 'ADMIN',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
            createdAt: member?.createdAt || new Date().toISOString(),
          };
          setUser(appUser);
          localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(appUser));
          const exp = extendSessionExpiry(sessionDays);
          setSessionExpiresAt(exp);

          await saveMemberRecord({
            email: cleanEmail,
            displayName: appUser.name,
            password,
            userId: appUser.id,
            createdAt: appUser.createdAt,
          });
          return { error: null };
        }
      } catch (err) {
        console.warn('Supabase signIn attempt error:', err);
      }
    }

    // --- BYPASS 2: Check member record in app_state / localStorage ---
    const member = await getMemberRecord(cleanEmail);
    if (member && member.password === password) {
      const appUser: User = {
        id: member.userId || 'u_' + btoa(cleanEmail).replace(/=/g, '').slice(0, 16),
        email: cleanEmail,
        name: member.displayName || cleanEmail.split('@')[0],
        role: 'ADMIN',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
        createdAt: member.createdAt || new Date().toISOString(),
      };
      setUser(appUser);
      localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(appUser));
      const exp = extendSessionExpiry(sessionDays);
      setSessionExpiresAt(exp);
      return { error: null };
    }

    return { error: new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง') };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string): Promise<{ error: Error | null; needsConfirmation?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const finalName = displayName?.trim() || cleanEmail.split('@')[0];
    const supabase = getSupabase();
    const sessionDays = getStoredSessionDurationDays();

    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please check settings.') };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            displayName: finalName,
            role: 'ADMIN',
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      const userId = data?.user?.id || 'u_' + btoa(cleanEmail).replace(/=/g, '').slice(0, 16);
      await saveMemberRecord({
        email: cleanEmail,
        displayName: finalName,
        password,
        userId,
        createdAt: data?.user?.created_at || new Date().toISOString(),
      });

      if (data?.user && data.session) {
        const mapped = mapSupabaseUserToAppUser(data.user);
        setUser(mapped);
        localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(mapped));
        const exp = extendSessionExpiry(sessionDays);
        setSessionExpiresAt(exp);
        return { error: null, needsConfirmation: false };
      }

      // If user created without session (email confirmation required in Supabase)
      // Since member record is saved, user can already log in with bypass!
      if (data?.user && !data.session) {
        const appUser: User = {
          id: userId,
          email: cleanEmail,
          name: finalName,
          role: 'ADMIN',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
          createdAt: new Date().toISOString(),
        };
        setUser(appUser);
        localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(appUser));
        const exp = extendSessionExpiry(sessionDays);
        setSessionExpiresAt(exp);
        return { error: null, needsConfirmation: false };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  const resetPasswordWithMemberInfo = useCallback(async (email: string, displayName: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    const res = await verifyAndResetPasswordWithMemberInfo(email, displayName, newPassword);
    if (res.success && res.user) {
      setUser(res.user);
      localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(res.user));
      const exp = extendSessionExpiry();
      setSessionExpiresAt(exp);
      return { success: true };
    }
    return { success: false, message: res.message || 'ไม่สามารถยืนยันข้อมูลสมาชิกได้' };
  }, []);

  const extendSession = useCallback((days?: number) => {
    const newExp = extendSessionExpiry(days);
    setSessionExpiresAt(newExp);
  }, []);

  const setSessionDurationDays = useCallback((days: number) => {
    setStoredSessionDurationDays(days);
    setSessionDurationDaysState(days);
    const newExp = extendSessionExpiry(days);
    setSessionExpiresAt(newExp);
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
    setSessionExpiresAt(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEYS.USER);
      localStorage.removeItem(SESSION_KEYS.EXPIRES_AT);
      sessionStorage.removeItem('tj_unlocked');
      sessionStorage.removeItem('tj_pin_skipped');
    }
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string): Promise<{ error: Error | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/login?type=recovery`
        : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  const updateUserPassword = useCallback(async (newPassword: string): Promise<{ error: Error | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { error: new Error(error.message) };
      }
      setIsPasswordRecovery(false);
      return { error: null };
    } catch (err: any) {
      return { error: err instanceof Error ? err : new Error(String(err)) };
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
      isPasswordRecovery,
      sessionExpiresAt,
      sessionDurationDays,
      extendSession,
      setSessionDurationDays,
      setIsPasswordRecovery,
      signIn,
      signUp,
      signOut,
      resetPasswordForEmail,
      updateUserPassword,
      resetPasswordWithMemberInfo,
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
