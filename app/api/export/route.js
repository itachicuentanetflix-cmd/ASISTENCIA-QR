import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getConfig } from '@/lib/config';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const DL = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const FILL = { A: 'FF22C55E', T: 'FFF59E0B', F: 'FFEF4444', J: 'FF3B82F6' };
const pad = (x) => String(x).padStart(2, '0');
const thin = { style: 'thin', color: { argb: 'FFB0B7C9' } };
const box = { top: thin, left: thin, bottom: thin, right: thin };

export async function GET(req) {
  if (!(await getSession())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const u = new URL(req.url);
  const cfg = await getConfig();
  const anio = +u.searchParams.get('anio') || +cfg.anio;
  const mes = Math.min(12, Math.max(1, +u.searchParams.get('mes') || 1));
  const d1 = `${anio}-${pad(mes)}-01`;
  const d2 = mes === 12 ? `${anio + 1}-01-01` : `${anio}-${pad(mes + 1)}-01`;
  const students = await sql`select id, apellidos, nombres, gender from students order by gender, apellidos, nombres`;
  const recs = await sql`select student_id, to_char(fecha,'YYYY-MM-DD') as fecha, estado from attendance where fecha >= ${d1}::date and fecha < ${d2}::date`;
  const map = {}; const held = new Set();
  recs.forEach(r => { map[`${r.student_id}|${r.fecha}`] = r.estado; held.add(r.fecha); });

  const nd = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const days = [];
  for (let d = 1; d <= nd; d++) {
    const f = `${anio}-${pad(mes)}-${pad(d)}`;
    const wd = new Date(f + 'T12:00:00Z').getUTCDay();
    if (wd >= 1 && wd <= 5) days.push({ d, f, l: DL[wd] });
  }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(MES[mes - 1], { views: [{ state: 'frozen', xSplit: 2, ySplit: 9 }] });
  const c0 = 3, last = c0 + days.length + 3; // última columna (totales)
  ws.getColumn(1).width = 2; ws.getColumn(2).width = 40;
  for (let c = c0; c <= last; c++) ws.getColumn(c).width = c > c0 + days.length - 1 ? 6 : 4.6;

  const title = (r, c1, c2, text, size, color = 'FF1E1B4B', bold = true) => {
    ws.mergeCells(r, c1, r, c2); const cell = ws.getCell(r, c1);
    cell.value = text; cell.font = { bold, size, color: { argb: color } }; cell.alignment = { horizontal: 'center', vertical: 'middle' };
  };
  title(2, 2, last - 4, cfg.escuela, 14); title(2, last - 3, last, cfg.aula, 14, 'FF6366F1');
  ws.mergeCells(4, 2, 4, last - 4); ws.mergeCells(4, last - 3, 4, last);
  const t = ws.getCell(4, 2); t.value = `ASISTENCIA - ${anio}`; t.font = { bold: true, size: 20, color: { argb: 'FFFFFFFF' } };
  t.alignment = { horizontal: 'center', vertical: 'middle' };
  for (let c = 2; c <= last; c++) ws.getCell(4, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  const m = ws.getCell(4, last - 3); m.value = MES[mes - 1]; m.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }; m.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(4).height = 32;
  ws.getCell(5, 2).value = `Profesora: ${cfg.profesora}`; ws.getCell(5, 2).font = { bold: true, size: 12 };
  ws.getCell(6, 2).value = 'A = Asistió   T = Tardanza   F = Falta   J = Justificado'; ws.getCell(6, 2).font = { italic: true, size: 10, color: { argb: 'FF555B73' } };

  ws.mergeCells(8, 2, 9, 2);
  const hdr = (cell, v) => { cell.value = v; cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } }; cell.border = box; };
  hdr(ws.getCell(8, 2), 'NOMBRES Y APELLIDOS');
  days.forEach((d, i) => { hdr(ws.getCell(8, c0 + i), d.l); hdr(ws.getCell(9, c0 + i), d.d); });
  ['A', 'T', 'F', 'J'].forEach((k, i) => { const c = c0 + days.length + i; ws.mergeCells(8, c, 9, c); hdr(ws.getCell(8, c), k); ws.getCell(8, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILL[k] } }; });

  students.forEach((s, ri) => {
    const r = 10 + ri; const tot = { A: 0, T: 0, F: 0, J: 0 };
    const nc = ws.getCell(r, 2); nc.value = `${s.apellidos}, ${s.nombres}`; nc.border = box;
    nc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: s.gender === 'H' ? 'FFE0F2FE' : 'FFFCE7F3' } };
    days.forEach((d, i) => {
      let v = map[`${s.id}|${d.f}`];
      if (!v && held.has(d.f)) v = 'F';
      const cell = ws.getCell(r, c0 + i); cell.border = box; cell.alignment = { horizontal: 'center' };
      if (v) { tot[v]++; cell.value = v; cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: FILL[v] } }; }
    });
    ['A', 'T', 'F', 'J'].forEach((k, i) => { const cell = ws.getCell(r, c0 + days.length + i); cell.value = tot[k]; cell.border = box; cell.alignment = { horizontal: 'center' }; cell.font = { bold: true }; });
  });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, { headers: {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="asistencia_${anio}_${pad(mes)}_${MES[mes - 1]}.xlsx"`,
  } });
}
