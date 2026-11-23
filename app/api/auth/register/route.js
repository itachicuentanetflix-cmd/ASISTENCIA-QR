import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/auth';

const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const username = String(b.username || '').trim();
  const { password = '', password2 = '' } = b;
  const code = String(b.code || '').trim().toUpperCase();
  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) return err('Usuario: 3 a 30 caracteres (letras, números, . _ -)');
  if (password.length < 6) return err('La contraseña debe tener mínimo 6 caracteres');
  if (password !== password2) return err('Las contraseñas no coinciden');
  if (!code) return err('Ingresa el código de registro');
  if (process.env.ADMIN_USER && username.toLowerCase() === process.env.ADMIN_USER.toLowerCase()) return err('Ese usuario no está disponible');
  const ex = await sql`select 1 from users where lower(username)=lower(${username})`;
  if (ex[0]) return err('Ese usuario ya existe');
  const claim = await sql`update codes set used_at=now() where code=${code} and used_at is null returning code`;
  if (!claim[0]) return err('Código inválido o ya utilizado');
  const hash = await bcrypt.hash(password, 10);
  let u;
  try { u = await sql`insert into users(username, pass_hash) values(${username}, ${hash}) returning id, username`; }
  catch { await sql`update codes set used_at=null where code=${code}`; return err('No se pudo crear el usuario'); }
  await sql`update codes set used_by=${u[0].id} where code=${code}`;
  await createSession({ id: u[0].id, username: u[0].username, role: 'user' });
  return NextResponse.json({ ok: true });
}
