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
    if (!user) return;
    try {
      const data = await getAccounts();
      setAccounts(data);
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('selectedAccountId') : null;
      const found = data.find(a => a.id === savedId);
      if (found) {
        setSelectedAccountState(found);
      } else if (data.length > 0 && !selectedAccount) {
        setSelectedAccountState(data[0]);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAccounts();
    }
  }, [user]);

  const setSelectedAccount = (account: Account) => {
    setSelectedAccountState(account);
    localStorage.setItem('selectedAccountId', account.id);
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
