-- ============================================================
-- MI SALA · Plantilla base — Esquema Supabase
-- Pega TODO este archivo en Supabase → SQL Editor → Run.
-- Crea las tablas, las políticas de seguridad (RLS) y los
-- buckets de archivos. Todo en el plan gratuito.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Tareas y notas ----------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  area text not null default 'personal',
  done boolean not null default false,
  tags text
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text default '',
  body text default '',
  tags text
);

-- ---------- Estudios: temario ----------
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  title text not null,
  url text,
  done boolean not null default false,
  ord int not null default 0,
  pdf_path text
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  lang text not null default 'en',
  day int not null,
  title text not null,
  body text,
  quiz jsonb not null default '[]'::jsonb
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  ord int not null default 0,
  title text not null,
  url text,
  note text
);

create table if not exists quiz_results (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  lesson_id uuid,
  score int not null default 0,
  total int not null default 0
);

-- ---------- Estudios: tests y simulacros ----------
create table if not exists test_questions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  bank text not null,
  subject text,
  ord int not null default 0,
  qid text,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct int not null default 0,
  explanation text,
  complementary boolean not null default false
);
create index if not exists test_questions_bank_idx on test_questions (bank);

create table if not exists test_attempts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  bank text not null,
  total int not null,
  score int not null,
  kind text not null default 'custom'
);

create table if not exists test_answers (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  attempt_id bigint,
  question_id bigint,
  chosen int,
  correct boolean
);
create index if not exists test_answers_attempt_idx on test_answers (attempt_id);

create table if not exists test_question_state (
  question_id bigint primary key,
  bank text,
  seen int not null default 0,
  ok int not null default 0,
  fail int not null default 0,
  last_correct boolean not null default false,
  streak int not null default 0,
  due date,
  updated_at timestamptz not null default now()
);

create table if not exists test_summaries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  attempt_id bigint,
  bank text,
  estado text not null default 'pendiente',
  body text
);

-- ---------- Agenda ----------
create table if not exists agenda_hidden (
  event_key text primary key,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists agenda_cal_hidden (
  calendar_id text primary key,
  name text,
  created_at timestamptz not null default now()
);

-- ---------- Idiomas ----------
create table if not exists kana_stats (
  kana text primary key,
  ok int not null default 0,
  fail int not null default 0,
  last_fail timestamptz,
  streak int not null default 0,
  due date,
  updated_at timestamptz not null default now()
);

create table if not exists jp_learning (
  user_id uuid primary key default auth.uid(),
  updated_at timestamptz not null default now(),
  payload jsonb
);

-- ---------- Música ----------
create table if not exists music_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  day date not null,
  platform text not null,
  metric text not null,
  value integer not null,
  note text,
  image_path text
);
create index if not exists music_entries_day_idx on music_entries (day desc);

create table if not exists music_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text,
  period text,
  body text
);

-- ---------- Comida / Deporte / Dinero ----------
create table if not exists food_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  kind text not null default 'casa',
  note text,
  fav boolean not null default false,
  mine boolean not null default false,
  kcal int,
  grams int,
  recipe jsonb
);

create table if not exists sport_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  day date not null,
  minutes int not null,
  km numeric,
  note text
);

create table if not exists fin_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  day date not null,
  kind text not null default 'gasto',
  concept text not null,
  amount numeric not null,
  iva int
);

-- ---------- Personalización y sistema ----------
create table if not exists personalizacion (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid(),
  tipo text not null,
  texto text,
  imagen_path text,
  activa boolean not null default false,
  estado text not null default 'pendiente',
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  endpoint text primary key,
  p256dh text,
  auth text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists sala_settings (
  key text primary key,
  value text
);

-- ---------- Seguridad (RLS): solo usuarios con sesión ----------
-- La app es monousuario: el login ya está limitado por ALLOWED_EMAILS
-- en config.js. Aquí damos acceso completo a quien tenga sesión válida.
do $$
declare t text;
begin
  foreach t in array array[
    'tasks','notes','topics','lessons','resources','quiz_results',
    'test_questions','test_attempts','test_answers','test_question_state','test_summaries',
    'agenda_hidden','agenda_cal_hidden','kana_stats','jp_learning',
    'music_entries','music_reports','food_items','sport_sessions','fin_entries',
    'personalizacion','push_subscriptions','sala_settings'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists owner_all on %I', t);
    execute format('create policy owner_all on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ---------- Buckets de archivos (privados) ----------
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false), ('personalizacion', 'personalizacion', false), ('music', 'music', false)
on conflict (id) do nothing;

drop policy if exists storage_auth_read on storage.objects;
create policy storage_auth_read on storage.objects for select to authenticated
  using (bucket_id in ('pdfs','personalizacion','music'));
drop policy if exists storage_auth_write on storage.objects;
create policy storage_auth_write on storage.objects for insert to authenticated
  with check (bucket_id in ('pdfs','personalizacion','music'));
drop policy if exists storage_auth_update on storage.objects;
create policy storage_auth_update on storage.objects for update to authenticated
  using (bucket_id in ('pdfs','personalizacion','music'));
drop policy if exists storage_auth_delete on storage.objects;
create policy storage_auth_delete on storage.objects for delete to authenticated
  using (bucket_id in ('pdfs','personalizacion','music'));

-- Listo: ya puedes entrar a la app con el usuario que crees en Authentication.
