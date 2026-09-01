// IMARSEN — Telegram-бот очереди на рейт внешности (Supabase Edge Function, вебхук).
//
// Бесплатно, serverless: Telegram при каждом апдейте дёргает эту функцию.
// Флоу пользователя: /start -> кнопка «Получить талон 🎫» -> прислал фото ->
//   (тест-режим: талон сразу | платно: счёт 50⭐ -> оплата) -> номер в очереди.
// Флоу блогера (админа): /queue /next /done /skip /clear /stats
//
// Секреты (Supabase -> Edge Functions -> Secrets): BOT_TOKEN, WEBHOOK_SECRET.
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase подставляет сам.
import { createClient } from "jsr:@supabase/supabase-js@2";

// --- Конфиг (не секретный; меняется передеплоем) ---
const PAID_MODE = false; // false = тест (талон бесплатно), true = оплата звёздами
const TICKET_PRICE_STARS = 50; // цена талона в звёздах
const ADMIN_IDS: number[] = []; // Telegram ID блогера/админов (заполним после /myid)

const BTN_GET = "Получить талон 🎫";

// --- Секреты / окружение ---
const BOT_TOKEN = Deno.env.get("BOT_TOKEN")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const ACTIVE = ["waiting", "serving"];
const mainKb = {
  keyboard: [[{ text: BTN_GET }]],
  resize_keyboard: true,
  input_field_placeholder: "Нажми кнопку, чтобы получить талон",
};

// --- Вызов Telegram Bot API ---
async function tg(method: string, payload: Record<string, unknown>) {
  const r = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json();
  if (!j.ok) console.error("TG error", method, JSON.stringify(j));
  return j;
}

const send = (chat_id: number, text: string, extra: Record<string, unknown> = {}) =>
  tg("sendMessage", { chat_id, text, parse_mode: "HTML", ...extra });

// --- Хелперы БД ---
function rowName(r: any): string {
  let name = r.first_name || "Гость";
  if (r.username) name += ` (@${r.username})`;
  return name;
}

async function getActiveTicket(userId: number) {
  const { data } = await supabase
    .from("rate_tickets").select("*")
    .eq("tg_user_id", userId).in("status", ACTIVE).limit(1);
  return data && data.length ? data[0] : null;
}

async function positionInQueue(ticketId: number): Promise<number> {
  const { data } = await supabase
    .from("rate_tickets").select("id")
    .eq("status", "waiting").order("created_at");
  if (!data) return 0;
  const idx = data.findIndex((r: any) => r.id === ticketId);
  return idx >= 0 ? idx + 1 : 0;
}

async function createTicket(u: any, photoFileId: string, isPaid: boolean,
                            amount: number, chargeId: string | null) {
  const { data, error } = await supabase.from("rate_tickets").insert({
    tg_user_id: u.id,
    username: u.username ?? null,
    first_name: u.first_name ?? null,
    photo_file_id: photoFileId,
    is_paid: isPaid,
    amount_stars: amount,
    payment_charge_id: chargeId,
    status: "waiting",
  }).select().single();
  if (error) throw error;
  return data;
}

async function setStatus(id: number, status: string) {
  const patch: Record<string, unknown> = { status };
  if (status === "done" || status === "cancelled") patch.served_at = new Date().toISOString();
  await supabase.from("rate_tickets").update(patch).eq("id", id);
}

async function currentServing() {
  const { data } = await supabase
    .from("rate_tickets").select("*")
    .eq("status", "serving").order("created_at").limit(1);
  return data && data.length ? data[0] : null;
}

// --- Обработка апдейта ---
const isAdmin = (id: number) => ADMIN_IDS.includes(id);

