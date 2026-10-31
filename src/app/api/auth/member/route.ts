import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface MemberRecord {
  email: string;
  displayName: string;
  password?: string;
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

const MEMBERS_FILE = path.join(process.cwd(), 'src/data/members.json');

// In-memory cache for serverless warm execution
const memoryMembers: Map<string, MemberRecord> = new Map([
  [
    'cs.peerasak@gmail.com',
    {
      email: 'cs.peerasak@gmail.com',
      displayName: 'Peerasak',
      userId: 'u-001',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
]);

async function loadMembersFromFile(): Promise<void> {
  try {
    const raw = await fs.readFile(MEMBERS_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data.members)) {
      data.members.forEach((m: MemberRecord) => {
        if (m.email) {
          const clean = m.email.trim().toLowerCase();
          const existing = memoryMembers.get(clean);
          memoryMembers.set(clean, { ...existing, ...m });
        }
      });
    }
  } catch {
    // If file cannot be read or doesn't exist, memory cache remains
  }
}

async function persistMembersToFile(): Promise<void> {
  try {
    const list = Array.from(memoryMembers.values());
    await fs.writeFile(MEMBERS_FILE, JSON.stringify({ members: list }, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem on Vercel is expected; memory cache still works
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim().toLowerCase();

  await loadMembersFromFile();

  if (!email) {
    return NextResponse.json({ error: 'Email query parameter required' }, { status: 400 });
  }

  const member = memoryMembers.get(email) || null;
  return NextResponse.json({ member });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cleanEmail = body?.email?.trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    await loadMembersFromFile();

    const existing = memoryMembers.get(cleanEmail);
    const updated: MemberRecord = {
      email: cleanEmail,
      displayName: body.displayName || existing?.displayName || cleanEmail.split('@')[0],
      password: body.password || existing?.password,
      userId:
        body.userId ||
        existing?.userId ||
        (cleanEmail === 'cs.peerasak@gmail.com'
          ? 'u-001'
          : 'u_' + btoa(cleanEmail).replace(/=/g, '').slice(0, 16)),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryMembers.set(cleanEmail, updated);
    await persistMembersToFile();

    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
