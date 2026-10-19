import { NextResponse } from 'next/server';
import { getFinances, saveFinances } from '@/lib/db';
import { FinanceEntry } from '@/types/finance';

export async function GET() {
  const finances = await getFinances();
  return NextResponse.json({ finances });
}

export async function POST(request: Request) {
  const newFinance: FinanceEntry = await request.json();
  const finances = await getFinances();
  
  const updatedFinances = [newFinance, ...finances];
  await saveFinances(updatedFinances);
  
  return NextResponse.json(newFinance, { status: 201 });
}
