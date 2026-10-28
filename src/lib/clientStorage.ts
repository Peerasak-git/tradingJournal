'use client';

import { Trade } from '@/types/trade';
import { Account } from '@/types/account';
import { JournalEntry } from '@/types/journal';
import { FinanceEntry } from '@/types/finance';
import { Review } from '@/types/review';
import { User } from '@/types/user';
import { getSupabase } from './supabase';

const KEYS = {
  TRADES: 'tj_trades',
  ACCOUNTS: 'tj_accounts',
  JOURNALS: 'tj_journals',
  FINANCES: 'tj_finances',
  REVIEWS: 'tj_reviews',
  USER: 'tj_user',
  PIN: 'tj_security_pin',
};

function isClient(): boolean {
  return typeof window !== 'undefined';
}

export function getActiveUserId(): string | null {
  if (!isClient()) return null;
  const local = localStorage.getItem(KEYS.USER);
  if (local) {
    try {
      const u = JSON.parse(local);
      return u?.id || null;
    } catch {}
  }
  return null;
}

export function getUserKey(baseKey: string): string {
  const userId = getActiveUserId();
  return userId ? `${baseKey}_${userId}` : baseKey;
}

// ---------------- Trades ----------------
export async function getTrades(): Promise<Trade[]> {
  if (!isClient()) return [];

  const supabase = getSupabase();
  const currentUserId = getActiveUserId();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        if (data.length > 0) {
          let trades: Trade[] = data.map((row: any) => ({
            ...(row.data as Trade),
            userId: row.data?.userId || row.user_id || undefined,
          }));
          if (currentUserId) {
            trades = trades.filter(t => !t.userId || t.userId === currentUserId);
          }
          localStorage.setItem(getUserKey(KEYS.TRADES), JSON.stringify(trades));
          return trades;
        }

        // If Supabase table is empty, check if we have local trades to push to cloud
        const local = localStorage.getItem(getUserKey(KEYS.TRADES)) || localStorage.getItem(KEYS.TRADES);
        if (local) {
          try {
            const localTrades: Trade[] = JSON.parse(local);
            if (localTrades.length > 0) {
              // Auto-seed cloud from local
              syncTradesToSupabase(localTrades).catch(console.error);
              return localTrades;
            }
          } catch (e) {
            console.error('Error parsing local trades for cloud seed', e);
          }
        }
      } else if (error) {
        console.warn('Supabase getTrades error, falling back to local cache:', error.message);
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local cache:', err);
    }
  }

  // Local fallback
  const local = localStorage.getItem(getUserKey(KEYS.TRADES)) || localStorage.getItem(KEYS.TRADES);
  if (local) {
    try {
      let parsed: Trade[] = JSON.parse(local);
      if (currentUserId) {
        parsed = parsed.filter(t => !t.userId || t.userId === currentUserId);
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing trades from localStorage', e);
    }
  }

  // Seed from API if first time and no specific user
  if (!currentUserId) {
    try {
      const res = await fetch('/api/trades');
      if (res.ok) {
        const data = await res.json();
        const trades: Trade[] = data.trades || [];
        localStorage.setItem(KEYS.TRADES, JSON.stringify(trades));

        if (supabase && trades.length > 0) {
          syncTradesToSupabase(trades).catch(console.error);
        }

        return trades;
      }
    } catch (err) {
      console.error('Error seeding trades from API:', err);
    }
  }
  return [];
}

export function saveTrades(trades: Trade[]): void {
  if (!isClient()) return;
  const currentUserId = getActiveUserId();
  const stamped = trades.map(t => ({
    ...t,
    userId: t.userId || currentUserId || undefined,
  }));
  localStorage.setItem(getUserKey(KEYS.TRADES), JSON.stringify(stamped));

  const supabase = getSupabase();
  if (supabase) {
    syncTradesToSupabase(stamped).catch(console.error);
  }
}

export async function addOrUpdateTrade(trade: Trade): Promise<Trade> {
  const currentUserId = getActiveUserId();
  if (!trade.userId && currentUserId) {
    trade.userId = currentUserId;
  }
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

  // Save to local cache
  if (isClient()) {
    localStorage.setItem(getUserKey(KEYS.TRADES), JSON.stringify(trades));
  }

  // Sync to Supabase
  const supabase = getSupabase();
  if (supabase) {
    Promise.resolve(
      supabase
        .from('trades')
        .upsert({
          id: trade.id,
          account_id: trade.accountId || null,
          instrument: trade.instrument || null,
          direction: trade.direction || null,
          status: trade.status || null,
          pnl: trade.financials?.netPnL ?? null,
          entry_date: trade.entryDate || null,
          data: trade,
          updated_at: new Date().toISOString(),
        })
    )
      .then(({ error }) => {
        if (error) console.error('Supabase trade upsert error:', error);
      })
      .catch(console.error);
  }

  return trade;
}

