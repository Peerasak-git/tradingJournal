import { NextResponse } from 'next/server';
import { getJournals, saveJournals } from '@/lib/db';
import { JournalEntry } from '@/types/journal';

export async function GET() {
  const journals = await getJournals();
  return NextResponse.json({ journals });
}

export async function POST(request: Request) {
  const newJournal: JournalEntry = await request.json();
  const journals = await getJournals();
  
  const updatedJournals = [newJournal, ...journals];
  await saveJournals(updatedJournals);
  
  return NextResponse.json(newJournal, { status: 201 });
}
