-- Вместо подписки Pro: разовое открытие одного скана за 150⭐ и рефералка.
--
-- Подписку никто не успел купить (star_payments пуст). Колонка
-- app_users.pro_until осталась и больше не используется: drop column ждал
-- эксклюзивную блокировку под живым трафиком и упал по таймауту.
--
-- rate_results.unlocked_at — скан открыт. Ставит только вебхук бота по
-- successful_payment, колбэку openInvoice на клиенте не верим.
--
-- referrals — кто кого привёл. Одна строка = одна скидка 50⭐ для
-- пригласившего; used_at проставляется, когда скидка потрачена.

set local lock_timeout = '5s';

alter table public.rate_results
  add column if not exists unlocked_at timestamptz;

alter table public.star_payments
  add column if not exists result_id bigint,
  add column if not exists discount_stars integer not null default 0;

create table if not exists public.referrals (
  invitee_id bigint primary key,
  inviter_id bigint not null,
  created_at timestamptz not null default now(),
  used_at    timestamptz
);

create index if not exists referrals_inviter_unused_idx
  on public.referrals (inviter_id) where used_at is null;

alter table public.referrals enable row level security;
