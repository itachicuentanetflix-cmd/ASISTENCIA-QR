'use client';
import { useState } from 'react';
import { I } from './Icons';

export default function Grupos({ students, records }) {
  const [n, setN] = useState(4);
  const [by, setBy] = useState('grupos');
  const [onlyP, setOnlyP] = useState(false);
  const [gs, setGs] = useState(null);
  function gen() {
    const here = new Set(records.filter(r => r.estado === 'A' || r.estado === 'T').map(r => r.student_id));
    const pool = students.filter(s => !onlyP || here.has(s.id));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const v = Math.max(1, +n || 1);
    const k = Math.max(1, Math.min(pool.length || 1, by === 'grupos' ? v : Math.ceil(pool.length / v)));
    const g = Array.from({ length: k }, () => []);
    pool.forEach((s, i) => g[i % k].push(s));
    setGs(g);
  }
  const copy = () => navigator.clipboard?.writeText(gs.map((g, i) => `Grupo ${i + 1}\n` + g.map(s => `- ${s.apellidos}, ${s.nombres}`).join('\n')).join('\n\n'));
  return (
    <div className="card">
      <h2><I n="shuffle" s={19} />Grupos aleatorios</h2>
      <div className="grid2">
        <input type="number" min="1" value={n} onChange={e => setN(e.target.value)} />
        <select value={by} onChange={e => setBy(e.target.value)}><option value="grupos">Cantidad de grupos</option><option value="integrantes">Integrantes por grupo</option></select>
      </div>
      <label className="mut" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input type="checkbox" style={{ width: 20, margin: 0 }} checked={onlyP} onChange={e => setOnlyP(e.target.checked)} /> Solo alumnos presentes hoy
      </label>
      <div className="row"><button className="btn" onClick={gen}><I n="shuffle" />Generar</button>{gs && <button className="btn sec" onClick={copy}><I n="copy" />Copiar</button>}</div>
      {gs && <div className="grid2" style={{ marginTop: 14 }}>
        {gs.map((g, i) => (<div className="grp" key={i}><h3 className="grad">Grupo {i + 1} · {g.length}</h3>
          {g.map(s => <div key={s.id} style={{ fontSize: 14, padding: '2px 0' }}>{s.apellidos.split(' ')[0]}, {s.nombres.split(' ')[0]}</div>)}</div>))}
      </div>}
    </div>
  );
}
