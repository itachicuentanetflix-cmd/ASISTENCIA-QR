import { sql } from './db';
import { limaNow } from './time';
export const DEF = () => ({ hora_inicio: '07:55', limite_puntual: '07:56', hora_falta: '14:00', aula: 'Mi aula', escuela: 'Mi institución', profesora: '', anio: limaNow().fecha.slice(0, 4) });
export async function getConfig(uid) {
  const rows = await sql`select key, value from user_settings where user_id=${uid}`;
  return { ...DEF(), ...Object.fromEntries(rows.map(r => [r.key, r.value])) };
}
