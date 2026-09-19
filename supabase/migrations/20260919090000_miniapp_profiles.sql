-- Мини-профиль пользователя Telegram Mini App + история ИИ-рейтингов.
--
-- Таблицы пишутся ТОЛЬКО из Edge Function `miniapp` под service-role ключом,
-- поэтому RLS включён и политик нет: anon/authenticated не видят ничего.
--
-- ВАЖНО: фото сюда не попадает. Сохраняются только числовые метрики —
-- обещание «фото не покидает устройство» на лендинге остаётся в силе.

create table if not exists public.app_users (
  tg_user_id    bigint primary key,
  username      text,
  first_name    text,
  last_name     text,
  photo_url     text,
  language_code text,
  is_premium    boolean not null default false,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create table if not exists public.rate_results (
  id         bigint generated always as identity primary key,
  tg_user_id bigint not null references public.app_users (tg_user_id) on delete cascade,
  overall    real not null,
  tier_key   text not null,
  tier_label text not null,
  scores     jsonb not null default '{}'::jsonb,
  metrics    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists rate_results_user_created_idx
  on public.rate_results (tg_user_id, created_at desc);

alter table public.app_users    enable row level security;
alter table public.rate_results enable row level security;
