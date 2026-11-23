'use client';
import { useMemo, useState } from 'react';
import { I } from './Icons';
import Avatar from './Avatar';
import { play, unlockSound } from '@/lib/sound';

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
    unlockSound();
    if (justify && !motivo.trim()) return setMsg({ e: 'Escribe el motivo de la justificación' });
    const r = await fetch('/api/attendance', {
      method: justify ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(justify ? { studentId: s.id, motivo } : { studentId: s.id, method: 'manual' }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { play('err'); return setMsg({ e: d.error || 'Error' }); }
    play(d.dup ? 'dup' : d.estado === 'A' ? 'A' : d.estado === 'T' ? 'T' : 'ok');
    setMsg({ ok: `${s.apellidos}, ${s.nombres}: ${d.estado}${d.dup ? ' (ya estaba registrado)' : ''}` });
    setQ(''); setMotivo(''); onDone();
  }
  return (
    <div className="card">
      <h2><I n={justify ? 'note' : 'edit'} s={19} />{justify ? 'Registrar justificación' : 'Registro manual'}</h2>
      <p className="mut" style={{ marginBottom: 10 }}>Escribe primero el apellido y luego el nombre. Se autocompleta mientras escribes.</p>
      <input placeholder="Ej: Aguilera Leonel" value={q} onChange={e => { setQ(e.target.value); setMsg(null); }} autoComplete="off" />
      {justify && <textarea placeholder="Motivo (ej: cita médica, enfermedad…)" value={motivo} onChange={e => setMotivo(e.target.value)} />}
      {msg && <div className={'msg ' + (msg.e ? 'er' : 'ok')}><I n={msg.e ? 'alert' : 'check'} s={18} />{msg.e || msg.ok}</div>}
      {list.map(s => (
        <div className="item" key={s.id}>
          <Avatar s={s} size={42} />
          <div className="tx"><b>{s.apellidos}</b><small>{s.nombres}</small></div>
          {rm[s.id] && <span className={'badge ' + rm[s.id].estado}>{rm[s.id].estado}</span>}
          <button className="check" onClick={() => save(s)} aria-label="Guardar"><I n="check" s={24} w={3} /></button>
        </div>))}
      {q && !list.length && <p className="mut">Sin coincidencias.</p>}
    </div>
  );
}
