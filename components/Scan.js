'use client';
import { useRef, useState } from 'react';
import jsQR from 'jsqr';
import { useCamera } from '@/lib/useCamera';
import { loadFace } from '@/lib/face';

const LBL = { A: 'Asistió · Puntual', T: 'Tardanza', J: 'Justificado', F: 'Falta' };

export default function Scan({ onMarked }) {
  const { videoRef, start, stop } = useCamera();
  const [mode, setMode] = useState(null);
  const [facing, setFacing] = useState('environment');
  const touched = useRef(false);
  const [msg, setMsg] = useState('');
  const [res, setRes] = useState(null);
  const run = useRef(0);
  const canvas = useRef(null);
  const last = useRef({ k: '', t: 0 });

  async function mark(body) {
    const k = JSON.stringify(body), n = Date.now();
    if (last.current.k === k && n - last.current.t < 4000) return;
    last.current = { k, t: n };
    const r = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setRes(r.ok ? d : { error: d.error || 'Error' });
    navigator.vibrate?.(r.ok ? 60 : [60, 40, 60]);
    if (r.ok) onMarked?.();
  }

  function qrLoop(id) {
    const v = videoRef.current, c = canvas.current, x = c.getContext('2d', { willReadFrequently: true });
    let t = 0;
    const tick = ts => {
      if (run.current !== id) return;
      if (ts - t > 130 && v.readyState >= 2 && v.videoWidth) {
        t = ts;
        const s = Math.min(1, 640 / v.videoWidth);
        c.width = v.videoWidth * s; c.height = v.videoHeight * s;
        x.drawImage(v, 0, 0, c.width, c.height);
        const im = x.getImageData(0, 0, c.width, c.height);
        const q = jsQR(im.data, c.width, c.height, { inversionAttempts: 'dontInvert' });
        if (q && q.data.startsWith('ASIST|')) mark({ qr: q.data, method: 'qr' });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  async function faceLoop(id) {
    let f;
    try { f = await loadFace(); } catch { return setMsg('No se pudo cargar el modelo facial (revisa tu internet)'); }
    const j = await fetch('/api/students?faces=1').then(x => x.json());
    const db = (j.students || []).filter(s => s.face).map(s => ({ id: s.id, d: new Float32Array(s.face) }));
    if (!db.length) return setMsg('Aún no hay rostros registrados. Ve a Alumnos → Registrar rostro.');
    setMsg('Mira a la cámara 🙂');
    let streak = { id: 0, n: 0 };
    while (run.current === id) {
      try {
        const v = videoRef.current;
        if (v && v.readyState >= 2) {
          const det = await f.detectSingleFace(v, new f.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks(true).withFaceDescriptor();
          if (det) {
            const ds = db.map(s => ({ id: s.id, dist: f.euclideanDistance(det.descriptor, s.d) })).sort((a, b) => a.dist - b.dist);
            const [b1, b2] = ds;
            if (b1.dist < 0.5 && (!b2 || b2.dist - b1.dist > 0.04)) {
              streak = streak.id === b1.id ? { id: b1.id, n: streak.n + 1 } : { id: b1.id, n: 1 };
              if (streak.n >= 2) { await mark({ studentId: b1.id, method: 'face' }); streak = { id: 0, n: 0 }; }
            } else streak = { id: 0, n: 0 };
          }
        }
      } catch {}
      await new Promise(r => setTimeout(r, 350));
    }
  }

  async function begin(m, fc) {
    const id = ++run.current;
    setMode(m); setFacing(fc); setRes(null);
    setMsg(m === 'qr' ? 'Apunta al código QR del alumno' : 'Cargando reconocimiento facial…');
    try { await start(fc); } catch (e) { setMsg('No se pudo abrir la cámara: ' + e.message); setMode(null); return; }
    m === 'qr' ? qrLoop(id) : faceLoop(id);
  }
  function halt() { run.current++; stop(); setMode(null); setMsg(''); }
  const pick = f => { touched.current = true; setFacing(f); if (mode) begin(mode, f); };

  return (
    <div className="card">
      <h2>Registrar asistencia con cámara</h2>
      <div className="tabs">
        <button className={facing === 'environment' ? 'on' : ''} onClick={() => pick('environment')}>📷 Trasera</button>
        <button className={facing === 'user' ? 'on' : ''} onClick={() => pick('user')}>🤳 Frontal</button>
      </div>
      <div className="row">
        <button className="btn" onClick={() => begin('qr', facing)}>▣ Cámara para QR</button>
        <button className="btn sec" onClick={() => begin('face', touched.current ? facing : 'user')}>🙂 Cámara facial</button>
      </div>
      <div className="scanbox" style={{ display: mode ? 'block' : 'none' }}>
        <video ref={videoRef} playsInline muted autoPlay style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
        <div className={'frame' + (mode === 'face' ? ' face' : '')} />
      </div>
      <canvas ref={canvas} hidden />
      {msg && <p className="mut" style={{ textAlign: 'center' }}>{msg}</p>}
      {mode && <button className="btn sec block" onClick={halt}>■ Detener cámara</button>}
      {res && (res.error
        ? <div className="res err"><span className="badge F">✕</span><b>{res.error}</b></div>
        : <div className={'res ' + res.estado}>
            <span className="badge" style={{ background: 'var(--' + res.estado + ')' }}>{res.estado}</span>
            <div><b>{res.student.apellidos}, {res.student.nombres}</b><div className="mut">{LBL[res.estado]} · {res.hora}{res.dup ? ' · ya estaba registrado' : ''}</div></div>
          </div>)}
    </div>
  );
}
