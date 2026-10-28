'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Account } from '@/types/account';
import { useAuth } from './AuthContext';
import { getAccounts } from '@/lib/clientStorage';

interface AccountContextType {
  accounts: Account[];
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account) => void;
  loading: boolean;
  refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccountState] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAccounts = async () => {
    if (!user) {
      setAccounts([]);
      setSelectedAccountState(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getAccounts();
      setAccounts(data);
      const storageKey = `selectedAccountId_${user.id}`;
      const savedId = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      const found = data.find(a => a.id === savedId);
      if (found) {
        setSelectedAccountState(found);
      } else if (data.length > 0) {
        setSelectedAccountState(data[0]);
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, data[0].id);
        }
      } else {
        setSelectedAccountState(null);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAccounts();
  }, [user]);

  const setSelectedAccount = (account: Account) => {
    setSelectedAccountState(account);
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(`selectedAccountId_${user.id}`, account.id);
    }
  };

  return (
    <AccountContext.Provider value={{ accounts, selectedAccount, setSelectedAccount, loading, refreshAccounts }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
