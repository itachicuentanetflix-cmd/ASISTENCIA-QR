import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getTeacher } from '@/lib/auth';
import { getConfig } from '@/lib/config';
export const dynamic = 'force-dynamic';

const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const T = /^\d{2}:\d{2}$/;

export async function GET() {
  const s = await getTeacher(); if (!s) return err('No autorizado', 401);
  return NextResponse.json({ cfg: await getConfig(s.id) });
}
export async function PUT(req) {
  const s = await getTeacher(); if (!s) return err('No autorizado', 401);
  const b = await req.json().catch(() => ({}));
  for (const k of ['hora_inicio', 'limite_puntual', 'hora_falta', 'aula', 'escuela', 'profesora', 'anio']) {
    if (b[k] === undefined) continue;
    const v = String(b[k]).trim();
    if (!v) return err('Hay campos vacíos');
    if (['hora_inicio', 'limite_puntual', 'hora_falta'].includes(k) && !T.test(v)) return err('Hora inválida');
    if (k === 'anio' && !/^20\d{2}$/.test(v)) return err('Año inválido');
    await sql`insert into user_settings(user_id, key, value) values(${s.id}, ${k}, ${v}) on conflict (user_id, key) do update set value=excluded.value`;
  }
  return NextResponse.json({ ok: true, cfg: await getConfig(s.id) });
}
