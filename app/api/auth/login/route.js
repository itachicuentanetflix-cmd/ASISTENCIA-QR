import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/auth';

export async function POST(req) {
  const { username = '', password = '' } = await req.json().catch(() => ({}));
  const u = String(username).trim();
  if (!u || !password) return NextResponse.json({ error: 'Ingresa usuario y contraseña' }, { status: 400 });
  const AU = process.env.ADMIN_USER, AP = process.env.ADMIN_PASS;
  if (AU && AP && u.toLowerCase() === AU.toLowerCase() && password === AP) {
    await createSession({ id: 0, username: AU, role: 'admin' });
    return NextResponse.json({ ok: true, role: 'admin' });
  }
  const r = await sql`select id, username, pass_hash, status from users where lower(username)=lower(${u})`;
  if (!r[0] || !(await bcrypt.compare(password, r[0].pass_hash)))
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  if (r[0].status !== 'active') return NextResponse.json({ error: 'Tu cuenta está bloqueada. Contacta al administrador.' }, { status: 403 });
  await createSession({ id: r[0].id, username: r[0].username, role: 'user' });
  return NextResponse.json({ ok: true, role: 'user' });
}
