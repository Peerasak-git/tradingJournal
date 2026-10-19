import fs from 'fs/promises';
import path from 'path';
import { Trade } from '@/types/trade';
import { Account } from '@/types/account';
import { User } from '@/types/user';
import { JournalEntry } from '@/types/journal';
import { FinanceEntry } from '@/types/finance';
import { Review } from '@/types/review';

const TRADES_PATH = path.join(process.cwd(), 'src/data/trades.json');
const ACCOUNTS_PATH = path.join(process.cwd(), 'src/data/accounts.json');
const USERS_PATH = path.join(process.cwd(), 'src/data/users.json');
const JOURNALS_PATH = path.join(process.cwd(), 'src/data/journals.json');
const FINANCES_PATH = path.join(process.cwd(), 'src/data/finances.json');
const REVIEWS_PATH = path.join(process.cwd(), 'src/data/reviews.json');

export async function getTrades(): Promise<Trade[]> {
  try {
    const data = await fs.readFile(TRADES_PATH, 'utf-8');
    const json = JSON.parse(data);
    return json.trades || [];
  } catch (error) {
    console.error('Error reading trades:', error);
    return [];
  }
}

export async function saveTrades(trades: Trade[]): Promise<void> {
  try {
    await fs.writeFile(TRADES_PATH, JSON.stringify({ trades }, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving trades:', error);
  }
}

export async function getJournals(): Promise<JournalEntry[]> {
  try {
    const data = await fs.readFile(JOURNALS_PATH, 'utf-8');
    const json = JSON.parse(data);
    return json.journals || [];
  } catch {
    return [];
  }
}

export async function saveJournals(journals: JournalEntry[]): Promise<void> {
  try {
    await fs.writeFile(JOURNALS_PATH, JSON.stringify({ journals }, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving journals:', error);
  }
}

export async function getAccounts(): Promise<Account[]> {
  try {
    const data = await fs.readFile(ACCOUNTS_PATH, 'utf-8');
    const json = JSON.parse(data);
    return json.accounts || [];
  } catch (error) {
    console.error('Error reading accounts:', error);
    return [];
  }
}

export async function saveAccounts(accounts: Account[]): Promise<void> {
  try {
    await fs.writeFile(ACCOUNTS_PATH, JSON.stringify({ accounts }, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving accounts:', error);
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_PATH, 'utf-8');
    const json = JSON.parse(data);
    return json.users || [];
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

export async function getFinances(): Promise<FinanceEntry[]> {
  try {
    const data = await fs.readFile(FINANCES_PATH, 'utf-8');
    const json = JSON.parse(data);
    return json.finances || [];
  } catch {
    return [];
  }
}

export async function saveFinances(finances: FinanceEntry[]): Promise<void> {
  try {
    await fs.writeFile(FINANCES_PATH, JSON.stringify({ finances }, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving finances:', error);
  }
}

export async function getReviews(): Promise<Review[]> {
  try {
    const data = await fs.readFile(REVIEWS_PATH, 'utf-8');
    const json = JSON.parse(data);
    return json.reviews || [];
  } catch {
    return [];
  }
}

export async function saveReviews(reviews: Review[]): Promise<void> {
  try {
    await fs.writeFile(REVIEWS_PATH, JSON.stringify({ reviews }, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving reviews:', error);
  }
}
