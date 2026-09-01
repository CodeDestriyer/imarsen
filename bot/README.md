# IMARSEN — бот-очередь на рейт внешности ⭐

Телеграм-бот: зритель жмёт кнопку, присылает фото, платит **50 ⭐** (Telegram Stars)
и получает талон в очередь на рейт от эксперта в прямом эфире. Блогер управляет
очередью прямо в боте командами.

## Возможности
- Кнопка «Получить талон 🎫» → фото → оплата звёздами → номер в очереди.
- Один активный талон на пользователя.
- **Тест-режим** (`PAID_MODE=false`) — талоны бесплатно, звёзды не тратятся.
- Команды блогера: `/queue`, `/next`, `/done`, `/skip`, `/clear`, `/stats`.
- Данные хранятся в Supabase (Postgres), не теряются при передеплое.

## Переменные окружения
См. `.env.example`. Обязательные: `BOT_TOKEN`, `ADMIN_IDS`, `SUPABASE_URL`,
`SUPABASE_SERVICE_KEY`. Оплату включает `PAID_MODE=true`.

## Локальный запуск
```bash
python -m venv .venv
. .venv/Scripts/activate   # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env        # заполнить значения
python bot.py
```

## Деплой на Railway
1. Подключить этот GitHub-репозиторий в Railway (New Project → Deploy from GitHub).
2. В Variables добавить переменные из `.env.example`.
3. Railway сам поставит зависимости и запустит `worker: python bot.py` (Procfile).

## Команды блогера
| Команда | Что делает |
|---------|-----------|
| `/queue` | Показать очередь |
| `/next`  | Закрыть текущего и вызвать следующего (с фото) |
| `/done`  | Закрыть текущего |
| `/skip`  | Пропустить текущего |
| `/clear` | Очистить всю очередь |
| `/stats` | Статистика |
| `/myid`  | Узнать свой Telegram ID (для настройки `ADMIN_IDS`) |

## БД
Таблица `rate_tickets` в Supabase (проект IMARSEN). RLS включён, доступ только
по `service_role` ключу с бэкенда.
