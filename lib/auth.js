import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { sql } from './db';

const key = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me-please-32chars');

export async function createSession(payload) {
  const token = await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d').sign(key());
  cookies().set('s', token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 604800, secure: process.env.NODE_ENV === 'production' });
}
export function clearSession() { cookies().set('s', '', { path: '/', maxAge: 0 }); }

export async function getSession() {
  const t = cookies().get('s')?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key());
    if (payload.role !== 'admin') {
      const r = await sql`select status from users where id=${payload.id}`;
      if (!r[0] || r[0].status !== 'active') return null;
    }
    return payload;
  } catch { return null; }
}
// Solo profesores (el admin no maneja alumnos ni asistencia)
export async function getTeacher() { const s = await getSession(); return s && s.role === 'user' ? s : null; }
