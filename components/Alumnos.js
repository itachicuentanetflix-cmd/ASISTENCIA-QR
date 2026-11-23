'use client';
import { useEffect, useRef, useState } from 'react';
import { useCamera } from '@/lib/useCamera';
import { loadFace, opts, cropPhoto } from '@/lib/face';
import { play, unlockSound } from '@/lib/sound';
import { I } from './Icons';
import Avatar from './Avatar';

const patch = body => fetch('/api/students', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// Registro de rostros automático: detecta, captura, guarda y pasa al siguiente alumno sin tocar nada.
function Enroll({ queue, onClose, onSaved }) {
  const { videoRef, start } = useCamera();
  const fRef = useRef(null);
  const [facing, setFacing] = useState('user');
  const [ready, setReady] = useState(false);
  const [idx, setIdx] = useState(0);
  const [st, setSt] = useState('Cargando reconocimiento facial…');
  const [prog, setProg] = useState(0);
  const [done, setDone] = useState(null);
  const s = queue[idx];

  useEffect(() => {
    let alive = true;
    (async () => {
      try { fRef.current = fRef.current || await loadFace(); await start(facing); if (alive) setReady(true); }
      catch (e) { if (alive) setSt('Error: ' + e.message); }
    })();
    return () => { alive = false; };
  }, [facing, start]);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setProg(0); setDone(null); setSt('Mira a la cámara, ya casi…');
    (async () => {
      const f = fRef.current, v = videoRef.current, ds = []; let photo = null, last = 0;
      while (alive && ds.length < 4) {
        try {
          if (v.readyState >= 2 && v.videoWidth) {
            const det = await f.detectSingleFace(v, opts(f)).withFaceLandmarks(true).withFaceDescriptor();
            if (!det) setSt('No veo el rostro… acércate un poco');
            else if (det.detection.score > 0.6 && det.detection.box.width > v.videoWidth * 0.2) {
              setSt('Perfecto, no te muevas…');
              const now = Date.now();
              if (now - last > 220) { last = now; ds.push(det.descriptor); if (ds.length === 1) photo = cropPhoto(v, det.detection.box); setProg(ds.length / 4); }
            } else setSt('Acércate un poco más');
          }
        } catch {}
        await new Promise(r => requestAnimationFrame(r));
      }
      if (!alive) return;
      const face = Array.from({ length: 128 }, (_, i) => ds.reduce((a, d) => a + d[i], 0) / ds.length);
      const r = await patch({ id: s.id, face, photo });
      if (!r.ok) return setSt('No se pudo guardar. Intenta de nuevo.');
      play('ok'); setDone(photo); onSaved();
      await new Promise(r => setTimeout(r, 1400));
      if (!alive) return;
      idx + 1 < queue.length ? setIdx(idx + 1) : onClose();
    })();
    return () => { alive = false; };
  }, [ready, idx]); // eslint-disable-line

  return (
    <div className="modal"><div className="card">
      <div className="between"><span className="mut">Alumno {idx + 1} de {queue.length}</span>
        <button className="btn sec sm" onClick={onClose}><I n="x" s={16} />Cerrar</button></div>
      <div style={{ textAlign: 'center', margin: '8px 0 10px' }}><h2 style={{ justifyContent: 'center', marginBottom: 2 }}>{s.nombres}</h2><div className="mut">{s.apellidos}</div></div>
      <div className="scanbox" style={{ aspectRatio: '1/1' }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
        <div className="frame face" />
        {done && <div className="ring" style={{ background: 'rgba(3,6,15,.7)', flexDirection: 'column', gap: 10 }}>
          <img className="av" src={done} style={{ width: 150, height: 150, borderColor: '#22c55e' }} alt="" />
          <span className="badge A" style={{ height: 34 }}><I n="check" s={18} w={3} />&nbsp;Guardado</span></div>}
      </div>
      <div className="pbar"><i style={{ width: prog * 100 + '%' }} /></div>
      <p className="mut" style={{ textAlign: 'center', marginBottom: 12 }}>{st}</p>
      <div className="row">
        <button className="btn sec" onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')}><I n="flip" />Girar cámara</button>
        <button className="btn sec" disabled={idx + 1 >= queue.length} onClick={() => setIdx(idx + 1)}>Omitir</button>
      </div>
    </div></div>
  );
}

