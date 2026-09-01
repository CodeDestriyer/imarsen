"""IMARSEN — бот-очередь на рейт внешности от эксперта в прямом эфире.

Флоу пользователя:
  /start -> кнопка «Получить талон 🎫» -> присылает фото
  -> (в платном режиме) счёт на 50 ⭐ -> оплата -> номер в очереди.

Флоу блогера (админа):
  /queue  — список очереди
  /next   — закрыть текущего и вызвать следующего (с фото)
  /done   — закрыть текущего
  /skip   — пропустить (отменить) текущего
  /clear  — очистить всю очередь
  /stats  — статистика
"""
import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import (
    LabeledPrice,
    Message,
    PreCheckoutQuery,
    ReplyKeyboardMarkup,
    KeyboardButton,
)

import config
import db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("imarsen")

bot = Bot(
    token=config.BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML),
)
dp = Dispatcher(storage=MemoryStorage())

BTN_GET = "Получить талон 🎫"

main_kb = ReplyKeyboardMarkup(
    keyboard=[[KeyboardButton(text=BTN_GET)]],
    resize_keyboard=True,
    input_field_placeholder="Нажми кнопку, чтобы получить талон",
)


class Form(StatesGroup):
    waiting_photo = State()
    waiting_payment = State()


def _display_name(msg_from) -> str:
    name = msg_from.first_name or "Гость"
    if msg_from.username:
        name += f" (@{msg_from.username})"
    return name


# ---------------------------------------------------------------------------
# Пользовательская часть
# ---------------------------------------------------------------------------
@dp.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()
    price = config.TICKET_PRICE_STARS
    mode = (
        f"Один талон стоит <b>{price} ⭐</b>."
        if config.PAID_MODE
        else "Сейчас идёт тест — талон выдаётся <b>бесплатно</b>."
    )
    await message.answer(
        "Привет! 👋\n\n"
        "Это очередь на <b>рейт твоей внешности</b> от эксперта в прямом эфире.\n\n"
        "Как попасть:\n"
        "1️⃣ Жми «Получить талон 🎫»\n"
        "2️⃣ Пришли своё фото\n"
        f"3️⃣ Получи номер в очереди\n\n{mode}",
        reply_markup=main_kb,
    )


@dp.message(Command("myid"))
async def cmd_myid(message: Message):
    await message.answer(
        f"Твой Telegram ID: <code>{message.from_user.id}</code>\n"
        "Передай его тому, кто настраивает бота, чтобы стать админом."
    )


@dp.message(Command("cancel"))
async def cmd_cancel(message: Message, state: FSMContext):
    await state.clear()
    ticket = await db.get_active_ticket(message.from_user.id)
    if ticket and ticket["status"] == "waiting":
        await db.set_status(ticket["id"], "cancelled")
        await message.answer("Ты вышел из очереди. Захочешь вернуться — жми кнопку.", reply_markup=main_kb)
    else:
        await message.answer("Ок, отменил.", reply_markup=main_kb)


@dp.message(F.text == BTN_GET)
async def on_get_ticket(message: Message, state: FSMContext):
    existing = await db.get_active_ticket(message.from_user.id)
    if existing:
        if existing["status"] == "serving":
            await message.answer("Ты сейчас на рейте прямо в эфире 🔴")
        else:
            pos = await db.position_in_queue(existing["id"])
            await message.answer(
                f"У тебя уже есть талон 🎫\nТвоя позиция в очереди: <b>{pos}</b>.\n"
                "Чтобы выйти из очереди — /cancel."
            )
        return

    await state.set_state(Form.waiting_photo)
    await message.answer("Отлично! Теперь пришли <b>фото</b>, которое будем рейтить 📸")


@dp.message(Form.waiting_photo, F.photo)
async def on_photo(message: Message, state: FSMContext):
    photo_file_id = message.photo[-1].file_id  # самое крупное разрешение

    # Повторная защита от дублей
    if await db.get_active_ticket(message.from_user.id):
        await state.clear()
        await message.answer("У тебя уже есть активный талон 🎫", reply_markup=main_kb)
        return

    if not config.PAID_MODE:
        # ТЕСТ-режим: талон бесплатно
        ticket = await db.create_ticket(
            tg_user_id=message.from_user.id,
            username=message.from_user.username,
            first_name=message.from_user.first_name,
            photo_file_id=photo_file_id,
            is_paid=False,
            amount_stars=0,
            payment_charge_id=None,
        )
        await state.clear()
        pos = await db.position_in_queue(ticket["id"])
        await message.answer(
            f"🎫 Талон <b>#{ticket['id']}</b> твой!\n"
            f"Позиция в очереди: <b>{pos}</b>.\n\n"
            "Жди вызова в эфире 🔴 (тест-режим, бесплатно).",
            reply_markup=main_kb,
        )
        return

    # ПЛАТНЫЙ режим: сохраняем фото, переходим в ожидание оплаты, выставляем счёт
    await state.update_data(photo_file_id=photo_file_id)
    await state.set_state(Form.waiting_payment)
    price = config.TICKET_PRICE_STARS
    await message.answer_invoice(
        title="VIP-талон на рейт",
        description=f"Место в очереди на рейт внешности в прямом эфире. Стоимость: {price} ⭐.",
        payload="rate_ticket",
        currency="XTR",  # Telegram Stars
        prices=[LabeledPrice(label="VIP-талон", amount=price)],
        provider_token="",  # для оплаты звёздами токен провайдера не нужен
        start_parameter="rate",
    )


