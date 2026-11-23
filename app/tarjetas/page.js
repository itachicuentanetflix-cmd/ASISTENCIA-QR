'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function Tarjetas() {
  const [list, setList] = useState(null);
  const [cfg, setCfg] = useState({});
  useEffect(() => {
    (async () => {
      const [s, c] = await Promise.all([fetch('/api/students').then(r => r.ok ? r.json() : null), fetch('/api/config').then(r => r.ok ? r.json() : null)]);
      if (!s) return setList([]);
      setCfg(c?.cfg || {});
      const rows = await Promise.all(s.students.map(async x => ({ ...x, img: await QRCode.toDataURL(x.qr, { errorCorrectionLevel: 'M', margin: 1, width: 420, color: { dark: '#111827', light: '#ffffff' } }) })));
      setList(rows);
    })();
  }, []);
  if (!list) return <div className="auth"><p className="mut">Generando tarjetas…</p></div>;
  return (<>
    <div className="noprint" style={{ padding: 16 }}>
      <div className="card between"><div><h2>▣ Tarjetas QR ({list.length})</h2><p className="mut">Imprime o guarda como PDF. 9 tarjetas por hoja.</p></div>
        <button className="btn fit" onClick={() => window.print()}>🖨 Imprimir / PDF</button></div>
    </div>
    <div className="cards">
      {list.map(s => (<div className="qcard" key={s.id}>
        <div className="qtop"><span>{cfg.escuela}</span><span>{cfg.aula}</span></div>
        <img src={s.img} alt="" />
        <div className="qname"><small>{s.apellidos}</small><strong>{s.nombres}</strong></div>
        <div className="qfoot">ASISTENCIA {cfg.anio}</div>
      </div>))}
    </div>
  </>);
}
