'use client';
import { useCallback, useEffect, useState } from 'react';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const post = body => fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) }));

export default function Admin({ cfg, students, onCfg }) {
  const hoy = new Date();
  const [d, setD] = useState({ users: [], codes: [], stats: {} });
  const [newCode, setNewCode] = useState('');
  const [anio, setAnio] = useState(+cfg.anio || hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [pAnio, setPAnio] = useState(+cfg.anio || hoy.getFullYear());
  const [pMes, setPMes] = useState(hoy.getMonth() + 1);
  const [conf, setConf] = useState('');
  const [msg, setMsg] = useState(null);
  const [fecha, setFecha] = useState('');
  const [day, setDay] = useState(null);

  const load = useCallback(async () => { const r = await fetch('/api/admin'); if (r.ok) setD(await r.json()); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (cfg.anio) { setAnio(+cfg.anio); setPAnio(+cfg.anio); } }, [cfg.anio]);

  async function gen() { const r = await post({ action: 'code' }); if (r.ok) { setNewCode(r.code); load(); } }
  async function act(action, id) {
    if (action === 'delete' && !confirm('¿Eliminar este usuario definitivamente?')) return;
    await post({ action, id }); load();
  }
  async function saveYear() {
    const r = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ anio }) });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? { ok: `Año del sistema: ${anio} ✓` } : { e: j.error }); if (r.ok) onCfg(j.cfg);
  }
  async function purge() {
    const lbl = pMes === 0 ? `TODO el año ${pAnio}` : `${MESES[pMes - 1]} ${pAnio}`;
    if (!confirm(`Se borrará TODA la asistencia de ${lbl}. Esta acción no se puede deshacer. ¿Continuar?`)) return;
    const r = await post({ action: 'purge', anio: pAnio, mes: pMes, confirm: conf });
    setMsg(r.ok ? { ok: `Se borraron ${r.borrados} registros de ${lbl}.` } : { e: r.error }); setConf(''); load();
  }
  async function consult(f) {
    setFecha(f); if (!f) return setDay(null);
    const r = await fetch('/api/attendance?fecha=' + f); setDay(await r.json());
  }
  const dm = day ? Object.fromEntries(day.records.map(r => [r.student_id, r])) : {};

  return (<>
    <div className="grid3">
      <div className="stat"><b>{d.stats.alumnos ?? '–'}</b><span>Alumnos</span></div>
      <div className="stat"><b>{d.stats.usuarios ?? '–'}</b><span>Usuarios</span></div>
      <div className="stat"><b>{d.stats.registros ?? '–'}</b><span>Registros</span></div>
    </div>
    {msg && <div className={'msg ' + (msg.e ? 'er' : 'ok')} style={{ margin: '12px 0' }}>{msg.e || msg.ok}</div>}

    <div className="card" style={{ marginTop: 14 }}>
      <h2>🔑 Generar código de registro</h2>
      <p className="mut" style={{ marginBottom: 10 }}>Cada código sirve para crear <b>un</b> usuario nuevo y se usa una sola vez.</p>
      <button className="btn block" onClick={gen}>Generar código nuevo</button>
      {newCode && <div className="msg ok" style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, letterSpacing: 4 }}>{newCode}</div>}
      {d.codes.map(c => (<div className="item" key={c.code}>
        <div><b style={{ letterSpacing: 2 }}>{c.code}</b><small>{c.usado ? `Usado por ${c.usado_por || '—'}` : 'Disponible'} · {c.creado}</small></div>
        {!c.usado && <button className="btn danger sm" onClick={() => post({ action: 'delcode', code: c.code }).then(load)}>Anular</button>}
      </div>))}
    </div>

    <div className="card">
      <h2>👤 Usuarios</h2>
      {!d.users.length && <p className="mut">Aún no hay usuarios registrados.</p>}
      {d.users.map(u => (<div className="item" key={u.id}>
        <div><b>{u.username}</b><small>{u.status === 'active' ? '🟢 Activo' : '🔴 Bloqueado'} · {u.creado}</small></div>
        <div className="row fit" style={{ gap: 6 }}>
          {u.status === 'active' ? <button className="btn sec sm" onClick={() => act('block', u.id)}>Bloquear</button> : <button className="btn sm" onClick={() => act('unblock', u.id)}>Permitir</button>}
          <button className="btn danger sm" onClick={() => act('delete', u.id)}>🗑</button>
        </div></div>))}
    </div>

    <div className="card">
      <h2>📊 Asistencia y descargas</h2>
      <div className="grid2"><select value={mes} onChange={e => setMes(+e.target.value)}>{MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
        <input type="number" value={anio} onChange={e => setAnio(+e.target.value)} /></div>
      <a className="btn block" href={`/api/export?anio=${anio}&mes=${mes}`}>⬇️ Descargar Excel de {MESES[mes - 1]} {anio}</a>
      <h3 style={{ marginTop: 16 }}>Consultar un día</h3>
      <input type="date" value={fecha} onChange={e => consult(e.target.value)} />
      {day && students.map(s => { const r = dm[s.id]; return (<div className="item" key={s.id}><div><b>{s.apellidos}</b><small>{s.nombres}{r?.motivo ? ' · ' + r.motivo : ''}</small></div>
        <div className="row fit" style={{ gap: 8 }}><span className="mut">{r?.hora || ''}</span><span className={'badge ' + (r ? r.estado : 'P')}>{r ? r.estado : '—'}</span></div></div>); })}
    </div>

    <div className="card">
      <h2>📅 Año del sistema</h2>
      <div className="row"><input type="number" value={anio} onChange={e => setAnio(+e.target.value)} style={{ marginBottom: 0 }} /><button className="btn fit" onClick={saveYear}>Guardar año</button></div>
    </div>

    <div className="card" style={{ borderColor: 'rgba(239,68,68,.5)' }}>
      <h2 style={{ color: '#f87171' }}>🧹 Borrar asistencia guardada</h2>
      <p className="mut" style={{ marginBottom: 10 }}>Elimina de la base de datos la asistencia del mes elegido. Descarga antes el Excel como respaldo. No borra alumnos ni usuarios.</p>
      <div className="grid2"><select value={pMes} onChange={e => setPMes(+e.target.value)}><option value={0}>Todo el año</option>{MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
        <input type="number" value={pAnio} onChange={e => setPAnio(+e.target.value)} /></div>
      <input placeholder='Escribe BORRAR para confirmar' value={conf} onChange={e => setConf(e.target.value)} />
      <button className="btn danger block" disabled={conf !== 'BORRAR'} onClick={purge}>Borrar datos</button>
    </div>
  </>);
}
