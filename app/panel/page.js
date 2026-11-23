'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Home from '@/components/Home';
import Scan from '@/components/Scan';
import Manual from '@/components/Manual';
import Hoy from '@/components/Hoy';
import Grupos from '@/components/Grupos';
import Alumnos from '@/components/Alumnos';
import Config from '@/components/Config';
import Admin from '@/components/Admin';
import { I } from '@/components/Icons';
import { preloadFace } from '@/lib/face';

const NAV = [['inicio', 'home', 'Inicio'], ['asist', 'qr', 'Asistencia'], ['reg', 'list', 'Registros'], ['alumnos', 'users', 'Alumnos'], ['ajustes', 'sliders', 'Ajustes']];
const Seg = ({ items, v, set }) => (<div className="seg">{items.map(([k, ic, l]) => <button key={k} className={v === k ? 'on' : ''} onClick={() => set(k)}><I n={ic} s={17} />{l}</button>)}</div>);

export default function Panel() {
  const r = useRouter();
  const [me, setMe] = useState(null);
  const [t, setT] = useState('inicio');
  const [sa, setSa] = useState('qr');
  const [sr, setSr] = useState('hoy');
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
    let timer;
    fetch('/api/auth/me').then(async x => {
      if (!x.ok) return r.replace('/');
      const u = await x.json(); setMe(u);
      if (u.role === 'user') { load(); preloadFace(); timer = setInterval(load, 30000); }
    });
    return () => clearInterval(timer);
  }, [r, load]);
  useEffect(() => {
    const f = () => setClock(new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }));
    f(); const i = setInterval(f, 15000); return () => clearInterval(i);
  }, []);

  const logout = async () => { await fetch('/api/auth/me', { method: 'DELETE' }); r.replace('/'); };
  const go = (tab, sub) => { setT(tab); if (tab === 'asist' && sub) setSa(sub); if (tab === 'reg' && sub) setSr(sub); window.scrollTo({ top: 0 }); };
  if (!me) return <div className="auth"><p className="mut">Cargando…</p></div>;
  const date = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long' });

  if (me.role === 'admin') return (
    <div className="wrap" style={{ paddingBottom: 40 }}>
      <div className="top"><div className="chip c1"><I n="shield" s={24} /></div>
        <div className="who"><small>Administrador</small><h1><span className="grad">Panel de control</span></h1></div>
        <button className="btn sec sm" onClick={logout}><I n="logout" s={17} />Salir</button></div>
      <Admin onLogout={logout} />
    </div>);

  return (
    <div className="wrap">
      <div className="top">
        <div className="chip c1"><I n="qr" s={24} /></div>
        <div className="who"><small>{cfg.escuela}</small><h1><span className="grad">{cfg.aula}</span></h1></div>
        <div className="clock">{clock}<small>{date}</small></div>
      </div>
      {t === 'inicio' && <Home me={me} cfg={cfg} students={students} att={att} go={go} />}
      {t === 'asist' && <>
        <Seg v={sa} set={setSa} items={[['qr', 'qr', 'QR'], ['face', 'face', 'Facial'], ['manual', 'edit', 'Manual'], ['just', 'note', 'Justificar']]} />
        {sa === 'qr' && <Scan key="qr" mode="qr" onMarked={load} />}
        {sa === 'face' && <Scan key="face" mode="face" onMarked={load} />}
        {sa === 'manual' && <Manual students={students} records={att.records} onDone={load} />}
        {sa === 'just' && <Manual justify students={students} records={att.records} onDone={load} />}
      </>}
      {t === 'reg' && <>
        <Seg v={sr} set={setSr} items={[['hoy', 'check', 'Presentes'], ['faltas', 'ban', 'Faltas'], ['grupos', 'shuffle', 'Grupos']]} />
        {sr === 'hoy' && <Hoy students={students} att={att} cfg={cfg} />}
        {sr === 'faltas' && <Hoy faltas students={students} att={att} cfg={cfg} />}
        {sr === 'grupos' && <Grupos students={students} records={att.records} />}
      </>}
      {t === 'alumnos' && <Alumnos students={students} onChange={load} />}
      {t === 'ajustes' && <Config cfg={cfg} att={att} onSaved={setCfg} onLogout={logout} />}
      <nav className="nav">
        {NAV.map(([k, ic, l]) => <button key={k} className={t === k ? 'on' : ''} onClick={() => go(k)}><I n={ic} s={22} />{l}</button>)}
      </nav>
    </div>
  );
}
