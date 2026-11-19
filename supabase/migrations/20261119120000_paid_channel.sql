-- Платный канал: нативная подписка Telegram за звёзды (300⭐ / 30 дней).
--
-- Деньги, продления и кик неплательщиков делает сам Telegram по ссылке из
-- createChatSubscriptionInviteLink — у нас ни счетов, ни крона. Эта таблица
-- только для статистики: бот пишет сюда апдейты chat_member из канала.
--
-- Канал, к которому привязан бот, лежит в app_settings под ключом
-- paid_channel ({id, title, link}). Наружу (anon) он не светится: политика
-- app_settings пускает anon только к ключу soon.

create table if not exists public.channel_subscribers (
  tg_user_id       bigint primary key,
  chat_id          bigint not null,
  username         text,
  first_name       text,
  status           text not null,           -- member / left / kicked / administrator ...
  via_subscription boolean not null default false,
  until_date       timestamptz,             -- до когда оплачено (из ChatMemberMember)
  first_joined_at  timestamptz,
  last_joined_at   timestamptz,
  left_at          timestamptz,
  joins            integer not null default 0,
  updated_at       timestamptz not null default now()
);

-- Пишет только бот под service-role.
alter table public.channel_subscribers enable row level security;
