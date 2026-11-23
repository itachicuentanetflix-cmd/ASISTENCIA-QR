'use client';
import { useEffect, useState } from 'react';

export default function Config({ cfg, me, onSaved }) {
  const [f, setF] = useState(cfg);
  const [msg, setMsg] = useState(null);
  useEffect(() => setF(cfg), [cfg]);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  async function save() {
    const r = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg({ e: d.error });
    onSaved(d.cfg); setMsg({ ok: 'Configuración guardada ✓' });
  }
  return (
    <div className="card">
      <h2>⚙️ Configuración</h2>
      <h3>🕗 Horario de asistencia (lunes a viernes)</h3>
      <div className="grid3 stack" style={{ gridTemplateColumns: '1fr' }}>
        <label className="mut">Hora de ingreso<input type="time" value={f.hora_inicio || ''} onChange={set('hora_inicio')} /></label>
        <label className="mut">Último minuto puntual (después = Tardanza)<input type="time" value={f.limite_puntual || ''} onChange={set('limite_puntual')} /></label>
        <label className="mut">Hora límite (después = Falta automática)<input type="time" value={f.hora_falta || ''} onChange={set('hora_falta')} /></label>
      </div>
      <div className="row" style={{ margin: '4px 0 12px' }}>
        <span className="badge A">A</span><span className="badge T">T</span><span className="badge F">F</span><span className="badge J">J</span>
      </div>
      <h3>🏫 Datos del salón</h3>
      <div className="grid2 stack">
        <input placeholder="Institución" value={f.escuela || ''} onChange={set('escuela')} />
        <input placeholder="Aula (ej: 3°F)" value={f.aula || ''} onChange={set('aula')} />
      </div>
      <input placeholder="Profesor(a)" value={f.profesora || ''} onChange={set('profesora')} />
      <label className="mut">Año lectivo {me.role !== 'admin' && '(solo el administrador puede cambiarlo)'}
        <input type="number" value={f.anio || ''} onChange={set('anio')} disabled={me.role !== 'admin'} /></label>
      {msg && <div className={'msg ' + (msg.e ? 'er' : 'ok')}>{msg.e || msg.ok}</div>}
      <button className="btn block" onClick={save}>Guardar cambios</button>
      <p className="mut" style={{ marginTop: 10 }}>Nota: si cambias el aula, los QR ya impresos siguen siendo válidos; los nuevos alumnos usarán la nueva aula.</p>
    </div>
  );
}
