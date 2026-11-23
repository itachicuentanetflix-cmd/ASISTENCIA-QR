import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getConfig } from '@/lib/config';
export const dynamic = 'force-dynamic';

const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const T = /^\d{2}:\d{2}$/;

export async function GET() {
  if (!(await getSession())) return err('No autorizado', 401);
  return NextResponse.json({ cfg: await getConfig() });
}

export async function PUT(req) {
  const s = await getSession();
  if (!s) return err('No autorizado', 401);
  const b = await req.json().catch(() => ({}));
  const allowed = ['hora_inicio', 'limite_puntual', 'hora_falta', 'aula', 'escuela', 'profesora'];
  if (s.role === 'admin') allowed.push('anio');
  for (const k of allowed) {
    if (b[k] === undefined) continue;
    const v = String(b[k]).trim();
    if (['hora_inicio', 'limite_puntual', 'hora_falta'].includes(k) && !T.test(v)) return err('Hora inválida');
    if (k === 'anio' && !/^20\d{2}$/.test(v)) return err('Año inválido');
    if (!v) return err('Hay campos vacíos');
    await sql`insert into settings(key, value) values(${k}, ${v}) on conflict (key) do update set value=excluded.value`;
  }
  return NextResponse.json({ ok: true, cfg: await getConfig() });
}
