import { getTeacher } from '@/lib/auth';
import { sql } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const s = await getTeacher();
  if (!s) return new Response('No autorizado', { status: 401 });
  const id = +new URL(req.url).searchParams.get('id');
  const r = await sql`select photo from students where id=${id} and owner_id=${s.id}`;
  if (!r[0]?.photo) return new Response('', { status: 404 });
  return new Response(Buffer.from(r[0].photo, 'base64'), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' } });
}
