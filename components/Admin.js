'use client';
import { useCallback, useEffect, useState } from 'react';
import { I } from './Icons';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const post = body => fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) }));

export default function Admin({ onLogout }) {
  const hoy = new Date();
  const [tab, setTab] = useState('res');
  const [d, setD] = useState({ users: [], codes: [] });
  const [newCode, setNewCode] = useState('');
  const [owner, setOwner] = useState('');
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [pOwner, setPOwner] = useState('0');
  const [pAnio, setPAnio] = useState(hoy.getFullYear());
  const [pMes, setPMes] = useState(hoy.getMonth() + 1);
  const [conf, setConf] = useState('');
  const [msg, setMsg] = useState(null);
  const [fecha, setFecha] = useState('');
  const [day, setDay] = useState(null);

  const load = useCallback(async () => { const r = await fetch('/api/admin'); if (r.ok) setD(await r.json()); }, []);
  useEffect(() => { load(); }, [load]);
  const totals = d.users.reduce((a, u) => ({ al: a.al + u.alumnos, re: a.re + u.registros }), { al: 0, re: 0 });

  async function gen() { const r = await post({ action: 'code' }); if (r.ok) { setNewCode(r.code); load(); } }
  async function act(action, u) {
    if (action === 'delete' && !confirm(`¿Eliminar a ${u.username}? Se borrarán también sus ${u.alumnos} alumnos y toda su asistencia.`)) return;
    await post({ action, id: u.id }); load();
  }
  async function purge() {
    const who = pOwner === '0' ? 'TODOS los profesores' : d.users.find(u => String(u.id) === pOwner)?.username;
    const lbl = pMes === 0 ? `todo el año ${pAnio}` : `${MESES[pMes - 1]} ${pAnio}`;
    if (!confirm(`Se borrará la asistencia de ${lbl} de ${who}. No se puede deshacer. ¿Continuar?`)) return;
    const r = await post({ action: 'purge', owner: +pOwner, anio: pAnio, mes: pMes, confirm: conf });
    setMsg(r.ok ? { ok: `Se borraron ${r.borrados} registros (${lbl}).` } : { e: r.error }); setConf(''); load();
  }
  async function consult(f) {
    setFecha(f); setDay(null);
    if (!f || !owner) return;
    const r = await post({ action: 'day', owner: +owner, fecha: f });
    if (r.ok) setDay(r); else setMsg({ e: r.error });
  }
  const dm = day ? Object.fromEntries(day.records.map(r => [r.student_id, r])) : {};
  const teacherSel = (v, set, all) => (<select value={v} onChange={e => set(e.target.value)}>
    <option value={all ? '0' : ''}>{all ? 'Todos los profesores' : 'Elige un profesor…'}</option>
    {d.users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select>);

  return (<>
    <div className="seg">
      {[['res', 'chart', 'Resumen'], ['prof', 'users', 'Profesores'], ['cod', 'key', 'Códigos'], ['dat', 'calendar', 'Datos']].map(([k, ic, l]) =>
        <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); setMsg(null); }}><I n={ic} s={17} />{l}</button>)}
    </div>
    {msg && <div className={'msg ' + (msg.e ? 'er' : 'ok')}><I n={msg.e ? 'alert' : 'check'} s={18} />{msg.e || msg.ok}</div>}

    {tab === 'res' && <>
      <div className="grid3" style={{ marginBottom: 14 }}>
        <div className="stat"><b>{d.users.length}</b><span>Profesores</span></div>
        <div className="stat"><b>{totals.al}</b><span>Alumnos</span></div>
        <div className="stat"><b>{totals.re}</b><span>Registros</span></div>
      </div>
      <div className="card"><h2><I n="key" s={19} />Nuevo profesor</h2>
        <p className="mut" style={{ marginBottom: 10 }}>Genera un código de un solo uso y dáselo al profesor para que cree su cuenta en “Registrarse”.</p>
        <button className="btn block" onClick={gen}><I n="plus" />Generar código</button>
        {newCode && <div className="msg ok" style={{ justifyContent: 'center', fontSize: 28, fontWeight: 800, letterSpacing: 5 }}>{newCode}</div>}
      </div>
      <div className="card"><h2><I n="info" s={19} />Cómo funciona</h2>
        <p className="mut">Cada profesor ve y administra <b>solo sus propios alumnos</b>. Tú controlas las cuentas, descargas sus planillas y limpias datos por mes desde “Datos”.</p></div>
    </>}

    {tab === 'prof' && <div className="card"><h2><I n="users" s={19} />Profesores ({d.users.length})</h2>
      {!d.users.length && <p className="mut">Aún no hay profesores. Genera un código y compártelo.</p>}
      {d.users.map(u => (<div className="item" key={u.id}>
        <div className="av ph" style={{ width: 44, height: 44, background: u.status === 'active' ? 'linear-gradient(135deg,#6366f1,#06b6d4)' : '#64748b' }}>{u.username[0]}</div>
        <div className="tx"><b>{u.username}</b><small>{u.status === 'active' ? 'Activo' : 'Bloqueado'} · {u.alumnos} alumnos · {u.registros} registros</small></div>
        {u.status === 'active'
          ? <button className="btn sec sm icb" title="Bloquear" onClick={() => act('block', u)}><I n="lock" s={18} /></button>
          : <button className="btn ok sm icb" title="Permitir" onClick={() => act('unblock', u)}><I n="unlock" s={18} /></button>}
        <button className="btn danger sm icb" title="Eliminar" onClick={() => act('delete', u)}><I n="trash" s={18} /></button>
      </div>))}
    </div>}

    {tab === 'cod' && <div className="card"><h2><I n="key" s={19} />Códigos de registro</h2>
      <button className="btn block" onClick={gen} style={{ marginBottom: 10 }}><I n="plus" />Generar código nuevo</button>
      {newCode && <div className="msg ok" style={{ justifyContent: 'center', fontSize: 28, fontWeight: 800, letterSpacing: 5 }}>{newCode}</div>}
      {d.codes.map(c => (<div className="item" key={c.code}>
        <div className="tx"><b style={{ letterSpacing: 2 }}>{c.code}</b><small>{c.usado ? `Usado por ${c.usado_por || '—'}` : 'Disponible'} · {c.creado}</small></div>
        {!c.usado && <button className="btn danger sm icb" title="Anular" onClick={() => post({ action: 'delcode', code: c.code }).then(load)}><I n="x" s={18} /></button>}
      </div>))}
    </div>}

    {tab === 'dat' && <>
      <div className="card"><h2><I n="download" s={19} />Descargar planilla</h2>
        {teacherSel(owner, setOwner)}
        <div className="grid2"><select value={mes} onChange={e => setMes(+e.target.value)}>{MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
          <input type="number" value={anio} onChange={e => setAnio(+e.target.value)} /></div>
        <a className={'btn ok block'} style={owner ? {} : { opacity: .45, pointerEvents: 'none' }} href={`/api/export?owner=${owner}&anio=${anio}&mes=${mes}`}><I n="download" />Excel de {MESES[mes - 1]} {anio}</a>
        <h3 style={{ marginTop: 16 }}>Consultar un día</h3>
        <input type="date" value={fecha} onChange={e => consult(e.target.value)} />
        {!owner && <p className="mut">Elige primero un profesor arriba.</p>}
        {day && day.students.map(s => { const r = dm[s.id]; return (<div className="item" key={s.id}><div className="tx"><b>{s.apellidos}</b><small>{s.nombres}{r?.motivo ? ' · ' + r.motivo : ''}</small></div><span className="mut">{r?.hora || ''}</span><span className={'badge ' + (r ? r.estado : 'P')}>{r ? r.estado : '—'}</span></div>); })}
      </div>
      <div className="card" style={{ borderColor: 'rgba(239,68,68,.5)' }}>
        <h2 style={{ color: '#f87171' }}><I n="trash" s={19} />Borrar asistencia guardada</h2>
        <p className="mut" style={{ marginBottom: 10 }}>Elimina la asistencia del mes y año elegidos. Descarga antes el Excel como respaldo. No borra alumnos ni profesores.</p>
        {teacherSel(pOwner, setPOwner, true)}
        <div className="grid2"><select value={pMes} onChange={e => setPMes(+e.target.value)}><option value={0}>Todo el año</option>{MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
          <input type="number" value={pAnio} onChange={e => setPAnio(+e.target.value)} /></div>
        <input placeholder="Escribe BORRAR para confirmar" value={conf} onChange={e => setConf(e.target.value)} />
        <button className="btn danger block" disabled={conf !== 'BORRAR'} onClick={purge}><I n="trash" />Borrar datos</button>
      </div>
    </>}
  </>);
}
