// IMARSEN — Telegram-бот очереди на рейт внешности (Supabase Edge Function, вебхук).
//
// Бесплатно, serverless: Telegram при каждом апдейте дёргает эту функцию.
// Флоу пользователя: /start -> кнопка «Получить талон 🎫» -> прислал фото ->
//   (тест-режим: талон сразу | платно: счёт 50⭐ -> оплата) -> номер в очереди.
// Флоу блогера (админа): /queue /next /done /skip /clear /stats /soon /paid
//
// Секреты (Supabase -> Edge Functions -> Secrets): BOT_TOKEN, WEBHOOK_SECRET.
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase подставляет сам.
import { createClient } from "jsr:@supabase/supabase-js@2";

// --- Конфиг (не секретный; меняется передеплоем) ---
const PAID_MODE = true; // false = тест (талон бесплатно), true = оплата звёздами
const TICKET_PRICE_STARS = 50; // цена талона в звёздах
const ADMIN_IDS: number[] = [7256107332, 915335079]; // Telegram ID блогера/админов

// Платная группа (с темами): подписка звёздами через бота, см. «Платная группа» ниже.
const GROUP_PRICE_STARS = 300; // в месяц
const GROUP_PERIOD_SEC = 2592000; // 30 дней — единственный период подписки в Telegram
const KICK_GRACE_MS = 6 * 3600 * 1000; // запас после конца срока: продление может прийти с задержкой
const NOTIFY_NEW_SUBSCRIBERS = true; // слать админам «новый подписчик»
// Апдейты, которые боту нужны. chat_join_request Telegram по умолчанию не шлёт.
const ALLOWED_UPDATES = ["message", "callback_query", "pre_checkout_query", "my_chat_member", "chat_join_request"];

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

// --- Платная группа: подписка через бота ---
// Группа с темами — не канал, нативной подписки Telegram у неё нет. Поэтому:
// бот выставляет счёт 300⭐ с автопродлением (subscription_period), Telegram сам
// списывает звёзды каждые 30 дней и шлёт нам successful_payment. Вход — по
// ссылке с заявкой: заявку одобряем, только если подписка оплачена. Раз в час
// pg_cron дёргает эту функцию, и тех, у кого срок вышел, бот удаляет из группы.
type PaidGroup = { id: number; title: string; invite?: string };

async function getPaidGroup(): Promise<PaidGroup | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", "paid_group").maybeSingle();
  return (data?.value as any) ?? null;
}

async function savePaidGroup(v: PaidGroup) {
  await supabase.from("app_settings")
    .upsert({ key: "paid_group", value: v, updated_at: new Date().toISOString() });
}

// Включить в вебхуке нужные апдейты (chat_join_request по умолчанию не приходит).
async function ensureWebhookUpdates(): Promise<string | null> {
  const info = await tg("getWebhookInfo", {});
  const url = info?.result?.url;
  if (!url) return "вебхук не найден";
  const cur: string[] = info.result.allowed_updates ?? [];
  if (ALLOWED_UPDATES.every((u) => cur.includes(u))) return null;
  const r = await tg("setWebhook", {
    url,
    allowed_updates: ALLOWED_UPDATES,
    ...(WEBHOOK_SECRET ? { secret_token: WEBHOOK_SECRET } : {}),
  });
  return r.ok ? null : (r.description || "setWebhook не прошёл");
}

const tsOrNull = (unix?: number) => (unix ? new Date(unix * 1000).toISOString() : null);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });

function parseSubPayload(payload: string) {
  const m = /^sub:(\d+)$/.exec(payload);
  return m ? { userId: Number(m[1]) } : null;
}

async function getSub(userId: number) {
  const { data } = await supabase.from("group_subs").select("*").eq("tg_user_id", userId).maybeSingle();
  return data;
}
const isActive = (s: any) => !!s?.paid_until && Date.parse(s.paid_until) > Date.now();

async function botUsername(): Promise<string> {
  const r = await tg("getMe", {});
  return r?.result?.username ?? "";
}

