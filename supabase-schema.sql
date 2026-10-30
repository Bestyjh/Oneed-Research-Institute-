-- Run this in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  phone text not null default '',
  organization text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bug_reports (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text not null,
  severity text not null default 'medium',
  reporter_email text not null default '',
  page_url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_bug_reports_created_at on public.bug_reports(created_at desc);
create index if not exists idx_bug_reports_user_id on public.bug_reports(user_id);

create table if not exists public.consultation_requests (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  service text not null default 'consultation',
  page_url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_consultation_requests_created_at on public.consultation_requests(created_at desc);
create index if not exists idx_consultation_requests_email on public.consultation_requests(email);
