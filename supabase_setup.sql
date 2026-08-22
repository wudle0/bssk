-- Supabase SQL Editor에 붙여넣고 실행하세요

create table if not exists records (
  id            text        primary key,
  no            integer     not null,
  book          text        not null,
  topic         text        default '',
  meeting_type  text        default '',
  presenter     text        default '',
  participants  text[]      default '{}',
  discussion_date timestamptz,
  opinions      jsonb       default '{}'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz
);

-- 실시간 구독 활성화
alter publication supabase_realtime add table records;

-- emoji 컬럼 추가 (이미 테이블이 있는 경우 실행)
alter table records add column if not exists emoji text default '';

-- cover_url 컬럼 추가 (이미 테이블이 있는 경우 실행)
alter table records add column if not exists cover_url text default '';

-- author, chapter 컬럼 추가
alter table records add column if not exists author text default '';
alter table records add column if not exists chapter text default '';

-- topics 배열 컬럼 추가 (화두 복수 지원)
alter table records add column if not exists topics text[] default '{}';

-- Row Level Security (공개 읽기/쓰기 — 소규모 팀용)
alter table records enable row level security;

create policy "allow all" on records
  for all using (true) with check (true);
