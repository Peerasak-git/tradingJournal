import { NextResponse } from 'next/server';
import { getTrades, saveTrades, getAccounts, saveAccounts } from '@/lib/db';
import { Trade } from '@/types/trade';

export async function GET() {
  const trades = await getTrades();
  return NextResponse.json({ trades });
}

export async function POST(request: Request) {
  const newTrade: Trade = await request.json();
  const trades = await getTrades();
  
  // Ensure we don't have duplicates if ID is generated client-side
  const updatedTrades = [newTrade, ...trades];
  await saveTrades(updatedTrades);
  
  // Auto-adjust account balance
  if (newTrade.status !== 'OPEN' && newTrade.financials.netPnL != null) {
    const accounts = await getAccounts();
    const accountIndex = accounts.findIndex((a: any) => a.id === newTrade.accountId);
    if (accountIndex !== -1) {
      accounts[accountIndex].balance += newTrade.financials.netPnL;
      await saveAccounts(accounts);
    }
  }

  return NextResponse.json(newTrade, { status: 201 });
}