async function handleUpdate(update: any) {
  // Подтверждение оплаты (обязательно в течение 10 сек)
  if (update.pre_checkout_query) {
    await tg("answerPreCheckoutQuery", {
      pre_checkout_query_id: update.pre_checkout_query.id,
      ok: true,
    });
    return;
  }

  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat.id;
  const from = msg.from;

  // Успешная оплата -> создаём талон (фото зашито в payload счёта)
  if (msg.successful_payment) {
    const sp = msg.successful_payment;
    const payload: string = sp.invoice_payload || "";
    const photoFileId = payload.startsWith("rate:") ? payload.slice(5) : "";
    if (!photoFileId) {
      await send(chatId, "Оплата прошла ✅, но потерялось фото. Пришли фото ещё раз — талон закреплю без повторной оплаты.");
      return;
    }
    if (await getActiveTicket(from.id)) {
      await send(chatId, "У тебя уже есть активный талон 🎫", { reply_markup: mainKb });
      return;
    }
    const t = await createTicket(from, photoFileId, true, sp.total_amount, sp.telegram_payment_charge_id);
    const pos = await positionInQueue(t.id);
    await send(chatId,
      `Оплата прошла ✅\n\n🎫 VIP-талон <b>#${t.id}</b> твой!\nПозиция в очереди: <b>${pos}</b>.\n\nЖди вызова в прямом эфире 🔴`,
      { reply_markup: mainKb });
    return;
  }

  // Фото -> заявка на талон
  if (msg.photo && msg.photo.length) {
    const photoFileId = msg.photo[msg.photo.length - 1].file_id; // самое крупное
    if (await getActiveTicket(from.id)) {
      await send(chatId, "У тебя уже есть активный талон 🎫 (посмотреть — /myticket)", { reply_markup: mainKb });
      return;
    }
    if (!PAID_MODE) {
      const t = await createTicket(from, photoFileId, false, 0, null);
      const pos = await positionInQueue(t.id);
      await send(chatId,
        `🎫 Талон <b>#${t.id}</b> твой!\nПозиция в очереди: <b>${pos}</b>.\n\nЖди вызова в эфире 🔴 (тест-режим, бесплатно).`,
        { reply_markup: mainKb });
      return;
    }
    // Платный режим: счёт в звёздах, фото — в payload
    await tg("sendInvoice", {
      chat_id: chatId,
      title: "VIP-талон на рейт",
      description: `Место в очереди на рейт внешности в прямом эфире. Стоимость: ${TICKET_PRICE_STARS} ⭐.`,
      payload: `rate:${photoFileId}`,
      currency: "XTR",
      prices: [{ label: "VIP-талон", amount: TICKET_PRICE_STARS }],
    });
    return;
  }

  const text: string = (msg.text || "").trim();

  // Кнопка «Получить талон»
  if (text === BTN_GET) {
    const existing = await getActiveTicket(from.id);
    if (existing) {
      if (existing.status === "serving") {
        await send(chatId, "Ты сейчас на рейте прямо в эфире 🔴");
      } else {
        const pos = await positionInQueue(existing.id);
        await send(chatId, `У тебя уже есть талон 🎫\nТвоя позиция: <b>${pos}</b>.\nВыйти из очереди — /cancel.`);
      }
      return;
    }
    await send(chatId, "Отлично! Теперь пришли <b>фото</b>, которое будем рейтить 📸", { reply_markup: mainKb });
    return;
  }

  // --- Команды ---
  if (text.startsWith("/")) {
    const cmd = text.split(/\s+/)[0].split("@")[0].toLowerCase();
    return handleCommand(cmd, chatId, from);
  }

  // Прочее
  await send(chatId, "Жми «Получить талон 🎫» и пришли фото 📸", { reply_markup: mainKb });
}

