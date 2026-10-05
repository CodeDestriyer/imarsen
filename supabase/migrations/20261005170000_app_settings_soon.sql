-- Рантайм-флаги без деплоя. Пока один: заглушка «Soon» в мини-аппе.
--
-- Пишет только бот (service-role) по админ-команде /soon on|off. Читает сайт
-- анонимным ключом прямо из REST, поэтому anon разрешено select — и только
-- по ключу soon: остальные настройки, если появятся, наружу не светятся.

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "anon reads soon flag" on public.app_settings
  for select to anon
  using (key = 'soon');

insert into public.app_settings (key, value)
values ('soon', 'true'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();
