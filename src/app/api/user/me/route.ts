import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

export async function GET() {
  const users = await getUsers();
  // Return the first user as the "current" user for this demo
  return NextResponse.json({ user: users[0] || null });
}
