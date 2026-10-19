'use client';

import { Trade } from '@/types/trade';
import { Account } from '@/types/account';
import { JournalEntry } from '@/types/journal';
import { FinanceEntry } from '@/types/finance';
import { Review } from '@/types/review';
import { User } from '@/types/user';

const KEYS = {
  TRADES: 'tj_trades',
  ACCOUNTS: 'tj_accounts',
  JOURNALS: 'tj_journals',
  FINANCES: 'tj_finances',
  REVIEWS: 'tj_reviews',
  USER: 'tj_user',
};

function isClient(): boolean {
  return typeof window !== 'undefined';
}

// ---------------- Trades ----------------
export async function getTrades(): Promise<Trade[]> {
  if (!isClient()) return [];
  const local = localStorage.getItem(KEYS.TRADES);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Error parsing trades from localStorage', e);
    }
  }

  // Seed from API if first time
  try {
    const res = await fetch('/api/trades');
    if (res.ok) {
      const data = await res.json();
      const trades: Trade[] = data.trades || [];
      localStorage.setItem(KEYS.TRADES, JSON.stringify(trades));
      return trades;
    }
  } catch (err) {
    console.error('Error seeding trades from API:', err);
  }
  return [];
}

export function saveTrades(trades: Trade[]): void {
  if (!isClient()) return;
  localStorage.setItem(KEYS.TRADES, JSON.stringify(trades));
}

export async function addOrUpdateTrade(trade: Trade): Promise<Trade> {
  const trades = await getTrades();
  const index = trades.findIndex(t => t.id === trade.id);
  const accounts = await getAccounts();
  const accIndex = accounts.findIndex(a => a.id === trade.accountId);

  if (index === -1) {
    // New trade
    trades.unshift(trade);
    if (accIndex !== -1 && trade.status !== 'OPEN' && trade.financials.netPnL != null) {
      accounts[accIndex].balance += trade.financials.netPnL;
      saveAccounts(accounts);
    }
  } else {
    // Update existing trade
    const oldTrade = trades[index];
    trades[index] = trade;

    if (accIndex !== -1) {
      if (oldTrade.status !== 'OPEN' && oldTrade.financials.netPnL != null) {
        accounts[accIndex].balance -= oldTrade.financials.netPnL;
      }
      if (trade.status !== 'OPEN' && trade.financials.netPnL != null) {
        accounts[accIndex].balance += trade.financials.netPnL;
      }
      saveAccounts(accounts);
    }
  }

  saveTrades(trades);
  return trade;
}

export async function deleteTrade(id: string): Promise<boolean> {
  const trades = await getTrades();
  const index = trades.findIndex(t => t.id === id);
  if (index === -1) return false;

  const oldTrade = trades[index];
  const filtered = trades.filter(t => t.id !== id);
  saveTrades(filtered);

  // Revert balance if closed
  if (oldTrade.status !== 'OPEN' && oldTrade.financials.netPnL != null) {
    const accounts = await getAccounts();
    const accIndex = accounts.findIndex(a => a.id === oldTrade.accountId);
    if (accIndex !== -1) {
      accounts[accIndex].balance -= oldTrade.financials.netPnL;
      saveAccounts(accounts);
    }
  }

  return true;
}

// ---------------- Accounts ----------------
export async function getAccounts(): Promise<Account[]> {
  if (!isClient()) return [];
  const local = localStorage.getItem(KEYS.ACCOUNTS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Error parsing accounts from localStorage', e);
    }
  }

  try {
    const res = await fetch('/api/accounts');
    if (res.ok) {
      const data = await res.json();
      const accounts: Account[] = data.accounts || [];
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
      return accounts;
    }
  } catch (err) {
    console.error('Error seeding accounts from API:', err);
  }
  return [];
}

export function saveAccounts(accounts: Account[]): void {
  if (!isClient()) return;
  localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export async function addAccount(account: Account): Promise<Account> {
  const accounts = await getAccounts();
  accounts.push(account);
  saveAccounts(accounts);
  return account;
}

export async function updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
  const accounts = await getAccounts();
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) return null;

  accounts[index] = { ...accounts[index], ...updates };
  saveAccounts(accounts);
  return accounts[index];
}

export async function deleteAccount(id: string): Promise<boolean> {
  const accounts = await getAccounts();
  const filtered = accounts.filter(a => a.id !== id);
  saveAccounts(filtered);
  return true;
}

// ---------------- Journals ----------------
export async function getJournals(): Promise<JournalEntry[]> {
  if (!isClient()) return [];
  const local = localStorage.getItem(KEYS.JOURNALS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Error parsing journals from localStorage', e);
    }
  }

  try {
    const res = await fetch('/api/journals');
    if (res.ok) {
      const data = await res.json();
      const journals: JournalEntry[] = data.journals || [];
      localStorage.setItem(KEYS.JOURNALS, JSON.stringify(journals));
      return journals;
    }
  } catch (err) {
    console.error('Error seeding journals from API:', err);
  }
  return [];
}

