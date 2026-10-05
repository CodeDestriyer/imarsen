// IMARSEN — Telegram-бот очереди на рейт внешности (Supabase Edge Function, вебхук).
//
// Бесплатно, serverless: Telegram при каждом апдейте дёргает эту функцию.
// Флоу пользователя: /start -> кнопка «Получить талон 🎫» -> прислал фото ->
//   (тест-режим: талон сразу | платно: счёт 50⭐ -> оплата) -> номер в очереди.
// Флоу блогера (админа): /queue /next /done /skip /clear /stats /soon
//
// Секреты (Supabase -> Edge Functions -> Secrets): BOT_TOKEN, WEBHOOK_SECRET.
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase подставляет сам.
import { createClient } from "jsr:@supabase/supabase-js@2";

// --- Конфиг (не секретный; меняется передеплоем) ---
const PAID_MODE = true; // false = тест (талон бесплатно), true = оплата звёздами
const TICKET_PRICE_STARS = 50; // цена талона в звёздах
const ADMIN_IDS: number[] = [7256107332, 915335079]; // Telegram ID блогера/админов

const BTN_GET = "Мгновенный рейт⚡️";

// --- Секреты / окружение ---
const BOT_TOKEN = Deno.env.get("BOT_TOKEN")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// URL мини-приложения (сайт). Задаётся секретом WEBAPP_URL в Supabase -> Edge Functions.
// Пока это существующий лендинг; позже поменяем на отдельный WebApp — просто сменив секрет.
const WEBAPP_URL = Deno.env.get("WEBAPP_URL") ?? "https://imarsen.vercel.app";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const ACTIVE = ["waiting", "serving"];
// Reply-клавиатура: только «Мгновенный рейт». Приложение открывается нативной
// кнопкой-меню слева от поля ввода (см. setMenuButton).
const mainKb = {
  keyboard: [[{ text: BTN_GET }]],
  resize_keyboard: true,
  input_field_placeholder: "Нажми кнопку, чтобы получить талон",
};

// Постоянная кнопка-меню слева от поля ввода → открывает приложение (WebApp).
async function setMenuButton(chatId: number) {
  await tg("setChatMenuButton", {
    chat_id: chatId,
    menu_button: { type: "web_app", text: "Приложение", web_app: { url: WEBAPP_URL } },
  });
}

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

// Экранирование HTML (имена и комментарии — свободный текст, могут содержать < > &)
function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- Хелперы БД ---
function rowName(r: any): string {
  let name = esc(r.first_name || "Гость");
  if (r.username) name += ` (@${esc(r.username)})`;
  return name;
}

// --- Черновики (фото ждёт комментарий) ---
async function getDraft(userId: number) {
  const { data } = await supabase.from("rate_drafts").select("*").eq("tg_user_id", userId).limit(1);
  return data && data.length ? data[0] : null;
}

async function upsertDraft(u: any, photoFileId: string) {
  await supabase.from("rate_drafts").upsert({
    tg_user_id: u.id,
    username: u.username ?? null,
    first_name: u.first_name ?? null,
    photo_file_id: photoFileId,
    comment: null,
    created_at: new Date().toISOString(),
  });
}

