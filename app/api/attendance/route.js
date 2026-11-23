import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getTeacher } from '@/lib/auth';
import { getConfig } from '@/lib/config';
import { limaNow, isWeekday, toMin } from '@/lib/time';
export const dynamic = 'force-dynamic';

const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req) {
  const s = await getTeacher(); if (!s) return err('No autorizado', 401);
  const n = limaNow();
  const fecha = new URL(req.url).searchParams.get('fecha') || n.fecha;
  if (!FECHA.test(fecha)) return err('Fecha inválida');
  const records = await sql`select a.student_id, a.estado, to_char(a.hora,'HH24:MI') as hora, a.motivo, a.metodo
                            from attendance a join students st on st.id=a.student_id
                            where st.owner_id=${s.id} and a.fecha=${fecha}::date`;
  return NextResponse.json({ fecha, today: n.fecha, hora: n.hora, min: n.min, weekday: isWeekday(n.fecha), records });
}

// Marcar asistencia: { studentId | qr, method }
export async function POST(req) {
  const s = await getTeacher(); if (!s) return err('No autorizado', 401);
  const b = await req.json().catch(() => ({}));
  const n = limaNow(); const cfg = await getConfig(s.id);
  if (!isWeekday(n.fecha)) return err('Hoy no es día de clases (lunes a viernes)');
  let st;
  if (b.studentId) st = (await sql`select id, apellidos, nombres, gender, (face is not null) as has_face, extract(epoch from face_at)::bigint as fv from students where id=${+b.studentId} and owner_id=${s.id}`)[0];
  else if (b.qr) st = (await sql`select id, apellidos, nombres, gender, (face is not null) as has_face, extract(epoch from face_at)::bigint as fv from students where qr=${String(b.qr)} and owner_id=${s.id}`)[0];
  if (!st) return err('QR no reconocido: este alumno no pertenece a tu lista', 404);
  const ex = await sql`select estado, to_char(hora,'HH24:MI') as hora from attendance where student_id=${st.id} and fecha=${n.fecha}::date`;
  if (ex[0]) return NextResponse.json({ ok: true, dup: true, student: st, estado: ex[0].estado, hora: ex[0].hora });
  if (n.min >= toMin(cfg.hora_falta)) return err(`Pasó la hora límite (${cfg.hora_falta}): se considera falta`);
  const estado = n.min > toMin(cfg.limite_puntual) ? 'T' : 'A';
  await sql`insert into attendance(student_id, fecha, estado, hora, metodo, usuario)
            values(${st.id}, ${n.fecha}::date, ${estado}, ${n.hora}::time, ${b.method || 'manual'}, ${s.username})
            on conflict (student_id, fecha) do nothing`;
  return NextResponse.json({ ok: true, student: st, estado, hora: n.hora.slice(0, 5) });
}

// Justificación: { studentId, motivo, fecha? }
export async function PUT(req) {
  const s = await getTeacher(); if (!s) return err('No autorizado', 401);
  const b = await req.json().catch(() => ({}));
  const n = limaNow();
  const fecha = b.fecha || n.fecha;
  const motivo = String(b.motivo || '').trim();
  if (!FECHA.test(fecha)) return err('Fecha inválida');
  if (!b.studentId || !motivo) return err('Falta alumno o motivo');
  const own = await sql`select 1 from students where id=${+b.studentId} and owner_id=${s.id}`;
  if (!own[0]) return err('Alumno no encontrado', 404);
  await sql`insert into attendance(student_id, fecha, estado, hora, motivo, metodo, usuario)
            values(${+b.studentId}, ${fecha}::date, 'J', ${n.hora}::time, ${motivo}, 'justificacion', ${s.username})
            on conflict (student_id, fecha) do update set estado='J', motivo=excluded.motivo, usuario=excluded.usuario`;
  return NextResponse.json({ ok: true, estado: 'J' });
}
