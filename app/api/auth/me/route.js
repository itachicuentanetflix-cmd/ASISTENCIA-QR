import { NextResponse } from 'next/server';
import { getSession, clearSession } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  return NextResponse.json({ username: s.username, role: s.role });
}
export async function DELETE() { clearSession(); return NextResponse.json({ ok: true }); }
