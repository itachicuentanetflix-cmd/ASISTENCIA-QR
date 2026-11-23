'use client';
import { useState } from 'react';
export default function Avatar({ s, size = 44 }) {
  const [bad, setBad] = useState(false);
  const st = { width: size, height: size };
  if (s.has_face && !bad) return <img className="av" style={st} src={`/api/photo?id=${s.id}&v=${s.fv || 0}`} onError={() => setBad(true)} alt="" />;
  const ini = ((s.apellidos || '?')[0] + (s.nombres || '')[0]).toUpperCase();
  return <div className="av ph" style={{ ...st, fontSize: size * 0.36, background: s.gender === 'M' ? 'linear-gradient(135deg,#ec4899,#be185d)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>{ini}</div>;
}
