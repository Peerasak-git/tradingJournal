import { NextResponse } from 'next/server';
import { getAccounts, saveAccounts } from '@/lib/db';
import { Account } from '@/types/account';

export async function GET() {
  const accounts = await getAccounts();
  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  const newAccount: Account = await request.json();
  const accounts = await getAccounts();
  
  const updatedAccounts = [...accounts, {
    ...newAccount,
    id: `acc-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString()
  }];
  
  await saveAccounts(updatedAccounts);
  return NextResponse.json(newAccount, { status: 201 });
}
