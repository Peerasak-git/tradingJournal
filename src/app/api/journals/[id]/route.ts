import { NextResponse } from 'next/server';
import { getJournals, saveJournals } from '@/lib/db';
import { JournalEntry } from '@/types/journal';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const updatedEntry: JournalEntry = await request.json();
  const journals = await getJournals();
  
  const index = journals.findIndex(j => j.id === id);
  if (index !== -1) {
    journals[index] = updatedEntry;
    await saveJournals(journals);
    return NextResponse.json(updatedEntry);
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const journals = await getJournals();
  
  const filtered = journals.filter(j => j.id !== id);
  await saveJournals(filtered);
  return NextResponse.json({ success: true });
}
