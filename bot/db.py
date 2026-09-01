"""Слой доступа к БД (Supabase / Postgres).

supabase-py — синхронный клиент, поэтому каждый вызов оборачиваем в
asyncio.to_thread, чтобы не блокировать событийный цикл aiogram.
"""
import asyncio
from datetime import datetime, timezone
from typing import Any


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

from supabase import Client, create_client

import config

_client: Client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)

TABLE = "rate_tickets"
ACTIVE_STATUSES = ("waiting", "serving")


async def _run(func, *args, **kwargs):
    return await asyncio.to_thread(func, *args, **kwargs)


async def get_active_ticket(tg_user_id: int) -> dict[str, Any] | None:
    """Активный (waiting/serving) талон пользователя, если есть."""
    def _q():
        return (
            _client.table(TABLE)
            .select("*")
            .eq("tg_user_id", tg_user_id)
            .in_("status", list(ACTIVE_STATUSES))
            .limit(1)
            .execute()
        )

    res = await _run(_q)
    return res.data[0] if res.data else None


async def create_ticket(
    tg_user_id: int,
    username: str | None,
    first_name: str | None,
    photo_file_id: str,
    is_paid: bool,
    amount_stars: int,
    payment_charge_id: str | None,
) -> dict[str, Any]:
    def _q():
        return (
            _client.table(TABLE)
            .insert(
                {
                    "tg_user_id": tg_user_id,
                    "username": username,
                    "first_name": first_name,
                    "photo_file_id": photo_file_id,
                    "is_paid": is_paid,
                    "amount_stars": amount_stars,
                    "payment_charge_id": payment_charge_id,
                    "status": "waiting",
                }
            )
            .execute()
        )

    res = await _run(_q)
    return res.data[0]


async def position_in_queue(ticket_id: int) -> int:
    """Позиция талона среди ожидающих (1 = следующий на очереди)."""
    def _q():
        return (
            _client.table(TABLE)
            .select("id, created_at")
            .eq("status", "waiting")
            .order("created_at")
            .execute()
        )

    res = await _run(_q)
    for idx, row in enumerate(res.data, start=1):
        if row["id"] == ticket_id:
            return idx
    return 0  # уже не в очереди (обслужен/отменён)


async def list_active(limit: int = 30) -> list[dict[str, Any]]:
    """Список активной очереди: сначала serving, потом waiting по времени."""
    def _q():
        return (
            _client.table(TABLE)
            .select("*")
            .in_("status", list(ACTIVE_STATUSES))
            .order("created_at")
            .limit(limit)
            .execute()
        )

    res = await _run(_q)
    rows = res.data or []
    # serving выводим первым
    rows.sort(key=lambda r: (r["status"] != "serving", r["created_at"]))
    return rows


async def current_serving() -> dict[str, Any] | None:
    def _q():
        return (
            _client.table(TABLE)
            .select("*")
            .eq("status", "serving")
            .order("created_at")
            .limit(1)
            .execute()
        )

    res = await _run(_q)
    return res.data[0] if res.data else None


async def take_next() -> dict[str, Any] | None:
    """Закрывает текущего обслуживаемого и берёт следующего из очереди.
    Возвращает нового обслуживаемого (или None, если очередь пуста)."""
    serving = await current_serving()
    if serving:
        await set_status(serving["id"], "done")

    def _q_next():
        return (
            _client.table(TABLE)
            .select("*")
            .eq("status", "waiting")
            .order("created_at")
            .limit(1)
            .execute()
        )

    res = await _run(_q_next)
    if not res.data:
        return None
    nxt = res.data[0]
    await set_status(nxt["id"], "serving")
    nxt["status"] = "serving"
    return nxt


async def set_status(ticket_id: int, status: str) -> None:
    payload: dict[str, Any] = {"status": status}
    if status in ("done", "cancelled"):
        payload["served_at"] = _now_iso()

    def _q():
        return _client.table(TABLE).update(payload).eq("id", ticket_id).execute()

    await _run(_q)


async def cancel_all_active() -> int:
    """Отменяет всю активную очередь. Возвращает число отменённых талонов."""
    active = await list_active(limit=1000)

    def _q():
        return (
            _client.table(TABLE)
            .update({"status": "cancelled", "served_at": _now_iso()})
            .in_("status", list(ACTIVE_STATUSES))
            .execute()
        )

    await _run(_q)
    return len(active)


async def counts() -> dict[str, int]:
    def _q():
        return _client.table(TABLE).select("status").execute()

    res = await _run(_q)
    out = {"waiting": 0, "serving": 0, "done": 0, "cancelled": 0}
    for row in res.data or []:
        out[row["status"]] = out.get(row["status"], 0) + 1
    return out
