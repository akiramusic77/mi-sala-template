-- Avisos automáticos con horarios (opcional) — pg_cron + pg_net.
-- Cómo usarlo: en el dashboard de tu Supabase → SQL Editor, pega este archivo
-- con tus 3 valores sustituidos y ejecútalo una vez. Crea un aviso diario de
-- ejemplo a las 9:00 (hora de Madrid, aguanta el cambio de horario de verano).
-- Para más avisos, duplica el bloque cambiando nombre, horas y textos.
--
-- Sustituye antes de ejecutar:
--   TU-PROYECTO   → el id de tu proyecto (lo ves en la URL del dashboard)
--   TU_ANON_KEY   → la anon key de Settings → API (es pública, va también en config.js)
--   TU_PUSH_TOKEN → la misma cadena que pusiste en el secret PUSH_TOKEN

select cron.schedule('sala-aviso-manana', '0 7,8 * * *', $$
  select net.http_post(
    url := 'https://TU-PROYECTO.supabase.co/functions/v1/push-send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'TU_ANON_KEY',
      'Authorization', 'Bearer TU_ANON_KEY',
      'x-push-token', 'TU_PUSH_TOKEN'
    ),
    body := jsonb_build_object(
      'title', 'Mi Sala',
      'body', 'Buenos días. Tu plan de hoy te espera en la Sala.',
      'tag', 'sala-manana'
    )
  ) where extract(hour from now() at time zone 'Europe/Madrid') = 9;
$$);

-- El doble horario UTC (7 y 8) + el filtro por hora de Madrid hace que el aviso
-- salga a las 9:00 todo el año, en verano y en invierno, disparando una sola vez.
-- Para borrar el aviso: select cron.unschedule('sala-aviso-manana');