async function handleCommand(cmd: string, chatId: number, from: any) {
  switch (cmd) {
    case "/start": {
      const mode = PAID_MODE
        ? `Один талон стоит <b>${TICKET_PRICE_STARS} ⭐</b>.`
        : "Сейчас идёт тест — талон выдаётся <b>бесплатно</b>.";
      await send(chatId,
        "Привет! 👋\n\nЭто очередь на <b>рейт твоей внешности</b> от эксперта в прямом эфире.\n\n" +
        "Как попасть:\n1️⃣ Жми «Получить талон 🎫»\n2️⃣ Пришли своё фото\n3️⃣ Получи номер в очереди\n\n" + mode,
        { reply_markup: mainKb });
      return;
    }
    case "/myid":
      await send(chatId, `Твой Telegram ID: <code>${from.id}</code>`);
      return;
    case "/myticket": {
      const t = await getActiveTicket(from.id);
      if (!t) { await send(chatId, "Активного талона нет. Жми «Получить талон 🎫»."); return; }
      if (t.status === "serving") { await send(chatId, "Ты сейчас на рейте 🔴"); return; }
      const pos = await positionInQueue(t.id);
      await send(chatId, `🎫 Талон <b>#${t.id}</b>. Позиция: <b>${pos}</b>.`);
      return;
    }
    case "/cancel": {
      const t = await getActiveTicket(from.id);
      if (t && t.status === "waiting") {
        await setStatus(t.id, "cancelled");
        await send(chatId, "Ты вышел из очереди. Захочешь вернуться — жми кнопку.", { reply_markup: mainKb });
      } else {
        await send(chatId, "Ок.", { reply_markup: mainKb });
      }
      return;
    }
  }

  // --- Админские команды ---
  if (!isAdmin(from.id)) return;

  switch (cmd) {
    case "/queue": {
      const { data } = await supabase.from("rate_tickets").select("*").in("status", ACTIVE).order("created_at");
      const rows = data || [];
      rows.sort((a: any, b: any) => (a.status === "serving" ? -1 : 1) - (b.status === "serving" ? -1 : 1));
      if (!rows.length) { await send(chatId, "Очередь пуста 🕳"); return; }
      const lines = ["<b>Очередь на рейт:</b>"];
      let pos = 0;
      for (const r of rows) {
        if (r.status === "serving") lines.push(`🔴 <b>СЕЙЧАС</b> — #${r.id} · ${rowName(r)}`);
        else { pos++; lines.push(`${pos}. #${r.id} · ${rowName(r)} ${r.is_paid ? "⭐" : "🆓"}`); }
      }
      lines.push("\n/next — вызвать следующего, /clear — очистить");
      await send(chatId, lines.join("\n"));
      return;
    }
    case "/next": {
      const serving = await currentServing();
      if (serving) await setStatus(serving.id, "done");
      const { data } = await supabase.from("rate_tickets").select("*").eq("status", "waiting").order("created_at").limit(1);
      if (!data || !data.length) { await send(chatId, "Очередь пуста — вызывать некого 🕳"); return; }
      const nxt = data[0];
      await setStatus(nxt.id, "serving");
      await tg("sendPhoto", {
        chat_id: chatId,
        photo: nxt.photo_file_id,
        parse_mode: "HTML",
        caption: `🔴 <b>Следующий на рейте</b>\nТалон #${nxt.id} · ${rowName(nxt)}\n${nxt.is_paid ? "Оплачено ⭐" : "Тест 🆓"}\n\n/next — следующий · /done — закрыть`,
      });
      return;
    }
    case "/done": {
      const s = await currentServing();
      if (!s) { await send(chatId, "Сейчас никто не на рейте."); return; }
      await setStatus(s.id, "done");
      await send(chatId, `Талон #${s.id} закрыт ✅. /next — следующий.`);
      return;
    }
    case "/skip": {
      const s = await currentServing();
      if (!s) { await send(chatId, "Сейчас никто не на рейте."); return; }
      await setStatus(s.id, "cancelled");
      await send(chatId, `Талон #${s.id} пропущен. /next — следующий.`);
      return;
    }
    case "/clear": {
      const { data } = await supabase.from("rate_tickets").select("id").in("status", ACTIVE);
      const n = data ? data.length : 0;
      await supabase.from("rate_tickets").update({ status: "cancelled", served_at: new Date().toISOString() }).in("status", ACTIVE);
      await send(chatId, `Очередь очищена. Отменено талонов: <b>${n}</b>.`);
      return;
    }
    case "/stats": {
      const { data } = await supabase.from("rate_tickets").select("status");
      const c: Record<string, number> = { waiting: 0, serving: 0, done: 0, cancelled: 0 };
      for (const r of data || []) c[r.status] = (c[r.status] || 0) + 1;
      await send(chatId, `<b>Статистика:</b>\nВ очереди: ${c.waiting}\nНа рейте: ${c.serving}\nОбслужено: ${c.done}\nОтменено: ${c.cancelled}`);
      return;
    }
  }
}

// --- HTTP entrypoint ---
Deno.serve(async (req: Request) => {
  // Проверка секрета вебхука (Telegram шлёт его в заголовке)
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 401 });
  }
  try {
    const update = await req.json();
    await handleUpdate(update);
  } catch (e) {
    console.error("handler error", e);
  }
  // Telegram важен только 200 OK
  return new Response("ok", { status: 200 });
});