// Ссылка-вход в группу с заявкой. Одна на всех: без оплаты заявку не одобрим,
// так что слить её бесполезно.
async function joinLink(): Promise<string | null> {
  const g = await getPaidGroup();
  if (!g) return null;
  if (g.invite) return g.invite;
  const r = await tg("createChatInviteLink", { chat_id: g.id, name: "Подписчики", creates_join_request: true });
  if (!r.ok) return null;
  await savePaidGroup({ ...g, invite: r.result.invite_link });
  return r.result.invite_link;
}

// Человеку: статус подписки или счёт на оплату.
async function offerSub(chatId: number, from: any) {
  const g = await getPaidGroup();
  if (!g) { await send(chatId, "Подписка скоро откроется 🔜"); return; }
  const s = await getSub(from.id);
  if (isActive(s)) {
    const link = await joinLink();
    await send(chatId,
      `✅ Подписка активна до <b>${fmtDate(s.paid_until)}</b>.` +
      (s.manual ? "" : "\nПродлевается сама. Отменить: Настройки → Мои звёзды → Подписки.") +
      (link ? `\n\nВход в группу: ${link}` : ""));
    return;
  }
  const r = await tg("createInvoiceLink", {
    title: "Подписка на 30 дней",
    description: `Доступ в закрытую группу «${g.title}». Продлевается автоматически, отменить можно в любой момент.`.slice(0, 255),
    payload: `sub:${from.id}`,
    currency: "XTR",
    prices: [{ label: "Подписка на 30 дней", amount: GROUP_PRICE_STARS }],
    subscription_period: GROUP_PERIOD_SEC,
  });
  if (!r.ok) { await send(chatId, "Не получилось выставить счёт 😕 Попробуй позже."); return; }
  await send(chatId,
    `🔒 <b>${esc(g.title)}</b>\n\n` +
    `Доступ в закрытую группу — <b>${GROUP_PRICE_STARS}⭐ в месяц</b>.\n` +
    "Продлевается автоматически, отменить можно в любой момент.",
    { reply_markup: { inline_keyboard: [[{ text: `Оплатить ${GROUP_PRICE_STARS}⭐`, url: r.result }]] } });
}

// Выдать доступ на срок: оплата или ручная выдача админом.
async function grantAccess(user: any, until: string, manual: boolean) {
  const prev = await getSub(user.id);
  const now = new Date().toISOString();
  await supabase.from("group_subs").upsert({
    tg_user_id: user.id,
    username: user.username ?? prev?.username ?? null,
    first_name: user.first_name ?? prev?.first_name ?? null,
    paid_until: until,
    manual,
    first_paid_at: prev?.first_paid_at ?? now,
    last_paid_at: manual ? (prev?.last_paid_at ?? null) : now,
    payments: (prev?.payments ?? 0) + (manual ? 0 : 1),
    kicked_at: null,
    updated_at: now,
  });
  // Если раньше выкидывали — снимаем бан, чтобы заявка прошла.
  const g = await getPaidGroup();
  if (g) await tg("unbanChatMember", { chat_id: g.id, user_id: user.id, only_if_banned: true });
  return prev;
}

async function onSubPayment(from: any, chatId: number, sp: any) {
  const { error } = await supabase.from("star_payments").insert({
    charge_id: sp.telegram_payment_charge_id,
    tg_user_id: from.id,
    product: "group_sub",
    amount_stars: sp.total_amount,
    is_recurring: !!sp.is_recurring,
    subscription_expires_at: tsOrNull(sp.subscription_expiration_date),
  });
  if (error) {
    if (error.code === "23505") return; // повторная доставка
    throw error;
  }
  const until = tsOrNull(sp.subscription_expiration_date) ??
    new Date(Date.now() + GROUP_PERIOD_SEC * 1000).toISOString();
  const prev = await grantAccess(from, until, false);

  if (sp.is_recurring && !sp.is_first_recurring) {
    await send(chatId, `Подписка продлена до <b>${fmtDate(until)}</b> ✅`);
    return;
  }
  const link = await joinLink();
  await send(chatId,
    `Оплата прошла ✅ Подписка до <b>${fmtDate(until)}</b>.\n\n` +
    (link ? `Вход в группу: ${link}\nЖми и подай заявку — бот одобрит её сразу.` : "Ссылку на вход пришлёт админ."));
  if (NOTIFY_NEW_SUBSCRIBERS) {
    const again = prev?.payments ? " (вернулся)" : "";
    for (const adminId of ADMIN_IDS) {
      await send(adminId, `💎 Новый подписчик${again}: ${rowName(from)} · +${sp.total_amount}⭐`);
    }
  }
}

