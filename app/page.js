'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const r = useRouter();
  const [tab, setTab] = useState('in');
  const [f, setF] = useState({ username: '', password: '', password2: '', code: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch('/api/auth/me').then(x => x.ok && r.replace('/panel')); }, [r]);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  async function go(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    const res = await fetch('/api/auth/' + (tab === 'in' ? 'login' : 'register'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(d.error || 'Error de conexión');
    r.replace('/panel');
  }
  return (
    <div className="auth">
      <form className="card" onSubmit={go}>
        <img className="logo" src="/icon-192.png" alt="" />
        <h1 style={{ textAlign: 'center' }}><span className="grad">Asistencia QR</span></h1>
        <p className="mut" style={{ textAlign: 'center', margin: '4px 0 18px' }}>Control escolar inteligente · QR y reconocimiento facial</p>
        <div className="tabs">
          <button type="button" className={tab === 'in' ? 'on' : ''} onClick={() => { setTab('in'); setErr(''); }}>Iniciar sesión</button>
          <button type="button" className={tab === 'up' ? 'on' : ''} onClick={() => { setTab('up'); setErr(''); }}>Registrarse</button>
        </div>
        <input placeholder="Usuario" autoCapitalize="none" autoComplete="username" value={f.username} onChange={set('username')} />
        <input type="password" placeholder="Contraseña" autoComplete={tab === 'in' ? 'current-password' : 'new-password'} value={f.password} onChange={set('password')} />
        {tab === 'up' && <>
          <input type="password" placeholder="Repetir contraseña" autoComplete="new-password" value={f.password2} onChange={set('password2')} />
          <input placeholder="Código de registro (te lo da el administrador)" autoCapitalize="characters" value={f.code} onChange={set('code')} />
        </>}
        {err && <div className="msg er">{err}</div>}
        <button className="btn block" disabled={busy}>{busy ? 'Un momento…' : tab === 'in' ? 'Entrar' : 'Crear cuenta'}</button>
      </form>
    </div>
  );
}
