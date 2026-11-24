-- Платная группа (с темами): подписка 300⭐ / 30 дней через бота.
--
-- Нативная подписка Telegram бывает только у каналов, а у нас супергруппа с
-- темами. Поэтому учёт свой: бот пишет сюда оплаты (successful_payment с
-- subscription_expiration_date), одобряет заявки на вход только при активной
-- подписке, а раз в час pg_cron дёргает функцию telegram-bot, и она удаляет
-- из группы тех, у кого срок вышел.
--
-- channel_subscribers — от первой версии под канал, пустая; убираем.

drop table if exists public.channel_subscribers;

create table if not exists public.group_subs (
  tg_user_id    bigint primary key,
  username      text,
  first_name    text,
  paid_until    timestamptz not null,   -- до когда есть доступ
  manual        boolean not null default false, -- выдан админом, не оплатой
  first_paid_at timestamptz,
  last_paid_at  timestamptz,
  payments      integer not null default 0,
  kicked_at     timestamptz,            -- удалён кроном; сбрасывается при оплате
  updated_at    timestamptz not null default now()
);

create index if not exists group_subs_expiry_idx
  on public.group_subs (paid_until) where kicked_at is null;

-- Пишет только бот под service-role.
alter table public.group_subs enable row level security;

-- Крон. Ключ генерируется в базе и лежит в app_settings: anon его не видит
-- (политика app_settings пускает anon только к ключу soon), функция читает
-- его под service-role и сверяет с заголовком x-cron-key.
create extension if not exists pg_net;
create extension if not exists pg_cron;

insert into public.app_settings (key, value)
values ('cron_key', to_jsonb(gen_random_uuid()::text))
on conflict (key) do nothing;

select cron.unschedule('expire-group-subs')
where exists (select 1 from cron.job where jobname = 'expire-group-subs');

select cron.schedule(
  'expire-group-subs',
  '7 * * * *',
  $$
  select net.http_post(
    url := 'https://mranatvgldcooncqaaan.supabase.co/functions/v1/telegram-bot',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-key', (select value #>> '{}' from public.app_settings where key = 'cron_key')
    ),
    body := '{"cron":"expire"}'::jsonb
  );
  $$
);
