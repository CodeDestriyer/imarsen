// IMARSEN — API мини-аппа (Supabase Edge Function).
//
// Авторизация без регистрации: сайт, открытый внутри Telegram, получает от
// клиента строку initData. Здесь она проверяется по HMAC-подписи бота — только
// после этого юзеру верят. initDataUnsafe на клиенте подделывается тривиально,
// поэтому на бэкенде ему не доверяем никогда.
//
// Экшены (POST, JSON):
//   { action: "sync" }                       -> upsert юзера + профиль со статой
//   { action: "save_result", result: {...} } -> сохранить ИИ-рейтинг + профиль
// В обоих случаях обязателен initData.
//
// Секреты (Supabase -> Edge Functions -> Secrets): BOT_TOKEN (тот же, что у бота).
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase подставляет сам.
import { createClient } from "jsr:@supabase/supabase-js@2";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Сколько живёт подпись initData. Telegram не протухает её сам, поэтому окно
// задаём мы: иначе перехваченная строка работала бы вечно.
const MAX_AUTH_AGE_SEC = 24 * 60 * 60;
const HISTORY_LIMIT = 5;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });

// --- Проверка подписи initData (Telegram WebApp) ---
type TgUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
};

const enc = new TextEncoder();

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", k, enc.encode(data));
}

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

// Сравнение за постоянное время — чтобы по времени ответа нельзя было подбирать хеш.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyInitData(initData: string): Promise<TgUser | null> {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  // data_check_string: пары key=value, отсортированные по ключу, через \n
  const pairs = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join("\n");

  const secret = await hmac(enc.encode("WebAppData"), BOT_TOKEN);
  const expected = toHex(await hmac(secret, dataCheckString));
  if (!safeEqual(expected, hash.toLowerCase())) return null;

  const authDate = Number(params.get("auth_date") || 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SEC) return null;

  const rawUser = params.get("user");
  if (!rawUser) return null;
  try {
    const u = JSON.parse(rawUser) as TgUser;
    return u && typeof u.id === "number" ? u : null;
  } catch {
    return null;
  }
}

// --- Профиль ---
async function upsertUser(u: TgUser) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("app_users")
    .upsert(
      {
        tg_user_id: u.id,
        username: u.username ?? null,
        first_name: u.first_name ?? null,
        last_name: u.last_name ?? null,
        photo_url: u.photo_url ?? null,
        language_code: u.language_code ?? null,
        is_premium: u.is_premium ?? false,
        last_seen_at: now,
      },
      { onConflict: "tg_user_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function buildProfile(u: TgUser) {
  const user = await upsertUser(u);

  const { data: history } = await supabase
    .from("rate_results")
    .select("id, overall, tier_key, tier_label, created_at")
    .eq("tg_user_id", u.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const { count } = await supabase
    .from("rate_results")
    .select("id", { count: "exact", head: true })
    .eq("tg_user_id", u.id);

  // Лучший результат — отдельным запросом, а не из history: в истории только
  // последние HISTORY_LIMIT, рекорд может быть старше.
  const { data: bestRows } = await supabase
    .from("rate_results")
    .select("overall, tier_label, created_at")
    .eq("tg_user_id", u.id)
    .order("overall", { ascending: false })
    .limit(1);

  // Место в очереди на живой рейт — если человек уже брал талон у бота.
  const { data: tickets } = await supabase
    .from("rate_tickets")
    .select("id, status")
    .eq("tg_user_id", u.id)
    .in("status", ["waiting", "serving"])
    .limit(1);

  return {
    user: {
      tgUserId: Number(user.tg_user_id),
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      photoUrl: user.photo_url,
      isPremium: user.is_premium,
      createdAt: user.created_at,
    },
    stats: {
      ratings: count ?? 0,
      best: bestRows?.length ? bestRows[0] : null,
      ticket: tickets?.length ? tickets[0] : null,
    },
    history: history ?? [],
  };
}

// --- Сохранение результата ---
type IncomingResult = {
  overall?: unknown;
  tierKey?: unknown;
  tierLabel?: unknown;
  scores?: unknown;
  metrics?: unknown;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

async function saveResult(userId: number, raw: IncomingResult) {
  const overall = Number(raw?.overall);
  if (!Number.isFinite(overall) || overall < 0 || overall > 1) {
    throw new Error("bad overall");
  }
  const tierKey = String(raw?.tierKey ?? "").slice(0, 32);
  const tierLabel = String(raw?.tierLabel ?? "").slice(0, 64);
  if (!tierKey || !tierLabel) throw new Error("bad tier");

  const { error } = await supabase.from("rate_results").insert({
    tg_user_id: userId,
    overall,
    tier_key: tierKey,
    tier_label: tierLabel,
    scores: isPlainObject(raw?.scores) ? raw.scores : {},
    metrics: isPlainObject(raw?.metrics) ? raw.metrics : {},
  });
  if (error) throw error;
}

// --- HTTP entrypoint ---
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let body: { action?: string; initData?: string; result?: IncomingResult };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const user = await verifyInitData(body.initData ?? "");
  if (!user) return json({ error: "unauthorized" }, 401);

  try {
    if (body.action === "save_result") {
      await saveResult(user.id, body.result ?? {});
    } else if (body.action !== "sync") {
      return json({ error: "unknown_action" }, 400);
    }
    return json(await buildProfile(user));
  } catch (e) {
    console.error("miniapp error", e);
    return json({ error: "server_error" }, 500);
  }
});