export async function deleteTrade(id: string): Promise<boolean> {
  const trades = await getTrades();
  const index = trades.findIndex(t => t.id === id);
  if (index === -1) return false;

  const oldTrade = trades[index];
  const filtered = trades.filter(t => t.id !== id);

  if (isClient()) {
    localStorage.setItem(getUserKey(KEYS.TRADES), JSON.stringify(filtered));
  }

  // Revert balance if closed
  if (oldTrade.status !== 'OPEN' && oldTrade.financials.netPnL != null) {
    const accounts = await getAccounts();
    const accIndex = accounts.findIndex(a => a.id === oldTrade.accountId);
    if (accIndex !== -1) {
      accounts[accIndex].balance -= oldTrade.financials.netPnL;
      saveAccounts(accounts);
    }
  }

  // Delete from Supabase
  const supabase = getSupabase();
  if (supabase) {
    Promise.resolve(supabase.from('trades').delete().eq('id', id))
      .then(({ error }) => {
        if (error) console.error('Supabase trade delete error:', error);
      })
      .catch(console.error);
  }

  return true;
}

async function syncTradesToSupabase(trades: Trade[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || trades.length === 0) return;

  const currentUserId = getActiveUserId();
  const rows = trades.map(t => {
    const item = {
      ...t,
      userId: t.userId || currentUserId || undefined,
    };
    return {
      id: item.id,
      account_id: item.accountId || null,
      instrument: item.instrument || null,
      direction: item.direction || null,
      status: item.status || null,
      pnl: item.financials?.netPnL ?? null,
      entry_date: item.entryDate || null,
      data: item,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('trades').upsert(rows);
  if (error) {
    console.warn('Failed to sync trades to Supabase:', error.message);
  }
}

// ---------------- Accounts ----------------
export async function getAccounts(): Promise<Account[]> {
  if (!isClient()) return [];

  const supabase = getSupabase();
  const currentUserId = getActiveUserId();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        if (data.length > 0) {
          let accounts: Account[] = data.map((row: any) => ({
            ...(row.data as Account),
            userId: row.data?.userId || row.user_id || undefined,
          }));
          if (currentUserId) {
            accounts = accounts.filter(a => !a.userId || a.userId === currentUserId);
          }
          localStorage.setItem(getUserKey(KEYS.ACCOUNTS), JSON.stringify(accounts));
          return accounts;
        }

        const local = localStorage.getItem(getUserKey(KEYS.ACCOUNTS)) || localStorage.getItem(KEYS.ACCOUNTS);
        if (local) {
          try {
            const localAccs: Account[] = JSON.parse(local);
            if (localAccs.length > 0) {
              syncAccountsToSupabase(localAccs).catch(console.error);
              return localAccs;
            }
          } catch (e) {
            console.error('Error parsing local accounts', e);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase getAccounts error, falling back to local cache:', err);
    }
  }

  const local = localStorage.getItem(getUserKey(KEYS.ACCOUNTS)) || localStorage.getItem(KEYS.ACCOUNTS);
  if (local) {
    try {
      let parsed: Account[] = JSON.parse(local);
      if (currentUserId) {
        parsed = parsed.filter(a => !a.userId || a.userId === currentUserId);
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing accounts from localStorage', e);
    }
  }

  if (!currentUserId) {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        const accounts: Account[] = data.accounts || [];
        localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
        if (supabase && accounts.length > 0) {
          syncAccountsToSupabase(accounts).catch(console.error);
        }
        return accounts;
      }
    } catch (err) {
      console.error('Error seeding accounts from API:', err);
    }
  }
  return [];
}

export function saveAccounts(accounts: Account[]): void {
  if (!isClient()) return;
  const currentUserId = getActiveUserId();
  const stamped = accounts.map(a => ({
    ...a,
    userId: a.userId || currentUserId || '',
  }));
  localStorage.setItem(getUserKey(KEYS.ACCOUNTS), JSON.stringify(stamped));

  const supabase = getSupabase();
  if (supabase) {
    syncAccountsToSupabase(stamped).catch(console.error);
  }
}

async function syncAccountsToSupabase(accounts: Account[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || accounts.length === 0) return;

  const currentUserId = getActiveUserId();
  const rows = accounts.map(a => {
    const item = {
      ...a,
      userId: a.userId || currentUserId || '',
    };
    return {
      id: item.id,
      name: item.name || null,
      balance: item.balance ?? 0,
      currency: item.currency || null,
      data: item,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('accounts').upsert(rows);
  if (error) {
    console.warn('Failed to sync accounts to Supabase:', error.message);
  }
}

export async function addAccount(account: Account): Promise<Account> {
  const currentUserId = getActiveUserId();
  if (!account.userId && currentUserId) {
    account.userId = currentUserId;
  }
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

  const supabase = getSupabase();
  if (supabase) {
    Promise.resolve(supabase.from('accounts').delete().eq('id', id)).catch(console.error);
  }
  return true;
}

// ---------------- Journals ----------------
export async function getJournals(): Promise<JournalEntry[]> {
  if (!isClient()) return [];

  const supabase = getSupabase();
  const currentUserId = getActiveUserId();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        if (data.length > 0) {
          let journals: JournalEntry[] = data.map((row: any) => ({
            ...(row.data as JournalEntry),
            userId: row.data?.userId || row.user_id || undefined,
          }));
          if (currentUserId) {
            journals = journals.filter(j => !j.userId || j.userId === currentUserId);
          }
          localStorage.setItem(getUserKey(KEYS.JOURNALS), JSON.stringify(journals));
          return journals;
        }

        const local = localStorage.getItem(getUserKey(KEYS.JOURNALS)) || localStorage.getItem(KEYS.JOURNALS);
        if (local) {
          try {
            const localJ: JournalEntry[] = JSON.parse(local);
            if (localJ.length > 0) {
              syncJournalsToSupabase(localJ).catch(console.error);
              return localJ;
            }
          } catch (e) {
            console.error('Error parsing local journals', e);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase getJournals error:', err);
    }
  }

  const local = localStorage.getItem(getUserKey(KEYS.JOURNALS)) || localStorage.getItem(KEYS.JOURNALS);
  if (local) {
    try {
      let parsed: JournalEntry[] = JSON.parse(local);
      if (currentUserId) {
        parsed = parsed.filter(j => !j.userId || j.userId === currentUserId);
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing journals from localStorage', e);
    }
  }

  if (!currentUserId) {
    try {
      const res = await fetch('/api/journals');
      if (res.ok) {
        const data = await res.json();
        const journals: JournalEntry[] = data.journals || [];
        localStorage.setItem(KEYS.JOURNALS, JSON.stringify(journals));
        if (supabase && journals.length > 0) {
          syncJournalsToSupabase(journals).catch(console.error);
        }
        return journals;
      }
    } catch (err) {
      console.error('Error seeding journals from API:', err);
    }
  }
  return [];
}

export function saveJournals(journals: JournalEntry[]): void {
  if (!isClient()) return;
  const currentUserId = getActiveUserId();
  const stamped = journals.map(j => ({
    ...j,
    userId: j.userId || currentUserId || undefined,
  }));
  localStorage.setItem(getUserKey(KEYS.JOURNALS), JSON.stringify(stamped));

  const supabase = getSupabase();
  if (supabase) {
    syncJournalsToSupabase(stamped).catch(console.error);
  }
}

async function syncJournalsToSupabase(journals: JournalEntry[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || journals.length === 0) return;

  const currentUserId = getActiveUserId();
  const rows = journals.map(j => {
    const item = {
      ...j,
      userId: j.userId || currentUserId || undefined,
    };
    return {
      id: item.id,
      date: item.date || null,
      data: item,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('journals').upsert(rows);
  if (error) console.warn('Failed to sync journals to Supabase:', error.message);
}

export async function addOrUpdateJournal(entry: JournalEntry): Promise<JournalEntry> {
  const currentUserId = getActiveUserId();
  if (!entry.userId && currentUserId) {
    entry.userId = currentUserId;
  }
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

  const supabase = getSupabase();
  if (supabase) {
    Promise.resolve(supabase.from('journals').delete().eq('id', id)).catch(console.error);
  }
  return true;
}

// ---------------- Finances ----------------
export async function getFinances(): Promise<FinanceEntry[]> {
  if (!isClient()) return [];

  const supabase = getSupabase();
  const currentUserId = getActiveUserId();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        if (data.length > 0) {
          let finances: FinanceEntry[] = data.map((row: any) => ({
            ...(row.data as FinanceEntry),
            userId: row.data?.userId || row.user_id || undefined,
          }));
          if (currentUserId) {
            finances = finances.filter(f => !f.userId || f.userId === currentUserId);
          }
          localStorage.setItem(getUserKey(KEYS.FINANCES), JSON.stringify(finances));
          return finances;
        }

        const local = localStorage.getItem(getUserKey(KEYS.FINANCES)) || localStorage.getItem(KEYS.FINANCES);
        if (local) {
          try {
            const localF: FinanceEntry[] = JSON.parse(local);
            if (localF.length > 0) {
              syncFinancesToSupabase(localF).catch(console.error);
              return localF;
            }
          } catch (e) {
            console.error('Error parsing local finances', e);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase getFinances error:', err);
    }
  }

  const local = localStorage.getItem(getUserKey(KEYS.FINANCES)) || localStorage.getItem(KEYS.FINANCES);
  if (local) {
    try {
      let parsed: FinanceEntry[] = JSON.parse(local);
      if (currentUserId) {
        parsed = parsed.filter(f => !f.userId || f.userId === currentUserId);
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing finances from localStorage', e);
    }
  }

  if (!currentUserId) {
    try {
      const res = await fetch('/api/finances');
      if (res.ok) {
        const data = await res.json();
        const finances: FinanceEntry[] = data.finances || [];
        localStorage.setItem(KEYS.FINANCES, JSON.stringify(finances));
        if (supabase && finances.length > 0) {
          syncFinancesToSupabase(finances).catch(console.error);
        }
        return finances;
      }
    } catch (err) {
      console.error('Error seeding finances from API:', err);
    }
  }
  return [];
}

export function saveFinances(finances: FinanceEntry[]): void {
  if (!isClient()) return;
  const currentUserId = getActiveUserId();
  const stamped = finances.map(f => ({
    ...f,
    userId: f.userId || currentUserId || undefined,
  }));
  localStorage.setItem(getUserKey(KEYS.FINANCES), JSON.stringify(stamped));

  const supabase = getSupabase();
  if (supabase) {
    syncFinancesToSupabase(stamped).catch(console.error);
  }
}

async function syncFinancesToSupabase(finances: FinanceEntry[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || finances.length === 0) return;

  const currentUserId = getActiveUserId();
  const rows = finances.map(f => {
    const item = {
      ...f,
      userId: f.userId || currentUserId || undefined,
    };
    return {
      id: item.id,
      date: item.date || null,
      type: item.type || null,
      amount: item.amount ?? 0,
      account_id: item.accountId || null,
      data: item,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('finances').upsert(rows);
  if (error) console.warn('Failed to sync finances to Supabase:', error.message);
}

export async function addFinance(entry: FinanceEntry): Promise<FinanceEntry> {
  const currentUserId = getActiveUserId();
  if (!entry.userId && currentUserId) {
    entry.userId = currentUserId;
  }
  const finances = await getFinances();
  finances.unshift(entry);
  saveFinances(finances);
  return entry;
}

// ---------------- Reviews ----------------
export async function getReviews(): Promise<Review[]> {
  if (!isClient()) return [];

  const supabase = getSupabase();
  const currentUserId = getActiveUserId();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        if (data.length > 0) {
          let reviews: Review[] = data.map((row: any) => ({
            ...(row.data as Review),
            userId: row.data?.userId || row.user_id || undefined,
          }));
          if (currentUserId) {
            reviews = reviews.filter(r => !r.userId || r.userId === currentUserId);
          }
          localStorage.setItem(getUserKey(KEYS.REVIEWS), JSON.stringify(reviews));
          return reviews;
        }

        const local = localStorage.getItem(getUserKey(KEYS.REVIEWS)) || localStorage.getItem(KEYS.REVIEWS);
        if (local) {
          try {
            const localR: Review[] = JSON.parse(local);
            if (localR.length > 0) {
              syncReviewsToSupabase(localR).catch(console.error);
              return localR;
            }
          } catch (e) {
            console.error('Error parsing local reviews', e);
          }
        }
      }
    } catch (err) {
      console.warn('Supabase getReviews error:', err);
    }
  }

  const local = localStorage.getItem(getUserKey(KEYS.REVIEWS)) || localStorage.getItem(KEYS.REVIEWS);
  if (local) {
    try {
      let parsed: Review[] = JSON.parse(local);
      if (currentUserId) {
        parsed = parsed.filter(r => !r.userId || r.userId === currentUserId);
      }
      return parsed;
    } catch (e) {
      console.error('Error parsing reviews from localStorage', e);
    }
  }

  if (!currentUserId) {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        const reviews: Review[] = data.reviews || [];
        localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
        if (supabase && reviews.length > 0) {
          syncReviewsToSupabase(reviews).catch(console.error);
        }
        return reviews;
      }
    } catch (err) {
      console.error('Error seeding reviews from API:', err);
    }
  }
  return [];
}

export function saveReviews(reviews: Review[]): void {
  if (!isClient()) return;
  const currentUserId = getActiveUserId();
  const stamped = reviews.map(r => ({
    ...r,
    userId: r.userId || currentUserId || undefined,
  }));
  localStorage.setItem(getUserKey(KEYS.REVIEWS), JSON.stringify(stamped));

  const supabase = getSupabase();
  if (supabase) {
    syncReviewsToSupabase(stamped).catch(console.error);
  }
}

async function syncReviewsToSupabase(reviews: Review[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || reviews.length === 0) return;

  const currentUserId = getActiveUserId();
  const rows = reviews.map(r => {
    const item = {
      ...r,
      userId: r.userId || currentUserId || undefined,
    };
    return {
      id: item.id,
      date: item.date || null,
      rating: item.rating || null,
      data: item,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('reviews').upsert(rows);
  if (error) console.warn('Failed to sync reviews to Supabase:', error.message);
}

export async function addOrUpdateReview(review: Review): Promise<Review> {
  const currentUserId = getActiveUserId();
  if (!review.userId && currentUserId) {
    review.userId = currentUserId;
  }
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

  const supabase = getSupabase();
  if (supabase) {
    Promise.resolve(supabase.from('reviews').delete().eq('id', id)).catch(console.error);
  }
  return true;
}

// ---------------- User Profile ----------------
export async function getUser(): Promise<User | null> {
  if (!isClient()) return null;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('value')
        .eq('key', 'user_profile')
        .single();

      if (!error && data?.value) {
        const u = data.value as User;
        localStorage.setItem(KEYS.USER, JSON.stringify(u));
        return u;
      }
    } catch {
      // ignore
    }
  }

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

      if (supabase && user) {
        Promise.resolve(
          supabase.from('app_state').upsert({
            key: 'user_profile',
            value: user,
            updated_at: new Date().toISOString()
          })
        ).catch(console.error);
      }

      return user;
    }
  } catch (err) {
    console.error('Error seeding user from API:', err);
  }
  return null;
}

// ---------------- Cloud Security PIN ----------------
export async function getCloudPin(): Promise<string | null> {
  if (!isClient()) return null;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('value')
        .eq('key', 'security_pin')
        .single();

      if (!error && data?.value) {
        const pin = String(data.value.pin || data.value);
        localStorage.setItem(KEYS.PIN, pin);
        return pin;
      }
    } catch {
      // ignore
    }
  }

  return localStorage.getItem(KEYS.PIN);
}

export async function setCloudPin(pin: string): Promise<void> {
  if (!isClient()) return;
  localStorage.setItem(KEYS.PIN, pin);

  const supabase = getSupabase();
  if (supabase) {
    Promise.resolve(
      supabase.from('app_state').upsert({
        key: 'security_pin',
        value: { pin },
        updated_at: new Date().toISOString(),
      })
    ).catch(console.error);
  }
}

export async function removeCloudPin(): Promise<void> {
  if (!isClient()) return;
  localStorage.removeItem(KEYS.PIN);

  const supabase = getSupabase();
  if (supabase) {
    Promise.resolve(
      supabase.from('app_state').delete().eq('key', 'security_pin')
    ).catch(console.error);
  }
}

// ---------------- App State Helpers (Sync All Settings & UI Preferences) ----------------
const APP_STATE_SYNC_KEYS = [
  'tradeChecklist',
  'financeCategories',
  'theme',
  'journal-color-scheme',
  'journal-win-color',
  'journal-loss-color',
  'petEnabled',
  'selectedAccountId',
];

export async function getAppState<T = any>(key: string, defaultValue?: T): Promise<T | null> {
  if (!isClient()) return defaultValue ?? null;

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!error && data?.value !== undefined) {
        const val = data.value;
        const serialized = typeof val === 'string' ? val : JSON.stringify(val);
        localStorage.setItem(key, serialized);
        return val as T;
      }
    } catch {
      // ignore
    }
  }

  const local = localStorage.getItem(key);
  if (local !== null) {
    try {
      return JSON.parse(local) as T;
    } catch {
      return local as unknown as T;
    }
  }

  return defaultValue ?? null;
}

export async function setAppState(key: string, value: any): Promise<void> {
  if (!isClient()) return;

  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  localStorage.setItem(key, serialized);

  const supabase = getSupabase();
  if (supabase) {
    Promise.resolve(
      supabase.from('app_state').upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      })
    ).catch(console.error);
  }
}

