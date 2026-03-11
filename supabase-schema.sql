-- ============================================================
-- Doggies Gone Wild — KPI Dashboard — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- Project: Settings → SQL Editor → New Query → paste & run
-- ============================================================

-- KPI Daily Entries (one row per location per day)
create table if not exists kpi_entries (
  id           uuid primary key default gen_random_uuid(),
  location     text not null,         -- 'doral' | 'westmia' | 'hialeah'
  entry_date   date not null,         -- YYYY-MM-DD
  data         jsonb not null default '{}',
  locked       boolean default false,
  updated_at   timestamptz default now(),
  unique(location, entry_date)
);

-- Monthly Fixed Expenses (one row per location per month)
create table if not exists fixed_expenses (
  id           uuid primary key default gen_random_uuid(),
  location     text not null,
  month        text not null,         -- YYYY-MM format
  data         jsonb not null default '{}',
  updated_at   timestamptz default now(),
  unique(location, month)
);

-- Cost Center Allocations (per location — editable per location)
create table if not exists cost_centers (
  id           uuid primary key default gen_random_uuid(),
  location     text not null,
  expense_key  text not null,
  label        text not null,
  dc_pct       numeric not null default 0,  -- daycare share (0-1)
  bd_pct       numeric not null default 0,  -- boarding share (0-1)
  gr_pct       numeric not null default 0,  -- grooming share (0-1)
  unique(location, expense_key)
);

-- ── Row Level Security ──────────────────────────────────────
-- Auth is handled at the app level (admin password).
-- Allow full anon access so the static HTML app can read/write.

alter table kpi_entries    enable row level security;
alter table fixed_expenses enable row level security;
alter table cost_centers   enable row level security;

create policy "anon_all" on kpi_entries    for all to anon using (true) with check (true);
create policy "anon_all" on fixed_expenses for all to anon using (true) with check (true);
create policy "anon_all" on cost_centers   for all to anon using (true) with check (true);

-- ── Seed Cost Centers for All 3 Locations ──────────────────
-- These match the current hardcoded FA values in the app.
-- You can edit them directly in Supabase Table Editor per location.

insert into cost_centers (location, expense_key, label, dc_pct, bd_pct, gr_pct) values
  -- Doral
  ('doral', 'rent',        'Rent',                        0.40, 0.40, 0.20),
  ('doral', 'fpl',         'FPL',                         0.45, 0.45, 0.10),
  ('doral', 'water',       'Water',                       0.20, 0.30, 0.50),
  ('doral', 'cleaning',    'Cleaning Supplies',           0.45, 0.45, 0.10),
  ('doral', 'groomSupply', 'Grooming Supplies',           0.00, 0.00, 1.00),
  ('doral', 'insurance',   'Insurance',                   0.33, 0.34, 0.33),
  ('doral', 'advertising', 'Advertising',                 0.33, 0.34, 0.33),
  ('doral', 'techComms',   'Internet, Phone & Software',  0.35, 0.35, 0.30),
  -- West Miami
  ('westmia', 'rent',        'Rent',                        0.40, 0.40, 0.20),
  ('westmia', 'fpl',         'FPL',                         0.45, 0.45, 0.10),
  ('westmia', 'water',       'Water',                       0.20, 0.30, 0.50),
  ('westmia', 'cleaning',    'Cleaning Supplies',           0.45, 0.45, 0.10),
  ('westmia', 'groomSupply', 'Grooming Supplies',           0.00, 0.00, 1.00),
  ('westmia', 'insurance',   'Insurance',                   0.33, 0.34, 0.33),
  ('westmia', 'advertising', 'Advertising',                 0.33, 0.34, 0.33),
  ('westmia', 'techComms',   'Internet, Phone & Software',  0.35, 0.35, 0.30),
  -- Hialeah
  ('hialeah', 'rent',        'Rent',                        0.40, 0.40, 0.20),
  ('hialeah', 'fpl',         'FPL',                         0.45, 0.45, 0.10),
  ('hialeah', 'water',       'Water',                       0.20, 0.30, 0.50),
  ('hialeah', 'cleaning',    'Cleaning Supplies',           0.45, 0.45, 0.10),
  ('hialeah', 'groomSupply', 'Grooming Supplies',           0.00, 0.00, 1.00),
  ('hialeah', 'insurance',   'Insurance',                   0.33, 0.34, 0.33),
  ('hialeah', 'advertising', 'Advertising',                 0.33, 0.34, 0.33),
  ('hialeah', 'techComms',   'Internet, Phone & Software',  0.35, 0.35, 0.30)
on conflict (location, expense_key) do nothing;

-- ── Useful Queries ──────────────────────────────────────────
-- View all entries for a location this month:
--   select * from kpi_entries where location='doral' and entry_date >= '2026-03-01';
--
-- View cost centers for a location:
--   select * from cost_centers where location='doral' order by expense_key;
--
-- Update a cost center split:
--   update cost_centers set dc_pct=0.50, bd_pct=0.30, gr_pct=0.20
--   where location='westmia' and expense_key='rent';
