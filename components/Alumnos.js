'use client';
import { useEffect, useRef, useState } from 'react';
import { useCamera } from '@/lib/useCamera';
import { loadFace } from '@/lib/face';

function Enroll({ s, onClose, onSaved }) {
  const { videoRef, start } = useCamera();
  const fa = useRef(null);
  const [st, setSt] = useState('Cargando modelo facial…');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    (async () => {
      try { fa.current = await loadFace(); await start('user'); setSt('Centra el rostro del alumno, con buena luz, y pulsa Capturar'); }
      catch (e) { setSt('Error: ' + e.message); }
    })();
  }, [start]);

  async function cap() {
    setBusy(true);
    const f = fa.current, ds = [];
    for (let i = 0; i < 6 && ds.length < 3; i++) {
      const det = await f.detectSingleFace(videoRef.current, new f.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks(true).withFaceDescriptor();
      if (det) ds.push(det.descriptor);
      await new Promise(r => setTimeout(r, 400));
    }
    if (ds.length < 2) { setBusy(false); return setSt('No se detectó un rostro claro. Mejora la luz e inténtalo otra vez.'); }
    const face = Array.from({ length: 128 }, (_, i) => ds.reduce((a, d) => a + d[i], 0) / ds.length);
    const r = await fetch('/api/students', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, face }) });
    setBusy(false);
    if (r.ok) { onSaved(); onClose(); } else setSt('No se pudo guardar el rostro');
  }
  return (
    <div className="modal"><div className="card">
      <h2>🙂 Rostro de {s.nombres.split(' ')[0]} {s.apellidos.split(' ')[0]}</h2>
      <div className="scanbox"><video ref={videoRef} playsInline muted autoPlay style={{ transform: 'scaleX(-1)' }} /><div className="frame face" /></div>
      <p className="mut" style={{ textAlign: 'center', marginBottom: 10 }}>{st}</p>
      <div className="row"><button className="btn" disabled={busy} onClick={cap}>{busy ? 'Capturando…' : '📸 Capturar'}</button><button className="btn sec" onClick={onClose}>Cerrar</button></div>
    </div></div>
  );
}

export default function Alumnos({ students, me, onChange }) {
  const [add, setAdd] = useState(false);
  const [h, setH] = useState('');
  const [m, setM] = useState('');
  const [msg, setMsg] = useState(null);
  const [enr, setEnr] = useState(null);

  async function bulk() {
    const r = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hombres: h, mujeres: m }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg({ e: d.error });
    setMsg({ ok: `Se agregaron ${d.added} alumnos.` + (d.bad?.length ? ` Líneas ignoradas (formato): ${d.bad.join(' | ')}` : '') });
    setH(''); setM(''); onChange();
  }
  async function del(s) {
    if (!confirm(`¿Eliminar a ${s.apellidos}, ${s.nombres} y toda su asistencia?`)) return;
    await fetch('/api/students?id=' + s.id, { method: 'DELETE' }); onChange();
  }
  async function noFace(s) {
    await fetch('/api/students', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, face: null }) }); onChange();
  }
  const sec = (t, g, col) => {
    const L = students.filter(s => s.gender === g);
    return (<div className="card"><div className="between"><h2 style={{ color: col }}>{t}</h2><span className="mut">{L.length}</span></div>
      {L.map(s => (<div className="item" key={s.id}>
        <div><b>{s.apellidos}</b><small>{s.nombres} {s.has_face ? '· 🙂 rostro registrado' : ''}</small></div>
        <div className="row fit" style={{ gap: 6 }}>
          <button className="btn sec sm" onClick={() => setEnr(s)}>{s.has_face ? '🔄' : '🙂'}</button>
          {s.has_face && <button className="btn sec sm" onClick={() => noFace(s)} title="Quitar rostro">🚫</button>}
          {me.role === 'admin' && <button className="btn danger sm" onClick={() => del(s)}>🗑</button>}
        </div></div>))}
    </div>);
  };
  return (<>
    <div className="card">
      <div className="between"><h2>👥 Alumnos ({students.length})</h2>
        <div className="row fit"><button className="btn sm" onClick={() => setAdd(!add)}>＋ Agregar varios</button><a className="btn sec sm" href="/tarjetas" target="_blank" rel="noreferrer">▣ Tarjetas QR</a></div></div>
      {add && <div style={{ marginTop: 12 }}>
        <p className="mut" style={{ marginBottom: 8 }}>Pega un alumno por línea con el formato <b>Apellidos, Nombres</b> (puedes copiar la columna directo desde Excel). El QR se genera solo.</p>
        <textarea placeholder={'♂ HOMBRES\nAguilera De La Cruz, Leonel Dylan\nAponte Huancaya, Rafael Aaron'} value={h} onChange={e => setH(e.target.value)} />
        <textarea placeholder={'♀ MUJERES\nBalbin Bautista, Sully Cielo Alejandra'} value={m} onChange={e => setM(e.target.value)} />
        {msg && <div className={'msg ' + (msg.e ? 'er' : 'ok')}>{msg.e || msg.ok}</div>}
        <button className="btn block" onClick={bulk}>Guardar alumnos</button>
      </div>}
    </div>
    {sec('♂ Hombres', 'H', '#38bdf8')}
    {sec('♀ Mujeres', 'M', '#f472b6')}
    {enr && <Enroll s={enr} onClose={() => setEnr(null)} onSaved={onChange} />}
  </>);
}