// ---------------- Two-Way Complete Sync Helpers ----------------
export async function syncAllLocalToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, count: 0, error: 'Supabase is not configured yet.' };
  }

  try {
    const [trades, accounts, journals, finances, reviews] = await Promise.all([
      getTrades(),
      getAccounts(),
      getJournals(),
      getFinances(),
      getReviews()
    ]);

    await Promise.all([
      trades.length > 0 ? syncTradesToSupabase(trades) : Promise.resolve(),
      accounts.length > 0 ? syncAccountsToSupabase(accounts) : Promise.resolve(),
      journals.length > 0 ? syncJournalsToSupabase(journals) : Promise.resolve(),
      finances.length > 0 ? syncFinancesToSupabase(finances) : Promise.resolve(),
      reviews.length > 0 ? syncReviewsToSupabase(reviews) : Promise.resolve(),
    ]);

    // Sync PIN
    const pin = localStorage.getItem(KEYS.PIN);
    if (pin) {
      await setCloudPin(pin);
    }

    // Sync all App States & settings (Checklist, Categories, Theme, Pet, Colors)
    for (const key of APP_STATE_SYNC_KEYS) {
      const v = localStorage.getItem(key);
      if (v !== null) {
        let valParsed: any = v;
        try {
          valParsed = JSON.parse(v);
        } catch {
          // string is fine
        }
        await supabase.from('app_state').upsert({
          key,
          value: valParsed,
          updated_at: new Date().toISOString(),
        });
      }
    }

    const totalCount = trades.length + accounts.length + journals.length + finances.length + reviews.length;
    return { success: true, count: totalCount };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Sync failed.' };
  }
}

