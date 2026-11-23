-- Ejecuta TODO este archivo en Neon → SQL Editor (instalación nueva)
create table if not exists users(
  id serial primary key, username text unique not null, pass_hash text not null,
  status text not null default 'active', created_at timestamptz default now());
create table if not exists codes(
  code text primary key, created_at timestamptz default now(),
  used_by int references users(id) on delete set null, used_at timestamptz);
create table if not exists students(
  id serial primary key,
  owner_id int not null references users(id) on delete cascade,   -- profesor dueño del alumno
  apellidos text not null, nombres text not null,
  gender char(1) not null check (gender in ('H','M')), aula text not null,
  qr text not null, face jsonb, photo text, face_at timestamptz,
  created_at timestamptz default now(), unique(owner_id, qr));
create table if not exists attendance(
  id serial primary key, student_id int not null references students(id) on delete cascade,
  fecha date not null, estado char(1) not null check (estado in ('A','T','F','J')),
  hora time, motivo text, metodo text, usuario text, unique(student_id, fecha));
create index if not exists attendance_fecha_idx on attendance(fecha);
create table if not exists user_settings(
  user_id int not null references users(id) on delete cascade,
  key text not null, value text not null, primary key(user_id, key));
