# imarsen

Лендинг сервиса AI-анализа внешности.

## Стек

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** (локально, не CDN)
- **framer-motion** — reveal/accordion-анимации
- **lucide-react** — иконки
- Canvas-частицы — свои, без зависимостей

## Скрипты

```bash
pnpm install
pnpm dev      # dev-сервер
pnpm build    # типечек + продакшн-билд в dist/
pnpm preview  # локальный превью билда
pnpm lint     # tsc --noEmit
```

## Структура

```
src/
  components/    переиспользуемые UI (Reveal, Tilt, Counter, Particles)
  sections/      секции лендинга (Nav, Hero, Stats, Features, Pricing, Faq, Footer)
  data/          контент (фичи, тарифы, FAQ)
  hooks/         useCountUp, useScrollProgress
  App.tsx
  main.tsx
  index.css      tailwind + кастом-стили (glass, aurora и т.д.)
```

## Профиль через Telegram (Mini App)

Сайт, открытый из бота, узнаёт пользователя сам — регистрации нет. Telegram
отдаёт подписанную строку `initData`, Edge Function `miniapp` проверяет её
HMAC-подпись ключом бота и заводит/обновляет запись в `app_users`. В шапке
появляется иконка профиля; результаты ИИ-рейтинга пишутся в `rate_results`.

Вне Telegram иконки профиля нет — фича просто не показывается.

**Сохраняются только числовые метрики. Фото никуда не уходит.**

### Настройка

Проект Supabase — **IMARSEN** (`mranatvgldcooncqaaan`), тот же, где живёт бот.

- [x] Миграция применена: таблицы `app_users` и `rate_results`, RLS включён.
- [x] Функция `miniapp` задеплоена (`verify_jwt: true`).
- [x] Переменные фронта лежат в `.env.production` — Vite подхватывает их на билде,
      настраивать Vercel вручную не нужно. Оба значения публичные: anon-ключ и так
      попадает в клиентский бандл, а доступа к данным не даёт (RLS без политик).
- [ ] **Осталось вручную:** секрет `BOT_TOKEN` в Supabase -> Edge Functions ->
      Secrets, тот же токен, что у бота. Через API секреты не выставляются.

Пока `BOT_TOKEN` не задан, функция отвечает 401 на любой запрос: подпись
`initData` не сходится. Иконка профиля появится, но профиль будет с ошибкой.
Лендинг при этом работает как обычно.

## Заглушка «Soon» — без деплоя

Админы бота пишут ему:

- `/soon on` — включить заглушку в мини-аппе
- `/soon off` — выключить
- `/soon` — посмотреть, что сейчас

Флаг лежит в `app_settings` (ключ `soon`), сайт читает его при каждом
открытии. Если прочитать не вышло — решает `SOON_FALLBACK` в `src/config.ts`.
В обычном браузере заглушки нет; посмотреть мини-апп под заглушкой —
`?preview=1` в адресе.

## Открытие рейта (150⭐) и рефералка

Внутри Telegram тир и четыре метрики (симметрия, тилт, челюсть, губы) закрыты
блюром внизу результата. Остальные пропорции бесплатны. Вне Telegram всё
открыто — флаг `PAYWALL_TELEGRAM_ONLY` в `src/config.ts`.

Оплата разовая, за один скан: мини-апп → `miniapp` (`unlock_invoice`)
выписывает `createInvoiceLink` с payload `scan:<user>:<result>:<скидка>` →
`Telegram.WebApp.openInvoice` → вебхук `telegram-bot` получает
`successful_payment`, пишет `star_payments` и ставит `rate_results.unlocked_at`.
Возврат (`refunded_payment`) скан снова закрывает.

Рефералка: ссылка `t.me/<бот>?start=ref_<id>` в профиле. Новичок, пришедший
по ней (ни разу не был в боте и мини-аппе), даёт пригласившему одну скидку
50⭐ на следующее открытие. Цены — в `supabase/functions/miniapp/index.ts`.

**Защита клиентская.** Метрики считаются в браузере; под блюром в разметке
лежат заглушки, но через отладчик JS цифры достать можно. На сервере реально
закрыты только тир и балл неоткрытых сканов в профиле.

## Деплой на Vercel

Framework Preset: **Vite** (определяется автоматически). Build: `pnpm build`. Output: `dist`.