// Возврат звёзд — доступ закрываем сразу.
async function onSubRefund(rp: any, from: any) {
  await supabase.from("star_payments")
    .update({ refunded_at: new Date().toISOString() })
    .eq("charge_id", rp.telegram_payment_charge_id);
  await supabase.from("group_subs").update({ paid_until: new Date().toISOString() }).eq("tg_user_id", from.id);
  const g = await getPaidGroup();
  if (g) await kickUser(g, from.id);
}

// Заявка на вход: оплатил — пускаем, нет — отказ и счёт в личку.
async function onJoinRequest(r: any) {
  const g = await getPaidGroup();
  if (!g || r.chat?.id !== g.id) return;
  const uid = r.from.id;
  if (isAdmin(uid) || isActive(await getSub(uid))) {
    await tg("approveChatJoinRequest", { chat_id: g.id, user_id: uid });
    return;
  }
  await tg("declineChatJoinRequest", { chat_id: g.id, user_id: uid });
  await offerSub(r.user_chat_id ?? uid, r.from);
}

// Удалить из группы, но не навсегда: бан + сразу разбан.
async function kickUser(g: PaidGroup, userId: number) {
  if (isAdmin(userId)) return;
  const b = await tg("banChatMember", { chat_id: g.id, user_id: userId });
  if (b.ok) await tg("unbanChatMember", { chat_id: g.id, user_id: userId, only_if_banned: true });
  await supabase.from("group_subs").update({ kicked_at: new Date().toISOString() }).eq("tg_user_id", userId);
}

// Крон: у кого срок вышел (с запасом на списание продления) — удаляем.
async function expireSubs(): Promise<number> {
  const g = await getPaidGroup();
  if (!g) return 0;
  const cutoff = new Date(Date.now() - KICK_GRACE_MS).toISOString();
  const { data } = await supabase.from("group_subs").select("tg_user_id")
    .lt("paid_until", cutoff).is("kicked_at", null);
  for (const s of data || []) {
    await kickUser(g, s.tg_user_id);
    await send(s.tg_user_id, "Подписка на группу закончилась — доступ закрыт.\n\nВернуться можно в любой момент: /sub");
  }
  return (data || []).length;
}

// Подключить группу. Боту нужны права банить и приглашать.
async function connectGroup(replyTo: number, groupId: number) {
  const r = await tg("getChat", { chat_id: groupId });
  if (!r.ok || r.result.type !== "supergroup") {
    await send(replyTo, "Это не супергруппа. Группа с темами подходит — проверь, что бот в ней админ.");
    return;
  }
  const ch = r.result;
  const botId = Number(BOT_TOKEN.split(":")[0]);
  const me = (await tg("getChatMember", { chat_id: ch.id, user_id: botId }))?.result;
  if (me?.status !== "administrator") {
    await send(replyTo, `Бот не админ в «${esc(ch.title || "")}». Сделай его админом.`);
    return;
  }
  const prev = await getPaidGroup();
  await savePaidGroup({ id: ch.id, title: ch.title || "группа", invite: prev?.id === ch.id ? prev.invite : undefined });
  const err = await ensureWebhookUpdates();
  const miss = [
    me.can_restrict_members ? "" : "«Блокировка участников»",
    me.can_invite_users ? "" : "«Пригласительные ссылки»",
  ].filter(Boolean);
  const bot = await botUsername();
  await send(replyTo,
    `✅ Группа «${esc(ch.title || "")}» подключена.\n` +
    (miss.length ? `\n⚠️ Дай боту права: ${miss.join(", ")} — без них не будет работать.\n` : "") +
    (err ? `\n⚠️ Вебхук: ${esc(err)}\n` : "") +
    `\nСсылка для продажи подписки (её и публикуй):\nhttps://t.me/${bot}?start=sub\n\n` +
    "Важно: публичную ссылку-приглашение группы и вход без заявки лучше убрать, иначе зайдут бесплатно.\n\n/paid — статистика и команды");
}