export function saveJournals(journals: JournalEntry[]): void {
  if (!isClient()) return;
  localStorage.setItem(KEYS.JOURNALS, JSON.stringify(journals));
}

export async function addOrUpdateJournal(entry: JournalEntry): Promise<JournalEntry> {
  const journals = await getJournals();
  const index = journals.findIndex(j => j.id === entry.id);
  if (index === -1) {
    journals.unshift(entry);
  } else {
    journals[index] = entry;
  }
  saveJournals(journals);
  return entry;
}

export async function deleteJournal(id: string): Promise<boolean> {
  const journals = await getJournals();
  const filtered = journals.filter(j => j.id !== id);
  saveJournals(filtered);
  return true;
}

// ---------------- Finances ----------------
export async function getFinances(): Promise<FinanceEntry[]> {
  if (!isClient()) return [];
  const local = localStorage.getItem(KEYS.FINANCES);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Error parsing finances from localStorage', e);
    }
  }

  try {
    const res = await fetch('/api/finances');
    if (res.ok) {
      const data = await res.json();
      const finances: FinanceEntry[] = data.finances || [];
      localStorage.setItem(KEYS.FINANCES, JSON.stringify(finances));
      return finances;
    }
  } catch (err) {
    console.error('Error seeding finances from API:', err);
  }
  return [];
}

export function saveFinances(finances: FinanceEntry[]): void {
  if (!isClient()) return;
  localStorage.setItem(KEYS.FINANCES, JSON.stringify(finances));
}

export async function addFinance(entry: FinanceEntry): Promise<FinanceEntry> {
  const finances = await getFinances();
  finances.unshift(entry);
  saveFinances(finances);
  return entry;
}

// ---------------- Reviews ----------------
export async function getReviews(): Promise<Review[]> {
  if (!isClient()) return [];
  const local = localStorage.getItem(KEYS.REVIEWS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Error parsing reviews from localStorage', e);
    }
  }

  try {
    const res = await fetch('/api/reviews');
    if (res.ok) {
      const data = await res.json();
      const reviews: Review[] = data.reviews || [];
      localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
      return reviews;
    }
  } catch (err) {
    console.error('Error seeding reviews from API:', err);
  }
  return [];
}

export function saveReviews(reviews: Review[]): void {
  if (!isClient()) return;
  localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
}

export async function addOrUpdateReview(review: Review): Promise<Review> {
  const reviews = await getReviews();
  const index = reviews.findIndex(r => r.id === review.id);
  if (index === -1) {
    reviews.unshift(review);
  } else {
    reviews[index] = review;
  }
  saveReviews(reviews);
  return review;
}

export async function deleteReview(id: string): Promise<boolean> {
  const reviews = await getReviews();
  const filtered = reviews.filter(r => r.id !== id);
  saveReviews(filtered);
  return true;
}

// ---------------- User ----------------
export async function getUser(): Promise<User | null> {
  if (!isClient()) return null;
  const local = localStorage.getItem(KEYS.USER);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }

  try {
    const res = await fetch('/api/user/me');
    if (res.ok) {
      const data = await res.json();
      const user: User = data.user;
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
      return user;
    }
  } catch (err) {
    console.error('Error seeding user from API:', err);
  }
  return null;
}

// ---------------- Backup & Restore ----------------
export async function exportAllData(): Promise<string> {
  const [trades, accounts, journals, finances, reviews, user] = await Promise.all([
    getTrades(),
    getAccounts(),
    getJournals(),
    getFinances(),
    getReviews(),
    getUser()
  ]);

  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: {
      trades,
      accounts,
      journals,
      finances,
      reviews,
      user
    }
  };

  return JSON.stringify(backup, null, 2);
}

export function importAllData(jsonString: string): { success: boolean; message?: string } {
  if (!isClient()) return { success: false, message: 'Not on client side' };
  try {
    const parsed = JSON.parse(jsonString);
    const data = parsed.data || parsed;

    if (data.trades && Array.isArray(data.trades)) {
      localStorage.setItem(KEYS.TRADES, JSON.stringify(data.trades));
    }
    if (data.accounts && Array.isArray(data.accounts)) {
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(data.accounts));
    }
    if (data.journals && Array.isArray(data.journals)) {
      localStorage.setItem(KEYS.JOURNALS, JSON.stringify(data.journals));
    }
    if (data.finances && Array.isArray(data.finances)) {
      localStorage.setItem(KEYS.FINANCES, JSON.stringify(data.finances));
    }
    if (data.reviews && Array.isArray(data.reviews)) {
      localStorage.setItem(KEYS.REVIEWS, JSON.stringify(data.reviews));
    }
    if (data.user) {
      localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Invalid JSON format' };
  }
}
