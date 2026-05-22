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

## Деплой на Vercel

Framework Preset: **Vite** (определяется автоматически). Build: `pnpm build`. Output: `dist`.

## legacy/

Старый vanilla-HTML вариант лежит в `legacy/` на случай отката.
