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

