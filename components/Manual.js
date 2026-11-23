'use client';
import { useMemo, useState } from 'react';

const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/,/g, ' ').toLowerCase();

export default function Manual({ students, records, justify, onDone }) {
  const [q, setQ] = useState('');
  const [motivo, setMotivo] = useState('');
  const [msg, setMsg] = useState(null);
  const rm = useMemo(() => Object.fromEntries(records.map(r => [r.student_id, r])), [records]);
  const list = useMemo(() => {
    const t = norm(q).split(/\s+/).filter(Boolean);
    if (!t.length) return [];
    return students.filter(s => { const w = norm(s.apellidos + ' ' + s.nombres).split(/\s+/); return t.every(x => w.some(p => p.startsWith(x))); }).slice(0, 8);
  }, [q, students]);

  async function save(s) {
    if (justify && !motivo.trim()) return setMsg({ e: 'Escribe el motivo de la justificación' });
    const r = await fetch('/api/attendance', {
      method: justify ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(justify ? { studentId: s.id, motivo } : { studentId: s.id, method: 'manual' }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg({ e: d.error || 'Error' });
    setMsg({ ok: `${s.apellidos}, ${s.nombres} → ${d.estado}${d.dup ? ' (ya estaba registrado)' : ''}` });
    setQ(''); setMotivo(''); onDone();
  }
  return (
    <div className="card">
      <h2>{justify ? '📝 Registrar justificación' : '✍️ Registro manual'}</h2>
      <p className="mut" style={{ marginBottom: 10 }}>Escribe primero el apellido y luego el nombre. Se autocompleta mientras escribes.</p>
      <input placeholder="Ej: Aguilera Leonel" value={q} onChange={e => { setQ(e.target.value); setMsg(null); }} autoComplete="off" />
      {justify && <textarea placeholder="Motivo de la justificación (ej: cita médica, enfermedad…)" value={motivo} onChange={e => setMotivo(e.target.value)} />}
      {msg && <div className={'msg ' + (msg.e ? 'er' : 'ok')}>{msg.e || msg.ok}</div>}
      {list.map(s => (
        <div className="item" key={s.id}>
          <div><b>{s.apellidos}</b><small>{s.nombres} · {s.gender === 'H' ? '♂ Hombre' : '♀ Mujer'}</small></div>
          {rm[s.id] && <span className={'badge ' + rm[s.id].estado}>{rm[s.id].estado}</span>}
          <button className="check" onClick={() => save(s)} aria-label="Guardar">✓</button>
        </div>
      ))}
      {q && !list.length && <p className="mut">Sin coincidencias.</p>}
    </div>
  );
}
