import { sql } from './db';
export const DEF = { hora_inicio: '07:55', limite_puntual: '07:56', hora_falta: '14:00', aula: '3°F', escuela: 'I.E. 0027', profesora: 'Deysi', anio: '2026' };
export async function getConfig() {
  const rows = await sql`select key, value from settings`;
  return { ...DEF, ...Object.fromEntries(rows.map(r => [r.key, r.value])) };
}
