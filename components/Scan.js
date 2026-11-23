'use client';
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useCamera } from '@/lib/useCamera';
import { loadFace, opts } from '@/lib/face';
import { play, unlockSound } from '@/lib/sound';
import { I } from './Icons';
import Avatar from './Avatar';

const LBL = { A: 'Puntual', T: 'Tardanza', J: 'Justificado' };

export default function Scan({ mode, onMarked }) {
  const { videoRef, start, stop } = useCamera();
  const [on, setOn] = useState(false);
  const [facing, setFacing] = useState(mode === 'face' ? 'user' : 'environment');
  const [msg, setMsg] = useState('');
  const [res, setRes] = useState(null);
  const [log, setLog] = useState([]);
  const run = useRef(0), canvas = useRef(null), seen = useRef({});

  useEffect(() => () => { run.current++; }, []);

  async function mark(body, key) {
    const now = Date.now();
    if (seen.current[key] && now - seen.current[key] < (body.method === 'face' ? 7000 : 3500)) return;
    seen.current[key] = now;
    const r = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { play('err'); navigator.vibrate?.([60, 40, 60]); return setRes({ error: d.error || 'Error' }); }
    play(d.dup ? 'dup' : d.estado === 'A' ? 'A' : d.estado === 'T' ? 'T' : 'ok');
    navigator.vibrate?.(60);
    setRes(d);
    if (!d.dup) { setLog(l => [{ ...d.student, estado: d.estado, hora: d.hora }, ...l].slice(0, 6)); onMarked?.(); }
  }

  function qrLoop(id) {
    const v = videoRef.current, c = canvas.current, x = c.getContext('2d', { willReadFrequently: true });
    let t = 0;
    const tick = ts => {
      if (run.current !== id) return;
      if (ts - t > 110 && v.readyState >= 2 && v.videoWidth) {
        t = ts;
        const s = Math.min(1, 560 / v.videoWidth);
        c.width = v.videoWidth * s; c.height = v.videoHeight * s;
        x.drawImage(v, 0, 0, c.width, c.height);
        const q = jsQR(x.getImageData(0, 0, c.width, c.height).data, c.width, c.height, { inversionAttempts: 'dontInvert' });
        if (q && q.data.startsWith('ASIST|')) mark({ qr: q.data, method: 'qr' }, q.data);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async function faceLoop(id) {
    let f;
    try { f = await loadFace(); } catch { return setMsg('No se pudo cargar el reconocimiento facial. Revisa tu internet.'); }
    const j = await fetch('/api/students?faces=1').then(x => x.json());
    const db = (j.students || []).map(s => ({ id: s.id, d: new Float32Array(s.face) }));
    if (!db.length) return setMsg('Aún no hay rostros registrados. Ve a Alumnos y toca "Registrar rostros".');
    setMsg('Listo: pide a los alumnos que miren a la cámara');
    let streak = {};
    while (run.current === id) {
      try {
        const v = videoRef.current;
        if (v && v.readyState >= 2 && v.videoWidth) {
          const dets = await f.detectAllFaces(v, opts(f)).withFaceLandmarks(true).withFaceDescriptors();
          const now = {};
          for (const det of dets) {
            const ds = db.map(s => ({ id: s.id, dist: f.euclideanDistance(det.descriptor, s.d) })).sort((a, b) => a.dist - b.dist);
            const [b1, b2] = ds;
            if (b1.dist < 0.5 && (!b2 || b2.dist - b1.dist > 0.035)) now[b1.id] = (streak[b1.id] || 0) + 1;
          }
          streak = now;
          for (const sid of Object.keys(now)) if (now[sid] >= 2) mark({ studentId: +sid, method: 'face' }, 'f' + sid);
        }
      } catch {}
      await new Promise(r => requestAnimationFrame(r));
    }
  }

  async function begin(fc = facing) {
    unlockSound();
    const id = ++run.current;
    setOn(true); setFacing(fc); setRes(null);
    setMsg(mode === 'qr' ? 'Apunta al código QR del alumno' : 'Cargando reconocimiento facial…');
    try { await start(fc); } catch (e) { setMsg('No se pudo abrir la cámara: ' + e.message); setOn(false); return; }
    mode === 'qr' ? qrLoop(id) : faceLoop(id);
  }
  function halt() { run.current++; stop(); setOn(false); setMsg(''); }

  return (<>
    <div className="card">
      {!on && <div className="idle">
        <div className={'chip ' + (mode === 'qr' ? 'c1' : 'c2')}><I n={mode === 'qr' ? 'qr' : 'face'} s={36} /></div>
        <h2 style={{ justifyContent: 'center' }}>{mode === 'qr' ? 'Asistencia con código QR' : 'Asistencia con rostro'}</h2>
        <p className="mut" style={{ marginBottom: 16 }}>{mode === 'qr' ? 'Cada alumno muestra su tarjeta y se registra al instante, con sonido.' : 'Puede reconocer a varios alumnos a la vez. Primero registra sus rostros en Alumnos.'}</p>
        <div className="seg" style={{ maxWidth: 320, margin: '0 auto 14px' }}>
          <button className={facing === 'environment' ? 'on' : ''} onClick={() => setFacing('environment')}><I n="camera" s={17} />Trasera</button>
          <button className={facing === 'user' ? 'on' : ''} onClick={() => setFacing('user')}><I n="user" s={17} />Frontal</button>
        </div>
        <button className="btn lg" onClick={() => begin(facing)}><I n="camera" />Iniciar cámara</button>
      </div>}
      <div className="scanbox" style={{ display: on ? 'block' : 'none' }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
        <div className={'frame' + (mode === 'face' ? ' face' : '')} />
        <div className="ov">
          <button className="btn sec" onClick={() => begin(facing === 'user' ? 'environment' : 'user')}><I n="flip" />Girar</button>
          <button className="btn danger" onClick={halt}><I n="stop" s={16} />Detener</button>
        </div>
      </div>
      <canvas ref={canvas} hidden />
      {on && msg && <p className="mut" style={{ textAlign: 'center', marginTop: 10 }}>{msg}</p>}
      {res && (res.error
        ? <div className="res err"><span className="badge F"><I n="x" s={16} /></span><b>{res.error}</b></div>
        : <div className={'res ' + res.estado}><Avatar s={res.student} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}><b>{res.student.apellidos}</b><div>{res.student.nombres}</div><div className="mut">{LBL[res.estado]} · {res.hora}{res.dup ? ' · ya estaba registrado' : ''}</div></div>
            <span className={'badge ' + res.estado}>{res.estado}</span></div>)}
    </div>
    {log.length > 0 && <div className="card"><h2><I n="clock" s={18} />Últimos registrados</h2>
      {log.map((s, i) => <div className="item" key={i}><Avatar s={s} size={38} /><div className="tx"><b>{s.apellidos}</b><small>{s.nombres}</small></div><span className="mut">{s.hora}</span><span className={'badge ' + s.estado}>{s.estado}</span></div>)}
    </div>}
  </>);
}