@dp.pre_checkout_query()
async def pre_checkout(pre_q: PreCheckoutQuery):
    # Обязательно подтвердить в течение 10 секунд, иначе оплата отменится
    await pre_q.answer(ok=True)


# Регистрируем ДО «wrong»-обработчиков, чтобы сообщение об оплате не перехватилось
@dp.message(F.successful_payment)
async def on_paid(message: Message, state: FSMContext):
    sp = message.successful_payment
    data = await state.get_data()
    photo_file_id = data.get("photo_file_id")
    await state.clear()

    if not photo_file_id:
        # Крайний случай: фото потерялось (напр. рестарт бота между фото и оплатой)
        await message.answer(
            "Оплата прошла ✅, но я потерял твоё фото. Пришли фото ещё раз — "
            "талон закреплю за тобой без повторной оплаты. Или напиши в поддержку."
        )
        logger.warning("Оплата без фото в state: user=%s", message.from_user.id)
        return

    ticket = await db.create_ticket(
        tg_user_id=message.from_user.id,
        username=message.from_user.username,
        first_name=message.from_user.first_name,
        photo_file_id=photo_file_id,
        is_paid=True,
        amount_stars=sp.total_amount,
        payment_charge_id=sp.telegram_payment_charge_id,
    )
    pos = await db.position_in_queue(ticket["id"])
    await message.answer(
        f"Оплата прошла ✅\n\n"
        f"🎫 VIP-талон <b>#{ticket['id']}</b> твой!\n"
        f"Позиция в очереди: <b>{pos}</b>.\n\n"
        "Жди вызова в прямом эфире 🔴",
        reply_markup=main_kb,
    )


@dp.message(Form.waiting_photo)
async def waiting_photo_wrong(message: Message):
    await message.answer("Мне нужно именно <b>фото</b> 📸 Пришли картинку, а не текст/файл.")


@dp.message(Form.waiting_payment)
async def waiting_payment_wrong(message: Message):
    await message.answer(
        "Ждём оплату талона в звёздах ⭐ — оплати счёт выше.\n"
        "Передумал? Нажми /cancel."
    )


# ---------------------------------------------------------------------------
# Админская часть (блогер)
# ---------------------------------------------------------------------------
def _admin_only(message: Message) -> bool:
    return config.is_admin(message.from_user.id)


@dp.message(Command("queue"))
async def cmd_queue(message: Message):
    if not _admin_only(message):
        return
    rows = await db.list_active()
    if not rows:
        await message.answer("Очередь пуста 🕳")
        return
    lines = ["<b>Очередь на рейт:</b>"]
    pos = 0
    for r in rows:
        if r["status"] == "serving":
            lines.append(f"🔴 <b>СЕЙЧАС</b> — #{r['id']} · {_row_name(r)}")
        else:
            pos += 1
            paid = "⭐" if r["is_paid"] else "🆓"
            lines.append(f"{pos}. #{r['id']} · {_row_name(r)} {paid}")
    lines.append("\n/next — вызвать следующего, /clear — очистить")
    await message.answer("\n".join(lines))


def _row_name(r: dict) -> str:
    name = r.get("first_name") or "Гость"
    if r.get("username"):
        name += f" (@{r['username']})"
    return name


@dp.message(Command("next"))
async def cmd_next(message: Message):
    if not _admin_only(message):
        return
    nxt = await db.take_next()
    if not nxt:
        await message.answer("Очередь пуста — вызывать некого 🕳")
        return
    await message.answer_photo(
        photo=nxt["photo_file_id"],
        caption=(
            f"🔴 <b>Следующий на рейте</b>\n"
            f"Талон #{nxt['id']} · {_row_name(nxt)}\n"
            f"{'Оплачено ⭐' if nxt['is_paid'] else 'Тест 🆓'}\n\n"
            "/next — следующий · /done — закрыть"
        ),
    )


@dp.message(Command("done"))
async def cmd_done(message: Message):
    if not _admin_only(message):
        return
    serving = await db.current_serving()
    if not serving:
        await message.answer("Сейчас никто не на рейте.")
        return
    await db.set_status(serving["id"], "done")
    await message.answer(f"Талон #{serving['id']} закрыт ✅. /next — следующий.")


@dp.message(Command("skip"))
async def cmd_skip(message: Message):
    if not _admin_only(message):
        return
    serving = await db.current_serving()
    if not serving:
        await message.answer("Сейчас никто не на рейте.")
        return
    await db.set_status(serving["id"], "cancelled")
    await message.answer(f"Талон #{serving['id']} пропущен. /next — следующий.")


@dp.message(Command("clear"))
async def cmd_clear(message: Message):
    if not _admin_only(message):
        return
    n = await db.cancel_all_active()
    await message.answer(f"Очередь очищена. Отменено талонов: <b>{n}</b>.")


@dp.message(Command("stats"))
async def cmd_stats(message: Message):
    if not _admin_only(message):
        return
    c = await db.counts()
    await message.answer(
        "<b>Статистика:</b>\n"
        f"В очереди: {c['waiting']}\n"
        f"На рейте: {c['serving']}\n"
        f"Обслужено: {c['done']}\n"
        f"Отменено: {c['cancelled']}"
    )


async def main():
    mode = "ПЛАТНЫЙ" if config.PAID_MODE else "ТЕСТ (бесплатно)"
    logger.info("Запуск бота. Режим: %s, цена: %s⭐, админы: %s",
                mode, config.TICKET_PRICE_STARS, config.ADMIN_IDS or "не заданы")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
