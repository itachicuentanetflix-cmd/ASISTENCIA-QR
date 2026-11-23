import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
export const dynamic = 'force-dynamic';

const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const isAdmin = async () => { const s = await getSession(); return s && s.role === 'admin'; };
const p2 = (x) => String(x).padStart(2, '0');

export async function GET() {
  if (!(await isAdmin())) return err('Solo administrador', 403);
  const users = await sql`select u.id, u.username, u.status, to_char(u.created_at,'DD/MM/YYYY') as creado,
      (select count(*) from students s where s.owner_id=u.id)::int as alumnos,
      (select count(*) from attendance a join students s on s.id=a.student_id where s.owner_id=u.id)::int as registros
      from users u order by u.id desc`;
  const codes = await sql`select c.code, (c.used_at is not null) as usado, u.username as usado_por, to_char(c.created_at,'DD/MM HH24:MI') as creado
      from codes c left join users u on u.id=c.used_by order by c.created_at desc limit 30`;
  return NextResponse.json({ users, codes });
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
  if (b.action === 'delete') { await sql`delete from users where id=${+b.id}`; return NextResponse.json({ ok: true }); } // borra también sus alumnos y asistencia
  if (b.action === 'day') {
    const o = +b.owner, f = String(b.fecha || '');
    if (!o || !/^\d{4}-\d{2}-\d{2}$/.test(f)) return err('Elige profesor y fecha');
    const students = await sql`select id, apellidos, nombres, gender from students where owner_id=${o} order by gender, apellidos, nombres`;
    const records = await sql`select a.student_id, a.estado, to_char(a.hora,'HH24:MI') as hora, a.motivo from attendance a join students s on s.id=a.student_id where s.owner_id=${o} and a.fecha=${f}::date`;
    return NextResponse.json({ ok: true, students, records });
  }
  if (b.action === 'purge') {
    if (b.confirm !== 'BORRAR') return err('Escribe BORRAR para confirmar');
    const a = +b.anio, m = +b.mes, o = +b.owner || 0;
    if (!(a >= 2000 && a <= 2100) || !(m >= 0 && m <= 12)) return err('Año o mes inválido');
    const d1 = m === 0 ? `${a}-01-01` : `${a}-${p2(m)}-01`;
    const d2 = m === 0 || m === 12 ? `${a + 1}-01-01` : `${a}-${p2(m + 1)}-01`;
    const r = o
      ? await sql`delete from attendance where student_id in (select id from students where owner_id=${o}) and fecha >= ${d1}::date and fecha < ${d2}::date returning id`
      : await sql`delete from attendance where fecha >= ${d1}::date and fecha < ${d2}::date returning id`;
    return NextResponse.json({ ok: true, borrados: r.length });
  }
  return err('Acción desconocida');
}