async function paidStatus(chatId: number) {
  const g = await getPaidGroup();
  if (!g) {
    await ensureWebhookUpdates();
    await send(chatId,
      "<b>Платная группа не подключена.</b>\n\n" +
      "1. Сделай бота админом в группе с правами «Блокировка участников» и «Пригласительные ссылки».\n" +
      "2. Напиши в группе <code>/paid</code> (не анонимно) — бот подключит её и удалит команду.\n\n" +
      "Бот может отписаться и сам сразу после добавления.");
    return;
  }
  await ensureWebhookUpdates();
  const now = Date.now();
  const monthAgo = new Date(now - GROUP_PERIOD_SEC * 1000).toISOString();
  const [{ data: subs }, { data: pays }] = await Promise.all([
    supabase.from("group_subs").select("paid_until, manual, first_paid_at, kicked_at"),
    supabase.from("star_payments").select("amount_stars, refunded_at").eq("product", "group_sub").gte("created_at", monthAgo),
  ]);
  const rows = subs || [];
  const active = rows.filter(isActive);
  const paidActive = active.filter((r: any) => !r.manual).length;
  const fresh = rows.filter((r: any) => r.first_paid_at && r.first_paid_at > monthAgo).length;
  const gone = rows.filter((r: any) => r.kicked_at).length;
  const ok = (pays || []).filter((p: any) => !p.refunded_at);
  const stars = ok.reduce((a: number, p: any) => a + (p.amount_stars || 0), 0);
  const bot = await botUsername();
  await send(chatId,
    `<b>Платная группа:</b> ${esc(g.title)}\n` +
    `Цена: ${GROUP_PRICE_STARS}⭐ / 30 дней\n` +
    `Продажа: https://t.me/${bot}?start=sub\n\n` +
    `👥 С доступом: <b>${active.length}</b> (платных ${paidActive}, выдано вручную ${active.length - paidActive})\n` +
    `🆕 Новых за 30 дней: ${fresh}\n` +
    `👋 Не продлили (удалены): ${gone}\n` +
    `💰 Оплат за 30 дней: ${ok.length} на <b>${stars}⭐</b>\n\n` +
    "<b>Команды:</b>\n" +
    "/paid give ID [дней] — выдать доступ вручную (по умолчанию 30)\n" +
    "/paid take ID — забрать доступ и удалить из группы\n" +
    "/paid check — прогнать проверку просрочек сейчас\n\n" +
    "<i>ID человека — его /myid в боте.</i>");
}

async function paidCommand(chatId: number, arg: string, rest: string) {
  const a = arg.toLowerCase();
  const [idStr, daysStr] = rest.trim().split(/\s+/);
  const uid = Number(idStr);
  if (a === "give") {
    if (!uid) { await send(chatId, "Формат: /paid give ID [дней]"); return; }
    const days = Math.max(1, Number(daysStr) || 30);
    const cur = await getSub(uid);
    const base = isActive(cur) ? Date.parse(cur.paid_until) : Date.now();
    const until = new Date(base + days * 86400000).toISOString();
    await grantAccess({ id: uid }, until, true);
    const link = await joinLink();
    await send(uid, `🎁 Тебе выдали доступ в группу до <b>${fmtDate(until)}</b>.` + (link ? `\n\nВход: ${link}` : ""));
    await send(chatId, `Готово: ${uid} с доступом до ${fmtDate(until)}.`);
    return;
  }
  if (a === "take") {
    if (!uid) { await send(chatId, "Формат: /paid take ID"); return; }
    await supabase.from("group_subs").update({ paid_until: new Date().toISOString() }).eq("tg_user_id", uid);
    const g = await getPaidGroup();
    if (g) await kickUser(g, uid);
    await send(chatId, `Доступ у ${uid} забран, из группы удалён.`);
    return;
  }
  if (a === "check") {
    const n = await expireSubs();
    await send(chatId, `Проверка прошла. Удалено просроченных: ${n}.`);
    return;
  }
  return paidStatus(chatId);
}