export default function Alumnos({ students, onChange }) {
  const [add, setAdd] = useState(false);
  const [h, setH] = useState('');
  const [m, setM] = useState('');
  const [msg, setMsg] = useState(null);
  const [queue, setQueue] = useState(null);
  const withFace = students.filter(s => s.has_face).length;
  const pending = students.filter(s => !s.has_face);

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
  const sec = (t, g, col) => {
    const L = students.filter(s => s.gender === g);
    return (<div className="card"><div className="between"><h2 style={{ color: col }}><I n="users" s={19} />{t}</h2><span className="mut">{L.length}</span></div>
      {L.map(s => (<div className="item" key={s.id}>
        <Avatar s={s} size={46} />
        <div className="tx"><b>{s.apellidos}</b><small>{s.nombres}</small></div>
        <button className={'btn sm icb ' + (s.has_face ? 'sec' : '')} title={s.has_face ? 'Rehacer rostro' : 'Registrar rostro'} onClick={() => { unlockSound(); setQueue([s]); }}><I n={s.has_face ? 'refresh' : 'face'} s={18} /></button>
        {s.has_face && <button className="btn sec sm icb" title="Quitar rostro" onClick={async () => { await patch({ id: s.id, face: null }); onChange(); }}><I n="ban" s={18} /></button>}
        <button className="btn danger sm icb" title="Eliminar alumno" onClick={() => del(s)}><I n="trash" s={18} /></button>
      </div>))}
      {!L.length && <p className="mut">Sin alumnos aquí todavía.</p>}
    </div>);
  };
  return (<>
    <div className="card">
      <div className="between"><h2><I n="users" s={19} />Mis alumnos ({students.length})</h2></div>
      {students.length > 0 && <>
        <div className="between mut"><span>Rostros registrados</span><b style={{ color: '#fff' }}>{withFace}/{students.length}</b></div>
        <div className="pbar"><i style={{ width: (withFace / students.length) * 100 + '%' }} /></div></>}
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn" disabled={!pending.length} onClick={() => { unlockSound(); setQueue(pending); }}><I n="face" />Registrar rostros{pending.length ? ` (${pending.length})` : ''}</button>
        <button className="btn sec" onClick={() => setAdd(!add)}><I n="plus" />Agregar varios</button>
      </div>
      <div className="row" style={{ marginTop: 10 }}><a className="btn sec" href="/tarjetas" target="_blank" rel="noreferrer"><I n="idcard" />Tarjetas QR para imprimir</a></div>
      {add && <div style={{ marginTop: 14 }}>
        <p className="mut" style={{ marginBottom: 8 }}>Pega un alumno por línea con el formato <b>Apellidos, Nombres</b> (puedes copiar la columna desde Excel). El QR se crea solo.</p>
        <textarea placeholder={'HOMBRES\nAguilera De La Cruz, Leonel Dylan'} value={h} onChange={e => setH(e.target.value)} />
        <textarea placeholder={'MUJERES\nBalbin Bautista, Sully Cielo Alejandra'} value={m} onChange={e => setM(e.target.value)} />
        {msg && <div className={'msg ' + (msg.e ? 'er' : 'ok')}><I n={msg.e ? 'alert' : 'check'} s={18} />{msg.e || msg.ok}</div>}
        <button className="btn block" onClick={bulk}><I n="check" />Guardar alumnos</button>
      </div>}
    </div>
    {sec('Hombres', 'H', '#60a5fa')}
    {sec('Mujeres', 'M', '#f472b6')}
    {queue && <Enroll queue={queue} onClose={() => setQueue(null)} onSaved={onChange} />}
  </>);
}
