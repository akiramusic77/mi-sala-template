/* ---------- Deporte: registro de cinta y actividad ---------- */
/* Módulo cargado bajo demanda desde app.js (openDeporte). */

const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const addDays = (key, n) => { const d = new Date(key + 'T00:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const fmtKm = v => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(v);

let ctx = null;
let sessions = [];
let ui = { showAll: false };

async function loadDeporte() {
  const { data } = await ctx.sb.from('sport_sessions').select('*').order('day', { ascending: false }).order('created_at', { ascending: false });
  sessions = data || [];
}

function weekStats() {
  const t = todayKey(), from = addDays(t, -6);
  const w = sessions.filter(s => s.day >= from && s.day <= t);
  return {
    n: w.length,
    min: w.reduce((a, s) => a + (s.minutes || 0), 0),
    km: w.reduce((a, s) => a + Number(s.km || 0), 0),
  };
}

function streak() {
  const days = new Set(sessions.map(s => s.day));
  if (!days.size) return 0;
  let d = todayKey();
  if (!days.has(d)) d = addDays(d, -1); // hoy aún no, no rompe la racha
  let n = 0;
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

function barsSVG() {
  const t = todayKey();
  const days = [...Array(7)].map((_, i) => addDays(t, i - 6));
  const byDay = {};
  for (const s of sessions) byDay[s.day] = (byDay[s.day] || 0) + (s.minutes || 0);
  const max = Math.max(20, ...days.map(d => byDay[d] || 0));
  const W = 640, H = 170, bw = 52, gap = (W - 7 * bw) / 8;
  const bars = days.map((d, i) => {
    const v = byDay[d] || 0;
    const h = Math.max(v ? 8 : 3, v / max * (H - 40));
    const x = gap + i * (bw + gap), y = H - 22 - h;
    const lab = new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'narrow' });
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="8" fill="${v ? 'var(--acc)' : 'var(--surface2)'}"/>
      <text x="${(x + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" fill="var(--mut)" font-size="15">${lab}</text>
      ${v ? `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" fill="var(--txt)" font-size="14" font-weight="700">${v}</text>` : ''}`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="mz-chart">${bars}</svg>`;
}

function vDeporte() {
  const { ic, esc } = ctx;
  const w = weekStats();
  const racha = streak();
  const list = sessions.slice(0, ui.showAll ? sessions.length : 8).map(s => `
    <div class="card task rise">
      <span class="mz-dot" style="background:var(--acc)"></span>
      <div class="grow txt"><b>${s.minutes} min</b>${s.km ? ` · ${fmtKm(Number(s.km))} km` : ''}
      <div class="mut small">${new Date(s.day + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}${s.note ? ' · ' + esc(s.note) : ''}</div></div>
      <button class="icon-btn" data-dp-del="${s.id}" title="Borrar">${ic('trash', 16)}</button>
    </div>`).join('');

  return `
  <header class="top rise"><div class="grow"><h1 class="small-h">Deporte</h1><div class="sub">Tu cinta y tu actividad, sesión a sesión</div></div></header>

  <div class="tiles rise" style="animation-delay:.04s">
    <div class="tile"><div class="lab">${ic('clock', 13)} Últimos 7 días</div>
      <div class="big">${w.min} <small>min</small></div>
      <div class="mut small">${w.n} sesiones · ${fmtKm(w.km)} km</div></div>
    <div class="tile"><div class="lab">${ic('target', 13)} Racha</div>
      <div class="big">${racha} <small>día${racha === 1 ? '' : 's'}</small></div>
      <div class="mut small">${racha >= 3 ? '¡Imparable! 🔥' : racha >= 1 ? 'Sigue así' : 'Hoy es buen día para empezar'}</div></div>
  </div>

  <div class="card rise" style="animation-delay:.07s">${barsSVG()}</div>

  <div class="sec rise" style="animation-delay:.1s"><h2>Apuntar sesión</h2></div>
  <div class="add-box rise" style="animation-delay:.11s">
    <div class="row">
      <input id="dp-min" class="grow" type="number" inputmode="numeric" min="1" step="1" placeholder="Minutos">
      <input id="dp-km" class="grow" type="number" inputmode="decimal" min="0" step="0.1" placeholder="Km (opcional)">
      <input id="dp-day" type="date" value="${todayKey()}" style="max-width:140px">
    </div>
    <input id="dp-note" placeholder="Nota (opcional): ritmo, cómo te sentiste..." style="margin-top:8px">
    <button class="btn primary block mt" id="dp-save">${ic('plus', 16, 2.2)} Guardar sesión</button>
    <div class="mut small" id="dp-msg" style="margin-top:8px"></div>
  </div>

  <div class="sec rise" style="animation-delay:.14s"><h2>Sesiones</h2>${sessions.length > 8 ? `<button class="link" id="dp-more">${ui.showAll ? 'Ver menos' : 'Ver todas'}</button>` : ''}</div>
  ${list || `<div class="empty">${ic('clock', 26)}<div>Sin sesiones apuntadas. La primera cuesta, luego engancha.</div></div>`}`;
}

function bindDeporte() {
  const { sb, app } = ctx;
  const q = s => app.querySelector(s);
  const qa = s => [...app.querySelectorAll(s)];
  const rerender = () => {
    const m = ctx.app.querySelector('main');
    const y = m ? m.scrollTop : 0;
    ctx.app.innerHTML = ctx.shell(vDeporte());
    ctx.bindNav(); bindDeporte();
    const m2 = ctx.app.querySelector('main');
    if (m2) m2.scrollTop = y;
    ctx.app.querySelectorAll('.rise').forEach(e => { e.style.animation = 'none'; });
  };

  const more = q('#dp-more');
  if (more) more.onclick = () => { ui.showAll = !ui.showAll; rerender(); };

  qa('[data-dp-del]').forEach(b => b.onclick = async () => {
    if (!confirm('¿Borrar esta sesión?')) return;
    await sb.from('sport_sessions').delete().eq('id', b.dataset.dpDel);
    sessions = sessions.filter(x => x.id !== b.dataset.dpDel);
    rerender();
  });

  q('#dp-save').onclick = async () => {
    const msg = q('#dp-msg');
    const minutes = parseInt(q('#dp-min').value, 10);
    if (!(minutes > 0)) { msg.textContent = 'Pon al menos los minutos.'; return; }
    const kmv = parseFloat(q('#dp-km').value.replace(',', '.'));
    const row = {
      day: q('#dp-day').value || todayKey(),
      minutes,
      km: kmv > 0 ? kmv : null,
      note: q('#dp-note').value.trim() || null,
    };
    const btn = q('#dp-save');
    btn.disabled = true; msg.textContent = 'Guardando...';
    const { data, error } = await sb.from('sport_sessions').insert(row).select().single();
    btn.disabled = false;
    if (error || !data) { msg.textContent = 'No se pudo guardar. Inténtalo de nuevo.'; return; }
    sessions.unshift(data);
    rerender();
  };
}

export async function openDeporte(c) {
  ctx = c;
  ctx.app.innerHTML = ctx.shell(`<div class="mut center" style="padding:60px 0">Cargando deporte...</div>`);
  ctx.bindNav();
  await loadDeporte();
  ctx.app.innerHTML = ctx.shell(vDeporte());
  ctx.bindNav();
  bindDeporte();
}