export async function syncAllSupabaseToLocal(): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured yet.' };
  }

  try {
    // Force re-fetch from Supabase and cache
    const [tradesRes, accountsRes, journalsRes, financesRes, reviewsRes, appStateRes] = await Promise.all([
      supabase.from('trades').select('*'),
      supabase.from('accounts').select('*'),
      supabase.from('journals').select('*'),
      supabase.from('finances').select('*'),
      supabase.from('reviews').select('*'),
      supabase.from('app_state').select('*'),
    ]);

    if (tradesRes.data) {
      const trades = tradesRes.data.map((r: any) => r.data as Trade);
      localStorage.setItem(KEYS.TRADES, JSON.stringify(trades));
    }
    if (accountsRes.data) {
      const accounts = accountsRes.data.map((r: any) => r.data as Account);
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
    }
    if (journalsRes.data) {
      const journals = journalsRes.data.map((r: any) => r.data as JournalEntry);
      localStorage.setItem(KEYS.JOURNALS, JSON.stringify(journals));
    }
    if (financesRes.data) {
      const finances = financesRes.data.map((r: any) => r.data as FinanceEntry);
      localStorage.setItem(KEYS.FINANCES, JSON.stringify(finances));
    }
    if (reviewsRes.data) {
      const reviews = reviewsRes.data.map((r: any) => r.data as Review);
      localStorage.setItem(KEYS.REVIEWS, JSON.stringify(reviews));
    }

    if (appStateRes.data) {
      for (const row of appStateRes.data) {
        if (row.key === 'security_pin') {
          const pin = String(row.value.pin || row.value);
          localStorage.setItem(KEYS.PIN, pin);
        } else if (row.key === 'user_profile') {
          localStorage.setItem(KEYS.USER, JSON.stringify(row.value));
        } else {
          const val = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
          localStorage.setItem(row.key, val);
        }
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Download sync failed.' };
  }
}

// ---------------- Storage Statistics & Free Tier Manager ----------------
export interface StorageStats {
  tradesCount: number;
  openTradesCount: number;
  closedTradesCount: number;
  tradesWithImagesCount: number;
  accountsCount: number;
  journalsCount: number;
  financesCount: number;
  reviewsCount: number;
  estimatedBytes: number;
  isCloudConnected: boolean;
}

export async function getStorageStats(): Promise<StorageStats> {
  const [trades, accounts, journals, finances, reviews] = await Promise.all([
    getTrades(),
    getAccounts(),
    getJournals(),
    getFinances(),
    getReviews()
  ]);

  const openTradesCount = trades.filter(t => t.status === 'OPEN').length;
  const closedTradesCount = trades.filter(t => t.status !== 'OPEN').length;
  const tradesWithImagesCount = trades.filter(t => Boolean(t.notes?.entryImage || t.notes?.exitImage)).length;

  const rawJson = JSON.stringify({ trades, accounts, journals, finances, reviews });
  const estimatedBytes = typeof Blob !== 'undefined' ? new Blob([rawJson]).size : rawJson.length;

  return {
    tradesCount: trades.length,
    openTradesCount,
    closedTradesCount,
    tradesWithImagesCount,
    accountsCount: accounts.length,
    journalsCount: journals.length,
    financesCount: finances.length,
    reviewsCount: reviews.length,
    estimatedBytes,
    isCloudConnected: Boolean(getSupabase()),
  };
}

// Strip screenshots (base64) from all trades to reclaim up to 90% DB space
export async function stripTradeScreenshots(): Promise<{ cleanedCount: number; savedBytesEstimate: number }> {
  const trades = await getTrades();
  let cleanedCount = 0;
  const initialJson = JSON.stringify(trades);
  const initialBytes = typeof Blob !== 'undefined' ? new Blob([initialJson]).size : initialJson.length;

  const updatedTrades = trades.map(t => {
    if (t.notes && (t.notes.entryImage || t.notes.exitImage)) {
      cleanedCount++;
      return {
        ...t,
        notes: {
          ...t.notes,
          entryImage: null,
          exitImage: null,
        }
      };
    }
    return t;
  });

  if (cleanedCount > 0) {
    saveTrades(updatedTrades);
    const newJson = JSON.stringify(updatedTrades);
    const newBytes = typeof Blob !== 'undefined' ? new Blob([newJson]).size : newJson.length;
    return { cleanedCount, savedBytesEstimate: Math.max(0, initialBytes - newBytes) };
  }

  return { cleanedCount: 0, savedBytesEstimate: 0 };
}

// Purge closed trades older than X days (preserving all open positions and account balances)
export async function purgeOldClosedTrades(olderThanDays?: number): Promise<{ purgedCount: number; remainingCount: number }> {
  const trades = await getTrades();
  const now = Date.now();
  const thresholdMs = olderThanDays ? olderThanDays * 24 * 60 * 60 * 1000 : null;

  const toKeep: Trade[] = [];
  const toPurge: Trade[] = [];

  for (const t of trades) {
    if (t.status === 'OPEN') {
      toKeep.push(t);
      continue;
    }

    if (thresholdMs) {
      const tradeTime = new Date(t.exitDate || t.entryDate).getTime();
      if (!isNaN(tradeTime) && now - tradeTime > thresholdMs) {
        toPurge.push(t);
      } else {
        toKeep.push(t);
      }
    } else {
      toPurge.push(t);
    }
  }

  saveTrades(toKeep);

  const supabase = getSupabase();
  if (supabase && toPurge.length > 0) {
    const ids = toPurge.map(t => t.id);
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      await supabase.from('trades').delete().in('id', chunk);
    }
  }

  return { purgedCount: toPurge.length, remainingCount: toKeep.length };
}

