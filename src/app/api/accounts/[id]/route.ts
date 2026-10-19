import { NextResponse } from 'next/server';
import { getAccounts, saveAccounts } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates = await request.json();
  const accounts = await getAccounts();
  
  const accountIndex = accounts.findIndex((a: any) => a.id === id);
  if (accountIndex === -1) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  accounts[accountIndex] = { ...accounts[accountIndex], ...updates };
  await saveAccounts(accounts);
  
  return NextResponse.json(accounts[accountIndex]);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const accounts = await getAccounts();
  
  const filteredAccounts = accounts.filter((a: any) => a.id !== id);
  await saveAccounts(filteredAccounts);
  
  return NextResponse.json({ success: true });
}
