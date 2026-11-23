# Asistencia QR (PWA) — Next.js + Neon + Vercel

Asistencia escolar con QR y reconocimiento facial para iPhone y Android (instalable).
- **Administrador** (variables ADMIN_USER / ADMIN_PASS): solo gestiona profesores, códigos, descargas y limpieza de datos.
- **Profesores**: cada uno tiene sus propios alumnos, QR, rostros, horario y Excel. Nadie ve los alumnos de otro profesor.

## Instalación nueva
1. **Neon** → SQL Editor → ejecuta `database.sql`. Copia el *Connection string*.
2. VS Code: `npm install`. Copia `.env.example` a `.env.local` y completa las 4 variables.
3. Sube a GitHub y despliega en Vercel con las mismas 4 variables.
4. Entra como admin → Profesores → genera un código → el profesor se registra con ese código.
5. Cuando "deysi" ya esté registrada, ejecuta `seed_alumnos_3F.sql` para cargar sus 33 alumnos (23 H y 10 M) y su salón.

## Si ya tenías la versión 1 instalada
Ejecuta `migracion.sql` (después de que "deysi" se registre) y vuelve a desplegar.

## Uso del reconocimiento facial
Alumnos → "Registrar rostros": automático, uno tras otro (guarda también la foto de perfil). Luego Asistencia → Facial.
