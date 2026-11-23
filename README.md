# Asistencia QR (PWA) — Next.js + Neon + Vercel

Control de asistencia escolar con QR y reconocimiento facial. Funciona en iPhone y Android, instalable.

## Instalación rápida
1. **Neon**: crea un proyecto → SQL Editor → ejecuta `database.sql` y luego `seed_alumnos_3F.sql`. Copia el *Connection string*.
2. **VS Code**: abre esta carpeta, en la terminal ejecuta `npm install`.
3. Copia `.env.example` a `.env.local` y completa `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASS`.
4. Prueba local: `npm run dev` → http://localhost:3000 (la cámara en el celular requiere HTTPS: prueba en Vercel).
5. **GitHub**: `git init`, `git add .`, `git commit -m "inicio"`, crea el repo y súbelo (`git push`).
6. **Vercel**: Add New → Project → importa el repo → Environment Variables (las 4 del paso 3) → Deploy.
7. Abre la URL en el celular. iPhone: Safari → Compartir → "Agregar a pantalla de inicio". Android: Chrome → "Instalar app".

## Uso
- Admin: entra con `ADMIN_USER`/`ADMIN_PASS` → pestaña 🛡️ Admin (códigos, usuarios, Excel, borrar mes, año).
- Alumnos → "Registrar rostro" (un alumno a la vez) y luego 🙂 Cámara facial en Escanear.
- Alumnos → "Tarjetas QR" para imprimir. El contenido del QR es `ASIST|3°F|Apellidos, Nombres` (igual al de tus QR actuales).
