-- 담당: 김씨 · Supabase SQL Editor 에서 실행한다.
-- 모든 접근은 Vercel 함수(service_role)로만 한다. RLS 를 켜고 정책을 만들지 않으면
-- anon 키로는 읽기·쓰기가 모두 막힌다. 공개 정책을 추가하지 말 것.

create table if not exists public.sessions (
  id           uuid primary key default gen_random_uuid(),
  nickname     text not null check (char_length(nickname) between 1 and 16),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  hints_used   integer not null default 0,
  stage_times  jsonb not null default '{}'::jsonb
);

create table if not exists public.rankings (
  session_id   uuid primary key references public.sessions(id) on delete cascade,
  nickname     text not null,
  final_time   integer not null,           -- ms (클리어 시간 + 힌트 패널티)
  hints_used   integer not null,
  created_at   timestamptz not null default now()
);

create index if not exists rankings_final_time_idx on public.rankings (final_time asc);

alter table public.sessions enable row level security;
alter table public.rankings enable row level security;