// Clear specific collection from local and cloud
export async function clearCollection(
  collection: 'trades' | 'journals' | 'finances' | 'reviews' | 'all'
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();

  if (collection === 'trades' || collection === 'all') {
    if (isClient()) localStorage.removeItem(KEYS.TRADES);
    if (supabase) {
      await supabase.from('trades').delete().neq('id', '___force_delete_all___');
    }
  }

  if (collection === 'journals' || collection === 'all') {
    if (isClient()) localStorage.removeItem(KEYS.JOURNALS);
    if (supabase) {
      await supabase.from('journals').delete().neq('id', '___force_delete_all___');
    }
  }

  if (collection === 'finances' || collection === 'all') {
    if (isClient()) localStorage.removeItem(KEYS.FINANCES);
    if (supabase) {
      await supabase.from('finances').delete().neq('id', '___force_delete_all___');
    }
  }

  if (collection === 'reviews' || collection === 'all') {
    if (isClient()) localStorage.removeItem(KEYS.REVIEWS);
    if (supabase) {
      await supabase.from('reviews').delete().neq('id', '___force_delete_all___');
    }
  }

  return { success: true, message: `ล้างข้อมูล ${collection} สำเร็จ` };
}

// ---------------- Comprehensive Backup & Restore (JSON File) ----------------
export async function exportAllData(): Promise<string> {
  const [trades, accounts, journals, finances, reviews, user] = await Promise.all([
    getTrades(),
    getAccounts(),
    getJournals(),
    getFinances(),
    getReviews(),
    getUser()
  ]);

  const appState: Record<string, any> = {};
  if (isClient()) {
    APP_STATE_SYNC_KEYS.concat([KEYS.PIN]).forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) {
        try {
          appState[k] = JSON.parse(v);
        } catch {
          appState[k] = v;
        }
      }
    });
  }

  const backup = {
    version: '3.0',
    exportDate: new Date().toISOString(),
    generator: 'CFD Trading Journal Cloud Backup',
    summary: {
      tradesCount: trades.length,
      openTradesCount: trades.filter(t => t.status === 'OPEN').length,
      closedTradesCount: trades.filter(t => t.status !== 'OPEN').length,
      accountsCount: accounts.length,
      journalsCount: journals.length,
      financesCount: finances.length,
      reviewsCount: reviews.length,
    },
    data: {
      trades,
      accounts,
      journals,
      finances,
      reviews,
      user,
      appState
    }
  };

  return JSON.stringify(backup, null, 2);
}

