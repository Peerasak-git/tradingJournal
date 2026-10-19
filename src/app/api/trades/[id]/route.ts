import { NextResponse } from 'next/server';
import { getTrades, saveTrades, getAccounts, saveAccounts } from '@/lib/db';
import { Trade } from '@/types/trade';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updatedTrade: Trade = await request.json();
  const trades = await getTrades();
  
  const index = trades.findIndex(t => t.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
  }
  
  const oldTrade = trades[index];
  trades[index] = updatedTrade;
  await saveTrades(trades);
  
  // Auto-adjust account balance
  const accounts = await getAccounts();
  const accountIndex = accounts.findIndex((a: any) => a.id === updatedTrade.accountId);
  if (accountIndex !== -1) {
    // Revert old PnL if it was closed
    if (oldTrade.status !== 'OPEN' && oldTrade.financials.netPnL != null) {
      accounts[accountIndex].balance -= oldTrade.financials.netPnL;
    }
    // Add new PnL if it is closed
    if (updatedTrade.status !== 'OPEN' && updatedTrade.financials.netPnL != null) {
      accounts[accountIndex].balance += updatedTrade.financials.netPnL;
    }
    await saveAccounts(accounts);
  }
  
  return NextResponse.json(updatedTrade);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const trades = await getTrades();
  
  const index = trades.findIndex(t => t.id === id);
  if (index === -1) {
    return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
  }
  
  const oldTrade = trades[index];
  const filteredTrades = trades.filter(t => t.id !== id);
  await saveTrades(filteredTrades);
  
  // Auto-adjust account balance
  if (oldTrade.status !== 'OPEN' && oldTrade.financials.netPnL != null) {
    const accounts = await getAccounts();
    const accountIndex = accounts.findIndex((a: any) => a.id === oldTrade.accountId);
    if (accountIndex !== -1) {
      accounts[accountIndex].balance -= oldTrade.financials.netPnL;
      await saveAccounts(accounts);
    }
  }
  
  return NextResponse.json({ message: 'Trade deleted' });
}
