'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Scan from '@/components/Scan';
import Manual from '@/components/Manual';
import Hoy from '@/components/Hoy';
import Grupos from '@/components/Grupos';
import Alumnos from '@/components/Alumnos';
import Config from '@/components/Config';
import Admin from '@/components/Admin';

const TABS = [['scan', '📷', 'Escanear'], ['manual', '✍️', 'Manual'], ['just', '📝', 'Justificar'], ['hoy', '✅', 'Hoy'], ['faltas', '🚫', 'Faltas'], ['grupos', '🎲', 'Grupos'], ['alumnos', '👥', 'Alumnos'], ['config', '⚙️', 'Config'], ['admin', '🛡️', 'Admin']];

export default function Panel() {
  const r = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState('scan');
  const [students, setStudents] = useState([]);
  const [att, setAtt] = useState({ records: [], min: 0, today: '' });
  const [cfg, setCfg] = useState({});
  const [clock, setClock] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, a, c] = await Promise.all(['/api/students', '/api/attendance', '/api/config'].map(u => fetch(u).then(x => x.json())));
      if (s.students) setStudents(s.students);
      if (a.records) setAtt(a);
      if (c.cfg) setCfg(c.cfg);
    } catch {}
  }, []);

  useEffect(() => {
    fetch('/api/auth/me').then(async x => { if (!x.ok) return r.replace('/'); setMe(await x.json()); load(); });
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [r, load]);
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', second: '2-digit' })), 1000);
    return () => clearInterval(t);
  }, []);

  async function logout() { await fetch('/api/auth/me', { method: 'DELETE' }); r.replace('/'); }
  if (!me) return <div className="auth"><p className="mut">Cargando…</p></div>;
  const tabs = TABS.filter(t => t[0] !== 'admin' || me.role === 'admin');
  const date = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="wrap">
      <div className="hero">
        <div>
          <h1><span className="grad">{cfg.aula || 'Asistencia'}</span> · {cfg.escuela}</h1>
          <div className="mut" style={{ textTransform: 'capitalize' }}>{date}</div>
          <div className="mut">👤 {me.username}{me.role === 'admin' ? ' · Admin' : ''} · <a href="#" onClick={e => { e.preventDefault(); logout(); }}>Salir</a></div>
        </div>
        <div className="clock">{clock}</div>
      </div>
      {tab === 'scan' && <Scan onMarked={load} />}
      {tab === 'manual' && <Manual students={students} records={att.records} onDone={load} />}
      {tab === 'just' && <Manual justify students={students} records={att.records} onDone={load} />}
      {tab === 'hoy' && <Hoy students={students} att={att} cfg={cfg} />}
      {tab === 'faltas' && <Hoy faltas students={students} att={att} cfg={cfg} />}
      {tab === 'grupos' && <Grupos students={students} records={att.records} />}
      {tab === 'alumnos' && <Alumnos students={students} me={me} onChange={load} />}
      {tab === 'config' && <Config cfg={cfg} me={me} onSaved={setCfg} />}
      {tab === 'admin' && me.role === 'admin' && <Admin cfg={cfg} students={students} onCfg={setCfg} />}
      <nav className="nav">
        {tabs.map(([k, i, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><span>{i}</span>{l}</button>)}
      </nav>
    </div>
  );
}
