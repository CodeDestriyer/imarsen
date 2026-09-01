"""Конфиг бота. Все секреты берутся из переменных окружения (env),
в код и в git ничего не хардкодим."""
import os

from dotenv import load_dotenv

load_dotenv()  # локально подхватит .env; на Railway переменные приходят из окружения


def _get(name: str, default: str | None = None, required: bool = False) -> str:
    val = os.getenv(name, default)
    if required and not val:
        raise RuntimeError(f"Не задана обязательная переменная окружения: {name}")
    return val or ""


# --- Telegram ---
BOT_TOKEN = _get("BOT_TOKEN", required=True)

# ID администраторов (блогера) через запятую. Узнать свой ID можно командой /myid
ADMIN_IDS = {
    int(x) for x in _get("ADMIN_IDS", "").replace(" ", "").split(",") if x.strip().isdigit()
}

# --- Supabase ---
SUPABASE_URL = _get("SUPABASE_URL", required=True)
# service_role ключ: даёт полный доступ к БД в обход RLS. ТОЛЬКО на бэкенде, не в клиенте!
SUPABASE_SERVICE_KEY = _get("SUPABASE_SERVICE_KEY", required=True)

# --- Логика талонов ---
# PAID_MODE=false -> тест-режим, талон выдаётся бесплатно (звёзды не тратятся).
# PAID_MODE=true  -> перед выдачей талона выставляется счёт на TICKET_PRICE_STARS звёзд.
PAID_MODE = _get("PAID_MODE", "false").strip().lower() in {"1", "true", "yes", "on"}
TICKET_PRICE_STARS = int(_get("TICKET_PRICE_STARS", "50"))


def is_admin(user_id: int) -> bool:
    return user_id in ADMIN_IDS
