let ctx;
export function unlockSound() {
  try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch {}
}
function tone(f, t0, d, type = 'sine', v = 0.28) {
  const t = ctx.currentTime + t0, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + d + 0.03);
}
// A = puntual, T = tardanza, ok = justificado/guardado, dup = ya registrado, err = error
export function play(k) {
  if (!ctx) unlockSound(); if (!ctx) return;
  if (k === 'A') { tone(880, 0, 0.12); tone(1320, 0.12, 0.2); }
  else if (k === 'T') { tone(620, 0, 0.14); tone(620, 0.2, 0.14); }
  else if (k === 'ok') { tone(988, 0, 0.1); tone(1319, 0.1, 0.16); }
  else if (k === 'dup') tone(520, 0, 0.12, 'triangle');
  else { tone(170, 0, 0.3, 'sawtooth', 0.18); }
}