async function deleteDraft(userId: number) {
  await supabase.from("rate_drafts").delete().eq("tg_user_id", userId);
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
                            amount: number, chargeId: string | null,
                            comment: string | null = null) {
  const { data, error } = await supabase.from("rate_tickets").insert({
    tg_user_id: u.id,
    username: u.username ?? null,
    first_name: u.first_name ?? null,
    photo_file_id: photoFileId,
    is_paid: isPaid,
    amount_stars: amount,
    payment_charge_id: chargeId,
    comment: comment,
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

// Оповестить админов о новом человеке в очереди (с его фото)
async function notifyAdmins(ticket: any, photoFileId: string) {
  const caption =
    `🔔 <b>Новый в очереди</b>\n` +
    `Талон #${ticket.id} · ${rowName(ticket)}\n` +
    (ticket.is_paid ? `Оплачено ${ticket.amount_stars}⭐` : "Тест 🆓") +
    (ticket.comment ? `\n💬 ${esc(ticket.comment)}` : "");
  for (const adminId of ADMIN_IDS) {
    if (adminId === ticket.tg_user_id) continue; // не шлём тому, кто сам взял талон
    await tg("sendPhoto", { chat_id: adminId, photo: photoFileId, parse_mode: "HTML", caption });
  }
}

// Завершить заявку из черновика: тест -> сразу в очередь, платно -> счёт
async function submitDraft(from: any, chatId: number, draft: any) {
  if (!PAID_MODE) {
    const t = await createTicket(from, draft.photo_file_id, false, 0, null, draft.comment);
    await deleteDraft(from.id);
    const pos = await positionInQueue(t.id);
    await send(chatId,
      `🎫 Талон <b>#${t.id}</b> твой!\nПозиция в очереди: <b>${pos}</b>.\n\nЖди вызова в эфире 🔴 (тест-режим, бесплатно).`,
      { reply_markup: mainKb });
    await notifyAdmins(t, draft.photo_file_id);
    return;
  }
  // Платный режим: выставляем счёт. Фото/коммент остаются в черновике до оплаты.
  await tg("sendInvoice", {
    chat_id: chatId,
    title: "VIP-талон на рейт",
    description: `Проход без очереди на рейт внешности в прямом эфире. Стоимость: ${TICKET_PRICE_STARS}⭐️.`,
    payload: "rate",
    currency: "XTR",
    prices: [{ label: "VIP-талон", amount: TICKET_PRICE_STARS }],
  });
}

// --- Открытие скана из мини-аппа ---
// Счёт выписывает функция miniapp с payload "scan:<tg_user_id>:<result_id>:<скидка>".
// Пропускать такие оплаты в ветку талонов нельзя: там человек получил бы
// «потерялось фото».
function parseScanPayload(payload: string) {
  const m = /^scan:(\d+):(\d+):(\d+)$/.exec(payload);
  return m ? { userId: Number(m[1]), resultId: Number(m[2]), discount: Number(m[3]) } : null;
}

async function unlockScan(from: any, chatId: number, sp: any) {
  const scan = parseScanPayload(sp.invoice_payload || "");
  if (!scan) return;

  // Telegram может доставить апдейт повторно: charge_id уникален, второй раз
  // вставка упадёт с конфликтом, и мы ничего не сделаем дважды.
  const { error } = await supabase.from("star_payments").insert({
    charge_id: sp.telegram_payment_charge_id,
    tg_user_id: from.id,
    product: "scan",
    amount_stars: sp.total_amount,
    result_id: scan.resultId,
    discount_stars: scan.discount,
  });
  if (error) {
    if (error.code === "23505") return; // уже обработан
    throw error;
  }

  await supabase.from("rate_results")
    .update({ unlocked_at: new Date().toISOString() })
    .eq("id", scan.resultId)
    .eq("tg_user_id", from.id);

  // Скидку списываем за самого раннего неиспользованного друга.
  if (scan.discount > 0) {
    const { data } = await supabase.from("referrals")
      .select("invitee_id")
      .eq("inviter_id", from.id).is("used_at", null)
      .order("created_at").limit(1);
    if (data?.length) {
      await supabase.from("referrals")
        .update({ used_at: new Date().toISOString() })
        .eq("invitee_id", data[0].invitee_id);
    }
  }

  await send(chatId, "Рейт открыт ✅ Возвращайся в приложение — тир и все метрики уже там.", { reply_markup: mainKb });
}

// Возврат (refundStarPayment или спор): скан снова закрываем.
async function relockScan(rp: any) {
  const scan = parseScanPayload(rp.invoice_payload || "");
  if (!scan) return;
  await supabase.from("star_payments")
    .update({ refunded_at: new Date().toISOString() })
    .eq("charge_id", rp.telegram_payment_charge_id);
  await supabase.from("rate_results").update({ unlocked_at: null }).eq("id", scan.resultId);
}

// --- Рефералка: /start ref_<id> ---
// Засчитываем только новичка: кто уже бывал в боте или мини-аппе, тот не
// «приглашённый». Иначе друзья бы бесконечно перекидывались ссылками.
async function registerReferral(from: any, arg: string) {
  const m = /^ref_(\d+)$/.exec(arg);
  if (!m) return;
  const inviterId = Number(m[1]);
  if (inviterId === from.id) return;

  const seen = await Promise.all([
    supabase.from("app_users").select("tg_user_id").eq("tg_user_id", from.id).limit(1),
    supabase.from("rate_tickets").select("id").eq("tg_user_id", from.id).limit(1),
    supabase.from("rate_drafts").select("tg_user_id").eq("tg_user_id", from.id).limit(1),
    supabase.from("referrals").select("invitee_id").eq("invitee_id", from.id).limit(1),
  ]);
  if (seen.some((r) => r.data?.length)) return;

  const { error } = await supabase.from("referrals").insert({ invitee_id: from.id, inviter_id: inviterId });
  if (error) return; // гонка двух /start — второй просто не засчитается
  await send(inviterId,
    `🎁 ${esc(from.first_name || "Друг")} пришёл по твоей ссылке — у тебя скидка <b>50⭐</b> на следующее открытие рейта.`);
}

async function handleUpdate(update: any) {
  // Подтверждение оплаты (обязательно в течение 10 сек)
  if (update.pre_checkout_query) {
    const q = update.pre_checkout_query;
    const payload: string = q.invoice_payload || "";
    // Счёт на скан выписан на конкретного человека — чужой оплатить нельзя.
    // Всё остальное (талоны) пропускаем как раньше, без проверок.
    const scan = parseScanPayload(payload);
    const ok = scan === null || scan.userId === q.from.id;
    await tg("answerPreCheckoutQuery", {
      pre_checkout_query_id: q.id,
      ok,
      ...(ok ? {} : { error_message: "Счёт устарел. Открой оплату заново из приложения." }),
    });
    return;
  }

  // Инлайн-кнопки: «Пропустить» (черновик) + админ-пульт под карточкой /next
  if (update.callback_query) {
    const cq = update.callback_query;
    await tg("answerCallbackQuery", { callback_query_id: cq.id });
    if (!cq.message) return;
    const cbChat = cq.message.chat.id;
    // Пульт: переиспользуем существующие команды (проверка админа — внутри handleCommand)
    if (cq.data === "adm_next") return handleCommand("/next", cbChat, cq.from);
    if (cq.data === "adm_queue") return handleCommand("/queue", cbChat, cq.from);
    if (cq.data === "adm_stats") return handleCommand("/stats", cbChat, cq.from);
    return;
  }

  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat.id;
  const from = msg.from;

  if (msg.refunded_payment) {
    await relockScan(msg.refunded_payment);
    return;
  }

  // Успешная оплата -> создаём талон из черновика (фото + комментарий)
  if (msg.successful_payment) {
    const sp = msg.successful_payment;
    if (parseScanPayload(sp.invoice_payload || "")) {
      await unlockScan(from, chatId, sp);
      return;
    }
    const draft = await getDraft(from.id);
    if (!draft) {
      await send(chatId, "Оплата прошла ✅, но потерялось фото. Пришли фото ещё раз — талон закреплю без повторной оплаты.");
      return;
    }
    if (await getActiveTicket(from.id)) {
      await deleteDraft(from.id);
      await send(chatId, "У тебя уже есть активный талон 🎫", { reply_markup: mainKb });
      return;
    }
    const t = await createTicket(from, draft.photo_file_id, true, sp.total_amount, sp.telegram_payment_charge_id, draft.comment);
    await deleteDraft(from.id);
    const pos = await positionInQueue(t.id);
    await send(chatId,
      `Оплата прошла ✅\n\n🎫 VIP-талон <b>#${t.id}</b> твой!\nПозиция в очереди: <b>${pos}</b>.\n\nЖди вызова в прямом эфире 🔴`,
      { reply_markup: mainKb });
    await notifyAdmins(t, draft.photo_file_id);
    return;
  }

  // Фото -> сохраняем черновик и просим комментарий
  if (msg.photo && msg.photo.length) {
    const photoFileId = msg.photo[msg.photo.length - 1].file_id; // самое крупное
    if (await getActiveTicket(from.id)) {
      await send(chatId, "У тебя уже есть активный талон 🎫 (посмотреть — /myticket)", { reply_markup: mainKb });
      return;
    }
    await upsertDraft(from, photoFileId);
    await submitDraft(from, chatId, { photo_file_id: photoFileId, comment: null });
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
    const [head, arg = ""] = text.split(/\s+/);
    const cmd = head.split("@")[0].toLowerCase();
    if (cmd === "/start" && arg) await registerReferral(from, arg);
    return handleCommand(cmd, chatId, from, arg);
  }

  // Прочее
  await send(chatId, "Жми «Мгновенный рейт⚡️» и пришли фото 📸", { reply_markup: mainKb });
}

async function handleCommand(cmd: string, chatId: number, from: any, arg = "") {
  switch (cmd) {
    case "/start": {
      await setMenuButton(chatId);
      await send(chatId,
        "Устал ждать своей <b>очереди</b>?\n\n" +
        `Купи <b>мгновенный рейтинг</b> на стриме за ${TICKET_PRICE_STARS}⭐️\n\n` +
        "Жми кнопку «<b>Мгновенный рейт</b>⚡️»",
        { reply_markup: mainKb });
      return;
    }
    case "/myid":
      await send(chatId, `Твой Telegram ID: <code>${from.id}</code>`);
      return;
    case "/myticket": {
      const t = await getActiveTicket(from.id);
      if (!t) { await send(chatId, "Активного талона нет. Жми «Мгновенный рейт⚡️»."); return; }
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
        caption: `🔴 <b>Следующий на рейте</b>\nТалон #${nxt.id} · ${rowName(nxt)}\n${nxt.is_paid ? "Оплачено ⭐" : "Тест 🆓"}` +
          (nxt.comment ? `\n💬 ${esc(nxt.comment)}` : "") +
          `\n\n/next — следующий · /done — закрыть`,
        reply_markup: {
          inline_keyboard: [
            [{ text: "▶️ Следующий", callback_data: "adm_next" }],
            [{ text: "📋 Очередь", callback_data: "adm_queue" }, { text: "💰 Стата", callback_data: "adm_stats" }],
          ],
        },
      });
      // Алерт юзеру: его очередь подошла
      await tg("sendMessage", {
        chat_id: nxt.tg_user_id,
        parse_mode: "HTML",
        text: "🔴 <b>Твоя очередь!</b> Ты сейчас на рейте — смотри стрим 👀",
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
    case "/soon": {
      // Заглушка «Soon» в мини-аппе. Сайт читает флаг из app_settings при
      // каждом открытии, так что переключается сразу, без деплоя.
      const a = arg.toLowerCase();
      if (a === "on" || a === "off") {
        const { error } = await supabase.from("app_settings")
          .upsert({ key: "soon", value: a === "on", updated_at: new Date().toISOString() });
        if (error) { await send(chatId, "Не получилось сохранить 😕"); return; }
      }
      const { data } = await supabase.from("app_settings").select("value").eq("key", "soon").maybeSingle();
      const on = data?.value === true;
      await send(chatId,
        `Заглушка Soon: <b>${on ? "ВКЛ 🔒" : "ВЫКЛ ✅"}</b>\n\n/soon on — включить\n/soon off — выключить`);
      return;
    }
    case "/stats": {
      const { data } = await supabase.from("rate_tickets").select("status, amount_stars");
      const c: Record<string, number> = { waiting: 0, serving: 0, done: 0, cancelled: 0 };
      let stars = 0;
      for (const r of data || []) {
        c[r.status] = (c[r.status] || 0) + 1;
        stars += r.amount_stars || 0;
      }
      const usd = (stars * 0.014).toFixed(2); // 80 клиентов × 50⭐ = 4000⭐ ≈ $56 -> $0.014/⭐
      await send(chatId, `<b>Статистика:</b>\nВ очереди: ${c.waiting}\nНа рейте: ${c.serving}\nОбслужено: ${c.done}\nОтменено: ${c.cancelled}\n\n💰 Собрано: <b>${stars}⭐</b> (≈ $${usd})`);
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
