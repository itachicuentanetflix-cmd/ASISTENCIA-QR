'use client';
const by = (a, b) => (a.apellidos + ' ' + a.nombres).localeCompare(b.apellidos + ' ' + b.nombres, 'es');
const toMin = s => { const [a, b] = String(s || '14:00').split(':'); return +a * 60 + +b; };

function Group({ title, color, rows, render }) {
  return (<div className="card">
    <div className="between"><h2 style={{ color }}>{title}</h2><span className="mut">{rows.length}</span></div>
    {rows.length ? rows.map(render) : <p className="mut">Nadie por ahora.</p>}
  </div>);
}

export default function Hoy({ students, att, cfg, faltas }) {
  const rm = Object.fromEntries(att.records.map(r => [r.student_id, r]));
  const after = att.min >= toMin(cfg.hora_falta);
  const cnt = k => att.records.filter(r => r.estado === k).length;
  const present = students.filter(s => rm[s.id]);
  const absent = students.filter(s => !rm[s.id]);
  const src = faltas ? absent : present;
  const H = src.filter(s => s.gender === 'H').sort(by), M = src.filter(s => s.gender === 'M').sort(by);
  const render = s => faltas
    ? (<div className="item" key={s.id}><div><b>{s.apellidos}</b><small>{s.nombres}</small></div><span className={'badge ' + (after || !att.weekday ? 'F' : 'P')}>{after ? 'F' : '…'}</span></div>)
    : (<div className="item" key={s.id}><div><b>{s.apellidos}</b><small>{s.nombres}{rm[s.id].motivo ? ' · ' + rm[s.id].motivo : ''}</small></div><div className="row fit" style={{ gap: 8 }}><span className="mut">{rm[s.id].hora}</span><span className={'badge ' + rm[s.id].estado}>{rm[s.id].estado}</span></div></div>);
  return (<>
    <div className="grid3" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 14 }}>
      <div className="stat A"><b>{cnt('A')}</b><span>Puntual</span></div>
      <div className="stat T"><b>{cnt('T')}</b><span>Tarde</span></div>
      <div className="stat J"><b>{cnt('J')}</b><span>Justif.</span></div>
      <div className="stat F"><b>{absent.length}</b><span>{after ? 'Faltas' : 'Sin marcar'}</span></div>
    </div>
    {faltas && !after && <div className="msg" style={{ background: 'rgba(100,116,139,.2)' }}>Aún no pasa la hora límite ({cfg.hora_falta}). Después de esa hora, quien no marque quedará con <b>F</b>.</div>}
    <Group title={faltas ? '♂ Hombres que faltaron' : '♂ Hombres presentes'} color="#38bdf8" rows={H} render={render} />
    <Group title={faltas ? '♀ Mujeres que faltaron' : '♀ Mujeres presentes'} color="#f472b6" rows={M} render={render} />
  </>);
}
