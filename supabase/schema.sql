-- Proxy Hearts Database Schema for Supabase Postgres
-- Run this script in your Supabase SQL Editor

create extension if not exists "pgcrypto";

-- 1. People
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text,
  linkedin_url text not null,
  instagram_url text not null,
  instagram_username text,
  photo_url text,
  open_to text default 'anyone', -- 'women' | 'men' | 'anyone'
  gender text, -- optional, only if user provides it
  pool text not null default 'demo', -- 'demo' (frozen season) | 'live'
  status text not null default 'pending',
  -- pending|scraping|scraped|analyzing|ready|swiped|dating|ranked|failed
  error text,
  li_run_id text,
  ig_run_id text,
  created_at timestamptz default now(),
  unique (linkedin_url, instagram_url)
);

-- 2. Raw Scrapes Cache
create table if not exists raw_scrapes (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  source text not null, -- 'linkedin' | 'instagram'
  url text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

-- 3. Profiles (Dossier, Analysis, Agent Card, Reading Log)
create table if not exists profiles (
  person_id uuid primary key references people(id) on delete cascade,
  dossier jsonb not null,
  analysis jsonb not null,
  agent_card jsonb not null,
  reading_log jsonb,
  model text,
  created_at timestamptz default now()
);

-- 4. Swipes (Pairwise candidate screening)
create table if not exists swipes (
  from_id uuid references people(id) on delete cascade,
  to_id uuid references people(id) on delete cascade,
  score int not null,
  reason text,
  primary key (from_id, to_id)
);

-- 5. Dates
create table if not exists dates (
  id uuid primary key default gen_random_uuid(),
  a_id uuid references people(id) on delete cascade,
  b_id uuid references people(id) on delete cascade,
  pool text not null default 'demo',
  status text not null default 'scheduled', -- scheduled|live|done|failed
  phase text default 'opener',
  step int default 0,
  date_card jsonb,
  twist text,
  a_debrief jsonb,
  b_debrief jsonb,
  outcome text, -- match|one_sided|pass
  chemistry int,
  created_at timestamptz default now()
);

-- 6. Date Messages (Turn-by-turn dialogue & private thoughts)
create table if not exists date_messages (
  id bigserial primary key,
  date_id uuid references dates(id) on delete cascade,
  seq int not null,
  speaker text not null, -- 'a' | 'b' | 'narrator'
  phase text not null,
  message text not null,
  thought text,
  vibe int,
  proposal jsonb,
  created_at timestamptz default now(),
  unique (date_id, seq)
);

