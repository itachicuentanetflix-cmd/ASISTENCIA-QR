-- SOLO si ya instalaste la versión 1 (con alumnos cargados). Ejecuta en Neon → SQL Editor.
alter table students add column if not exists owner_id int references users(id) on delete cascade;
alter table students add column if not exists photo text;
alter table students add column if not exists face_at timestamptz;
alter table students drop constraint if exists students_qr_key;
create unique index if not exists students_owner_qr on students(owner_id, qr);
create table if not exists user_settings(
  user_id int not null references users(id) on delete cascade,
  key text not null, value text not null, primary key(user_id, key));
-- Después de que "deysi" se haya registrado, asigna los alumnos existentes a ella:
update students set owner_id=(select id from users where lower(username)='deysi') where owner_id is null;
insert into user_settings(user_id,key,value)
select u.id,k,v from users u, (values ('aula','3°F'),('escuela','I.E. 0027'),('profesora','Deysi'),('anio','2026')) t(k,v)
where lower(u.username)='deysi' on conflict do nothing;
