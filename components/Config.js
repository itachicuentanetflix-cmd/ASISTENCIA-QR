'use client';
import { useEffect, useState } from 'react';
import { I } from './Icons';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function Config({ cfg, att, onSaved, onLogout }) {
  const [f, setF] = useState(cfg);
  const [msg, setMsg] = useState(null);
  const [mes, setMes] = useState(+(att.today || '').slice(5, 7) || new Date().getMonth() + 1);
  useEffect(() => setF(cfg), [cfg]);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  async function save() {
    const r = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg({ e: d.error });
    onSaved(d.cfg); setMsg({ ok: 'Cambios guardados' });
  }
  return (<>
    <div className="card">
      <h2><I n="download" s={19} />Descargar Excel del mes</h2>
      <p className="mut" style={{ marginBottom: 10 }}>Tu planilla mensual con colores y totales. Siempre sale actualizada.</p>
      <div className="grid2"><select value={mes} onChange={e => setMes(+e.target.value)}>{MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select>
        <input type="number" value={f.anio || ''} onChange={set('anio')} /></div>
      <a className="btn ok block" href={`/api/export?anio=${f.anio}&mes=${mes}`}><I n="download" />Descargar {MESES[mes - 1]} {f.anio}</a>
    </div>
    <div className="card">
      <h2><I n="clock" s={19} />Horario de asistencia</h2>
      <p className="mut" style={{ marginBottom: 8 }}>De lunes a viernes. Colores: <span className="badge A">A</span> <span className="badge T">T</span> <span className="badge F">F</span> <span className="badge J">J</span></p>
      <label className="mut">Hora de ingreso<input type="time" value={f.hora_inicio || ''} onChange={set('hora_inicio')} /></label>
      <label className="mut">Último minuto puntual (después = Tardanza)<input type="time" value={f.limite_puntual || ''} onChange={set('limite_puntual')} /></label>
      <label className="mut">Hora límite (después = Falta automática)<input type="time" value={f.hora_falta || ''} onChange={set('hora_falta')} /></label>
      <h3>Datos de mi salón</h3>
      <div className="grid2 stack"><input placeholder="Institución" value={f.escuela || ''} onChange={set('escuela')} /><input placeholder="Aula (ej: 3°F)" value={f.aula || ''} onChange={set('aula')} /></div>
      <input placeholder="Profesor(a)" value={f.profesora || ''} onChange={set('profesora')} />
      {msg && <div className={'msg ' + (msg.e ? 'er' : 'ok')}><I n={msg.e ? 'alert' : 'check'} s={18} />{msg.e || msg.ok}</div>}
      <button className="btn block" onClick={save}><I n="check" />Guardar cambios</button>
    </div>
    <div className="card">
      <h2><I n="phone" s={19} />Instalar en tu celular</h2>
      <p className="mut"><b>iPhone:</b> abre en Safari → botón Compartir → “Agregar a pantalla de inicio”.<br /><b>Android:</b> abre en Chrome → menú ⋮ → “Instalar aplicación”.</p>
    </div>
    <button className="btn sec block" onClick={onLogout}><I n="logout" />Cerrar sesión</button>
  </>);
}
