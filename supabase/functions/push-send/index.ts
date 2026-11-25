// push-send — envía notificaciones web push a las suscripciones guardadas
// en la tabla push_subscriptions de tu Supabase.
//
// Secrets a configurar una vez (ver GUIA.md, sección Notificaciones):
//   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... \
//     VAPID_SUBJECT=mailto:tu-correo@ejemplo.com PUSH_TOKEN=una-cadena-larga-e-inventada
// SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY las pone Supabase.
//
// La función acepta llamadas de dos caminos:
//   a) de tu app con sesión iniciada (botón "Probar" de Configuración);
//   b) de tus crons con la cabecera x-push-token igual a tu PUSH_TOKEN.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUSH_TOKEN = Deno.env.get("PUSH_TOKEN") || "";

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:hola@ejemplo.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  let allowed = !!PUSH_TOKEN && req.headers.get("x-push-token") === PUSH_TOKEN;
  if (!allowed) {
    try {
      const auth = req.headers.get("authorization") || "";
      const asUser = createClient(URL_, ANON, { global: { headers: { Authorization: auth } } });
      const { data: { user } } = await asUser.auth.getUser();
      allowed = !!user;
    } catch (_) { /* sigue sin permiso */ }
  }
  if (!allowed) return Response.json({ error: "sin permiso" }, { status: 401 });

  const payload = await req.json().catch(() => ({}));
  const { title = "Mi Sala", body = "", tag = "sala", url = "./" } = payload;

  const sb = createClient(URL_, SERVICE);
  const { data: subs, error } = await sb.from("push_subscriptions").select("endpoint,p256dh,auth");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let sent = 0, cleaned = 0;
  for (const s of subs || []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ title, body, tag, url })
      );
      sent++;
    } catch (e) {
      const code = (e && (e.statusCode || e.status)) || 0;
      if (code === 404 || code === 410) {
        await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        cleaned++;
      }
    }
  }
  return Response.json({ ok: true, sent, cleaned });
});
