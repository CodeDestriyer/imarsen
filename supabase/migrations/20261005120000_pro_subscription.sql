-- IMARSEN Pro: подписка за звёзды (500⭐ / 30 дней).
--
-- Источник правды о доступе — app_users.pro_until. Его двигает только вебхук
-- бота по successful_payment: колбэку openInvoice на клиенте не верим.
--
-- star_payments — журнал списаний. charge_id первичный ключ, поэтому повторная
-- доставка того же апдейта от Telegram ничего не продлит дважды. Он же нужен
-- для возврата: refundStarPayment принимает telegram_payment_charge_id.

alter table public.app_users
  add column if not exists pro_until timestamptz;

create table if not exists public.star_payments (
  charge_id               text primary key,
  tg_user_id              bigint not null,
  product                 text not null,
  amount_stars            integer not null,
  is_recurring            boolean not null default false,
  subscription_expires_at timestamptz,
  refunded_at             timestamptz,
  created_at              timestamptz not null default now()
);

create index if not exists star_payments_user_idx
  on public.star_payments (tg_user_id, created_at desc);

-- Пишут только Edge Functions под service-role; anon не видит ничего.
alter table public.star_payments enable row level security;
