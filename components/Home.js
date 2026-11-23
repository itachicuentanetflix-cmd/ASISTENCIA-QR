'use client';
import { I } from './Icons';

export default function Home({ me, cfg, students, att, go }) {
  const total = students.length, face = students.filter(s => s.has_face).length;
  const c = k => att.records.filter(r => r.estado === k).length;
  const A = c('A'), T = c('T'), J = c('J'), marked = att.records.length, pend = Math.max(total - marked, 0);
  const h = +new Date().toLocaleString('en-US', { timeZone: 'America/Lima', hour: 'numeric', hour12: false });
  const hi = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const mes = +(att.today || '').slice(5, 7) || new Date().getMonth() + 1;
  const pct = k => (total ? (k / total) * 100 : 0) + '%';
  const steps = [
    { ok: total > 0, t: 'Agrega a tus alumnos', d: 'Pega la lista, se crea el QR de cada uno', a: () => go('alumnos') },
    { ok: total > 0 && face === total, t: `Registra los rostros (${face}/${total})`, d: 'Automático: uno tras otro, con foto de perfil', a: () => go('alumnos') },
    { ok: marked > 0, t: 'Toma la asistencia de hoy', d: 'Con QR, rostro o manual', a: () => go('asist', 'qr') },
  ];
  const tile = (cls, ic, t, d, onClick) => (<button className="tile" onClick={onClick}><div className={'chip ' + cls}><I n={ic} s={24} /></div><div><b>{t}</b><small>{d}</small></div></button>);
  return (<>
    <div className="card" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.35),rgba(6,182,212,.18))' }}>
      <h2 style={{ marginBottom: 2 }}>{hi}, {cfg.profesora || me.username}</h2>
      <p className="mut" style={{ marginBottom: 12 }}>{att.weekday === false ? 'Hoy no es día de clases.' : `Asistencia de hoy · ${total} alumnos`}</p>
      <div className="bar"><i style={{ width: pct(A), background: 'var(--A)' }} /><i style={{ width: pct(T), background: 'var(--T)' }} /><i style={{ width: pct(J), background: 'var(--J)' }} /></div>
      <div className="grid4" style={{ marginTop: 12 }}>
        <div className="stat A"><b>{A}</b><span>Puntual</span></div><div className="stat T"><b>{T}</b><span>Tarde</span></div>
        <div className="stat J"><b>{J}</b><span>Justif.</span></div><div className="stat F"><b>{pend}</b><span>Sin marcar</span></div>
      </div>
    </div>
    <h3 style={{ margin: '4px 2px 8px' }}>Acciones rápidas</h3>
    <div className="tiles" style={{ marginBottom: 14 }}>
      {tile('c1', 'qr', 'Escanear QR', 'Registro al instante', () => go('asist', 'qr'))}
      {tile('c2', 'face', 'Reconocimiento facial', 'Varios alumnos a la vez', () => go('asist', 'face'))}
      {tile('c3', 'edit', 'Registro manual', 'Busca por apellido', () => go('asist', 'manual'))}
      {tile('c4', 'note', 'Justificar', 'Con motivo escrito', () => go('asist', 'just'))}
      {tile('c5', 'ban', 'Faltas de hoy', `${pend} sin marcar`, () => go('reg', 'faltas'))}
      {tile('c7', 'shuffle', 'Grupos', 'Aleatorios', () => go('reg', 'grupos'))}
      <a className="tile" href={`/api/export?anio=${cfg.anio}&mes=${mes}`}><div className="chip c8"><I n="download" s={24} /></div><div><b>Excel del mes</b><small>Descargar planilla</small></div></a>
      {tile('c6', 'idcard', 'Tarjetas QR', 'Imprimir', () => window.open('/tarjetas', '_blank'))}
    </div>
    {!(steps.every(x => x.ok)) && <div className="card"><h2><I n="info" s={19} />Primeros pasos</h2>
      {steps.map((s, i) => (<div className="step" key={i} onClick={s.a}><div className={'dot' + (s.ok ? ' ok' : '')}>{s.ok ? <I n="check" s={16} w={3} /> : i + 1}</div><div><b>{s.t}</b><div className="mut">{s.d}</div></div></div>))}
    </div>}
  </>);
}
