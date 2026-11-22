import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { UNITS as JP_UNITS } from './jp-content.js';

const CFG = window.SALA_CONFIG || {};
/* Ajustes de Configuración guardados en este dispositivo: nombre visible y apartados visibles. */
try { const n = localStorage.getItem('sala_name'); if (n) CFG.OWNER_NAME = n; } catch(e) {}
const userHiddenTabs = () => { try { const a = JSON.parse(localStorage.getItem('sala_hidden_tabs') || '[]'); return Array.isArray(a) ? a : []; } catch(e) { return []; } };
const THEME_OP = CFG.THEME === 'onepiece';
if (THEME_OP) document.body.classList.add('theme-onepiece');
const app = document.getElementById('app');
let sb = null, session = null, tab = 'hoy';
/* Estudios tiene dos vertientes: Temario y Tests (peticion del propietario, 22-nov-2026). */
let estudiosSub = 'temario';
let cache = { tasks: [], notes: [], topics: [], lessons: [], resources: [], results: [], testAttempts: [], pers: [], testStates: [], hidden: [], hiddenCals: [] };
let persSigned = {};
let jpHoy = null; // recomendación diaria de japonés (japanese.js jpToday)
const SHOW_HOY_NOTES = false; // Apuntes recientes en Hoy: ocultos por petición del propietario (22-nov-2026). true para reactivar.

/* Bloqueo de zoom por doble toque y pellizco (petición del propietario, PWA iPhone 21-nov-2026).
   No afecta al scroll ni al visor de PDFs (va en su propio iframe). */
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());
let salaLastTap = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - salaLastTap < 350) e.preventDefault();
  salaLastTap = now;
}, { passive: false });

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const h = html => { app.innerHTML = html; };