// Бота сделали админом в группе — подключаем сами.
async function onMyChatMember(u: any) {
  if (u.chat?.type !== "supergroup" || !isAdmin(u.from?.id)) return;
  if (u.new_chat_member?.status !== "administrator") return;
  const prev = await getPaidGroup();
  if (prev?.id === u.chat.id) return;
  await connectGroup(u.from.id, u.chat.id);
}

async function handleUpdate(update: any) {
  if (update.my_chat_member) return onMyChatMember(update.my_chat_member);
  if (update.chat_join_request) return onJoinRequest(update.chat_join_request);

  // Подтверждение оплаты (обязательно в течение 10 сек)
  if (update.pre_checkout_query) {
    const q = update.pre_checkout_query;
    const payload: string = q.invoice_payload || "";
    // Счёт на скан выписан на конкретного человека — чужой оплатить нельзя.
    // Всё остальное (талоны) пропускаем как раньше, без проверок.
    const scan = parseScanPayload(payload);
    const sub = parseSubPayload(payload);
    const ok = (scan === null || scan.userId === q.from.id) && (sub === null || sub.userId === q.from.id);
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
  // В группах бот молчит. Единственное исключение — админ пишет /paid в
  // группе, чтобы подключить её как платную.
  if (msg.chat.type !== "private") {
    const t = (msg.text || "").trim();
    if (/^\/paid(@\w+)?$/i.test(t) && isAdmin(msg.from?.id)) {
      await tg("deleteMessage", { chat_id: msg.chat.id, message_id: msg.message_id });
      await connectGroup(msg.from.id, msg.chat.id);
    }
    return;
  }
  const chatId = msg.chat.id;
  const from = msg.from;

  if (msg.refunded_payment) {
    if (parseSubPayload(msg.refunded_payment.invoice_payload || "")) await onSubRefund(msg.refunded_payment, from);
    else await relockScan(msg.refunded_payment);
    return;
  }

  // Успешная оплата -> создаём талон из черновика (фото + комментарий)
  if (msg.successful_payment) {
    const sp = msg.successful_payment;
    if (parseSubPayload(sp.invoice_payload || "")) {
      await onSubPayment(from, chatId, sp);
      return;
    }
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
    const [head, arg = "", ...rest] = text.split(/\s+/);
    const cmd = head.split("@")[0].toLowerCase();
    if (cmd === "/start" && arg) await registerReferral(from, arg);
    return handleCommand(cmd, chatId, from, arg, rest.join(" "));
  }

  // Прочее
  await send(chatId, "Жми «Мгновенный рейт⚡️» и пришли фото 📸", { reply_markup: mainKb });
}

async function handleCommand(cmd: string, chatId: number, from: any, arg = "", rest = "") {
  switch (cmd) {
    case "/sub":
      return offerSub(chatId, from);
    case "/start": {
      if (arg === "sub") return offerSub(chatId, from);
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
    case "/paid":
      return paidCommand(chatId, arg, rest);
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
  // Ежечасный вызов из pg_cron: ключ лежит в app_settings (cron_key), наружу не отдаётся.
  const cronKey = req.headers.get("x-cron-key");
  if (cronKey) {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "cron_key").maybeSingle();
    if (!data?.value || data.value !== cronKey) return new Response("forbidden", { status: 401 });
    try {
      const n = await expireSubs();
      return new Response(JSON.stringify({ expired: n }), { status: 200 });
    } catch (e) {
      console.error("cron error", e);
      return new Response("error", { status: 500 });
    }
  }
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
