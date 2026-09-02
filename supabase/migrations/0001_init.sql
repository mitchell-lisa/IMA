-- MarketReady Risk Diagnostic — initial schema
--
-- Access model
--   * Prospects never connect to Supabase directly. All prospect reads and
--     writes go through Next.js route handlers using the service-role key,
--     which bypasses RLS.
--   * Producers authenticate with Supabase Auth (magic link). RLS lets a
--     producer listed in `producers` read leads/assessments and update the
--     review fields on leads. Nothing is granted to `anon`.

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
create table if not exists public.assessments (
  id              uuid primary key default gen_random_uuid(),
  results_token   text not null unique,
  status          text not null default 'in_progress' check (status in ('in_progress','completed')),
  profile         jsonb not null,
  answers         jsonb not null default '{}'::jsonb,
  result          jsonb,
  enrichment      jsonb,
  attribution     jsonb not null default '{}'::jsonb,
  ip_hash         text,
  user_agent      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index if not exists assessments_status_idx on public.assessments (status, created_at desc);
create index if not exists assessments_industry_idx on public.assessments ((profile->>'industry'));
create index if not exists assessments_partner_idx on public.assessments ((attribution->>'partnerCode'));

-- --------------------------------------------------------------------------
create table if not exists public.leads (
  id                        uuid primary key default gen_random_uuid(),
  assessment_id             uuid not null references public.assessments(id) on delete cascade,
  email                     text not null,
  name                      text,
  role                      text,
  phone                     text,
  consent_report            boolean not null default false,
  consent_marketing         boolean not null default false,
  consent_at                timestamptz not null default now(),
  consent_text_version      text not null,
  workshop_requested        boolean not null default false,
  preferred_contact         text check (preferred_contact in ('email','phone')),
  prospect_notes            text,
  lead_score                jsonb not null,
  disposition               text not null default 'new' check (disposition in (
                              'new','reviewing','contacted','workshop_scheduled','workshop_completed',
                              'opportunity','not_a_fit','unresponsive','do_not_contact')),
  follow_up_owner           text,
  review_notes              text,
  licensed_review_completed boolean not null default false,
  crm_sync_status           text not null default 'pending' check (crm_sync_status in ('pending','sent','failed','skipped')),
  crm_external_id           text,
  email_status              text not null default 'pending' check (email_status in ('pending','sent','delivered','bounced','failed','skipped')),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (assessment_id)
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_disposition_idx on public.leads (disposition);
create index if not exists leads_email_idx on public.leads (lower(email));

-- --------------------------------------------------------------------------
create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid references public.assessments(id) on delete cascade,
  lead_id        uuid references public.leads(id) on delete set null,
  name           text not null,
  properties     jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists events_assessment_idx on public.events (assessment_id, created_at);
create index if not exists events_name_idx on public.events (name, created_at desc);

-- --------------------------------------------------------------------------
-- Producers allowed to use the dashboard. Populate manually or via admin.
create table if not exists public.producers (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  display_name text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Partner attribution codes (CPAs, attorneys, lenders, chambers).
create table if not exists public.partners (
  code        text primary key,
  name        text not null,
  type        text,
  contact_email text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- Row-level security
alter table public.assessments enable row level security;
alter table public.leads       enable row level security;
alter table public.events      enable row level security;
alter table public.producers   enable row level security;
alter table public.partners    enable row level security;

create or replace function public.is_active_producer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.producers p
    where p.user_id = auth.uid() and p.is_active
  );
$$;

-- No policies for anon: anonymous access is denied entirely.

create policy "producers read assessments" on public.assessments
  for select to authenticated using (public.is_active_producer());

create policy "producers read leads" on public.leads
  for select to authenticated using (public.is_active_producer());

create policy "producers update lead review fields" on public.leads
  for update to authenticated
  using (public.is_active_producer())
  with check (public.is_active_producer());

create policy "producers read events" on public.events
  for select to authenticated using (public.is_active_producer());

create policy "producers read own row" on public.producers
  for select to authenticated using (user_id = auth.uid());

create policy "producers read partners" on public.partners
  for select to authenticated using (public.is_active_producer());

-- Prevent producers from editing prospect-supplied lead columns through the
-- API even though they hold an update policy.
create or replace function public.protect_lead_prospect_columns()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.assessment_id      := old.assessment_id;
    new.email              := old.email;
    new.name               := old.name;
    new.role               := old.role;
    new.phone              := old.phone;
    new.consent_report     := old.consent_report;
    new.consent_marketing  := old.consent_marketing;
    new.consent_at         := old.consent_at;
    new.consent_text_version := old.consent_text_version;
    new.workshop_requested := old.workshop_requested;
    new.prospect_notes     := old.prospect_notes;
    new.lead_score         := old.lead_score;
    new.created_at         := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists leads_protect_prospect_columns on public.leads;
create trigger leads_protect_prospect_columns
  before update on public.leads
  for each row execute function public.protect_lead_prospect_columns();

-- --------------------------------------------------------------------------
-- Retention: assessments without a lead older than 90 days can be purged by
-- a scheduled job. Leads are retained per IMA's records policy.
create or replace function public.purge_anonymous_assessments(retention_days int default 90)
returns int language plpgsql security definer as $$
declare deleted int;
begin
  delete from public.assessments a
  where a.created_at < now() - make_interval(days => retention_days)
    and not exists (select 1 from public.leads l where l.assessment_id = a.id);
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

-- Deletion workflow for a prospect request (by email).
create or replace function public.delete_prospect_data(target_email text)
returns int language plpgsql security definer as $$
declare deleted int;
begin
  delete from public.assessments a
  using public.leads l
  where l.assessment_id = a.id and lower(l.email) = lower(target_email);
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;
