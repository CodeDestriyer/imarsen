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

1. Применить миграцию `supabase/migrations/20260919090000_miniapp_profiles.sql`.
2. Задеплоить функцию: `supabase functions deploy miniapp`.
3. Секрет в Supabase -> Edge Functions -> Secrets: `BOT_TOKEN` (тот же, что у бота).
   `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` подставляются автоматически.
4. Переменные фронта (Vercel -> Environment Variables, см. `.env.example`):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Без п.4 профиль выключен, лендинг работает как раньше.

## Деплой на Vercel

Framework Preset: **Vite** (определяется автоматически). Build: `pnpm build`. Output: `dist`.

