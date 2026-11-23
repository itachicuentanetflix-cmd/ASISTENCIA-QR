import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getConfig } from '@/lib/config';
export const dynamic = 'force-dynamic';

const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });

export async function GET(req) {
  if (!(await getSession())) return err('No autorizado', 401);
  const faces = new URL(req.url).searchParams.get('faces');
  const students = faces
    ? await sql`select id, apellidos, nombres, gender, face from students order by gender, apellidos, nombres`
    : await sql`select id, apellidos, nombres, gender, qr, (face is not null) as has_face from students order by gender, apellidos, nombres`;
  return NextResponse.json({ students });
}

// Carga masiva: { hombres: "Apellidos, Nombres\n...", mujeres: "..." }
export async function POST(req) {
  if (!(await getSession())) return err('No autorizado', 401);
  const b = await req.json().catch(() => ({}));
  const cfg = await getConfig();
  let added = 0; const bad = [];
  for (const [key, g] of [['hombres', 'H'], ['mujeres', 'M']]) {
    for (const raw of String(b[key] || '').split(/\r?\n/)) {
      const line = raw.replace(/\s+/g, ' ').trim();
      if (!line) continue;
      const i = line.indexOf(',');
      if (i < 1 || i === line.length - 1) { bad.push(line); continue; }
      const ap = line.slice(0, i).trim(), no = line.slice(i + 1).trim();
      const qr = `ASIST|${cfg.aula}|${ap}, ${no}`;
      const r = await sql`insert into students(apellidos, nombres, gender, aula, qr) values(${ap}, ${no}, ${g}, ${cfg.aula}, ${qr}) on conflict (qr) do nothing returning id`;
      if (r[0]) added++;
    }
  }
  return NextResponse.json({ ok: true, added, bad });
}

// Guardar / quitar rostro: { id, face: number[128] | null }
export async function PATCH(req) {
  if (!(await getSession())) return err('No autorizado', 401);
  const { id, face } = await req.json().catch(() => ({}));
  if (!id) return err('Falta el alumno');
  if (face === null) await sql`update students set face=null where id=${+id}`;
  else {
    if (!Array.isArray(face) || face.length !== 128 || face.some(x => typeof x !== 'number')) return err('Rostro inválido');
    await sql`update students set face=${JSON.stringify(face)}::jsonb where id=${+id}`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req) {
  const s = await getSession();
  if (!s || s.role !== 'admin') return err('Solo el administrador puede eliminar alumnos', 403);
  const id = new URL(req.url).searchParams.get('id');
  await sql`delete from students where id=${+id}`;
  return NextResponse.json({ ok: true });
}