/* ---------- Iconos SVG (trazo, estilo consistente) ---------- */
const IC = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  check:'<path d="M4 12.5 9.5 18 20 6.5"/>',
  squareCheck:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="m8.5 12.2 2.6 2.6 5-5.4"/>',
  note:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  musica:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18Z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  trash:'<path d="M4 7h16"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2"/><path d="M6.5 7 7.5 20a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5L17.5 7"/>',
  chev:'<path d="m9 5 7 7-7 7"/>',
  back:'<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="16" rx="4"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  play:'<path d="M7 4.5v15l12-7.5Z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>',
  refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  logout:'<path d="M9 21H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3H9"/><path d="m15 16 4-4-4-4"/><path d="M19 12H9"/>',
  cap:'<path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z"/><path d="M6.5 11.5V16c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-4.5"/><path d="M21.5 9v5"/>',
  sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M18.4 5.6l-2.9 2.9M8.5 15.5l-2.9 2.9"/>',
  video:'<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10.5 5-3v9l-5-3"/>',
  link:'<path d="M10 14a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 10a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  settings:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
  download:'<path d="M12 3v11"/><path d="m6.5 10.5 5.5 5.5 5.5-5.5"/><path d="M4.5 20h15"/>',
  mic:'<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3.5"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M15.2 8.8a4 4 0 1 0 0 6.4"/><path d="M7.5 10.8h6M7.5 13.2h6"/>',
  food:'<path d="M7 3v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2V3"/><path d="M9 11v10"/><path d="M16 3c-1.5 2-2 4-2 6 0 2 .8 3 2 3v9"/>',
  dumbbell:'<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>'
};
const HAT = (w,cls) => `<svg class="${cls}" width="${w}" height="${Math.round(w*0.69)}" viewBox="0 0 64 44"><ellipse cx="32" cy="32" rx="30" ry="9" fill="#e6c15c" stroke="#a8812f" stroke-width="2"/><path d="M13 30 Q13 6 32 6 Q51 6 51 30 Q32 22 13 30 Z" fill="#e6c15c" stroke="#a8812f" stroke-width="2"/><path d="M14 27 Q32 19 50 27 L50 31 Q32 23 14 31 Z" fill="#d64545"/></svg>`;
const LOGPOSE = s => `<svg width="${s}" height="${s}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#0f1420" stroke="#e6c15c" stroke-width="2.5"/><circle cx="32" cy="32" r="20" fill="none" stroke="#2b3350" stroke-width="1.5"/><circle cx="32" cy="32" r="14" fill="none" stroke="#2b3350" stroke-width="1"/><path d="M32 32 L44 18 L34 34 Z" fill="#d64545"/><path d="M32 32 L20 46 L30 30 Z" fill="#7c87f8"/><circle cx="32" cy="32" r="3" fill="#e6c15c"/><text x="32" y="13" text-anchor="middle" fill="#e6c15c" font-size="8" font-weight="700">N</text></svg>`;
const ROSETA = s => `<svg class="roseta" width="${s}" height="${s}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="none" stroke="#e6c15c" stroke-width="3"/><path d="M32 12 L37 32 L32 52 L27 32 Z" fill="#e6c15c"/><path d="M12 32 L32 27 L52 32 L32 37 Z" fill="#e6c15c" opacity=".7"/></svg>`;
const ic = (n, s=20, sw=1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${IC[n]||''}</svg>`;

const ALL_TABS = [['hoy','home','Inicio'],['agenda','calendar','Agenda'],['tareas','squareCheck','Tareas'],['apuntes','note','Apuntes'],['estudios','cap','Estudios'],['tests','target','Tests'],['idiomas','globe','Idiomas'],['musica','musica','Música'],['dinero','coin','Dinero'],['comida','food','Comida'],['deporte','dumbbell','Deporte']];
/* Pestañas ocultas por petición del propietario (21-nov-2026): solo se quitan de la barra; datos y código siguen intactos. Para reactivarlas, quitar el id de HIDDEN_TABS en config.js. */
const tabsVisibles = () => ALL_TABS.filter(([id]) => !(CFG.HIDDEN_TABS || []).includes(id) && !userHiddenTabs().includes(id));
const AREA_DOT = {personal:'area-personal',trabajo:'area-trabajo',estudios:'area-estudios'};

function shell(content) {
  const lp = langProgress();
  const pct = lp.total ? Math.round(lp.hechas/lp.total*100) : 0;
  const jsSide = jpStats();
  const sideProg = lp.total
    ? `<div class="bar"><i style="width:${pct}%"></i></div><small>Idiomas · ${lp.hechas}/${lp.total} sesiones</small>`
    : (jsSide.sessions || jsSide.mastered)
      ? `<div class="bar"><i style="width:${jsSide.total?Math.round(jsSide.mastered/jsSide.total*100):0}%"></i></div><small>Japonés · ${jsSide.mastered}/${jsSide.total} unidades · ${jsSide.sessions} sesiones</small>`
      : `<small>Tu progreso aparecerá aquí</small>`;
  return `<main>${content}</main><nav class="tabbar">` +
    [...tabsVisibles(), ['cuenta','settings','Configuración']].map(([id,icn,label]) => `<button class="${tab===id?'on':''}" data-tab="${id}" aria-label="${label}" title="${label}"><span class="ic-wrap">${ic(icn)}${THEME_OP&&(id==='hoy'||id==='idiomas')?HAT(15,'hat-mini'):''}</span><span class="tab-lab">${label}</span></button>`).join('') +
    `<div class="side-card"><span class="sc-emo">🌸</span><b>¡Sigue aprendiendo!</b>` +
    sideProg +
    `</div></nav>`;
}
function bindNav() {
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
}
const header = (title, sub, extra='') =>
  `<header class="top rise"><div class="grow"><h1 class="small-h">${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div>${extra}</header>`;

/* Consultas de lectura de la app. loadAll las lanza en paralelo; la descarga offline
   las recorre una a una con progreso. Mismas URLs => misma cache del service worker. */
const dataQueryMakers = [
  () => sb.from('tasks').select('*').order('created_at',{ascending:false}),
  () => sb.from('notes').select('*').order('updated_at',{ascending:false}),
  () => sb.from('topics').select('*').order('ord'),
  () => sb.from('lessons').select('*').order('day'),
  () => sb.from('resources').select('*').order('ord'),
  () => sb.from('quiz_results').select('*'),
  () => sb.from('test_attempts').select('*').order('created_at',{ascending:false}),
  () => sb.from('kana_stats').select('*'),
  () => sb.from('test_question_state').select('*'),
  () => sb.from('agenda_hidden').select('*'),
  () => sb.from('agenda_cal_hidden').select('*'),
  () => sb.from('test_summaries').select('*').order('created_at',{ascending:false}),
  () => sb.from('personalizacion').select('*').order('created_at',{ascending:false}),
  () => sb.from('jp_learning').select('payload').maybeSingle(),
];

async function loadAll() {
  const [t,n,tp,l,r,res,ta,ks,tqs,hh,hc,tsm,persRes,jpRes] = await Promise.all(dataQueryMakers.map(f => f()));
  const persRows = persRes.data;
  /* Totales por banco, paginados (PostgREST corta en 1000 filas y el conteo simple
     dejaba bancos sin total, apagando el verde de completado). Con copia local
     para que sigan disponibles sin conexion. */
  let tc = null;
  try { tc = await fetchBankCounts(); try { localStorage.setItem('sala_test_counts', JSON.stringify(tc)); } catch(e) {} }
  catch(e) { try { tc = JSON.parse(localStorage.getItem('sala_test_counts') || 'null'); } catch(e2) {} }
  cache = { tasks:t.data||[], notes:n.data||[], topics:tp.data||[], lessons:l.data||[], resources:r.data||[], results:res.data||[], testAttempts:ta.data||[], pers:persRows||[], testStates:tqs.data||[], hidden:hh.data||[], hiddenCals:(typeof hc!=='undefined'?hc.data:null)||[], testSummaries:(typeof tsm!=='undefined'?tsm.data:null)||[], kanaRows:ks.data||[], jp:jpRes.data?.payload||null, testCounts:tc||{} };
  try { const jm = await import('./japanese.js?v=2'); jpHoy = await jm.jpToday(sb); } catch(e) { jpHoy = null; }
  kanaStats = {};
  (ks.data||[]).forEach(row => { kanaStats[row.kana] = { ok:row.ok, fail:row.fail, last_fail:row.last_fail, streak:row.streak||0, due:row.due||null }; });
  persSigned = {};
  const imgs = cache.pers.filter(r=>r.tipo==='imagen' && r.imagen_path).map(r=>r.imagen_path);
  if (imgs.length) {
    const { data: urls } = await sb.storage.from('personalizacion').createSignedUrls(imgs, 3600);
    (urls||[]).forEach(u => { if (u && u.path && u.signedUrl) persSigned[u.path] = u.signedUrl; });
  }
}

/* Descarga bajo demanda: rellena la cache offline con todos los datos, con progreso.
   No guarda contrasenas ni tokens: solo respuestas de lectura (el SW excluye /auth/ y /storage/). */
let dlToastTimer = null;
function dlToast(msg, done) {
  let el = document.getElementById('dl-toast');
  if (!el) { el = document.createElement('div'); el.id = 'dl-toast'; el.setAttribute('role','status'); document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  el.classList.toggle('ok', !!done);
  if (dlToastTimer) clearTimeout(dlToastTimer);
  if (done) dlToastTimer = setTimeout(() => el.classList.remove('show'), 4200);
}
async function prefetchOffline(btn) {
  if (!navigator.onLine || !session) { syncOnline(); return; }
  if (btn) btn.disabled = true;
  const simSubs = [...new Set(BANKS.map(b=>b.subject))];
  const total = dataQueryMakers.length + simSubs.length;
  let done = 0;
  dlToast('Descargando para uso sin conexión… 0/' + total);
  try {
    for (const make of dataQueryMakers) {
      const r = await make();
      if (r && r.error) throw r.error;
      done++;
      dlToast('Descargando para uso sin conexión… ' + done + '/' + total);
    }
    for (const s2 of simSubs) {
      await fetchAllQuestions(BANKS.filter(b=>b.subject===s2).map(b=>b.bank));
      done++;
      dlToast('Descargando para uso sin conexión… ' + done + '/' + total);
    }
    dlToast('Listo · ya disponible sin conexión ✓', true);
  } catch(e) {
    dlToast('No se pudo completar la descarga', true);
  }
  if (btn) btn.disabled = !navigator.onLine;
}

const examInfo = (cfg = CFG.EXAM) => {
  const fecha = (cfg && cfg.date) ? new Date(cfg.date) : null;
  const dias = fecha ? Math.ceil((fecha - new Date())/86400000) : null;
  return { fecha, dias };
};
const langProgress = () => {
  const total = cache.lessons.length;
  const hechas = cache.lessons.filter(l => cache.results.some(r => r.lesson_id===l.id)).length;
  return { total, hechas };
};

/* ---------- Vistas ---------- */


/* ---------- Agenda (Google Calendar via RPC proxy en Postgres) ---------- */
const GCAL_CID = 'TU_CLIENT_ID.apps.googleusercontent.com'; // OPCIONAL: Client ID de Google Cloud para sincronizar Google Calendar (ver GUIA.md)
const GCAL_SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly';
const oauthUrl = () => {
  const st = crypto.randomUUID();
  localStorage.setItem('salaCalState', st);
  return 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + GCAL_CID +
    '&redirect_uri=' + encodeURIComponent(location.origin + '/oauth-callback.html') +
    '&response_type=code&scope=' + encodeURIComponent(GCAL_SCOPES) +
    '&access_type=offline&prompt=consent&state=' + encodeURIComponent(st);
};
let cal = { connected: null, calendars: [], sel: JSON.parse(localStorage.getItem('salaCalSel') || 'null'), weekOff: 0, events: [], busy: false, detail: null, form: null };

async function calApi(action, payload = {}) {
  const { data, error } = await sb.rpc('calendar_api', { action, payload });
  if (error) return { error: /does not exist|schema cache|Could not find/i.test(error.message || '') ? 'calendar_no_conectado' : error.message };
  if (data && data.error) return data;
  return (data && data.data !== undefined) ? data.data : data;
}
function calStart(off = 0) { const d = new Date(); d.setDate(d.getDate() + off * 7); d.setHours(0,0,0,0); return d; }
const calDayKey = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const DOW = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
const evStart = ev => ev.start.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start.date + 'T00:00:00');

async function agendaLoad(withCalendars) {
  if (cal.busy) return; cal.busy = true;
  if (withCalendars || cal.connected === null) {
    const r = await calApi('list_calendars');
    if (r.error === 'calendar_no_conectado') { cal.connected = false; cal.busy = false; render(); return; }
    if (r.error) { cal.connected = 'error'; cal.errMsg = r.error; cal.busy = false; render(); return; }
    cal.connected = true;
    cal.calendars = (r.items || []).map(c => ({ id: c.id, name: c.summary, color: c.backgroundColor || '#7aa2ff', primary: !!c.primary }));
    const serverHidden = new Set(cache.hiddenCals.map(r => r.calendar_id));
    if (serverHidden.size) {
      cal.sel = cal.calendars.map(c => c.id).filter(id => !serverHidden.has(id));
    } else if (!cal.sel) cal.sel = cal.calendars.map(c => c.id);
    localStorage.setItem('salaCalSel', JSON.stringify(cal.sel));
  }
  const m = calStart(cal.weekOff), e = new Date(m); e.setDate(e.getDate() + 7);
  const selCals = cal.calendars.filter(c => cal.sel.includes(c.id));
  const res = await Promise.all(selCals.map(async c => {
    const r = await calApi('list_events', { calendarId: c.id, timeMin: m.toISOString(), timeMax: e.toISOString() });
    return (r.items || []).map(ev => ({ ...ev, _cal: c }));
  }));
  cal.events = res.flat().sort((a,b) => (a.start.dateTime || a.start.date) > (b.start.dateTime || b.start.date) ? 1 : -1);
  cal.busy = false; render();
  if (cal.weekOff === 0) requestAnimationFrame(() => { const t = document.querySelector('.ag-today'); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
}

const hiddenSet = () => new Set(cache.hidden.map(r => r.event_key));

function vAgenda() {
  if (cal.connected === null) { agendaLoad(true); return header('Agenda', 'Tu Google Calendar') + `<div class="card rise"><div class="sub">Cargando…</div></div>`; }
  if (cal.connected === 'error') return header('Agenda', 'Tu Google Calendar') +
    `<div class="card rise"><h3>Error</h3><div class="sub">${esc(cal.errMsg || 'desconocido')}</div>
     <button class="btn block" id="ag-retry" style="margin-top:12px">Reintentar</button></div>`;
  if (cal.connected === false) return header('Agenda', 'Tu Google Calendar') +
    `<div class="card rise"><h3>Conecta tu calendario</h3>
     <div class="sub">Ve y gestiona los eventos de tus calendarios de Google sin salir de la Sala. Solo tú ves esto.</div>
     <button class="btn primary block" id="ag-connect" style="margin-top:14px">Conectar Google Calendar</button></div>`;

  const m = calStart(cal.weekOff);
  const days = Array.from({length: 7}, (_, i) => { const d = new Date(m); d.setDate(d.getDate() + i); return d; });
  const range = days[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' - ' + days[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  /* Los calendarios ocultos se muestran apagados al final: con un toque se reactivan. */
  const isCalHidden = id => cache.hiddenCals.some(r => r.calendar_id === id);
  const chipStyle = c => cal.sel.includes(c.id)
    ? `background:linear-gradient(100deg,${esc(c.color)}e0,${esc(c.color)}59);border-color:${esc(c.color)};color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.4)`
    : `background:${esc(c.color)}17;border-color:${esc(c.color)}59;color:${esc(c.color)}`;
  const chips = [...cal.calendars].sort((a, b) => isCalHidden(a.id) - isCalHidden(b.id)).map(c =>
    `<button class="chip ag-chip ${cal.sel.includes(c.id) ? 'on' : ''}" data-calchip="${esc(c.id)}" style="${chipStyle(c)}${isCalHidden(c.id) ? ';opacity:.45' : ''}">${esc(c.name)}</button>`).join('');
  let out = header('Agenda', range,
    `<button class="icon-btn" id="ag-new" title="Nuevo evento">${ic('plus')}</button>`);
  out += `<div class="ag-weeknav rise">
      <button class="icon-btn" id="ag-prev"${cal.weekOff === 0 ? ' disabled style="opacity:.35"' : ''}>${ic('back')}</button>
      <button class="btn ghost" id="ag-today">Hoy</button>
      <button class="icon-btn" id="ag-next" style="transform:scaleX(-1)">${ic('back')}</button>
      <button class="btn ghost" id="ag-disc" style="margin-left:auto">Desconectar</button>
    </div>`;
  out += `<div class="chips ag-chips rise">${chips}</div>`;
  const hkeys = hiddenSet();
  if (cache.hidden.length) out += `<button class="btn ghost block rise" id="ag-hidden-toggle" style="margin-bottom:8px">${cal.showHidden ? 'Volver a ocultarlos' : `Ver eventos ocultos en la Sala (${cache.hidden.length})`}</button>`;
  const todayK = calDayKey(new Date());
  for (const d of days) {
    const k = calDayKey(d);
    const evs = cal.events.filter(ev => calDayKey(evStart(ev)) === k && (cal.showHidden || !hkeys.has(ev._cal.id + '|' + ev.id)));
    if (!evs.length && k !== todayK) continue;
    out += `<div class="ag-day rise ${k === todayK ? 'ag-today' : ''}">
      <div class="ag-dayhead">${DOW[(d.getDay()+6)%7]} <span>${d.getDate()}</span>${k === todayK ? ' <span class="ag-hoypill">hoy</span>' : ''}</div>
      ${evs.length ? evs.map(ev => {
        const time = ev.start.dateTime
          ? new Date(ev.start.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) +
            ' - ' + new Date(ev.end.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})
          : 'Todo el día';
        return `<button class="ag-ev ag-ev-cal ${hkeys.has(ev._cal.id + '|' + ev.id) ? 'ag-ev-off' : ''}" data-ev="${esc(ev._cal.id)}|${esc(ev.id)}"
          style="background:linear-gradient(100deg,${esc(ev._cal.color)}bf,${esc(ev._cal.color)}38 68%,${esc(ev._cal.color)}14);border-color:${esc(ev._cal.color)}73">
          <span class="ag-ev-main"><b>${esc(ev.summary || '(sin título)')}</b><small>${time} · ${esc(ev._cal.name)}</small></span>
          ${ic('chev', 16)}</button>`;
      }).join('') : '<div class="sub" style="padding:2px 4px 8px">Sin eventos</div>'}
    </div>`;
  }
  if (cal.detail) out += vAgendaDetail();
  if (cal.form) out += vAgendaForm();
  out += `<div class="ag-privacy"><a href="/privacy.html">Privacidad</a></div>`;
  return out;
}

function vAgendaDetail() {
  const ev = cal.detail;
  const when = ev.start.dateTime
    ? evStart(ev).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}) + ', ' +
      new Date(ev.start.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) + ' - ' +
      new Date(ev.end.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})
    : evStart(ev).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}) + ' (todo el día)';
  return `<div class="ag-overlay" id="ag-overlay"><div class="card ag-panel rise">
    <h3>${esc(ev.summary || '(sin título)')}</h3>
    <div class="sub">${when}</div>
    <div class="sub" style="margin-top:6px"><span class="ag-calpill" style="background:linear-gradient(100deg,${esc(ev._cal.color)}d9,${esc(ev._cal.color)}4d);border:1px solid ${esc(ev._cal.color)}">${esc(ev._cal.name)}</span></div>
    ${ev.location ? `<div class="sub" style="margin-top:4px">${esc(ev.location)}</div>` : ''}
    ${ev.description ? `<div class="ag-desc">${esc(ev.description)}</div>` : ''}
    <div class="ag-actions">
      <button class="btn" id="ag-edit">Editar</button>
      ${hiddenSet().has(ev._cal.id + '|' + ev.id)
        ? `<button class="btn" id="ag-unhide">Mostrar de nuevo</button>`
        : `<button class="btn ghost" id="ag-hide">Ocultar en la Sala</button>`}
      <button class="btn ghost" id="ag-close">Cerrar</button>
    </div>
    <div class="mut small" style="margin-top:8px">Ocultar solo afecta a la Sala; tu Google Calendar no cambia.</div></div></div>`;
}

function vAgendaForm() {
  const f = cal.form;
  const opts = cal.calendars.map(c => `<option value="${esc(c.id)}" ${c.id===f.calendarId?'selected':''}>${esc(c.name)}</option>`).join('');
  return `<div class="ag-overlay" id="ag-overlay"><div class="card ag-panel rise">
    <h3>${f.id ? 'Editar evento' : 'Nuevo evento'}</h3>
    <input class="inp" id="agf-title" placeholder="Título" value="${esc(f.summary || '')}">
    <select class="inp" id="agf-cal">${opts}</select>
    <input class="inp" id="agf-date" type="date" value="${esc(f.date)}">
    <label class="ag-allday"><input type="checkbox" id="agf-allday" ${f.allDay ? 'checked' : ''}> Todo el día</label>
    <div class="ag-times ${f.allDay ? 'ag-hidden' : ''}" id="agf-times">
      <input class="inp" id="agf-start" type="time" value="${esc(f.start || '09:00')}">
      <input class="inp" id="agf-end" type="time" value="${esc(f.end || '10:00')}">
    </div>
    <textarea class="inp" id="agf-desc" placeholder="Descripción (opcional)">${esc(f.description || '')}</textarea>
    <div class="ag-actions">
      <button class="btn primary" id="ag-save">${f.id ? 'Guardar cambios' : 'Crear evento'}</button>
      <button class="btn ghost" id="ag-close">Cancelar</button>
    </div></div></div>`;
}

function bindAgenda() {
  const retry = document.getElementById('ag-retry');
  if (retry) retry.onclick = () => { cal.connected = null; render(); };
  const conn = document.getElementById('ag-connect');
  if (conn) conn.onclick = () => {
    if (GCAL_CID.startsWith('TU_')) { alert('Google Calendar es opcional: configura tu Client ID en app.js (GCAL_CID) y la función calendar_api en Supabase. La agenda funciona sin esto con tus tareas.'); return; }
    location.href = oauthUrl();
  };
  app.querySelectorAll('[data-calchip]').forEach(b => b.onclick = async () => {
    const id = b.dataset.calchip;
    const hiding = cal.sel.includes(id);
    cal.sel = hiding ? cal.sel.filter(x => x !== id) : [...cal.sel, id];
    if (!cal.sel.length) cal.sel = [id];
    localStorage.setItem('salaCalSel', JSON.stringify(cal.sel));
    const cname = (cal.calendars.find(c => c.id === id) || {}).name || '';
    if (hiding) {
      await sb.from('agenda_cal_hidden').upsert({ calendar_id: id, name: cname }, { onConflict: 'calendar_id' });
      if (!cache.hiddenCals.some(r => r.calendar_id === id)) cache.hiddenCals.push({ calendar_id: id, name: cname });
    } else {
      await sb.from('agenda_cal_hidden').delete().eq('calendar_id', id);
      cache.hiddenCals = cache.hiddenCals.filter(r => r.calendar_id !== id);
    }
    agendaLoad(false);
  });
  const prev = document.getElementById('ag-prev'), next = document.getElementById('ag-next'), today = document.getElementById('ag-today');
  if (prev) prev.onclick = () => { cal.weekOff = Math.max(0, cal.weekOff - 1); agendaLoad(false); };
  if (next) next.onclick = () => { cal.weekOff++; agendaLoad(false); };
  if (today) today.onclick = () => { cal.weekOff = 0; agendaLoad(false); };
  const disc = document.getElementById('ag-disc');
  if (disc) disc.onclick = async () => {
    if (!confirm('¿Desconectar Google Calendar? Se borrará el token guardado y la Sala dejará de acceder a tu calendario. Tus eventos no se tocan.')) return;
    const r = await calApi('disconnect');
    if (r && r.error) { alert('Error: ' + r.error); return; }
    cal.connected = false; cal.calendars = []; cal.sel = null; cal.events = []; cal.weekOff = 0;
    localStorage.removeItem('salaCalSel');
    render();
  };
  const nw = document.getElementById('ag-new');
  if (nw) nw.onclick = () => {
    cal.detail = null;
    cal.form = { id: null, summary: '', calendarId: (cal.calendars.find(c=>c.primary)||cal.calendars[0]||{}).id,
      date: calDayKey(new Date()), start: '09:00', end: '10:00', allDay: false, description: '' };
    render();
  };
  app.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => {
    const [cid, eid] = b.dataset.ev.split('|');
    cal.detail = cal.events.find(ev => ev.id === eid && ev._cal.id === cid) || null;
    cal.form = null; render();
  });
  const close = document.getElementById('ag-close');
  if (close) close.onclick = () => { cal.detail = null; cal.form = null; render(); };
  const ov = document.getElementById('ag-overlay');
  if (ov) ov.onclick = e => { if (e.target === ov) { cal.detail = null; cal.form = null; render(); } };
  const hide = document.getElementById('ag-hide');
  if (hide) hide.onclick = async () => {
    const ev = cal.detail;
    const key = ev._cal.id + '|' + ev.id;
    hide.disabled = true;
    const { error } = await sb.from('agenda_hidden').insert({ event_key: key, title: ev.summary || '' });
    if (error) { hide.disabled = false; alert('Error: ' + error.message); return; }
    cache.hidden.push({ event_key: key, title: ev.summary || '' });
    cal.detail = null; render();
  };
  const unhide = document.getElementById('ag-unhide');
  if (unhide) unhide.onclick = async () => {
    const ev = cal.detail;
    const key = ev._cal.id + '|' + ev.id;
    unhide.disabled = true;
    const { error } = await sb.from('agenda_hidden').delete().eq('event_key', key);
    if (error) { unhide.disabled = false; alert('Error: ' + error.message); return; }
    cache.hidden = cache.hidden.filter(r => r.event_key !== key);
    cal.detail = null; render();
  };
  const ht = document.getElementById('ag-hidden-toggle');
  if (ht) ht.onclick = () => { cal.showHidden = !cal.showHidden; render(); };
  const allday = document.getElementById('agf-allday');
  if (allday) allday.onchange = () => document.getElementById('agf-times').classList.toggle('ag-hidden', allday.checked);
  const edit = document.getElementById('ag-edit');
  if (edit) edit.onclick = () => {
    const ev = cal.detail;
    cal.form = { id: ev.id, calendarId: ev._cal.id, summary: ev.summary || '',
      date: calDayKey(evStart(ev)),
      start: ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',hour12:false}) : '09:00',
      end: ev.end.dateTime ? new Date(ev.end.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',hour12:false}) : '10:00',
      allDay: !ev.start.dateTime, description: ev.description || '' };
    cal.detail = null; render();
  };
  const save = document.getElementById('ag-save');
  if (save) save.onclick = async () => {
    const summary = document.getElementById('agf-title').value.trim();
    if (!summary) { document.getElementById('agf-title').focus(); return; }
    const calendarId = document.getElementById('agf-cal').value;
    const date = document.getElementById('agf-date').value;
    const ad = document.getElementById('agf-allday').checked;
    const description = document.getElementById('agf-desc').value.trim();
    const event = { summary };
    if (description) event.description = description;
    if (ad) {
      const endD = new Date(date + 'T00:00:00'); endD.setDate(endD.getDate() + 1);
      event.start = { date }; event.end = { date: calDayKey(endD) };
    } else {
      event.start = { dateTime: date + 'T' + document.getElementById('agf-start').value + ':00', timeZone: 'Europe/Madrid' };
      event.end = { dateTime: date + 'T' + document.getElementById('agf-end').value + ':00', timeZone: 'Europe/Madrid' };
    }
    save.disabled = true; save.textContent = 'Guardando…';
    const f = cal.form;
    const r = f.id
      ? await calApi('update_event', { calendarId, eventId: f.id, event })
      : await calApi('create_event', { calendarId, event });
    if (r && r.error) { save.disabled = false; save.textContent = f.id ? 'Guardar cambios' : 'Crear evento'; alert('Error: ' + r.error); return; }
    cal.form = null; agendaLoad(false);
  };
}

/* ---------- Kana (práctica de hiragana con registro de fallos) ---------- */
const KANA_GROUPS = [
  {id:'v', name:'Vocales', items:[['あ','a'],['い','i'],['う','u'],['え','e'],['お','o']]},
  {id:'k', name:'か K', items:[['か','ka'],['き','ki'],['く','ku'],['け','ke'],['こ','ko']]},
  {id:'s', name:'さ S', items:[['さ','sa'],['し','shi'],['す','su'],['せ','se'],['そ','so']]},
  {id:'t', name:'た T', items:[['た','ta'],['ち','chi'],['つ','tsu'],['て','te'],['と','to']]},
  {id:'n', name:'な N', items:[['な','na'],['に','ni'],['ぬ','nu'],['ね','ne'],['の','no']]},
  {id:'h', name:'は H', items:[['は','ha'],['ひ','hi'],['ふ','fu'],['へ','he'],['ほ','ho']]},
  {id:'m', name:'ま M', items:[['ま','ma'],['み','mi'],['む','mu'],['め','me'],['も','mo']]},
  {id:'y', name:'や Y', items:[['や','ya'],['ゆ','yu'],['よ','yo']]},
  {id:'r', name:'ら R', items:[['ら','ra'],['り','ri'],['る','ru'],['れ','re'],['ろ','ro']]},
  {id:'w', name:'わ W', items:[['わ','wa'],['を','wo'],['ん','n']]},
  {id:'d', name:'Dakuten がざだばぱ', items:[['が','ga'],['ぎ','gi'],['ぐ','gu'],['げ','ge'],['ご','go'],['ざ','za'],['じ','ji'],['ず','zu'],['ぜ','ze'],['ぞ','zo'],['だ','da'],['で','de'],['ど','do'],['ば','ba'],['び','bi'],['ぶ','bu'],['べ','be'],['ぼ','bo'],['ぱ','pa'],['ぴ','pi'],['ぷ','pu'],['ぺ','pe'],['ぽ','po']]},
  {id:'c', name:'Combos きゃしゃちゃ', items:[['きゃ','kya'],['きゅ','kyu'],['きょ','kyo'],['しゃ','sha'],['しゅ','shu'],['しょ','sho'],['ちゃ','cha'],['ちゅ','chu'],['ちょ','cho'],['にゃ','nya'],['にゅ','nyu'],['にょ','nyo'],['ひゃ','hya'],['ひゅ','hyu'],['ひょ','hyo'],['みゃ','mya'],['みゅ','myu'],['みょ','myo'],['りゃ','rya'],['りゅ','ryu'],['りょ','ryo'],['ぎゃ','gya'],['ぎゅ','gyu'],['ぎょ','gyo'],['じゃ','ja'],['じゅ','ju'],['じょ','jo'],['びゃ','bya'],['びゅ','byu'],['びょ','byo'],['ぴゃ','pya'],['ぴゅ','pyu'],['ぴょ','pyo']]}
];
const KATA_GROUPS = [
  {id:'v', name:'Vocales', items:[['ア','a'],['イ','i'],['ウ','u'],['エ','e'],['オ','o']]},
  {id:'k', name:'カ K', items:[['カ','ka'],['キ','ki'],['ク','ku'],['ケ','ke'],['コ','ko']]},
  {id:'s', name:'サ S', items:[['サ','sa'],['シ','shi'],['ス','su'],['セ','se'],['ソ','so']]},
  {id:'t', name:'タ T', items:[['タ','ta'],['チ','chi'],['ツ','tsu'],['テ','te'],['ト','to']]},
  {id:'n', name:'ナ N', items:[['ナ','na'],['ニ','ni'],['ヌ','nu'],['ネ','ne'],['ノ','no']]},
  {id:'h', name:'ハ H', items:[['ハ','ha'],['ヒ','hi'],['フ','fu'],['ヘ','he'],['ホ','ho']]},
  {id:'m', name:'マ M', items:[['マ','ma'],['ミ','mi'],['ム','mu'],['メ','me'],['モ','mo']]},
  {id:'y', name:'ヤ Y', items:[['ヤ','ya'],['ユ','yu'],['ヨ','yo']]},
  {id:'r', name:'ラ R', items:[['ラ','ra'],['リ','ri'],['ル','ru'],['レ','re'],['ロ','ro']]},
  {id:'w', name:'ワ W', items:[['ワ','wa'],['ヲ','wo'],['ン','n']]}
];
const KANA_READ = {}; [...KANA_GROUPS, ...KATA_GROUPS].forEach(g => g.items.forEach(([k,r]) => KANA_READ[k] = r));
const kanaGroups = () => (kz && kz.script === 'kata') ? KATA_GROUPS : KANA_GROUPS;
const KANA_ALIAS = { si:'shi', ti:'chi', tu:'tsu', hu:'fu', zi:'ji', di:'ji', du:'zu', o:'wo' };
let kanaStats = {};
let kz = null;
const kzShuffle = a => { for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

/* ---------- V1.2.0: repaso espaciado + voz ---------- */
const dayStr = (dt=new Date()) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
const SRS_DAYS = [1, 3, 7, 16, 35];
const srsNext = streak => { const d = new Date(); d.setDate(d.getDate() + SRS_DAYS[Math.min(Math.max(streak,1), SRS_DAYS.length) - 1]); return dayStr(d); };
const srsFailDue = () => { const d = new Date(); d.setDate(d.getDate() + 1); return dayStr(d); };
const isDue = s => !!(s && s.due && s.due <= dayStr());
function speakText(txt, lang) {
  try {
    const u = new SpeechSynthesisUtterance(txt); u.lang = lang; u.rate = 0.85;
    const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith(lang.slice(0,2)));
    if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
    return true;
  } catch(e) { return false; }
}
const voiceFor = pre => { try { return speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith(pre)) || null; } catch(e) { return null; } };
if (typeof speechSynthesis !== 'undefined') { try { speechSynthesis.getVoices(); } catch(e) {} }

function kanaHit(k, okAns) {
  const cur = kanaStats[k] || { ok:0, fail:0, last_fail:null, streak:0, due:null };
  const streak = okAns ? (cur.streak||0)+1 : 0;
  const row = { kana:k, ok:cur.ok+(okAns?1:0), fail:cur.fail+(okAns?0:1),
    last_fail: okAns ? cur.last_fail : new Date().toISOString(),
    streak, due: okAns ? srsNext(streak) : srsFailDue(),
    updated_at:new Date().toISOString() };
  kanaStats[k] = { ok:row.ok, fail:row.fail, last_fail:row.last_fail, streak:row.streak, due:row.due };
  sb.from('kana_stats').upsert(row).then(()=>{});
}

function openKana() {
  let sel = null, mode = 'read', script = 'hira';
  try {
    sel = JSON.parse(localStorage.getItem('salaKanaSel')||'null');
    mode = localStorage.getItem('salaKanaMode') || 'read';
    script = localStorage.getItem('salaKanaScript') || 'hira';
  } catch(e) {}
  kz = { phase:'setup', sel: (sel && sel.length ? sel : KANA_GROUPS.filter(g=>g.id!=='d'&&g.id!=='c').map(g=>g.id)),
         script, mode, strokes:[], showGuide:true,
         deck:[], pos:0, total:0, cleared:0, firstTryOk:0, wrongs:[], fb:null, exp:0 };
  renderKana();
}
function renderKana() {
  h(shell(vKana())); bindNav(); bindKana();
  app.querySelector('[data-back]').onclick = async () => { await refreshLang(); tab='idiomas'; render(); };
}

function vKana() {
  const head = `<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
    <div class="grow"><h1 class="small-h">Práctica de kana</h1><div class="sub">${kz.script==='kata'?'Katakana':'Hiragana'} · ${kz.mode==='trace'?'traza sobre la guía con orden y dirección':kz.mode==='listen'?'escucha y elige el kana que oyes':'escribe la lectura en romaji'}</div></div></header>`;
  if (kz.phase === 'setup') {
    const total = kanaGroups().filter(g => kz.sel.includes(g.id)).reduce((n,g) => n + g.items.length, 0);
    const dueKana = Object.entries(kanaStats).filter(([k,st]) => isDue(st) && KANA_READ[k]);
    const fails = Object.entries(kanaStats).filter(([k,s]) => s.fail > 0)
      .sort((a,b) => b[1].fail - a[1].fail || new Date(b[1].last_fail||0) - new Date(a[1].last_fail||0)).slice(0,8);
    return head + `
    <div class="card rise"><b>Elige qué practicar</b>
      <div class="chips" style="margin-top:12px">
        <div class="chip ${kz.mode==='read'?'on':''}" data-kmode="read">Leer</div>
        <div class="chip ${kz.mode==='trace'?'on':''}" data-kmode="trace">Trazar</div>
        <div class="chip ${kz.mode==='listen'?'on':''}" data-kmode="listen">Dictado</div>
      </div>
      <div class="chips">
        <div class="chip ${kz.script==='hira'?'on':''}" data-kscript="hira">Hiragana あ</div>
        <div class="chip ${kz.script==='kata'?'on':''}" data-kscript="kata">Katakana ア</div>
      </div>
      <div class="chips" style="flex-wrap:wrap">${kanaGroups().map(g => `<div class="chip ${kz.sel.includes(g.id)?'on':''}" data-kg="${g.id}">${esc(g.name)}</div>`).join('')}</div>
      <button class="btn primary block" id="kz-start" style="margin-top:16px" ${total?'':'disabled'}>${kz.mode==='trace'?'Empezar a trazar':kz.mode==='listen'?'Empezar el dictado':'Empezar'} · ${total} kana</button>
      ${kz.mode==='listen' ? `<div class="mut small" style="margin-top:6px">Oirás cada kana con la voz del dispositivo y eliges cuál era. Usa la voz japonesa de tu navegador o sistema.</div>` : ''}
      ${kz.noVoice && kz.mode==='listen' ? `<div class="notice" style="margin-top:8px">Este navegador no tiene una voz japonesa instalada; sin ella el dictado no puede sonar. En el móvil suele venir con el sistema.</div>` : ''}
      ${dueKana.length ? `<button class="btn block" id="kz-review" style="margin-top:8px">${ic('sparkle',16,1.8)} Repasar hoy · ${dueKana.length} kana tocan</button>` : ''}
    </div>
    ${fails.length ? `<div class="sec rise"><h2>Dónde fallas</h2></div>
    <div class="card rise">${fails.map(([k,s]) => `<div class="kz-failrow"><span class="kz-k">${k}</span><span class="grow mut">${esc(KANA_READ[k]||'')}</span><span class="pill no">${s.fail}✗</span></div>`).join('')}</div>` : ''}`;
  }
  if (kz.phase === 'quiz') {
    const item = kz.deck[kz.pos];
    return head + `
    <div class="card rise">
      <div class="mut small">${kz.cleared}/${kz.total} · a la primera ${kz.firstTryOk}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${kz.total?Math.round(kz.cleared/kz.total*100):0}%"></i></div>
      <div class="kz-big">${item[0]}</div>
      ${kz.fb
        ? `<div class="kz-fb ${kz.fb.ok?'ok':'no'}">${kz.fb.ok?'✓ Correcto':'✗ Era <b>'+esc(item[1])+'</b>'}</div>
           <button class="btn primary block" id="kz-next">Siguiente</button>`
        : `<input class="inp kz-inp" id="kz-ans" placeholder="romaji…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
           <button class="btn primary block" id="kz-check" style="margin-top:12px">Comprobar</button>`}
    </div>`;
  }
  if (kz.phase === 'listen') {
    const q = kz.deck[kz.pos];
    return head + `
    <div class="card rise" style="text-align:center">
      <div class="mut small">${kz.cleared}/${kz.total} · a la primera ${kz.firstTryOk}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${kz.total?Math.round(kz.cleared/kz.total*100):0}%"></i></div>
      <div style="margin:18px 0 6px"><button class="btn primary" id="kz-replay">${ic('play',16,2)} Escuchar de nuevo</button></div>
      <div class="mut small">¿Qué kana has oído?</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">${q.opts.map(o => `<button class="btn" style="font-size:34px;padding:12px 0" data-kopt="${o}" ${kz.fb?'disabled':''}>${o}</button>`).join('')}</div>
      ${kz.fb ? `<div class="kz-fb ${kz.fb.ok?'ok':'no'}">${kz.fb.ok?'✓ Correcto':'✗ Era <b>'+q[0]+'</b> ('+esc(q[1])+')'}</div>
      <button class="btn primary block" id="kz-next">Siguiente</button>` : ''}
    </div>`;
  }
  if (kz.phase === 'trace') {
    const item = kz.deck[kz.pos];
    return head + `
    <div class="card rise" style="text-align:center">
      <div class="mut small">${kz.pos+1}/${kz.deck.length} · ${esc(item[1])}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${Math.round(kz.pos/kz.deck.length*100)}%"></i></div>
      <canvas id="kz-canvas" class="kz-canvas" width="640" height="640"></canvas>
      <div class="row" style="margin-top:12px">
        <button class="btn grow" id="kz-clear">Borrar</button>
        <button class="btn grow" id="kz-guide">${kz.showGuide===false?'Mostrar guía':'Ocultar guía'}</button>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn ghost grow" id="kz-prev" ${kz.pos===0?'disabled':''}>Anterior</button>
        <button class="btn primary grow" id="kz-next-t">${kz.pos+1<kz.deck.length?'Siguiente':'Terminar'}</button>
      </div>
      <div id="kz-msg" class="mut small" style="margin-top:12px;min-height:18px">Traza en orden: la guía comprueba inicio, dirección y orden de cada trazo (no la forma).</div>
      <div class="mut small" style="font-size:10px;opacity:.6;margin-top:4px">Orden de trazos: datos KanjiVG (CC BY-SA 3.0)</div>
    </div>`;
  }
  const uniq = [];
  kz.wrongs.forEach(it => { if (!uniq.some(u => u[0]===it[0])) uniq.push(it); });
  return head + `
  <div class="card rise" style="text-align:center">
    <div class="kz-score">${kz.firstTryOk}/${kz.total}</div>
    <div class="mut">aciertos a la primera</div>
  </div>
  ${uniq.length ? `<div class="sec rise"><h2>Fallados en esta ronda</h2></div>
  <div class="card rise">${uniq.map(([k,r]) => `<div class="kz-failrow"><span class="kz-k">${k}</span><span class="grow mut">${esc(r)}</span></div>`).join('')}</div>
  <button class="btn primary block" id="kz-retry" style="margin-top:12px">Repetir fallados (${uniq.length})</button>`
  : `<div class="card rise" style="text-align:center"><b>Sin fallos. Muy bien.</b></div>`}
  <button class="btn ghost block" id="kz-again" style="margin-top:10px">Elegir kana</button>`;
}

function bindKana() {
  app.querySelectorAll('[data-kmode]').forEach(c => c.onclick = () => { kz.mode = c.dataset.kmode; kz.noVoice = false; localStorage.setItem('salaKanaMode', kz.mode); renderKana(); });
  app.querySelectorAll('[data-kscript]').forEach(c => c.onclick = () => { kz.script = c.dataset.kscript; localStorage.setItem('salaKanaScript', kz.script); renderKana(); });
  app.querySelectorAll('[data-kg]').forEach(c => c.onclick = () => {
    const id = c.dataset.kg;
    kz.sel = kz.sel.includes(id) ? kz.sel.filter(x => x!==id) : [...kz.sel, id];
    localStorage.setItem('salaKanaSel', JSON.stringify(kz.sel));
    renderKana();
  });
  const start = document.getElementById('kz-start');
  if (start) start.onclick = () => {
    const items = kanaGroups().filter(g => kz.sel.includes(g.id)).flatMap(g => g.items);
    if (!items.length) return;
    if (kz.mode === 'trace') {
      kz.deck = items.map(it => [...it]);
      kz.pos = 0; kz.strokes = []; kz.showGuide = true; kz.exp = 0;
      kz.phase = 'trace'; renderKana(); return;
    }
    if (kz.mode === 'listen') {
      if (!voiceFor('ja')) { kz.noVoice = true; renderKana(); return; }
      const pool = items.map(it => it[0]);
      kz.deck = kzShuffle(items.map(it => [...it]));
      kz.deck.forEach(it => { it.opts = kzShuffle([it[0], ...kzShuffle(pool.filter(x => x !== it[0])).slice(0,3)]); });
      kz.pos = 0; kz.total = kz.deck.length; kz.cleared = 0; kz.firstTryOk = 0; kz.wrongs = []; kz.fb = null;
      kz.phase = 'listen'; renderKana(); return;
    }
    kz.deck = kzShuffle(items.map(it => [...it]));
    kz.pos = 0; kz.total = kz.deck.length; kz.cleared = 0; kz.firstTryOk = 0; kz.wrongs = []; kz.fb = null;
    kz.phase = 'quiz'; renderKana();
  };
  const rev = document.getElementById('kz-review');
  if (rev) rev.onclick = () => {
    const due = Object.keys(kanaStats).filter(k => isDue(kanaStats[k]) && KANA_READ[k]);
    if (!due.length) return;
    kz.deck = kzShuffle(due.map(k => [k, KANA_READ[k]]));
    kz.pos = 0; kz.total = kz.deck.length; kz.cleared = 0; kz.firstTryOk = 0; kz.wrongs = []; kz.fb = null;
    kz.phase = 'quiz'; renderKana();
  };
  const replay = document.getElementById('kz-replay');
  if (replay) {
    speakText(kz.deck[kz.pos][0], 'ja-JP');
    replay.onclick = () => speakText(kz.deck[kz.pos][0], 'ja-JP');
    app.querySelectorAll('[data-kopt]').forEach(b => b.onclick = () => {
      if (kz.fb) return;
      const q = kz.deck[kz.pos];
      const ok = b.dataset.kopt === q[0];
      if (!q._t) { q._t = true; if (ok) kz.firstTryOk++; else kz.wrongs.push(q); }
      kanaHit(q[0], ok);
      if (ok) kz.cleared++; else kz.deck.push(q);
      kz.fb = { ok, sel: b.dataset.kopt }; renderKana();
    });
  }
  const check = document.getElementById('kz-check');
  const ans = document.getElementById('kz-ans');
  if (ans) { ans.focus(); ans.onkeydown = e => { if (e.key==='Enter' && check) check.click(); }; }
  if (check) check.onclick = () => {
    const item = kz.deck[kz.pos];
    const a = (ans.value||'').trim().toLowerCase();
    if (!a) { ans.focus(); return; }
    const ok = a === item[1] || KANA_ALIAS[a] === item[1];
    if (!item._t) { item._t = true; if (ok) kz.firstTryOk++; else kz.wrongs.push(item); }
    kanaHit(item[0], ok);
    if (ok) kz.cleared++; else kz.deck.push(item);
    kz.fb = { ok }; renderKana();
  };
  const next = document.getElementById('kz-next');
  if (next) { next.focus(); next.onkeydown = e => { if (e.key==='Enter') next.click(); }; next.onclick = () => {
    kz.pos++; kz.fb = null;
    kz.phase = kz.pos >= kz.deck.length ? 'results' : (kz.mode === 'listen' ? 'listen' : 'quiz');
    renderKana();
  }; }
  const retry = document.getElementById('kz-retry');
  if (retry) retry.onclick = () => {
    const uniq = [];
    kz.wrongs.forEach(it => { if (!uniq.some(u => u[0]===it[0])) uniq.push(it); });
    kz.deck = kzShuffle(uniq.map(it => [it[0], it[1]]));
    kz.pos = 0; kz.total = kz.deck.length; kz.cleared = 0; kz.firstTryOk = 0; kz.wrongs = []; kz.fb = null;
    kz.phase = 'quiz'; renderKana();
  };
  const again = document.getElementById('kz-again');
  if (again) again.onclick = () => { kz.phase = 'setup'; renderKana(); };
  const canvas = document.getElementById('kz-canvas');
  if (canvas) {
    const item = kz.deck[kz.pos];
    const ctx = canvas.getContext('2d');
    const redraw = () => {
      ctx.clearRect(0, 0, 640, 640);
      if (kz.showGuide !== false) {
        if (!drawKanaOrder(ctx, item[0])) {
          ctx.font = '400px "Hiragino Sans","Noto Sans JP","Yu Gothic",sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255,255,255,.12)';
          ctx.fillText(item[0], 320, 350);
        }
      }
      const lay0 = kanaOrderLayout(item[0]);
      if (lay0 && kz.exp > 0) {
        for (let i = 0; i < Math.min(kz.exp, lay0.length); i++) {
          const sp = kanaPath(lay0[i].d);
          const p1 = sp.getPointAtLength(sp.getTotalLength());
          const x = lay0[i].ox + p1.x*lay0[i].sc, y = lay0[i].oy + p1.y*lay0[i].sc;
          ctx.beginPath(); ctx.arc(x, y, 13, 0, 7);
          ctx.fillStyle = 'rgba(46,204,113,.95)'; ctx.fill();
          ctx.strokeStyle = '#0b0f1a'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x-6, y); ctx.lineTo(x-1.5, y+5); ctx.lineTo(x+7, y-5); ctx.stroke();
        }
      }
      ctx.lineWidth = 24; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(240,240,246,.92)';
      (kz.strokes || []).forEach(st => { if (!st.length) return; ctx.beginPath(); st.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke(); });
    };
    const posOf = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * 640 / r.width, (e.clientY - r.top) * 640 / r.height]; };
    let drawing = false;
    canvas.addEventListener('pointerdown', e => { e.preventDefault(); drawing = true; kz.strokes = kz.strokes || []; kz.strokes.push([posOf(e)]); try { canvas.setPointerCapture(e.pointerId); } catch(_) {} redraw(); });
    canvas.addEventListener('pointermove', e => { if (!drawing) return; e.preventDefault(); kz.strokes[kz.strokes.length-1].push(posOf(e)); redraw(); });
    canvas.addEventListener('pointerup', () => {
      drawing = false;
      const lay = kanaOrderLayout(item[0]);
      if (!lay || kz.exp >= lay.length) return;
      const st = kz.strokes[kz.strokes.length-1];
      if (!st || st.length < 2) { if (st) kz.strokes.pop(); redraw(); return; }
      const e = lay[kz.exp];
      const sp = kanaPath(e.d);
      const p0 = sp.getPointAtLength(0), p1 = sp.getPointAtLength(sp.getTotalLength());
      const x0 = e.ox + p0.x*e.sc, y0 = e.oy + p0.y*e.sc;
      const x1 = e.ox + p1.x*e.sc, y1 = e.oy + p1.y*e.sc;
      const s0 = st[0], s1 = st[st.length-1];
      const T = 78;
      const ok = Math.hypot(s0[0]-x0, s0[1]-y0) < T && Math.hypot(s1[0]-x1, s1[1]-y1) < T;
      const msg = document.getElementById('kz-msg');
      if (ok) {
        kz.exp++;
        if (msg) msg.innerHTML = kz.exp >= lay.length
          ? '🎉 <b>Kana completo</b>: todos los trazos en orden y dirección'
          : `✓ Trazo ${kz.exp} bien. Ahora el ${kz.exp+1}.`;
        if (kz.exp >= lay.length) kanaHit(item[0], true);
      } else {
        kz.strokes.pop();
        if (msg) msg.innerHTML = `✗ Ese no era el trazo ${kz.exp+1}: mira el número y la flecha de la guía.`;
      }
      redraw();
    });
    ['pointercancel','pointerleave'].forEach(ev => canvas.addEventListener(ev, () => { drawing = false; }));
    redraw();
    const clr = document.getElementById('kz-clear');
    if (clr) clr.onclick = () => { kz.strokes = []; kz.exp = 0; const m = document.getElementById('kz-msg'); if (m) m.innerHTML = 'Traza en orden: la guía comprueba inicio, dirección y orden de cada trazo (no la forma).'; redraw(); };
    const gd = document.getElementById('kz-guide');
    if (gd) gd.onclick = () => { kz.showGuide = !(kz.showGuide !== false); gd.textContent = kz.showGuide === false ? 'Mostrar guía' : 'Ocultar guía'; redraw(); };
    const pv = document.getElementById('kz-prev');
    if (pv) pv.onclick = () => { if (kz.pos > 0) { kz.pos--; kz.strokes = []; kz.exp = 0; renderKana(); } };
    const nt = document.getElementById('kz-next-t');
    if (nt) nt.onclick = () => { if (kz.pos + 1 < kz.deck.length) { kz.pos++; kz.strokes = []; kz.exp = 0; renderKana(); } else { kz.phase = 'setup'; renderKana(); } };
  }
}

const kanaPathCache = new Map();
function kanaPath(d) {
  let p = kanaPathCache.get(d);
  if (!p) {
    p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d', d);
    kanaPathCache.set(d, p);
  }
  return p;
}
function kanaOrderLayout(str) {
  const KS = window.KANA_STROKES; if (!KS) return null;
  const chars = [...str];
  if (!chars.every(ch => KS[ch])) return null;
  const layouts = chars.length === 1
    ? [{ ox: 55, oy: 55, sc: 530/109 }]
    : [{ ox: 40, oy: 40, sc: 340/109 }, { ox: 330, oy: 330, sc: 250/109 }];
  const out = [];
  chars.forEach((ch, ci) => KS[ch].forEach(d => out.push({ d, ox: layouts[ci].ox, oy: layouts[ci].oy, sc: layouts[ci].sc })));
  return out;
}
function drawKanaOrder(ctx, str) {
  const entries = kanaOrderLayout(str);
  if (!entries) return false;
  let n = 0;
  {
    entries.forEach(({ d, ox, oy, sc }) => {
      const L = { ox, oy, sc };
      n++;
      const sp = kanaPath(d);
      const len = sp.getTotalLength();
      const path = new Path2D(d);
      ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.sc, L.sc);
      ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,.10)';
      ctx.stroke(path);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = 'rgba(139,148,255,.5)';
      ctx.stroke(path);
      ctx.restore();
      const p0 = sp.getPointAtLength(0);
      const x0 = L.ox + p0.x*L.sc, y0 = L.oy + p0.y*L.sc;
      ctx.beginPath(); ctx.arc(x0, y0, 14, 0, 7);
      ctx.fillStyle = 'rgba(139,148,255,.95)'; ctx.fill();
      ctx.fillStyle = '#0b0f1a'; ctx.font = 'bold 17px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(n), x0, y0+1);
      const p1 = sp.getPointAtLength(len), p9 = sp.getPointAtLength(Math.max(0, len-2));
      const x1 = L.ox + p1.x*L.sc, y1 = L.oy + p1.y*L.sc;
      const ang = Math.atan2(p1.y-p9.y, p1.x-p9.x);
      ctx.save(); ctx.translate(x1, y1); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-18,-9); ctx.lineTo(-18,9); ctx.closePath();
      ctx.fillStyle = 'rgba(139,148,255,.95)'; ctx.fill(); ctx.restore();
    });
  }
  return true;
}

/* Mini gráficas SVG para las tarjetas de Inicio (siempre con datos reales). */
const sparkSVG = (pts, color, w=80, h=36) => {
  if(!pts.length) return '';
  const min = Math.min(...pts), max = Math.max(...pts), span = (max-min)||1;
  const X = i => 3 + (w-6) * i/(pts.length-1 || 1);
  const Y = v => h-5 - (h-12)*(v-min)/span;
  let d = `M${X(0).toFixed(1)},${Y(pts[0]).toFixed(1)}`;
  for(let i=0;i<pts.length-1;i++){
    const p0 = pts[Math.max(0,i-1)], p1 = pts[i], p2 = pts[i+1], p3 = pts[Math.min(pts.length-1,i+2)];
    const c1x = X(i) + (X(i+1)-X(Math.max(0,i-1)))/6, c1y = Y(p1) + (Y(p2)-Y(p0))/6;
    const c2x = X(i+1) - (X(Math.min(pts.length-1,i+2))-X(i))/6, c2y = Y(p2) - (Y(p3)-Y(p1))/6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${X(i+1).toFixed(1)},${Y(p2).toFixed(1)}`;
  }
  const gid = 'sg'+color.replace('#','');
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${X(pts.length-1).toFixed(1)},${h-2} L${X(0).toFixed(1)},${h-2} Z" fill="url(#${gid})"/><path d="${d}" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${X(pts.length-1).toFixed(1)}" cy="${Y(pts[pts.length-1]).toFixed(1)}" r="3" fill="${color}"/></svg>`;
};
const barsSVG = (vals, colors, w=80, h=38) => {
  const n = vals.length, gap = 3, bw = (w - gap*(n-1)) / n, max = Math.max(...vals)||1;
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${vals.map((v,i)=>{const bh=Math.max(4,(h-6)*v/max);const x=(i*(bw+gap)).toFixed(1);const y=(h-bh).toFixed(1);const c=colors[i%colors.length];return `<rect x="${x}" y="${y}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${(bw/2).toFixed(1)}" fill="${c}" opacity="${(0.55+0.45*v/max).toFixed(2)}"/>`;}).join('')}</svg>`;
};

function vHoy() {
  const nextLesson = cache.lessons.find(l => !cache.results.some(r => r.lesson_id===l.id));
  const ex = examInfo();
  const lp = langProgress();
  const notas = cache.notes.slice(0,2);
  const jsHoy = jpStats();
  const langTile = lp.total ? {lab:'Sesiones idiomas', x:lp.hechas, y:lp.total}
    : {lab:'Japonés · unidades', x:jsHoy.mastered, y:jsHoy.total};
  const temPct = cache.topics.length ? Math.round(cache.topics.filter(t => t.done).length/cache.topics.length*100) : 0;
  const jpPct = jsHoy.total ? Math.round(jsHoy.mastered/jsHoy.total*100) : 0;
  const tqPct = cache.testStates.length ? Math.round(cache.testStates.filter(s => s.last_correct).length/cache.testStates.length*100) : 0;
  const genPct = Math.round((temPct + jpPct + tqPct)/3);
  const fechaStr = new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
  const fechaCap = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
  const lpct = lp.total ? Math.round(lp.hechas/lp.total*100) : genPct;
  const RING_C = (2*Math.PI*44).toFixed(1);
  /* Series reales: semanas que quedan hasta el examen y sesiones de japonés acumuladas por día. */
  const exSeries = ex.dias!==null ? [0,1,2,3,4,5,6,7].map(w => Math.max(0, ex.dias - w*7)) : [];
  const jpByDay = {};
  jsHoy.hist.forEach(x => { if (x.kind === 'lesson' && x.at) { const d = String(x.at).slice(0,10); jpByDay[d] = (jpByDay[d] || 0) + 1; } });
  let cum = 0;
  const jpSeries = Object.keys(jpByDay).sort().map(d => cum += jpByDay[d]);

  return `<div class="hoy-fill">
  <header class="top rise" style="animation-delay:.02s">
    <div class="grow"><h1>Hola${CFG.OWNER_NAME?', <span class="hgrad">'+esc(CFG.OWNER_NAME)+'</span>':''} 👋</h1></div>
    <button class="icon-btn" id="btn-refresh" title="Actualizar">${ic('refresh',18)}</button>
    <button class="icon-btn" id="btn-offline" title="Descargar para usar sin conexión">${ic('download',18)}</button>
    <button class="icon-btn" id="btn-cuenta" title="Cuenta">${ic('settings',18)}</button>
    <button class="icon-btn ${THEME_OP?'hat-host':''}" id="btn-out" title="Cerrar sesión">${ic('logout',18)}${THEME_OP?HAT(24,'hat-mini'):''}</button>
  </header>
  <div class="cta-row rise" style="animation-delay:.04s">
    <button class="btn primary" data-go="idiomas">${ic('play',15,2)} Continuar aprendiendo</button>
    <button class="btn cta-ghost" data-go="estudios">${ic('cap',16)} Ver mi progreso</button>
  </div>
  ${THEME_OP?'<div class="ship-space" aria-hidden="true"></div>':''}

  <div class="hoy-row rise" style="animation-delay:.08s">
    ${ex.dias!==null ? `<div class="tile">
      <span class="wm wm-amber">${ic('calendar',96)}</span>
      <div class="tile-main">
        <div class="grow"><div class="big">${ex.dias} <small>días</small></div>
        <div class="lab">${esc((CFG.EXAM&&CFG.EXAM.title)||'Exámenes')}</div></div>
        ${sparkSVG(exSeries,'#fdba74',64,32)}
      </div>
      <div class="bar"><i class="warn" style="width:${Math.max(4,Math.min(100,100-ex.dias/2))}%"></i></div>
    </div>` : ''}
    <div class="tile">
      <span class="wm wm-violet wm-txt">あ</span>
      <div class="tile-main">
        <div class="grow"><div class="big">${langTile.x}<small>/${langTile.y}</small></div>
        <div class="lab">${langTile.lab}</div></div>
      </div>
      <div class="bar"><i style="width:${langTile.y?Math.round(langTile.x/langTile.y*100):0}%"></i></div>
    </div>
    <div class="tile">
      <span class="wm wm-blue">${ic('sparkle',96)}</span>
      <div class="tile-main">
        <div class="grow"><div class="big">${genPct}<small>%</small></div>
        <div class="lab">Progreso general</div></div>
        ${barsSVG([18,30,26,48,62,80,100].map(v=>Math.max(6,Math.round(v*genPct/100))),['#7dd3fc','#c084fc','#f9a8d4'])}
      </div>
      <div class="bar"><i style="width:${genPct}%"></i></div>
    </div>
  ${nextLesson ? `
  <div class="hero rise" style="animation-delay:.06s" data-go="idiomas">
    <span class="glyph">${nextLesson.lang==='ja'?'あ':'Aa'}</span>
    ${THEME_OP?`<span class="logpose">${LOGPOSE(54)}</span>`:`<div class="go">${ic('chev',16,2.2)}</div>`}
    <div class="kicker">Tu próxima actividad</div>
    <h3>${esc(nextLesson.title)}</h3>
    <div class="meta">${ic('clock',14)} Unos 10 min · ${nextLesson.lang==='ja'?'Japonés':'Inglés'}</div>
  </div>` : jpHoy ? `
  <div class="hero rise" style="animation-delay:.06s" data-go="idiomas">
    <span class="glyph">あ</span>
    ${THEME_OP?`<span class="logpose">${LOGPOSE(54)}</span>`:`<div class="go">${ic('chev',16,2.2)}</div>`}
    <div class="kicker">Tu próxima actividad</div>
    <h3>${jpHoy.started ? esc(jpHoy.title) : 'Prueba de nivel de japonés'}</h3>
    <div class="meta">${ic('clock',14)} Unos 10 min · Japonés${jpHoy.started ? (jpHoy.review ? ' · repaso' : ' · lección nueva') : ' · empezamos por tu nivel'}</div>
  </div>` : `
  <div class="hero done rise" style="animation-delay:.06s" data-go="idiomas">
    <span class="glyph">✓</span>
    <div class="kicker">Idiomas</div>
    <h3>Todo al día</h3>
    <div class="meta">Has completado todas las sesiones</div>
  </div>`}
  </div>

  <div class="sec rise" style="animation-delay:.18s"><h2>${THEME_OP?ROSETA(16):''} ${fechaCap}</h2><button class="link" data-go="agenda">Ver agenda</button></div>
  <div class="hoy-cols">
  <div class="hoy-left">
  <div class="ag-panel rise" style="animation-delay:.22s">
  ${hoyAgendaHTML()}
  </div>
  </div>
  <div class="card prog-card rise" style="animation-delay:.24s">
    <div class="row"><h2 class="grow">Tu progreso</h2><button class="link" data-go="estudios">Ver detalles ${ic('chev',13)}</button></div>
    <div class="ring-wrap"><svg viewBox="0 0 110 110" width="126" height="126">
      <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f9a8d4"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
      <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(150,180,255,.15)" stroke-width="11"/>
      <circle cx="55" cy="55" r="44" fill="none" stroke="url(#rg)" stroke-width="11" stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="${(RING_C*(1-lpct/100)).toFixed(1)}" transform="rotate(-90 55 55)"/>
      <text x="55" y="52" text-anchor="middle" fill="#fff" font-size="21" font-weight="800">${lpct}%</text>
      <text x="55" y="69" text-anchor="middle" fill="rgba(220,230,255,.6)" font-size="9.5">Completado</text>
    </svg></div>
    ${jpSeries.length ? `<div class="prog-chart">${sparkSVG(jpSeries,'#f9a8d4',190,42)}<div class="mut small">Sesiones de japonés acumuladas</div></div>` : ''}
    <div class="prog-bars">
      <div class="pb-row"><span>Temario</span><div class="bar grow"><i style="width:${temPct}%;background:linear-gradient(90deg,#7dd3fc,#6366f1)"></i></div><b>${temPct}%</b></div>
      <div class="pb-row"><span>Japonés</span><div class="bar grow"><i style="width:${jpPct}%;background:linear-gradient(90deg,#c084fc,#8b5cf6)"></i></div><b>${jpPct}%</b></div>
      <div class="pb-row"><span>Tests</span><div class="bar grow"><i style="width:${tqPct}%;background:linear-gradient(90deg,#fdba74,#fb923c)"></i></div><b>${tqPct}%</b></div>
    </div>
    <div class="prog-msg">🐱🌸 <b>¡Vas genial${CFG.OWNER_NAME?', '+esc(CFG.OWNER_NAME):''}!</b><div class="prog-sub">Estás más cerca de tus metas.</div></div>
  </div>
  </div>

  ${SHOW_HOY_NOTES ? `
  <div class="sec rise" style="animation-delay:.26s"><h2>${THEME_OP?ROSETA(16):''} Apuntes recientes</h2><button class="link" data-go="apuntes">Todos</button></div>
  <div class="rise" style="animation-delay:.3s">
  ${notas.length ? notas.map(n=>`
    <div class="card note-card clickable" data-note="${n.id}"><b>${esc(n.title)||'Sin título'}</b>
      <div class="prev">${(esc(n.body)||'').slice(0,110)}</div>
      <div class="foot">${new Date(n.updated_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}${n.tags?` · <span class="tag">${esc(n.tags)}</span>`:''}</div></div>`).join('')
    : `<div class="empty">${ic('note',26)}<div>Sin apuntes todavía. Empieza uno desde Apuntes.</div></div>`}
  </div>` : ''}
  <div class="ag-privacy rise" style="animation-delay:.34s"><a href="/privacy.html">Privacidad</a></div></div>`;
}

/* Agenda de hoy en la página principal: solo los eventos de hoy de sus calendarios visibles. */
function hoyAgendaHTML() {
  if (cal.connected === null) return `<div class="empty">${ic('calendar',26)}<div>Cargando tu agenda...</div></div>`;
  if (cal.connected === false) return `<div class="empty">${ic('calendar',26)}<div>Conecta tu Google Calendar desde Agenda para ver aquí tu día.</div></div>`;
  if (cal.connected === 'error') return `<div class="empty">${ic('calendar',26)}<div>No se pudo cargar la agenda.</div></div>`;
  const hkeys = hiddenSet();
  const k = calDayKey(new Date());
  const evs = cal.events.filter(ev => calDayKey(evStart(ev)) === k && !hkeys.has(ev._cal.id + '|' + ev.id));
  if (!evs.length) return `<div class="empty">${ic('sparkle',26)}<div>Hoy no tienes nada en la agenda.</div></div>`;
  return evs.map(ev => {
    const time = ev.start.dateTime ? evStart(ev).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : 'Todo el día';
    const mins = (ev.start.dateTime && ev.end && ev.end.dateTime) ? Math.round((new Date(ev.end.dateTime) - evStart(ev))/60000) : 0;
    const dur = mins > 0 ? (mins >= 90 ? ' · ' + Math.floor(mins/60) + ' h' + (mins%60 ? ' ' + (mins%60) + ' min' : '') : ' · ' + mins + ' min') : '';
    return `<button class="ag-ev ag-ev-cal" data-go="agenda"
      style="width:100%;background:linear-gradient(100deg,${esc(ev._cal.color)}bf,${esc(ev._cal.color)}38 68%,${esc(ev._cal.color)}14);border-color:${esc(ev._cal.color)}73">
      <span class="ag-ev-main"><b>${esc(ev.summary || '(sin título)')}</b><small>${time} · ${esc(ev._cal.name)}${dur}</small></span>
    </button>`;
  }).join('');
}

function vTareas() {
  const areas = ['personal','trabajo','estudios'];
  const nPend = cache.tasks.filter(t=>!t.done).length;
  return `${header('Tareas',`${nPend} pendiente${nPend===1?'':'s'}`)}
  <div class="add-box rise" style="animation-delay:.05s">
    <input id="nt-title" placeholder="Nueva tarea...">
    <div class="chips" id="nt-chips">${areas.map((a,i)=>`<div class="chip ${i===0?'on':''}" data-area="${a}">${a[0].toUpperCase()+a.slice(1)}</div>`).join('')}</div>
    <button class="btn primary block" id="nt-add">${ic('plus',17,2.2)} Añadir tarea</button>
  </div>
  ${areas.map((a,ai)=>{
    const list = cache.tasks.filter(t=>t.area===a);
    if(!list.length) return '';
    return `<div class="sec rise" style="animation-delay:${.1+ai*.05}s"><h2><span class="area-dot ${AREA_DOT[a]}"></span>${a[0].toUpperCase()+a.slice(1)}</h2><span class="count">${list.filter(t=>!t.done).length}</span></div>` +
      list.map((t,i)=>`
      <div class="card task rise" style="animation-delay:${.12+ai*.05+i*.03}s"><button class="chk ${t.done?'done':''}" data-task="${t.id}">${ic('check',14,3)}</button>
      <div class="grow txt ${t.done?'done':''}">${esc(t.title)}</div>
      <button class="icon-btn" data-del-task="${t.id}" title="Borrar">${ic('trash',16)}</button></div>`).join('');
  }).join('') || `<div class="empty rise" style="animation-delay:.1s">${ic('squareCheck',26)}<div>Sin tareas todavía. Añade la primera arriba.</div></div>`}`;
}

function vApuntes() {
  return `${header('Apuntes','Tus notas, ordenadas por etiquetas')}
  <button class="btn primary block rise" style="animation-delay:.05s" id="note-new">${ic('plus',17,2.2)} Apunte nuevo</button>
  <div class="mt"></div>
  ${cache.notes.map((n,i)=>`
    <div class="card note-card clickable rise" style="animation-delay:${.08+i*.04}s" data-note="${n.id}"><b>${esc(n.title)||'Sin título'}</b>
    <div class="prev">${(esc(n.body)||'').slice(0,140)}</div>
    <div class="foot">${new Date(n.updated_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}${n.tags?` · <span class="tag">${esc(n.tags)}</span>`:''}</div></div>`).join('')
    || `<div class="empty rise" style="animation-delay:.08s">${ic('note',26)}<div>Todavía no hay apuntes. El primero cuesta, luego fluye.</div></div>`}`;
}

function vApunte(n) {
  return `<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button><div class="grow"><h1 class="small-h">${n.id?'Editar apunte':'Apunte nuevo'}</h1></div></header>
  <div class="card rise" style="animation-delay:.05s">
    <label>Título</label><input id="ed-title" value="${esc(n.title||'')}" placeholder="¿De qué va?">
    <label>Etiquetas</label><input id="ed-tags" value="${esc(n.tags||'')}" placeholder="estudios, japonés, inglés, trabajo...">
    <label>Contenido</label><textarea id="ed-body" placeholder="Escribe aquí...">${esc(n.body||'')}</textarea>
    <div class="row mt"><button class="btn primary grow" id="ed-save">Guardar</button>
    ${n.id ? `<button class="icon-btn" id="ed-del" title="Borrar">${ic('trash',17)}</button>` : ''}</div>
  </div>`;
}

const estudiosSel = () => `<div class="chips rise" id="est-sub" style="animation-delay:.03s;margin-bottom:12px">
  <div class="chip ${estudiosSub==='temario'?'on':''}" data-est="temario">Temario</div>
  <div class="chip ${estudiosSub==='tests'?'on':''}" data-est="tests">Tests</div>
  <div class="chip ${estudiosSub==='simulacros'?'on':''}" data-est="simulacros">Simulacros</div></div>`;

function vEstudios() {
  if (estudiosSub === 'tests') return `${header('Estudios','Tu grado, tema a tema. Temario y tests.')}${estudiosSel()}${vTests(true)}`;
  if (estudiosSub === 'simulacros') return `${header('Estudios','Tu grado, tema a tema. Temario, tests y simulacros.')}${estudiosSel()}${vSimulacros()}`;
  const mods = [...new Set(cache.topics.map(t=>t.module))];
  const mord = CFG.MODULE_ORDER || [];
  mods.sort((x,y)=>{const ix=mord.indexOf(x), iy=mord.indexOf(y); return (ix<0?99:ix)-(iy<0?99:iy);});
  const ex = examInfo();
  const ex2 = examInfo(CFG.EXAM2);
  return `${header('Estudios','Tu grado, tema a tema. Temario y tests.')}
  ${estudiosSel()}
  ${CFG.EXAM ? `<div class="card rise" style="animation-delay:.05s">
    <div class="row"><span class="link-ic">${ic('cap',20)}</span>
    <div class="grow"><b>${esc(CFG.EXAM.title||'Exámenes')}</b><div class="mut small">${esc(CFG.EXAM.when||'')}</div></div>
    <span class="pill warn">${ex.dias} días</span></div>
    ${CFG.EXAM.detail ? `<div class="mut small mt">${esc(CFG.EXAM.detail)}</div>` : ''}
  </div>` : ''}
  ${CFG.EXAM2 && ex2.dias!==null ? `<div class="card rise" style="animation-delay:.055s">
    <div class="row"><span class="link-ic">${ic('calendar',20)}</span>
    <div class="grow"><b>${esc(CFG.EXAM2.title||'Otro')}</b><div class="mut small">${esc(CFG.EXAM2.when||'')}</div></div>
    <span class="pill warn">${ex2.dias} días</span></div>
    ${CFG.EXAM2.detail ? `<div class="mut small mt">${esc(CFG.EXAM2.detail)}</div>` : ''}
  </div>` : ''}
  ${mods.map((m,mi)=>{
    const ts = cache.topics.filter(t=>t.module===m);
    const done = ts.filter(t=>t.done).length;
    const pct = ts.length?Math.round(done/ts.length*100):0;
    return `<div class="mod-head rise" style="animation-delay:${.08+mi*.05}s"><h2>${esc(m)}</h2><span class="pill ${done===ts.length?'ok':'acc'}">${done}/${ts.length}</span></div>
    <div class="bar rise" style="animation-delay:${.09+mi*.05}s;margin:-4px 0 10px"><i class="${done===ts.length?'ok':''}" style="width:${pct}%"></i></div>` +
      ts.map((t,i)=>`<div class="card task rise" style="animation-delay:${.1+mi*.05+i*.03}s"><button class="chk ${t.done?'done':''}" data-topic="${t.id}">${ic('check',14,3)}</button>
      <div class="grow txt ${t.done?'done':''}">${esc(t.title)}</div>
      ${t.url?`<a class="icon-btn" href="${esc(t.url)}" target="_blank" rel="noopener" title="Abrir">${ic('link',16)}</a>`:''}
      ${t.pdf_path?`<button class="icon-btn" data-pdf="${t.id}" title="Ver temario">${ic('chev',16)}</button>`:''}</div>`).join('');
  }).join('')}
  <div class="sec rise" style="animation-delay:.2s"><h2>Recursos</h2></div>
  ${cache.resources.filter(r=>r.section==='estudios').map((r,i)=>`
    <a class="card link-row clickable rise" style="animation-delay:${.22+i*.04}s" href="${esc(r.url)}" target="_blank" rel="noopener">
    <span class="link-ic">${ic('link',18)}</span><span class="grow"><b>${esc(r.title)}</b><span>${esc(r.note||'')}</span></span>${ic('chev',16)}</a>`).join('')
    || '<div class="empty">Aún no hay recursos.</div>'}`;
}

/* Temario PDF: la flecha abre el PDF firmado directamente en una pestaña nueva,
   sin visor ni menu intermedio (peticion del propietario; el iframe falla en iOS).
   window.open va sincrono en el click para que iOS Safari no lo bloquee,
   y luego se le asigna la URL firmada. */
async function openTopicPdf(t) {
  const w = window.open('about:blank', '_blank');
  const { data, error } = await sb.storage.from('pdfs').createSignedUrl(t.pdf_path, 3600);
  if (error || !data?.signedUrl) { if (w) w.close(); alert('No se pudo abrir el PDF. Intentalo de nuevo.'); return; }
  if (w) { w.location.href = data.signedUrl; } else { window.location.href = data.signedUrl; }
}

const nextFor = lang => {
  const ls = cache.lessons.filter(l => l.lang === lang).sort((a, b) => a.day - b.day);
  const undone = ls.find(l => !cache.results.some(r => r.lesson_id === l.id));
  if (!undone) return null;
  const idx = ls.indexOf(undone);
  const prev = idx > 0 ? ls[idx - 1] : null;
  let repaso = false;
  if (prev) {
    const best = Math.max(-1, ...cache.results.filter(r => r.lesson_id === prev.id).map(r => r.score));
    repaso = best >= 0 && best < (prev.quiz || []).length;
  }
  return { lesson: undone, repaso };
};
const nextCard = lang => {
  if (!cache.lessons.some(l => l.lang === lang)) return '';
  const nx = nextFor(lang);
  const badge = lang === 'ja' ? 'あ' : 'EN';
  const name = lang === 'ja' ? 'Japonés' : 'Inglés';
  if (!nx) return `<div class="card rise" style="animation-delay:.06s"><div class="lesson-row">
    <span class="lang-badge ${lang}">${badge}</span>
    <div class="grow"><b>${name}: tanda completada</b>
    <div class="meta">Has terminado todas las sesiones de esta tanda. Tu asistente prepara la siguiente y aparecerá aquí cuando esté lista.</div></div></div></div>`;
  return `<div class="card clickable rise" style="animation-delay:.06s" data-lesson="${nx.lesson.id}"><div class="lesson-row">
    <span class="lang-badge ${lang}">${badge}</span>
    <div class="grow"><b>Siguiente: ${esc(nx.lesson.title)}</b>
    <div class="meta">${nx.repaso ? 'La sesión anterior te salió floja: repásala si quieres antes' : name + ' · sesión ' + nx.lesson.day}</div></div>
    ${ic('chev',16)}</div></div>`;
};

/* Recarga japonés/kana/lecciones tras practicar, para que Idiomas y la tarjeta lateral
   reflejen el progreso real al volver, sin recargar la app (petición del propietario, 22-nov-2026). */
async function refreshLang() {
  try {
    const [jpR, kR, lR, rR] = await Promise.all([
      sb.from('jp_learning').select('payload').maybeSingle(),
      sb.from('kana_stats').select('*'),
      sb.from('lessons').select('*').order('day'),
      sb.from('quiz_results').select('*'),
    ]);
    cache.jp = jpR.data?.payload || null;
    cache.kanaRows = kR.data || [];
    cache.lessons = lR.data || [];
    cache.results = rR.data || [];
    try { const jm = await import('./japanese.js?v=2'); jpHoy = await jm.jpToday(sb); } catch(e) {}
  } catch(e) { /* conserva lo que hubiera en caché */ }
}
const jpStats = () => {
  const jp = cache.jp || null;
  const hist = (jp && jp.history) || [];
  return {
    jp, hist,
    sessions: hist.filter(x => x.kind === 'lesson').length,
    mastered: jp ? Object.values(jp.progress || {}).filter(p => p && p.mastered).length : 0,
    total: JP_UNITS.length,
    placement: hist.find(x => x.kind === 'placement') || null,
  };
};
const jpUnitTitle = id => JP_UNITS.find(u => u.id === id)?.title || String(id || '');
const fmtSessionDay = iso => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) +
  ' · ' + new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

function vIdiomas() {
  const lp = langProgress();
  const js = jpStats();
  const kRows = cache.kanaRows || [];
  const kanaOk = kRows.reduce((a, r) => a + (r.ok || 0), 0);
  const progRows = [];
  if (lp.total) progRows.push(`<div class="row" style="margin-top:10px"><div class="grow mut small">Sesiones del plan</div><b>${lp.hechas}/${lp.total}</b></div>
    <div class="bar" style="margin-top:4px"><i style="width:${Math.round(lp.hechas/lp.total*100)}%"></i></div>`);
  progRows.push(`<div class="row" style="margin-top:10px"><div class="grow mut small">Japonés · unidades consolidadas</div><b>${js.mastered}/${js.total}</b></div>
    <div class="bar" style="margin-top:4px"><i style="width:${js.total?Math.round(js.mastered/js.total*100):0}%"></i></div>
    <div class="mut small" style="margin-top:4px">${js.sessions} sesión${js.sessions===1?'':'es'} de japonés completada${js.sessions===1?'':'s'}${js.placement ? ` · prueba de nivel ${js.placement.score}/${js.placement.total}` : ''}</div>`);
  progRows.push(`<div class="row" style="margin-top:10px"><div class="grow mut small">Kana practicado</div><b>${kRows.length} caracteres · ${kanaOk} aciertos</b></div>`);
  return `${header('Idiomas','Japonés e inglés en sesiones cortas. Plan completo en Recursos.')}
  <button class="card clickable rise" data-japanese style="display:block;width:100%;text-align:left;color:inherit;font:inherit;border:1px solid rgba(124,135,248,.3);background:linear-gradient(130deg,var(--acc-soft),var(--surface))"><div class="lesson-row"><span class="lang-badge ja">日</span><div class="grow"><b>Tu japonés, paso a paso</b><div class="meta">Prueba de nivel · lecciones · repasos<br>Tu progreso guardado en tu cuenta</div></div>${ic('chev',16)}</div></button>
  <div class="card rise" style="animation-delay:.05s">
    <div class="row"><span class="link-ic">${ic('target',20)}</span>
    <div class="grow"><b>Tu progreso</b><div class="mut small">Se actualiza solo cada vez que practicas</div></div></div>
    ${progRows.join('')}
  </div>
  ${cache.lessons.length ? `<div class="sec rise" style="animation-delay:.06s"><h2>Continúa por aquí</h2></div>
  ${['ja','en'].map(nextCard).join('')}` : ''}
  <div class="card clickable rise" style="animation-delay:.07s" data-kana><div class="lesson-row">
    <span class="lang-badge ja">あ</span>
    <div class="grow"><b>Práctica de kana</b><div class="meta">Hiragana · lectura en romaji, con registro de fallos</div></div>
    ${ic('chev',16)}</div></div>
  ${cache.lessons.length ? cache.lessons.map((l,i)=>{
    const res = cache.results.find(r=>r.lesson_id===l.id);
    return `<div class="card clickable rise" style="animation-delay:${.08+i*.04}s" data-lesson="${l.id}"><div class="lesson-row">
    <span class="lang-badge ${l.lang==='ja'?'ja':'en'}">${l.lang==='ja'?'あ':'EN'}</span>
    <div class="grow"><b>${esc(l.title)}</b><div class="meta">${l.lang==='ja'?'Japonés':'Inglés'} · sesión ${l.day}</div></div>
    ${res?`<span class="pill ok">${res.score}/${res.total}</span>`:'<span class="pill">pendiente</span>'}</div></div>`;
  }).join('') : (js.hist.length ? `<div class="sec rise" style="animation-delay:.08s"><h2>Tus últimas sesiones</h2></div>` + js.hist.slice(0,8).map((x,i)=>`<div class="card rise" style="animation-delay:${.09+i*.03}s"><div class="lesson-row">
    <span class="lang-badge ja">${x.kind==='placement'?'★':'あ'}</span>
    <div class="grow"><b>${x.kind==='placement'?'Prueba de nivel':esc(jpUnitTitle(x.unit))}</b><div class="meta">Japonés · ${fmtSessionDay(x.at)}</div></div>
    <span class="pill ${x.total && x.score/x.total>=.8?'ok':''}">${x.score}/${x.total}</span></div></div>`).join('') : '<div class="empty">Aún no hay sesiones.</div>')}
  <div class="sec rise" style="animation-delay:.2s"><h2>Recursos</h2></div>
  ${cache.resources.filter(r=>r.section==='idiomas').map((r,i)=>`
    <a class="card link-row clickable rise" style="animation-delay:${.22+i*.04}s" href="${esc(r.url)}" target="_blank" rel="noopener">
    <span class="link-ic">${ic(r.url.includes('youtube')?'video':'link',18)}</span><span class="grow"><b>${esc(r.title)}</b><span>${esc(r.note||'')}</span></span>${ic('chev',16)}</a>`).join('')}`;
}

function vLesson(l) {
  const res = cache.results.find(r=>r.lesson_id===l.id);
  const quiz = l.quiz || [];
  return `<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
    <div class="grow"><h1 class="small-h">${esc(l.title)}</h1><div class="sub">${l.lang==='ja'?'Japonés':'Inglés'} · sesión ${l.day}</div></div></header>
  <div class="card lesson-body rise" style="animation-delay:.05s">${l.body||''}</div>
  ${l.video_url?`<a class="card link-row clickable rise" style="animation-delay:.08s" href="${esc(l.video_url)}" target="_blank" rel="noopener"><span class="link-ic">${ic('video',18)}</span><span class="grow"><b>Vídeo de la sesión</b><span>YouTube</span></span>${ic('chev',16)}</a>`:''}
  ${(l.body||'').includes('class="jp"') ? `<button class="btn block rise" style="animation-delay:.09s;margin-top:10px" id="les-listen">${ic('play',16,2)} Escuchar la lectura en voz alta</button><div id="les-listen-note" class="mut small" style="margin-top:6px"></div>` : ''}
  ${quiz.length?`<div class="sec rise" style="animation-delay:.1s"><h2>Mini-test</h2><span class="count">${quiz.length} preguntas</span></div><div id="quiz">${quiz.map((q,i)=>`
    <div class="card rise" style="animation-delay:${.12+i*.04}s" data-q="${i}"><b>${esc(q.q)}</b><div class="mt">
    ${q.opts.map((o,j)=>`<button class="quiz-opt" data-opt="${j}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
    <button class="btn primary block" id="quiz-send">Corregir</button></div>
    <div id="quiz-out"></div>`:''}
  ${res?`<div class="card mt rise"><div class="row"><span class="link-ic" style="color:var(--ok)">${ic('check',20)}</span><div class="grow"><b>Ya la completaste: ${res.score}/${res.total}</b></div></div></div>`:''}`;
}

/* ---------- Tests ---------- */
const BANKS = CFG.TEST_BANKS || [];
/* Número de unidad del banco (p.ej. "Marketing Digital U07" -> "7"); si no hay, siglas de la asignatura. */
const bankBadge = (bank, subject) => { const m = /U(\d+)/.exec(bank); return m ? String(parseInt(m[1], 10)) : subject.slice(0,3).toUpperCase(); };
const bankStats = bank => {
  const l = cache.testAttempts.filter(a => a.bank===bank);
  if (!l.length) return null;
  const fulls = l.filter(a => a.kind === 'full');
  return { n:l.length, best: fulls.length ? Math.max(...fulls.map(a=>Math.round(100*a.score/a.total))) : null, last:l[0] };
};
const stateByQid = () => { const m = {}; cache.testStates.forEach(s => { m[s.question_id] = s; }); return m; };
const bankProgress = bank => {
  const rows = cache.testStates.filter(s => s.bank === bank);
  if (!rows.length) return null;
  return { vistas: rows.length, dominadas: rows.filter(s => s.last_correct).length };
};
const bankCardMeta = (bank, st) => {
  const parts = [];
  if (st) parts.push(`${st.n} intento${st.n===1?'':'s'}${st.best!=null ? ` · mejor nota ${st.best}%` : ''}`);
  const pr = bankProgress(bank);
  if (pr) parts.push(`${pr.vistas} vistas · ${pr.dominadas} dominadas`);
  return parts.length ? parts.join(' · ') : 'Sin intentos todavía';
};

function vTests(inner = false) {
  const subs = [...new Set(BANKS.map(b=>b.subject))];
  const dueTests = cache.testStates.filter(isDue);
  const savedRun = loadSavedRun();
  return `${inner ? '' : header('Tests','Bancos de tus PDF de estudio')}
  ${savedRun ? `<div class="card rise" style="animation-delay:.03s"><div class="lesson-row">
    <span class="lang-badge ja">▶</span>
    <div class="grow"><b>Test a medias: ${esc(savedRun.bank.bank)}</b>
    <div class="meta">Pregunta ${(savedRun.i||0)+1} de ${savedRun.list.length}${savedRun.sim ? ' · simulacro en curso' : ''} · se retoma donde lo dejaste</div></div></div>
    <div class="row" style="margin-top:10px">
      <button class="btn primary grow" id="ts-resume">Continuar</button>
      <button class="btn ghost grow" id="ts-discard">Descartar</button>
    </div></div>` : ''}
  ${dueTests.length ? `<div class="card clickable rise" style="animation-delay:.04s" id="ts-review"><div class="lesson-row">
    <span class="lang-badge en">🔁</span>
    <div class="grow"><b>Repasar hoy · ${dueTests.length} pregunta${dueTests.length===1?'':'s'}</b>
    <div class="meta">Repaso espaciado: tocan según cuándo las fallaste o las viste por última vez</div></div>
    ${ic('chev',16)}</div></div>` : ''}
  ${subs.map((s,si) => `<div class="mod-head rise" style="animation-delay:${.05+si*.06}s"><h2>${esc(s)}</h2><span class="count">${BANKS.filter(b=>b.subject===s).length} temas</span></div>` +
    BANKS.filter(b=>b.subject===s).map((b,i) => {
      const st = bankStats(b.bank);
      const pr2 = bankProgress(b.bank);
      const total2 = (cache.testCounts||{})[b.bank]||0;
      const done2 = !!(pr2 && total2>0 && pr2.vistas>=total2);
      const perfect = cache.testAttempts.some(a => a.bank===b.bank && a.kind==='full' && a.score===a.total);
      return `<div class="card clickable rise${perfect?' test-perfect':(done2?' test-done':'')}" style="animation-delay:${.08+si*.06+i*.03}s" data-bank="${esc(b.bank)}"><div class="lesson-row">
      <span class="lang-badge ja">${bankBadge(b.bank, b.subject)}</span>
      <div class="grow"><b>${esc(b.bank)}</b>${b.comp?' <span class="pill warn">Complementario</span>':''}
      <div class="meta">${bankCardMeta(b.bank, st)}</div></div>
      ${ic('chev',16)}</div></div>`;
    }).join('')).join('')}
  <div class="mut small center mt">Las preguntas y respuestas vienen de tus PDF de estudio, tal cual.</div>`;
}

function vTestBank(b) {
  const ats = cache.testAttempts.filter(a=>a.bank===b.bank);
  const st = bankStats(b.bank);
  const pr = bankProgress(b.bank);
  const failedEver = cache.testStates.filter(s => s.bank === b.bank && s.fail > 0 && !s.last_correct).length;
  return `<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
  <div class="grow"><h1 class="small-h">${esc(b.bank)}</h1>
  <div class="sub">${esc(b.subject)}${b.comp?' · banco complementario':''}</div></div></header>
  ${THEME_OP?'<div class="ship-space" aria-hidden="true"></div>':''}
  <div class="tiles rise" style="animation-delay:.05s">
    <div class="tile"><div class="lab">${ic('target',14)} Intentos</div><div class="big">${st?st.n:0}</div></div>
    <div class="tile"><div class="lab">${ic('check',14)} Mejor nota</div><div class="big">${st && st.best!=null ? st.best+'<small>%</small>':'—'}</div></div>
  </div>
  <div class="mut small rise" style="animation-delay:.055s;margin:2px 2px 0">La mejor nota solo cuenta los tests completos de 100 preguntas; los cortos y los repasos guardan su historial pero no compiten por esa marca.</div>
  ${pr ? `<div class="card rise" style="animation-delay:.06s">
    <div class="row" style="justify-content:space-between"><b>Progreso del banco</b><span class="mut small">${pr.dominadas} dominadas · ${pr.vistas} vistas</span></div>
    <div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, pr.dominadas)}%"></i></div>
  </div>` : ''}
  ${THEME_OP && st && st.best!=null ? `<div class="wanted rise" style="animation-delay:.07s">
    ${HAT(44,'w-hat')}
    <div style="height:22px"></div>
    <div class="w-title">WANTED</div>
    <div class="w-sub">MEJOR MARCA</div>
    <div class="w-score">${st.best}%</div>
    <div class="w-label">${esc(b.bank)} · tu mejor marca hasta ahora</div>
  </div>` : ''}
  <div class="card rise" style="animation-delay:.08s">
    <b>Preparar test</b>
    <div class="mut small" style="margin:4px 0 10px">Elige la longitud y el modo de corrección. Las preguntas salen en orden aleatorio.</div>
    <div class="chips">${[10,25,50,100].map(n => `<div class="chip ${n===25?'on':''}" data-tcount="${n}">${n===100?'Todas':n}</div>`).join('')}</div>
    <div class="chips" style="margin-top:8px">
      <div class="chip on" data-tcorr="end">Corregir al final</div>
      <div class="chip" data-tcorr="now">Corregir al momento</div>
    </div>
    <div class="mut small" style="margin:2px 0 8px">Al final puedes moverte entre preguntas, cambiar respuestas y dejar alguna en blanco. Al momento es práctica rápida con explicación tras cada una.</div>
    <div class="chips" style="margin-top:8px">
      <div class="chip on" data-ttimer="no">Sin límite</div>
      <div class="chip" data-ttimer="sim">Simulacro ⏱</div>
    </div>
    <div class="mut small" style="margin:2px 0 8px">El simulacro es como el examen: 45 segundos por pregunta en total, corrección al final y, si se acaba el tiempo, se corrige solo. Las que queden en blanco cuentan como falladas.</div>
    <button class="btn primary block" id="bt-start" style="margin-top:6px">${ic('play',17,2)} Empezar test</button>
  </div>
  ${failedEver>0 ? `<button class="btn block rise" style="animation-delay:.11s" id="bt-failed">${ic('sparkle',17,1.8)} Repasar las que te cuestan (${failedEver})</button>` : ''}
  ${(() => { const sums = (cache.testSummaries||[]).filter(x => x.bank === b.bank && x.estado === 'lista');
    return sums.length ? `<div class="sec rise" style="animation-delay:.13s"><h2>Resúmenes del tema</h2><span class="count">${sums.length}</span></div>` +
    sums.slice(0,5).map((sm,i) => `<div class="card clickable rise" style="animation-delay:${.14+i*.04}s" data-sum="${sm.id}"><div class="lesson-row">
      <span class="link-ic">${ic('note',18)}</span>
      <div class="grow"><b>Resumen del ${new Date(sm.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</b><div class="meta">Tema completo, con énfasis en lo que fallaste</div></div>
      ${ic('chev',16)}</div></div>`).join('') : ''; })()}
  <div class="sec rise" style="animation-delay:.14s"><h2>Historial</h2><span class="count">${ats.length}</span></div>
  ${ats.length ? ats.slice(0,10).map((a,i)=>{
      const pct = Math.round(100*a.score/a.total);
      return `<div class="card hist-row rise" style="animation-delay:${.16+i*.04}s"><div class="grow"><b>${a.score}/${a.total}</b><span class="mut small"> · ${new Date(a.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})} ${new Date(a.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span></div><span class="pill ${pct>=80?'ok':pct>=50?'acc':'warn'}">${pct}%</span></div>`;
    }).join('') : '<div class="empty">Aún no hay intentos. El primero empieza arriba.</div>'}`;
}

/* Todas las preguntas de varios bancos, paginando de 1000 en 1000 (tope de PostgREST).
   Cada pagina es un GET cacheable por el service worker: sirve tambien sin conexion. */
async function fetchAllQuestions(bankNames) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('test_questions').select('*').in('bank', bankNames).order('ord').range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/* Recuento de preguntas por banco, paginado para no quedarse en las primeras 1000 filas. */
async function fetchBankCounts() {
  const m = {};
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('test_questions').select('bank').range(from, from + 999);
    if (error) throw error;
    (data || []).forEach(q => { m[q.bank] = (m[q.bank]||0)+1; });
    if (!data || data.length < 1000) break;
  }
  return m;
}

/* Vuelta atras desde un intento: los simulacros vuelven a su apartado, no a un banco. */
const runBack = () => {
  if (trun && trun.bank && trun.bank.simulacro) { tab='estudios'; estudiosSub='simulacros'; render(); }
  else openBank(trun.bank);
};

function vSimulacros() {
  const subs = [...new Set(BANKS.map(b=>b.subject))];
  const savedRun = loadSavedRun();
  const simAts = cache.testAttempts.filter(a => a.kind === 'simulacro');
  return `${savedRun && savedRun.bank && savedRun.bank.simulacro ? `<div class="card rise" style="animation-delay:.03s"><div class="lesson-row">
    <span class="lang-badge ja">▶</span>
    <div class="grow"><b>Simulacro a medias: ${esc(savedRun.bank.bank.replace('Simulacro · ',''))}</b>
    <div class="meta">El reloj sigue corriendo · se retoma donde lo dejaste</div></div></div>
    <div class="row" style="margin-top:10px">
      <button class="btn primary grow" id="ts-resume">Continuar</button>
      <button class="btn ghost grow" id="ts-discard">Descartar</button>
    </div></div>` : ''}
  <div class="card rise" style="animation-delay:.04s"><b>Simulacros de examen</b>
    <div class="mut small" style="margin-top:4px">40 preguntas aleatorias de todas las unidades de la asignatura, 50 minutos y corrección automática al final, con nota y fallos. Puedes hacerlos cuantas veces quieras: cada uno mezcla distinto.${navigator.onLine ? '' : ' Estás sin conexión: solo se pueden empezar si descargaste los datos antes (botón de descarga en Inicio).'}</div></div>
  ${subs.map((s2,si) => {
    const ats = simAts.filter(a => a.bank === 'Simulacro · ' + s2);
    const nBanks = BANKS.filter(b=>b.subject===s2).length;
    const best = ats.length ? Math.max(...ats.map(a=>Math.round(100*a.score/a.total))) : null;
    return `<div class="mod-head rise" style="animation-delay:${.06+si*.05}s"><h2>${esc(s2)}</h2><span class="count">${nBanks} unidades</span></div>
    <div class="card rise" style="animation-delay:${.07+si*.05}s">
      <div class="row"><span class="link-ic">${ic('target',18)}</span>
      <div class="grow"><b>Simulacro de ${esc(s2)}</b><div class="meta">40 preguntas · 50 minutos${best!=null ? ' · mejor nota ' + best + '%' : ''}</div></div></div>
      <button class="btn primary block" style="margin-top:10px" data-sim="${esc(s2)}">${ic('play',17,2)} Nuevo simulacro</button>
    </div>` +
    (ats.length ? ats.slice(0,5).map((a,i)=>{ const pct=Math.round(100*a.score/a.total);
      return `<div class="card hist-row rise" style="animation-delay:${.09+si*.05+i*.03}s"><div class="grow"><b>${a.score}/${a.total}</b> · nota ${(10*a.score/a.total).toFixed(1).replace('.',',')}<span class="mut small"> · ${new Date(a.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})} ${new Date(a.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span></div><span class="pill ${pct>=80?'ok':pct>=50?'acc':'warn'}">${pct}%</span></div>`;
    }).join('') : `<div class="mut small rise" style="animation-delay:.09s;margin:0 2px">Sin simulacros todavía.</div>`);
  }).join('')}
  <div class="mut small center mt">Las preguntas salen del mismo banco de tus tests, sin tocarlo: los simulacros no cambian tus vistas ni dominadas.</div>`;
}

async function startSimulacro(subject) {
  const banks = BANKS.filter(b => b.subject === subject).map(b => b.bank);
  if (!banks.length) return;
  const prev = loadSavedRun();
  if (prev && prev.bank && prev.bank.bank && (prev.i > 0 || (prev.answers||[]).length || Object.keys(prev.resp||{}).length)) {
    if (!confirm(`Tienes un test a medias (${prev.bank.bank}, pregunta ${(prev.i||0)+1} de ${prev.list.length}). ¿Descartarlo y empezar este?`)) return;
    clearSavedRun();
  }
  h(shell(`<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button><div class="grow"><h1 class="small-h">Simulacro · ${esc(subject)}</h1><div class="sub">Cargando preguntas...</div></div></header>`)); bindNav();
  app.querySelector('[data-back]').onclick = () => { tab='estudios'; estudiosSub='simulacros'; render(); };
  let data = null;
  try { data = await fetchAllQuestions(banks); } catch(e) { data = null; }
  if (!data || !data.length) {
    dlToast(navigator.onLine ? 'No se pudieron cargar las preguntas. Inténtalo de nuevo.' : 'Sin conexión: descarga antes los datos con el botón de Inicio', true);
    tab='estudios'; estudiosSub='simulacros'; render(); return;
  }
  const list = kzShuffle([...data]).slice(0, 40);
  finishingRun = false;
  trun = { bank:{ bank:'Simulacro · ' + subject, subject, simulacro:true }, list, i:0, answers:[], locked:false, corr:'end', resp:{},
           sim:{ total: 50*60, deadline: Date.now() + 50*60*1000 } };
  saveRun();
  renderRun();
}

let trun = null;

/* V1.2.0: el intento activo sobrevive a recargas y a irse a background */
const runKey = () => 'salaTestRun:' + (session && session.user && session.user.id ? session.user.id : 'anon');
function saveRun() {
  try {
    if (!trun) return;
    localStorage.setItem(runKey(), JSON.stringify({ v:1, ts: Date.now(), bank: trun.bank,
      list: trun.list, i: trun.i, answers: trun.answers || [], resp: trun.resp || {},
      corr: trun.corr, sim: trun.sim || null, full: !!trun.full, review: !!trun.review }));
  } catch(e) {}
}
function loadSavedRun() {
  try {
    const r = JSON.parse(localStorage.getItem(runKey()) || 'null');
    if (!r || r.v !== 1 || !r.list || !r.list.length) return null;
    return r;
  } catch(e) { return null; }
}
function clearSavedRun() { try { localStorage.removeItem(runKey()); } catch(e) {} }
function restoreRun(r) {
  finishingRun = false;
  trun = { bank: r.bank, list: r.list, i: r.i || 0, answers: r.answers || [], resp: r.resp || {},
           locked: false, corr: r.corr || 'now', sim: r.sim || null, full: !!r.full, review: !!r.review };
  if (trun.corr !== 'end') {
    while (trun.i < trun.list.length && trun.answers.some(a => a.question_id === trun.list[trun.i].id)) trun.i++;
    if (trun.i >= trun.list.length) { finishRun(); return; }
  }
  if (trun.sim && trun.sim.deadline && Date.now() > trun.sim.deadline) { finishRun(); return; }
  renderRun();
}

async function startTestRun(b, opts = {}) {
  const prev = loadSavedRun();
  if (prev && prev.bank && prev.bank.bank && (prev.i > 0 || (prev.answers||[]).length || Object.keys(prev.resp||{}).length)) {
    if (!confirm(`Tienes un test a medias (${prev.bank.bank}, pregunta ${(prev.i||0)+1} de ${prev.list.length}). ¿Descartarlo y empezar este?`)) return;
    clearSavedRun();
  }
  h(shell(`<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button><div class="grow"><h1 class="small-h">${esc(b.bank)}</h1><div class="sub">Cargando preguntas...</div></div></header>`)); bindNav();
  app.querySelector('[data-back]').onclick = () => openBank(b);
  const { data } = await sb.from('test_questions').select('*').eq('bank', b.bank).order('ord');
  let list = data || [];
  if (!list.length) return openBank(b);
  if (opts.mode === 'failed') {
    const m = stateByQid();
    list = list.filter(q => { const s = m[q.id]; return s && s.fail > 0 && !s.last_correct; });
    if (!list.length) return openBank(b);
  }
  if (opts.mode === 'lastFailed') {
    const last = (cache.testAttempts.find(a=>a.bank===b.bank));
    if (!last) return openBank(b);
    const { data:ans } = await sb.from('test_answers').select('question_id').eq('attempt_id', last.id).eq('correct', false);
    const ids = new Set((ans||[]).map(x=>x.question_id));
    list = list.filter(q=>ids.has(q.id));
    if (!list.length) return openBank(b);
  }
  const coversAll = !opts.mode && (!opts.count || opts.count >= list.length) && list.length === 100;
  list = kzShuffle([...list]);
  if (opts.count && list.length > opts.count) list = list.slice(0, opts.count);
  finishingRun = false;
  trun = { bank:b, list, i:0, answers:[], locked:false, corr: opts.sim ? 'end' : (opts.corr || 'now'), resp: {},
           full: coversAll, review: opts.mode === 'failed' || opts.mode === 'lastFailed' };
  if (opts.sim) trun.sim = { total: list.length * 45, deadline: Date.now() + list.length * 45000 };
  saveRun();
  renderRun();
}

function renderRun() {
  if (trun.corr === 'end') return renderRunEnd();
  const q = trun.list[trun.i];
  const n = trun.list.length;
  const num = trun.i + 1;
  h(shell(`
  <header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
    <div class="grow"><h1 class="small-h">${esc(trun.bank.bank)}</h1>
    <div class="sub">Pregunta ${num} de ${n}</div></div>
    <button class="btn ghost" id="run-end">Terminar y corregir</button></header>
  <div class="bar rise" style="animation-delay:.02s;margin:6px 0 16px"><i style="width:${Math.round(100*(num-1)/n)}%"></i></div>
  <div class="card rise" style="animation-delay:.04s">
    <div class="qnum">${esc(trun.bank.bank)} · ${q.qid ? `<span class="mut small">${esc(q.qid)}</span>` : ''}</div>
    <div class="qtext">${esc(q.question)}</div>
    <div class="mt" id="opts">
      ${q.options.map((o,j)=>`<button class="quiz-opt opt" data-opt="${j}"><span class="opt-letter">${'ABCD'[j]}</span><span>${esc(o)}</span></button>`).join('')}
    </div>
    <div id="expl"></div>
  </div>
  <button class="btn ghost block" id="run-save-exit" style="margin-top:10px">Guardar y salir</button>`)); bindNav();
  app.querySelector('[data-back]').onclick = runBack;
  document.getElementById('run-end').onclick = () => {
    if (!trun.answers.length) return runBack();
    if (confirm(`¿Corregir ya con las ${trun.answers.length} respondidas?`)) finishRun();
  };
  document.getElementById('run-save-exit').onclick = () => {
    if (trun.sim && !confirm('El reloj del simulacro sigue corriendo aunque salgas: si llega a cero, se corregirá solo con lo que lleves respondido. ¿Guardar y salir?')) return;
    saveRun(); runBack();
  };
  app.querySelectorAll('#opts .quiz-opt').forEach(btn => btn.onclick = () => {
    if (trun.locked) return;
    trun.locked = true;
    const chosen = +btn.dataset.opt;
    const ok = chosen === q.correct;
    trun.answers.push({ question_id:q.id, chosen, correct:ok });
    saveRun();
    app.querySelectorAll('#opts .quiz-opt').forEach((b,j)=>{
      b.disabled = true;
      if (j===q.correct) b.classList.add('right');
      else if (b===btn) b.classList.add('wrong');
    });
    document.getElementById('expl').innerHTML =
      `<div class="expl-box ${ok?'ok':'bad'}"><b>${ok?'¡Correcta!':'No es esa.'}</b> ${esc(q.explanation||'')}</div>
       <button class="btn primary block" id="run-next">${trun.i+1<trun.list.length?'Siguiente':'Ver resultado'}</button>`;
    document.getElementById('run-next').onclick = () => {
      trun.i++; trun.locked = false;
      saveRun();
      if (trun.i < trun.list.length) renderRun(); else finishRun();
    };
    const main = app.querySelector('main');
    if (main) main.scrollTop = main.scrollHeight;
  });
}

function renderRunEnd() {
  const q = trun.list[trun.i];
  const n = trun.list.length;
  const num = trun.i + 1;
  const answered = Object.keys(trun.resp).length;
  h(shell(`
  <header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
    <div class="grow"><h1 class="small-h">${esc(trun.bank.bank)}</h1>
    <div class="sub">Pregunta ${num} de ${n} · ${answered} respondida${answered===1?'':'s'}</div></div>
    <button class="btn ghost" id="run-end">Corregir</button></header>
  <div class="bar rise" style="animation-delay:.02s;margin:6px 0 16px"><i style="width:${Math.round(100*answered/n)}%"></i></div>
  ${trun.sim ? `<div class="card rise" style="animation-delay:.03s;padding:10px 14px;margin-bottom:12px"><div class="row" style="justify-content:space-between"><span class="mut small">⏱ Tiempo restante</span><b id="sim-clock" style="font-size:18px"></b></div></div>` : ''}
  <div class="card rise" style="animation-delay:.04s">
    <div class="qnum">${esc(trun.bank.bank)}${q.qid ? ` · <span class="mut small">${esc(q.qid)}</span>` : ''}</div>
    <div class="qtext">${esc(q.question)}</div>
    <div class="mt" id="opts">
      ${q.options.map((o,j)=>`<button class="quiz-opt opt ${trun.resp[q.id]===j?'picked':''}" data-opt="${j}"><span class="opt-letter">${'ABCD'[j]}</span><span>${esc(o)}</span></button>`).join('')}
    </div>
    <div class="row" style="margin-top:14px">
      <button class="btn ghost grow" id="run-prev" ${trun.i===0?'disabled':''}>Anterior</button>
      <button class="btn grow" id="run-next2">${trun.i+1<n?'Siguiente':'Corregir'}</button>
    </div>
    <div class="mut small" style="margin-top:10px">Toca una opción para marcarla; tócala de nuevo para dejarla en blanco.</div>
  </div>
  <button class="btn ghost block" id="run-save-exit2" style="margin-top:10px">Guardar y salir</button>`)); bindNav();
  app.querySelector('[data-back]').onclick = runBack;
  const se2 = document.getElementById('run-save-exit2');
  if (se2) se2.onclick = () => {
    if (trun.sim && !confirm('El reloj del simulacro sigue corriendo aunque salgas: si llega a cero, se corregirá solo con lo que lleves respondido. ¿Guardar y salir?')) return;
    saveRun(); runBack();
  };
  document.getElementById('run-end').onclick = () => {
    const blank = n - Object.keys(trun.resp).length;
    if (!Object.keys(trun.resp).length) return runBack();
    if (blank > 0 && !confirm(`Quedan ${blank} sin responder. Cuentan como falladas. ¿Corregir ya?`)) return;
    finishRun();
  };
  app.querySelectorAll('#opts .quiz-opt').forEach(btn => btn.onclick = () => {
    const chosen = +btn.dataset.opt;
    if (trun.resp[q.id] === chosen) delete trun.resp[q.id]; else trun.resp[q.id] = chosen;
    saveRun();
    app.querySelectorAll('#opts .quiz-opt').forEach((b,j) => b.classList.toggle('picked', trun.resp[q.id] === j));
  });
  const pv = document.getElementById('run-prev');
  if (pv) pv.onclick = () => { if (trun.i > 0) { trun.i--; saveRun(); renderRunEnd(); } };
  document.getElementById('run-next2').onclick = () => {
    if (trun.i + 1 < n) { trun.i++; saveRun(); renderRunEnd(); }
    else document.getElementById('run-end').click();
  };
  if (trun.sim) {
    if (!trun.sim.deadline) trun.sim.deadline = Date.now() + trun.sim.total * 1000;
    clearInterval(runTimer);
    const tick = () => {
      const el = document.getElementById('sim-clock');
      if (!el) { clearInterval(runTimer); runTimer = null; return; }
      const left = Math.max(0, Math.round((trun.sim.deadline - Date.now()) / 1000));
      el.textContent = `${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
      if (left < 60) el.style.color = 'var(--warn, #e0a030)';
      if (left <= 0) { clearInterval(runTimer); runTimer = null; finishRun(); }
    };
    tick();
    runTimer = setInterval(tick, 1000);
  }
}

let runTimer = null;
let finishingRun = false;
async function finishRun() {
  if (!trun || finishingRun) return;
  finishingRun = true;
  clearInterval(runTimer); runTimer = null;
  if (trun) clearInterval(trun.timerId);
  saveRun();
  if (trun.corr === 'end') {
    trun.answers = trun.list.map(q => ({ question_id: q.id,
      chosen: (trun.resp[q.id] !== undefined ? trun.resp[q.id] : null),
      correct: trun.resp[q.id] === q.correct }));
  }
  const total = trun.answers.length;
  const score = trun.answers.filter(a=>a.correct).length;
  h(shell(`<header class="top rise"><div class="grow"><h1 class="small-h">${esc(trun.bank.bank)}</h1><div class="sub">Guardando resultado...</div></div></header>`)); bindNav();
  let att = null;
  const kind = trun.bank.simulacro ? 'simulacro' : ((trun.bank.bank === 'Repaso de hoy' || trun.review) ? 'review' : (trun.full && total === 100 ? 'full' : 'custom'));
  const { data:attData } = await sb.from('test_attempts').insert({ bank:trun.bank.bank, total, score, kind }).select().single();
  att = attData;
  if (att) clearSavedRun();
  else finishingRun = false;
  if (att) {
    const rows = trun.answers.map(a=>({ attempt_id:att.id, question_id:a.question_id, chosen:a.chosen, correct:a.correct }));
    if (rows.length) await sb.from('test_answers').insert(rows);
    cache.testAttempts.unshift(att);
    if (trun.bank.simulacro) { await renderResult(score, total, att); return; }
    const m = stateByQid();
    const srows = trun.answers.map(a => {
      const cur = m[a.question_id] || {};
      const streak = a.correct ? (cur.streak||0) + 1 : 0;
      return { question_id: a.question_id, bank: (trun.list.find(q => q.id === a.question_id)||{}).bank || cur.bank || trun.bank.bank,
        seen: (cur.seen||0) + 1, ok: (cur.ok||0) + (a.correct ? 1 : 0), fail: (cur.fail||0) + (a.correct ? 0 : 1),
        last_correct: a.correct, streak, due: a.correct ? srsNext(streak) : srsFailDue(),
        updated_at: new Date().toISOString() };
    });
    if (srows.length) {
      await sb.from('test_question_state').upsert(srows, { onConflict: 'question_id' });
      srows.forEach(r => {
        const i = cache.testStates.findIndex(s => s.question_id === r.question_id);
        if (i >= 0) cache.testStates[i] = r; else cache.testStates.push(r);
      });
    }
  }
  if (att) {
    const { data: srow } = await sb.from('test_summaries').insert({ attempt_id: att.id, bank: trun.bank.bank, estado: 'pendiente' }).select().single();
    if (srow) cache.testSummaries.unshift(srow);
  }
  await renderResult(score, total, att);
}

async function renderResult(score, total, att) {
  const saved = !!att;
  const pct = total ? Math.round(100*score/total) : 0;
  const byId = Object.fromEntries(trun.list.map(q=>[q.id,q]));
  const fails = trun.answers.filter(a=>!a.correct);
  const blanks = trun.answers.filter(a => a.chosen === null || a.chosen === undefined).length;
  h(shell(`
  <header class="top rise"><div class="grow"><h1 class="small-h">${esc(trun.bank.bank)}</h1>
  <div class="sub">Resultado del test</div></div></header>
  <div class="card center rise" style="animation-delay:.04s">
    <div style="font-size:38px;font-weight:800">${score}/${total}</div>
    <div class="mt"><span class="pill ${pct>=80?'ok':pct>=50?'acc':'warn'}">${pct}%</span></div>
    <div class="mut small mt">${score} correcta${score===1?'':'s'} · ${fails.length - blanks} fallada${(fails.length-blanks)===1?'':'s'}${blanks ? ' · ' + blanks + ' en blanco' : ''}</div>
    ${trun.bank.simulacro ? `<div class="mt"><span class="pill ${10*score/total>=5?'ok':'warn'}" style="font-size:15px">Nota: ${(10*score/total).toFixed(1).replace('.',',')} / 10</span></div>` : ''}
    <div class="mut small mt">${saved ? 'Guardado en tu historial' : 'No se pudo guardar en el historial'}</div>
  </div>
  ${att && !trun.bank.simulacro ? `<div class="sec rise" style="animation-delay:.06s"><h2>Resumen del tema</h2></div>
  <div class="card rise" id="resumen-box" style="animation-delay:.07s"><div class="mut small">La solicitud queda guardada como pendiente. La generación de resúmenes todavía no está activada en tu Sala; instalar esta versión no genera resúmenes ni envía avisos.</div></div>` : ''}
  ${fails.length ? `<div class="sec rise" style="animation-delay:.08s"><h2>Falladas${blanks ? ' y en blanco' : ''} (${fails.length})</h2></div>` +
    fails.map((a,i)=>{ const q = byId[a.question_id]; if(!q) return ''; return `
    <div class="card fail-q rise" style="animation-delay:${.1+i*.03}s">
      <div class="qtext small-q">${esc(q.question)}</div>
      <div class="fail-line bad">${(a.chosen===null||a.chosen===undefined) ? 'Tu respuesta: en blanco' : 'Tu respuesta: ' + esc(q.options[a.chosen])}</div>
      <div class="fail-line good">Correcta: ${esc(q.options[q.correct])}</div>
      ${q.explanation?`<div class="mut small mt">${esc(q.explanation)}</div>`:''}
    </div>`;}).join('') : `<div class="card center rise" style="animation-delay:.08s"><b>¡Pleno!</b><div class="mut small mt">Ningún fallo en este test 🎉</div></div>`}
  ${(() => { const m = {}; cache.testStates.forEach(st => { const x = m[st.bank] = m[st.bank] || { f:0 }; if (st.fail > 0 && !st.last_correct) x.f++; });
    const weak = Object.entries(m).filter(([,x]) => x.f > 0).sort((a,b) => b[1].f - a[1].f).slice(0,3);
    return weak.length ? `<div class="sec rise" style="animation-delay:.12s"><h2>Temas que peor llevas</h2></div>
    <div class="card rise" style="animation-delay:.14s">${weak.map(([b,x]) => `<div class="kz-failrow"><span class="grow">${esc(b)}</span><span class="pill no">${x.f} por dominar</span></div>`).join('')}</div>` : ''; })()}
  <div class="row mt">
    ${trun.bank.simulacro ? `<button class="btn grow" id="res-newsim">${ic('refresh',16,2)} Nuevo simulacro</button>` : (fails.length ? `<button class="btn grow" id="res-failed">Repetir ${blanks ? 'falladas y en blanco' : 'falladas'}</button>` : '')}
    <button class="btn primary grow" id="res-back">Volver</button>
  </div>`)); bindNav();
  document.getElementById('res-back').onclick = runBack;
  const rn = document.getElementById('res-newsim');
  if (rn) rn.onclick = () => startSimulacro(trun.bank.subject);
  const rf = document.getElementById('res-failed');
  if (rf) rf.onclick = () => startTestRun(trun.bank, { mode: 'lastFailed', corr: 'now' });
  if (att) {
    const { data:sums } = await sb.from('test_summaries').select('*').eq('attempt_id', att.id).order('created_at', { ascending:false }).limit(1);
    const sm = sums && sums[0];
    const box = document.getElementById('resumen-box');
    if (box && sm && sm.estado === 'lista') box.innerHTML = `<div class="lesson-body">${sm.body}</div>`;
  }
}

async function startReviewRun() {
  const ids = cache.testStates.filter(isDue).map(st => st.question_id);
  if (!ids.length) { tab='estudios'; estudiosSub='tests'; render(); return; }
  h(shell(`<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button><div class="grow"><h1 class="small-h">Repasar hoy</h1><div class="sub">Cargando preguntas...</div></div></header>`)); bindNav();
  app.querySelector('[data-back]').onclick = () => { tab='estudios'; estudiosSub='tests'; render(); };
  const { data } = await sb.from('test_questions').select('*').in('id', ids);
  if (!data || !data.length) { tab='estudios'; estudiosSub='tests'; render(); return; }
  finishingRun = false;
  trun = { bank:{ bank:'Repaso de hoy', subject:'Repaso' }, list: kzShuffle(data), i:0, answers:[], locked:false, corr:'now', resp:{} };
  saveRun();
  renderRun();
}

function openBank(b) {
  h(shell(vTestBank(b))); bindNav();
  app.querySelector('[data-back]').onclick = () => { tab='estudios'; estudiosSub='tests'; render(); };
  let prepCount = 25, prepCorr = 'end', prepSim = false;
  app.querySelectorAll('[data-tcount]').forEach(c => c.onclick = () => {
    prepCount = +c.dataset.tcount;
    app.querySelectorAll('[data-tcount]').forEach(x => x.classList.toggle('on', x === c));
  });
  app.querySelectorAll('[data-tcorr]').forEach(c => c.onclick = () => {
    prepCorr = c.dataset.tcorr;
    app.querySelectorAll('[data-tcorr]').forEach(x => x.classList.toggle('on', x === c));
  });
  app.querySelectorAll('[data-ttimer]').forEach(c => c.onclick = () => {
    prepSim = c.dataset.ttimer === 'sim';
    app.querySelectorAll('[data-ttimer]').forEach(x => x.classList.toggle('on', x === c));
  });
  document.getElementById('bt-start').onclick = () => startTestRun(b, { count: prepCount, corr: prepCorr, sim: prepSim });
  const bf = document.getElementById('bt-failed');
  if (bf) bf.onclick = () => startTestRun(b, { mode: 'failed', corr: 'now' });
  app.querySelectorAll('[data-sum]').forEach(x => x.onclick = () => openSummary(+x.dataset.sum, b));
}

function openSummary(id, b) {
  const sm = (cache.testSummaries||[]).find(x => x.id === id);
  if (!sm) return;
  h(shell(`<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
    <div class="grow"><h1 class="small-h">Resumen del tema</h1>
    <div class="sub">${esc(sm.bank)} · ${new Date(sm.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</div></div></header>
  <div class="card lesson-body rise" style="animation-delay:.05s">${sm.body}</div>`)); bindNav();
  app.querySelector('[data-back]').onclick = () => { if (b) openBank(b); else { tab='estudios'; estudiosSub='tests'; render(); } };
}

/* ---------- Cuenta / Personalización ---------- */
const PERS_ESTADO = { pendiente:['Pendiente','warn'], en_proceso:['En proceso','acc'], aplicada:['Aplicada','ok'], descartada:['Descartada',''] };

function vCuenta() {
  const email = session?.user?.email || '';
  const ocultos = userHiddenTabs();
  const cfgTabs = ALL_TABS.filter(([id]) => id !== 'hoy' && !(CFG.HIDDEN_TABS || []).includes(id));
  return `<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
  <div class="grow"><h1 class="small-h">Configuración</h1><div class="sub">${esc(email)}</div></div></header>

  <div class="sec rise" style="animation-delay:.02s"><h2>Tu Sala</h2></div>
  <div class="card rise" style="animation-delay:.04s">
    <div class="lab" style="margin-bottom:8px">Nombre visible</div>
    <div style="display:flex;gap:8px">
      <input id="cfg-name" class="grow" placeholder="Tu nombre" value="${esc(CFG.OWNER_NAME || '')}">
      <button class="btn primary" id="cfg-name-save">${ic('check',16,2.2)} Guardar</button>
    </div>
    <div class="mut small" style="margin-top:8px">Aparece en el saludo de Inicio. Se guarda en este dispositivo.</div>
  </div>
  <div class="card rise" style="animation-delay:.06s">
    <div class="lab" style="margin-bottom:8px">Apartados visibles</div>
    <div class="chips">${cfgTabs.map(([id,,label]) => `<div class="chip ${ocultos.includes(id) ? '' : 'on'}" data-cfg-tab="${id}">${label}</div>`).join('')}</div>
    <div class="mut small" style="margin-top:8px">Toca un apartado para mostrarlo u ocultarlo en la barra. Se guarda en este dispositivo.</div>
  </div>

  <div class="sec rise" style="animation-delay:.08s"><h2>Personalización</h2></div>
  <div class="card rise" style="animation-delay:.06s">
    <div class="mut small" style="margin-bottom:10px">Pide cómo quieres tu Sala: escribe una petición o sube una imagen de referencia. Tu asistente la revisa periódicamente, te propone el cambio y, solo si lo apruebas, lo aplica. Nada cambia sin tu OK.</div>
    <textarea id="pers-text" placeholder="Ej.: quiero un fondo con los barcos de mi anime favorito, tonos oscuros..." style="min-height:90px"></textarea>
    <div style="display:flex;gap:8px">
      <button class="btn primary grow" id="pers-send">${ic('check',16,2.2)} Enviar petición</button>
      <button class="btn" id="pers-img-btn">${ic('plus',16,2)} Imagen</button>
      <input type="file" id="pers-file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden">
    </div>
    <div id="pers-upmsg" class="mut small" style="margin-top:6px"></div>
  </div>

  ${cache.pers.length ? cache.pers.map((p,i) => {
    const [lab, cls] = PERS_ESTADO[p.estado] || [p.estado, ''];
    const cuando = new Date(p.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
    return `<div class="card rise" style="animation-delay:${.08+i*.04}s">
      <div class="row" style="align-items:flex-start">
        ${p.tipo==='imagen' && persSigned[p.imagen_path]
          ? `<img src="${persSigned[p.imagen_path]}" alt="referencia" style="width:56px;height:56px;object-fit:cover;border-radius:12px;flex:none">`
          : `<span class="link-ic" style="width:40px;height:40px">${ic(p.tipo==='imagen'?'sparkle':'note',17)}</span>`}
        <div class="grow">
          <b style="font-size:14px">${p.tipo==='imagen' ? 'Imagen de referencia' : esc(p.texto||'')}</b>
          <div class="mut small">${cuando}${p.activa?' · referencia activa':''}${p.nota?' · '+esc(p.nota):''}</div>
        </div>
        <span class="pill ${cls}">${lab}</span>
      </div>
      <div class="row" style="margin-top:10px;gap:8px">
        ${p.activa ? '' : `<button class="btn ghost" data-pers-activa="${p.id}">Usar esta referencia</button>`}
        <button class="btn danger-ghost" data-pers-del="${p.id}" style="margin-left:auto">${ic('trash',15)}</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Aún no has pedido ninguna personalización.</div>'}

  <div class="sec rise" style="animation-delay:.08s"><h2>Notificaciones</h2></div>
  <div class="card rise" style="animation-delay:.09s">
    <div class="mut small" style="margin-bottom:10px">Avisos de tu Sala: recordatorios de estudio, exámenes y novedades. En iPhone hace falta tener la app instalada en pantalla de inicio (Safari → Compartir → Añadir a pantalla de inicio) y abrirla desde el icono.</div>
    <div class="row"><button class="btn primary grow" id="push-enable">Activar notificaciones</button>
    <button class="btn" id="push-test" style="display:none">Probar</button></div>
    <div id="push-msg" class="mut small" style="margin-top:6px"></div>
  </div>

  <div class="sec rise" style="animation-delay:.09s"><h2>Actualización</h2></div>
  <div class="card rise" style="animation-delay:.1s">
    <div class="mut small" style="margin-bottom:10px">¿No ves los últimos cambios? Limpia la caché y recarga la app con la última versión. Tu sesión y tus datos no se borran.</div>
    <button class="btn primary block" id="btn-actualizar">${ic('refresh',16,2.2)} Actualizar</button>
    <div id="upd-msg" class="mut small" style="margin-top:6px"></div>
  </div>

  <div class="sec rise" style="animation-delay:.1s"><h2>Info</h2></div>
  <div class="card rise" style="animation-delay:.12s">
    <div class="row"><b class="grow" style="font-size:14px">Mi Sala</b><span class="pill acc">V1.5.0</span></div>
    <div class="mut small" style="margin-top:6px">Tus peticiones e imágenes son privadas: las ves tú y el asistente que tú autorices, y solo se usan para personalizar tu Sala.</div>
  </div>`;
}

/* ---------- Notificaciones push ---------- */
const b64ToUint8 = b64 => { const pad='='.repeat((4-b64.length%4)%4); const raw=atob((b64+pad).replace(/-/g,'+').replace(/_/g,'/')); return Uint8Array.from([...raw].map(c=>c.charCodeAt(0))); };

async function pushState() {
  if (!('Notification' in window)) return { ok:false, reason:'Este navegador no admite notificaciones.' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return { ok:false, reason:'En iPhone las notificaciones solo llegan con la app instalada en pantalla de inicio. Ábrela desde su icono (si no la tienes: Safari → Compartir → Añadir a pantalla de inicio).' };
  if (Notification.permission==='denied') return { ok:false, reason:'Tienes las notificaciones bloqueadas para esta app. Actívalas en Ajustes del dispositivo y vuelve aquí.' };
  let sub=null;
  try { const reg=await navigator.serviceWorker.getRegistration(); sub=reg && await reg.pushManager.getSubscription(); } catch(_){}
  return { ok:true, granted: Notification.permission==='granted', sub };
}

async function enablePush(msgEl) {
  const st = await pushState();
  if (!st.ok) { msgEl.textContent = st.reason; return false; }
  msgEl.textContent = 'Activando...';
  const perm = await Notification.requestPermission();
  if (perm!=='granted') { msgEl.textContent='Sin el permiso no puedo avisarte. Si lo denegaste, cámbialo en Ajustes y vuelve.'; return false; }
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey: b64ToUint8(CFG.VAPID_PUBLIC) });
    const j = sub.toJSON();
    const { error } = await sb.from('push_subscriptions').upsert(
      { endpoint:j.endpoint, p256dh:j.keys.p256dh, auth:j.keys.auth, user_agent:navigator.userAgent.slice(0,200) },
      { onConflict:'endpoint' });
    if (error) { msgEl.textContent='No se pudo guardar la suscripción. Inténtalo de nuevo.'; return false; }
    msgEl.textContent='Listo: notificaciones activadas en este dispositivo.';
    return true;
  } catch(e) {
    console.error('push', e);
    msgEl.textContent='No se pudo activar. En iPhone, asegúrate de abrir la Sala desde el icono instalado en pantalla de inicio.';
    return false;
  }
}

function openCuenta() {
  h(shell(vCuenta())); bindNav();
  app.querySelector('[data-back]').onclick = () => { tab='hoy'; render(); };
  const cfgName = document.getElementById('cfg-name');
  document.getElementById('cfg-name-save').onclick = () => {
    const v = (cfgName.value || '').trim();
    try { if (v) localStorage.setItem('sala_name', v); else localStorage.removeItem('sala_name'); } catch(e) {}
    CFG.OWNER_NAME = v || (window.SALA_CONFIG || {}).OWNER_NAME;
    render();
  };
  app.querySelectorAll('[data-cfg-tab]').forEach(c => c.onclick = () => {
    const id = c.dataset.cfgTab;
    let a = userHiddenTabs();
    a = a.includes(id) ? a.filter(x => x !== id) : [...a, id];
    try { localStorage.setItem('sala_hidden_tabs', JSON.stringify(a)); } catch(e) {}
    openCuenta();
  });
  const pushMsg = document.getElementById('push-msg');
  const pushBtn = document.getElementById('push-enable');
  const pushTest = document.getElementById('push-test');
  (async () => {
    const st = await pushState();
    if (!st.ok) { pushMsg.textContent = st.reason; }
    else if (st.sub) { pushMsg.textContent = 'Activadas en este dispositivo.'; pushBtn.textContent='Reactivar'; pushTest.style.display=''; }
  })();
  pushBtn.onclick = async () => { pushBtn.disabled=true; const ok=await enablePush(pushMsg); pushBtn.disabled=false; if (ok) pushTest.style.display=''; };
  pushTest.onclick = async () => {
    pushTest.disabled=true; pushMsg.textContent='Enviando prueba...';
    try {
      const { error } = await sb.functions.invoke('push-send', { body:{ title:'Mi Sala', body:'¡Funciona! Ya te llegan las notificaciones.' } });
      pushMsg.textContent = error ? 'Falló el envío. Inténtalo de nuevo.' : 'Enviada. Te debería llegar en unos segundos.';
    } catch(_) { pushMsg.textContent='Falló el envío. Inténtalo de nuevo.'; }
    pushTest.disabled=false;
  };
  document.getElementById('pers-send').onclick = async () => {
    const ta = document.getElementById('pers-text');
    const texto = ta.value.trim();
    if (!texto) return;
    const msg = document.getElementById('pers-upmsg');
    const { data, error } = await sb.from('personalizacion').insert({ tipo:'prompt', texto }).select().single();
    if (error || !data) { msg.textContent = 'No se pudo guardar la petición. Inténtalo de nuevo.'; return; }
    cache.pers.unshift(data); ta.value=''; msg.textContent=''; openCuenta();
  };
  const fileInp = document.getElementById('pers-file');
  document.getElementById('pers-img-btn').onclick = () => fileInp.click();
  fileInp.onchange = async () => {
    const f = fileInp.files && fileInp.files[0];
    if (!f) return;
    const msg = document.getElementById('pers-upmsg');
    if (!['image/png','image/jpeg','image/webp','image/gif'].includes(f.type)) { msg.textContent = 'Solo se admiten imágenes PNG, JPG, WebP o GIF.'; fileInp.value=''; return; }
    if (f.size > 5*1024*1024) { msg.textContent = 'La imagen pesa más de 5 MB. Prueba con una más ligera.'; fileInp.value=''; return; }
    msg.textContent = 'Subiendo imagen...';
    const safe = f.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-60);
    const path = session.user.id + '/' + Date.now() + '-' + safe;
    const { error: upErr } = await sb.storage.from('personalizacion').upload(path, f, { cacheControl:'3600', upsert:false });
    if (upErr) { msg.textContent = 'No se pudo subir la imagen.'; fileInp.value=''; return; }
    const { data, error: insErr } = await sb.from('personalizacion').insert({ tipo:'imagen', imagen_path:path, texto:f.name }).select().single();
    if (insErr || !data) {
      const { error: rmErr } = await sb.storage.from('personalizacion').remove([path]);
      msg.textContent = rmErr
        ? 'No se pudo registrar la imagen y tampoco limpiar el archivo subido. Avisa a tu asistente para revisarlo.'
        : 'No se pudo registrar la imagen. Inténtalo de nuevo.';
      fileInp.value=''; return;
    }
    cache.pers.unshift(data);
    const { data: su } = await sb.storage.from('personalizacion').createSignedUrl(path, 3600);
    if (su && su.signedUrl) persSigned[path] = su.signedUrl;
    msg.textContent = ''; fileInp.value='';
    openCuenta();
  };
  const updBtn = document.getElementById('btn-actualizar');
  if (updBtn) updBtn.onclick = async () => {
    const msg = document.getElementById('upd-msg');
    updBtn.disabled = true;
    if (msg) msg.textContent = 'Limpiando caché y recargando...';
    const limpiar = (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
      } catch (e) { /* aunque falle la limpieza, recargamos igual */ }
    })();
    await Promise.race([limpiar, new Promise(r => setTimeout(r, 2500))]);
    location.reload();
  };
  app.querySelectorAll('[data-pers-activa]').forEach(b => b.onclick = async () => {
    const id = b.dataset.persActiva;
    const { error: e1 } = await sb.from('personalizacion').update({ activa:false, updated_at:new Date().toISOString() }).eq('activa', true);
    const { error: e2 } = await sb.from('personalizacion').update({ activa:true, updated_at:new Date().toISOString() }).eq('id', id);
    if (e1 || e2) { alert('No se pudo marcar la referencia. Inténtalo de nuevo.'); return; }
    cache.pers.forEach(p => p.activa = (p.id===id));
    openCuenta();
  });
  app.querySelectorAll('[data-pers-del]').forEach(b => b.onclick = async () => {
    if (!confirm('¿Borrar esta petición?')) return;
    const id = b.dataset.persDel;
    const p = cache.pers.find(x=>x.id===id);
    if (p && p.imagen_path) {
      const { error: rmErr } = await sb.storage.from('personalizacion').remove([p.imagen_path]);
      if (rmErr) { alert('No se pudo borrar la imagen del almacenamiento; la petición sigue ahí para reintentar.'); return; }
    }
    const { error: delErr } = await sb.from('personalizacion').delete().eq('id', id);
    if (delErr) { alert('No se pudo borrar la petición. Inténtalo de nuevo.'); return; }
    cache.pers = cache.pers.filter(x=>x.id!==id);
    delete persSigned[p && p.imagen_path];
    openCuenta();
  });
}

/* ---------- Lógica ---------- */

function lazyModule(file, exportName, label) {
  return async function () {
    h(shell(`<div class="mut center" style="padding:60px 0">Cargando ${label}...</div>`));
    bindNav();
    try {
      const mod = await import(`./${file}?v=5`);
      await mod[exportName]({ sb, app, session, shell, bindNav, ic, esc });
    } catch (e) {
      console.error(label + ' module could not open', e);
      h(shell(`<div class="empty" style="margin-top:40px">${ic('sparkle',26)}<div>No se ha podido abrir ${label}. Revisa tu conexión e inténtalo de nuevo.</div></div>`));
      bindNav();
    }
  };
}
const openDinero = lazyModule('dinero.js', 'openDinero', 'dinero');
const openComida = lazyModule('comida.js', 'openComida', 'comida');
const openDeporte = lazyModule('deporte.js', 'openDeporte', 'deporte');

async function openMusica() {
  h(shell(`<div class="mut center" style="padding:60px 0">Cargando música...</div>`));
  bindNav();
  try {
    const { openMusic } = await import('./music.js?v=4');
    await openMusic({ sb, app, session, shell, bindNav, ic, esc });
  } catch (e) {
    console.error('Music module could not open', e);
    h(shell(`<div class="empty" style="margin-top:40px">${ic('mic',26)}<div>No se ha podido abrir Música. Revisa tu conexión e inténtalo de nuevo.</div></div>`));
    bindNav();
  }
}

let lastRenderTab = null;
async function render() {
  document.body.classList.add('logged-in');
  if (tab==='lesson') return;
  const sameTab = (lastRenderTab === tab);
  lastRenderTab = tab;
  const prevMain = app.querySelector('main');
  const keepY = sameTab && prevMain ? prevMain.scrollTop : 0;
  if (tab==='hoy' && cal.connected===null && !cal.busy) agendaLoad(true);
  let content = '';
  if (tab==='hoy') content = vHoy();
  else if (tab==='agenda') content = vAgenda();
  else if (tab==='tareas') content = vTareas();
  else if (tab==='apuntes') content = vApuntes();
  else if (tab==='estudios') content = vEstudios();
  else if (tab==='tests') { tab='estudios'; estudiosSub='tests'; content = vEstudios(); }
  else if (tab==='idiomas') content = vIdiomas();
  else if (tab==='musica') return openMusica();
  else if (tab==='dinero') return openDinero();
  else if (tab==='comida') return openComida();
  else if (tab==='deporte') return openDeporte();
  else if (tab==='cuenta') return openCuenta();
  h(shell(content)); bindNav(); bindActions(); bindAgenda();
  const nm = app.querySelector('main');
  if (nm) nm.scrollTop = keepY;
  if (sameTab) app.querySelectorAll('.rise').forEach(e => { e.style.animation = 'none'; });
}

function bindActions() {
  app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { tab=b.dataset.go; render(); });
  const ref = document.getElementById('btn-refresh');
  if (ref) { ref.disabled = !navigator.onLine; ref.onclick = async () => {
    if (!navigator.onLine) { syncOnline(); return; }
    ref.disabled = true;
    try { if (session) await loadAll(); } catch(e) {}
    try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch(e) {}
    location.reload();
  }; }
  const dlb = document.getElementById('btn-offline');
  if (dlb) { dlb.disabled = !navigator.onLine; dlb.onclick = () => prefetchOffline(dlb); }
  const out = document.getElementById('btn-out');
  if (out) out.onclick = async () => { await sb.auth.signOut(); };
  const cta = document.getElementById('btn-cuenta');
  if (cta) cta.onclick = () => { tab='cuenta'; render(); };
  app.querySelectorAll('[data-cuenta]').forEach(b => b.onclick = () => { tab='cuenta'; render(); });
  app.querySelectorAll('[data-task]').forEach(b => b.onclick = async () => {
    const t = cache.tasks.find(x=>x.id===b.dataset.task);
    t.done=!t.done; render();
    await sb.from('tasks').update({done:t.done}).eq('id',t.id);
  });
  app.querySelectorAll('[data-del-task]').forEach(b => b.onclick = async () => {
    await sb.from('tasks').delete().eq('id',b.dataset.delTask);
    cache.tasks = cache.tasks.filter(x=>x.id!==b.dataset.delTask); render();
  });
  app.querySelectorAll('[data-topic]').forEach(b => b.onclick = async () => {
    const t = cache.topics.find(x=>x.id===b.dataset.topic);
    t.done=!t.done; render();
    await sb.from('topics').update({done:t.done}).eq('id',t.id);
  });
  app.querySelectorAll('[data-pdf]').forEach(b => b.onclick = () => {
    const t = cache.topics.find(x=>x.id===b.dataset.pdf);
    if (t) openTopicPdf(t);
  });
  app.querySelectorAll('[data-est]').forEach(c => c.onclick = () => {
    if (estudiosSub !== c.dataset.est) { estudiosSub = c.dataset.est; render(); }
  });
  app.querySelectorAll('#nt-chips .chip').forEach(c => c.onclick = () => {
    app.querySelectorAll('#nt-chips .chip').forEach(x=>x.classList.remove('on'));
    c.classList.add('on');
  });
  const addBtn = document.getElementById('nt-add');
  if (addBtn) addBtn.onclick = async () => {
    const title = document.getElementById('nt-title').value.trim();
    if (!title) return;
    const area = (app.querySelector('#nt-chips .chip.on')||{}).dataset?.area || 'personal';
    const { data } = await sb.from('tasks').insert({title,area}).select().single();
    if (data) cache.tasks.unshift(data); render();
  };
  const ntInput = document.getElementById('nt-title');
  if (ntInput) ntInput.onkeydown = e => { if(e.key==='Enter') addBtn.click(); };
  const newNote = document.getElementById('note-new');
  if (newNote) newNote.onclick = () => openNote(null);
  app.querySelectorAll('[data-note]').forEach(b => b.onclick = () => openNote(cache.notes.find(x=>x.id===b.dataset.note)));
  app.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => openLesson(cache.lessons.find(x=>x.id===b.dataset.lesson)));
  app.querySelectorAll('[data-kana]').forEach(b => b.onclick = openKana);
  app.querySelectorAll('[data-japanese]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    try {
      const { openJapanese } = await import('./japanese.js?v=2');
      await openJapanese({sb,app,shell,bindNav,onBack:async()=>{ await refreshLang(); tab='idiomas'; render(); }});
    } catch (e) {
      console.error('Japanese module could not open', e);
      alert('No se ha podido abrir japonés. Revisa tu conexión e inténtalo de nuevo.');
      b.disabled = false;
    }
  });
  app.querySelectorAll('[data-bank]').forEach(b => b.onclick = () => openBank(BANKS.find(x=>x.bank===b.dataset.bank)));
  app.querySelectorAll('[data-sim]').forEach(b => b.onclick = () => startSimulacro(b.dataset.sim));
  const tsr = document.getElementById('ts-review');
  if (tsr) tsr.onclick = () => startReviewRun();
  const tsResume = document.getElementById('ts-resume');
  if (tsResume) tsResume.onclick = () => { const r = loadSavedRun(); if (r) restoreRun(r); };
  const tsDiscard = document.getElementById('ts-discard');
  if (tsDiscard) tsDiscard.onclick = () => { if (confirm('¿Descartar el test a medias? Se perderán las respuestas no corregidas.')) { clearSavedRun(); render(); } };
}

function openNote(n) {
  const isNew = !n;
  n = n || {id:null,title:'',body:'',tags:''};
  h(shell(vApunte(n))); bindNav();
  app.querySelector('[data-back]').onclick = render;
  document.getElementById('ed-save').onclick = async () => {
    const row = { title: document.getElementById('ed-title').value.trim(),
                  tags: document.getElementById('ed-tags').value.trim(),
                  body: document.getElementById('ed-body').value,
                  updated_at: new Date().toISOString() };
    if (isNew) { const {data} = await sb.from('notes').insert(row).select().single(); if(data) cache.notes.unshift(data); }
    else { await sb.from('notes').update(row).eq('id',n.id); Object.assign(n,row);
           cache.notes.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)); }
    tab='apuntes'; render();
  };
  const del = document.getElementById('ed-del');
  if (del) del.onclick = async () => {
    if (!confirm('¿Borrar este apunte?')) return;
    await sb.from('notes').delete().eq('id',n.id);
    cache.notes = cache.notes.filter(x=>x.id!==n.id); tab='apuntes'; render();
  };
}

function openLesson(l) {
  h(shell(vLesson(l))); bindNav();
  app.querySelector('[data-back]').onclick = () => { tab='idiomas'; render(); };
  const listen = document.getElementById('les-listen');
  if (listen) listen.onclick = () => {
    const lang = l.lang === 'ja' ? 'ja-JP' : 'en-US';
    const note = document.getElementById('les-listen-note');
    if (!voiceFor(lang.slice(0,2))) {
      if (note) note.textContent = 'Este navegador no tiene voz ' + (l.lang==='ja'?'japonesa':'inglesa') + ' instalada; sin ella no puede sonar. Suele venir con el sistema del móvil.';
      return;
    }
    const parts = [...app.querySelectorAll('.lesson-body .jp')].map(x => x.textContent.trim()).filter(Boolean);
    if (!parts.length) return;
    listen.disabled = true;
    speakText(parts.join('. '), lang);
    setTimeout(() => { listen.disabled = false; }, 2500);
  };
  const send = document.getElementById('quiz-send');
  if (!send) return;
  send.onclick = async () => {
    const quiz = l.quiz||[]; let score = 0;
    quiz.forEach((q,i)=>{
      const card = app.querySelector(`[data-q="${i}"]`);
      const sel = card.querySelector('.quiz-opt.picked');
      card.querySelectorAll('.quiz-opt').forEach((b,j)=>{
        if (j===q.a) b.classList.add('right');
        else if (b.classList.contains('picked')) b.classList.add('wrong');
        b.disabled = true;
      });
      if (sel && +sel.dataset.opt===q.a) score++;
    });
    send.disabled = true;
    await sb.from('quiz_results').insert({lesson_id:l.id, score, total:quiz.length});
    cache.results.push({lesson_id:l.id, score, total:quiz.length});
    const nx = nextFor(l.lang);
    document.getElementById('quiz-out').innerHTML =
      `<div class="card center mt"><div style="font-size:30px;font-weight:800">${score}/${quiz.length}</div><div class="mut small">${score===quiz.length?'¡Perfecto! 🎉':'Repasa los fallos arriba y mañana seguimos 💪'}</div></div>` +
      (nx ? `<button class="btn primary block" id="quiz-next" style="margin-top:10px">Siguiente sesión: ${esc(nx.lesson.title)}</button>`
          : `<div class="card center mt"><div class="mut small">Tanda completada. Tu asistente prepara la siguiente tanda y aparecerá aquí cuando esté lista.</div></div>`);
    const qn = document.getElementById('quiz-next');
    if (qn) qn.onclick = () => openLesson(nx.lesson);
  };
  app.querySelectorAll('.quiz-opt').forEach(b => b.onclick = () => {
    b.parentElement.querySelectorAll('.quiz-opt').forEach(x=>x.classList.remove('picked'));
    b.classList.add('picked');
  });
}

function renderLogin(msg) {
  document.body.classList.remove('logged-in');
  h(`<main><div class="login-wrap">
  <div class="logo-mark"><svg width="34" height="34" viewBox="0 0 64 64" fill="none"><path d="M23 45V21.5L32 32l9-10.5V45" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
  <h1>Mi Sala</h1>
  <div class="sub">Tus tareas, apuntes, estudios e idiomas.<br>Solo para ti.</div>
  <div class="login-card">
    <label>Email</label><input id="li-email" type="email" autocomplete="email" placeholder="tu@gmail.com">
    <label>Contraseña</label><input id="li-pass" type="password" autocomplete="current-password" placeholder="••••••••">
    <button class="btn primary block mt" id="li-in">Entrar</button>
    ${msg?`<div class="notice">${esc(msg)}</div>`:''}
  </div>
  <div class="footnote">Acceso privado</div></div></main>`);
  const doIn = async () => {
    const email = document.getElementById('li-email').value.trim();
    const password = document.getElementById('li-pass').value;
    const btn = document.getElementById('li-in');
    btn.disabled = true; btn.textContent = 'Entrando...';
    const { error } = await sb.auth.signInWithPassword({email,password});
    if (error) { btn.disabled = false; btn.textContent = 'Entrar'; renderLogin('No cuadra: revisa email y contraseña.'); }
  };
  document.getElementById('li-in').onclick = doIn;
  document.getElementById('li-pass').onkeydown = e => { if(e.key==='Enter') doIn(); };
  document.getElementById('li-email').onkeydown = e => { if(e.key==='Enter') document.getElementById('li-pass').focus(); };
}

/* Estado de conexion: aviso claro sin conexion, boton Actualizar desactivado y resincronizacion al volver la red. */
const syncOnline = () => {
  document.body.classList.toggle('offline', !navigator.onLine);
  const r = document.getElementById('btn-refresh'); if (r) r.disabled = !navigator.onLine;
  const d = document.getElementById('btn-offline'); if (d) d.disabled = !navigator.onLine;
};
window.addEventListener('offline', syncOnline);
window.addEventListener('online', async () => { syncOnline(); if (session) { try { await loadAll(); render(); } catch(e) {} } });

async function boot() {
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) {
    h(`<main><div class="login-wrap"><div class="logo-mark"><svg width="34" height="34" viewBox="0 0 64 64" fill="none"><path d="M23 45V21.5L32 32l9-10.5V45" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><h1>Mi Sala</h1>
    <div class="notice">Falta config.js o está incompleto. Revisa el README.</div></div></main>`);
    return;
  }
  h(`<main><div class="login-wrap"><div class="logo-mark"><svg width="34" height="34" viewBox="0 0 64 64" fill="none"><path d="M23 45V21.5L32 32l9-10.5V45" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><h1>Mi Sala</h1><div class="sub center">Cargando...</div></div></main>`);
  sb = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  sb.auth.onAuthStateChange(async (_e, s) => {
    session = s;
    if (session) { await loadAll(); const sr = loadSavedRun(); if (sr) { if (!trun) restoreRun(sr); } else { tab='hoy'; render(); } }
    else { trun = null; clearInterval(runTimer); runTimer = null; renderLogin(); }
  });
  const { data } = await sb.auth.getSession();
  if (!data.session) renderLogin();
}

/* ---------- Buscador MiSala (Cmd/Ctrl+K): filtra datos ya cargados en el cliente ---------- */
let sbpEl = null, sbpSel = 0, sbpItems = [];
function sbpIndex() {
  const ix = [];
  tabsVisibles().forEach(([id,icn,label]) => ix.push({t:label, s:'Sección', ic:icn, go:id}));
  if (!tabsVisibles().some(([id]) => id === 'tests')) ix.push({t:'Tests', s:'Sección · Estudios', ic:'target', go:'estudios', sub:'tests'});
  (cache.topics||[]).forEach(t => ix.push({t:t.title, s:'Estudios' + (t.module ? ' · '+t.module : ''), ic:'cap', go:'estudios'}));
  (cache.lessons||[]).forEach(l => ix.push({t:l.title, s:(l.lang==='ja'?'Japonés':'Inglés')+' · sesión '+l.day, ic:'globe', go:'idiomas'}));
  const ayer = new Date(Date.now()-864e5);
  (cal.events||[]).filter(ev => { try { return evStart(ev) >= ayer; } catch(e){ return false; } }).slice(0,40)
    .forEach(ev => ix.push({t:ev.summary||'(sin título)', s:'Agenda · '+evStart(ev).toLocaleDateString('es-ES',{day:'numeric',month:'short'}), ic:'calendar', go:'agenda'}));
  return ix;
}
function openSearch() {
  if (!session) return;
  if (!sbpEl) {
    sbpEl = document.createElement('div');
    sbpEl.className = 'sbp-overlay';
    sbpEl.style.display = 'none';
    sbpEl.innerHTML = `<div class="sbp"><input id="sbp-in" placeholder="Buscar en MiSala..." autocomplete="off"><div class="sbp-list"></div></div>`;
    document.body.appendChild(sbpEl);
    sbpEl.addEventListener('click', e => { if (e.target === sbpEl) closeSearch(); });
    const inp = sbpEl.querySelector('#sbp-in');
    inp.addEventListener('input', () => sbpRender(inp.value));
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sbpSel = Math.min(sbpSel+1, sbpItems.length-1); sbpPaint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sbpSel = Math.max(sbpSel-1, 0); sbpPaint(); }
      else if (e.key === 'Enter') { e.preventDefault(); sbpGo(sbpSel); }
    });
  }
  sbpEl.style.display = 'flex';
  const inp = sbpEl.querySelector('#sbp-in');
  inp.value = ''; sbpRender('');
  setTimeout(() => inp.focus(), 30);
}
function closeSearch() { if (sbpEl) sbpEl.style.display = 'none'; }
function sbpRender(q) {
  q = (q||'').trim().toLowerCase();
  const ix = sbpIndex();
  sbpItems = (q ? ix.filter(x => (x.t+' '+x.s).toLowerCase().includes(q)) : ix).slice(0,12);
  sbpSel = 0; sbpPaint();
}
function sbpPaint() {
  const list = sbpEl.querySelector('.sbp-list');
  list.innerHTML = sbpItems.length
    ? sbpItems.map((x,i) => `<button class="sbp-item${i===sbpSel?' sel':''}" data-sbp="${i}"><span class="sic">${ic(x.ic,16)}</span><span class="grow"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span></button>`).join('')
    : `<div class="sbp-empty">Sin resultados</div>`;
  list.querySelectorAll('[data-sbp]').forEach(b => b.onclick = () => sbpGo(+b.dataset.sbp));
}
function sbpGo(i) {
  const x = sbpItems[i]; if (!x) return;
  closeSearch(); tab = x.go; if (x.sub) estudiosSub = x.sub; render();
}
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
  else if (e.key === 'Escape') closeSearch();
});

const sbs = document.getElementById('sb-search');
if (sbs) sbs.onclick = openSearch;

boot();
