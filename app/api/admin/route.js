import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
export const dynamic = 'force-dynamic';

const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const isAdmin = async () => { const s = await getSession(); return s && s.role === 'admin'; };

export async function GET() {
  if (!(await isAdmin())) return err('Solo administrador', 403);
  const users = await sql`select id, username, status, to_char(created_at,'DD/MM/YYYY') as creado from users order by id desc`;
  const codes = await sql`select c.code, (c.used_at is not null) as usado, u.username as usado_por, to_char(c.created_at,'DD/MM HH24:MI') as creado
                          from codes c left join users u on u.id=c.used_by order by c.created_at desc limit 30`;
  const st = await sql`select (select count(*) from students)::int as alumnos, (select count(*) from attendance)::int as registros, (select count(*) from users)::int as usuarios`;
  return NextResponse.json({ users, codes, stats: st[0] });
}

export async function POST(req) {
  if (!(await isAdmin())) return err('Solo administrador', 403);
  const b = await req.json().catch(() => ({}));
  if (b.action === 'code') {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const code = Array.from(crypto.randomBytes(8), x => A[x % A.length]).join('');
    await sql`insert into codes(code) values(${code})`;
    return NextResponse.json({ ok: true, code });
  }
  if (b.action === 'delcode') { await sql`delete from codes where code=${String(b.code)} and used_at is null`; return NextResponse.json({ ok: true }); }
  if (b.action === 'block') { await sql`update users set status='blocked' where id=${+b.id}`; return NextResponse.json({ ok: true }); }
  if (b.action === 'unblock') { await sql`update users set status='active' where id=${+b.id}`; return NextResponse.json({ ok: true }); }
  if (b.action === 'delete') { await sql`delete from users where id=${+b.id}`; return NextResponse.json({ ok: true }); }
  if (b.action === 'purge') {
    if (b.confirm !== 'BORRAR') return err('Escribe BORRAR para confirmar');
    const a = +b.anio, m = +b.mes;
    if (!(a >= 2000 && a <= 2100) || !(m >= 0 && m <= 12)) return err('Año o mes inválido');
    const p = (x) => String(x).padStart(2, '0');
    const d1 = m === 0 ? `${a}-01-01` : `${a}-${p(m)}-01`;
    const d2 = m === 0 || m === 12 ? `${a + 1}-01-01` : `${a}-${p(m + 1)}-01`;
    const r = await sql`delete from attendance where fecha >= ${d1}::date and fecha < ${d2}::date returning id`;
    return NextResponse.json({ ok: true, borrados: r.length });
  }
  return err('Acción desconocida');
}
