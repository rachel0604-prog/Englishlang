-- Adds the real twice-daily (AM/PM) session structure from the learner's
-- roadmap doc: 5 weekdays x {morning, evening} = 10 sessions/week, each with
-- its own activity type. Quiz-type sessions (vocab_game, root_context,
-- logic_puzzle, spaced_review) link to a `cases` row and are graded via the
-- existing rounds/progress mechanism. All other types are self-directed —
-- the learner does the work off-app and self-reports completion here.

create table sessions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references weeks(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 5),
  time_of_day text not null check (time_of_day in ('morning', 'evening')),
  session_type text not null check (session_type in (
    'reading', 'vocab_game', 'root_context', 'logic_puzzle',
    'listening', 'rewrite', 'spaced_review', 'speaking', 'writing_quiz'
  )),
  title text not null,
  instructions text not null,
  case_id uuid references cases(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (week_id, day_of_week, time_of_day)
);

create index sessions_week_id_idx on sessions(week_id);
create index sessions_case_id_idx on sessions(case_id);

create table session_progress (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  is_complete boolean not null default false,
  completed_at timestamptz,
  unique (session_id)
);

alter table sessions enable row level security;
alter table session_progress enable row level security;

create policy "sessions are readable" on sessions for select using (true);

create policy "session_progress is readable" on session_progress for select using (true);
create policy "session_progress is writable" on session_progress for insert with check (true);
create policy "session_progress is updatable" on session_progress for update using (true);