export async function importAllData(
  jsonString: string,
  options: { mode?: 'replace' | 'merge' } = { mode: 'replace' }
): Promise<{
  success: boolean;
  message: string;
  counts?: { trades: number; accounts: number; journals: number; finances: number; reviews: number };
}> {
  if (!isClient()) return { success: false, message: 'Not on client side' };

  try {
    const parsed = JSON.parse(jsonString);
    const data = parsed.data || parsed;
    const mode = options.mode || 'replace';

    let finalTrades: Trade[] = [];
    let finalAccounts: Account[] = [];
    let finalJournals: JournalEntry[] = [];
    let finalFinances: FinanceEntry[] = [];
    let finalReviews: Review[] = [];

    if (mode === 'replace') {
      finalTrades = Array.isArray(data.trades) ? data.trades : [];
      finalAccounts = Array.isArray(data.accounts) ? data.accounts : [];
      finalJournals = Array.isArray(data.journals) ? data.journals : [];
      finalFinances = Array.isArray(data.finances) ? data.finances : [];
      finalReviews = Array.isArray(data.reviews) ? data.reviews : [];
    } else {
      // Merge mode
      const [existingTrades, existingAccs, existingJournals, existingFinances, existingReviews] = await Promise.all([
        getTrades(),
        getAccounts(),
        getJournals(),
        getFinances(),
        getReviews()
      ]);

      const tradeMap = new Map<string, Trade>();
      existingTrades.forEach(t => tradeMap.set(t.id, t));
      (data.trades || []).forEach((t: Trade) => tradeMap.set(t.id, t));
      finalTrades = Array.from(tradeMap.values());

      const accMap = new Map<string, Account>();
      existingAccs.forEach(a => accMap.set(a.id, a));
      (data.accounts || []).forEach((a: Account) => accMap.set(a.id, a));
      finalAccounts = Array.from(accMap.values());

      const journalMap = new Map<string, JournalEntry>();
      existingJournals.forEach(j => journalMap.set(j.id, j));
      (data.journals || []).forEach((j: JournalEntry) => journalMap.set(j.id, j));
      finalJournals = Array.from(journalMap.values());

      const financeMap = new Map<string, FinanceEntry>();
      existingFinances.forEach(f => financeMap.set(f.id, f));
      (data.finances || []).forEach((f: FinanceEntry) => financeMap.set(f.id, f));
      finalFinances = Array.from(financeMap.values());

      const reviewMap = new Map<string, Review>();
      existingReviews.forEach(r => reviewMap.set(r.id, r));
      (data.reviews || []).forEach((r: Review) => reviewMap.set(r.id, r));
      finalReviews = Array.from(reviewMap.values());
    }

    // Save locally
    saveTrades(finalTrades);
    saveAccounts(finalAccounts);
    saveJournals(finalJournals);
    saveFinances(finalFinances);
    saveReviews(finalReviews);

    if (data.user) {
      localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
    }

    // Restore appState
    if (data.appState && typeof data.appState === 'object') {
      for (const [k, v] of Object.entries(data.appState)) {
        if (v !== undefined) {
          const serialized = typeof v === 'string' ? v : JSON.stringify(v);
          localStorage.setItem(k, serialized);
        }
      }
    }

    // Sync to Supabase directly if connected
    const supabase = getSupabase();
    if (supabase) {
      await Promise.all([
        finalTrades.length > 0 ? syncTradesToSupabase(finalTrades) : Promise.resolve(),
        finalAccounts.length > 0 ? syncAccountsToSupabase(finalAccounts) : Promise.resolve(),
        finalJournals.length > 0 ? syncJournalsToSupabase(finalJournals) : Promise.resolve(),
        finalFinances.length > 0 ? syncFinancesToSupabase(finalFinances) : Promise.resolve(),
        finalReviews.length > 0 ? syncReviewsToSupabase(finalReviews) : Promise.resolve(),
      ]);

      if (data.appState) {
        for (const [k, v] of Object.entries(data.appState)) {
          await supabase.from('app_state').upsert({
            key: k,
            value: v,
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    return {
      success: true,
      message: `นำเข้าข้อมูลสำเร็จ (${mode === 'merge' ? 'รวมข้อมูลเดิม' : 'เขียนทับ'})!`,
      counts: {
        trades: finalTrades.length,
        accounts: finalAccounts.length,
        journals: finalJournals.length,
        finances: finalFinances.length,
        reviews: finalReviews.length,
      }
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Invalid JSON format' };
  }
}
