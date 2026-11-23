export function limaNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date()).map(x => [x.type, x.value]));
  const h = p.hour === '24' ? '00' : p.hour;
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${h}:${p.minute}:${p.second}`, min: +h * 60 + +p.minute };
}
export const toMin = (s) => { const [a, b] = String(s).split(':'); return +a * 60 + +b; };
export const isWeekday = (f) => { const d = new Date(f + 'T12:00:00Z').getUTCDay(); return d >= 1 && d <= 5; };
