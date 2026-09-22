-- Vocab Case File — initial schema
-- Single-user app: no auth tables. /admin writes are gated by a PIN check in
-- the app layer and use the service-role key; everything else uses the anon
-- key under the read/write policies below.

create extension if not exists "pgcrypto";

-- 1. weeks ------------------------------------------------------------
create table weeks (
  id uuid primary key default gen_random_uuid(),
  week_number int not null unique,
  start_date date not null,
  theme_title text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now()
);

-- 2. cases --------------------------------------------------------------
create table cases (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references weeks(id) on delete cascade,
  case_title text not null,
  source_note text,
  created_at timestamptz not null default now()
);

create index cases_week_id_idx on cases(week_id);

-- 3. rounds ---------------------------------------------------------------
create table rounds (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  order_index int not null,
  target_word text not null,
  sentence_html text not null,
  hint_text text,
  options jsonb not null,
  correct_index int not null check (correct_index between 0 and 3),
  code_fragment text not null,
  created_at timestamptz not null default now()
);

create index rounds_case_id_idx on rounds(case_id);

-- 4. progress ---------------------------------------------------------
create table progress (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  is_solved boolean not null default false,
  solved_at timestamptz,
  attempts int not null default 0,
  unique (round_id)
);

-- 5. settings (single row, single user) --------------------------------
create table settings (
  id int primary key default 1,
  reminder_morning_time time not null default '08:00',
  reminder_evening_time time not null default '18:00',
  push_subscription jsonb,
  constraint settings_singleton check (id = 1)
);

insert into settings (id) values (1);

-- Row Level Security ------------------------------------------------------
-- No auth system exists, so every policy targets the `anon` role. Content
-- writes to weeks/cases/rounds are intentionally NOT exposed to anon — those
-- only happen server-side through /admin using the service-role key.

alter table weeks enable row level security;
alter table cases enable row level security;
alter table rounds enable row level security;
alter table progress enable row level security;
alter table settings enable row level security;

create policy "weeks are readable" on weeks for select using (true);
create policy "cases are readable" on cases for select using (true);
create policy "rounds are readable" on rounds for select using (true);

create policy "progress is readable" on progress for select using (true);
create policy "progress is writable" on progress for insert with check (true);
create policy "progress is updatable" on progress for update using (true);

create policy "settings are readable" on settings for select using (true);
create policy "settings are updatable" on settings for update using (true);
