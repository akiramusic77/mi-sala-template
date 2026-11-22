/* ---------- Música: stats del artista + panel del manager ---------- */
/* Módulo cargado bajo demanda desde app.js (openMusica). */

const PLATFORMS = {
  spotify:   { name: 'Spotify',   color: '#1DB954', primary: 'oyentes' },
  apple:     { name: 'Apple Music', color: '#fa2d48', primary: 'plays' },
  tiktok:    { name: 'TikTok',    color: '#25f4ee', primary: 'seguidores' },
  instagram: { name: 'Instagram', color: '#e1306c', primary: 'seguidores' },
};
const METRICS = {
  spotify:   [['oyentes', 'Oyentes mensuales'], ['streams', 'Streams'], ['seguidores', 'Seguidores']],
  apple:     [['plays', 'Reproducciones'], ['oyentes', 'Oyentes'], ['shazams', 'Shazams']],
  tiktok:    [['seguidores', 'Seguidores'], ['vistas', 'Vistas'], ['likes', 'Likes']],
  instagram: [['seguidores', 'Seguidores'], ['alcance', 'Alcance'], ['interacciones', 'Interacciones']],
};
const metricLabel = (p, m) => (METRICS[p] || []).find(x => x[0] === m)?.[1] || m;

/* Iconos propios de plataforma (SVG dibujados en el código, sin servicios externos). */
const PLAT_ICONS = {
  spotify:   '<circle cx="12" cy="12" r="9.5"/><path d="M7.8 9.8c2.9-.9 6.2-.7 8.7.8"/><path d="M8.3 12.6c2.4-.7 5-.5 7 .7"/><path d="M8.8 15.2c1.9-.5 3.9-.3 5.4.6"/>',
  apple:     '<path d="M9.2 17.4V6.2l8.6-1.9v10.6"/><circle cx="6.9" cy="17.6" r="2.4"/><circle cx="15.5" cy="15.6" r="2.4"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.8"/><circle cx="16.9" cy="7.1" r="1.1" fill="currentColor" stroke="none"/>',
  tiktok:    '<path d="M13.8 4.5v9.3a3.6 3.6 0 1 1-3.1-3.6"/><path d="M13.8 4.5c.5 2.7 2.1 4.4 4.7 4.7"/>',
};
const platIcon = (p, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${PLAT_ICONS[p] || ''}</svg>`;
const platBadge = (p, s = 34) => `<span class="mz-platic" style="background:${PLATFORMS[p].color}">${platIcon(p, Math.round(s * .55))}</span>`;
const fmt = v => new Intl.NumberFormat('es-ES').format(Math.round(v));
const dayKey = d => d; // 'YYYY-MM-DD'

let ctx = null;         // { sb, app, session, shell, bindNav, ic, esc, onTab }
let entries = [];       // music_entries desc por día
let reports = [];       // music_reports recientes
let signed = {};        // image_path -> signedUrl
let ui = { platform: 'spotify', metric: 'oyentes', chartP: 'spotify', chartM: 'oyentes', showAllReports: false, showHistory: false };

/* Petición de diseño (22-nov-2026): ocultar Evolución, Apuntar números e Histórico en la UI.
   Solo se ocultan; datos, tablas y código siguen intactos. Para reactivarlos, poner HIDE_STATS = false. */
const HIDE_STATS = true;

async function loadMusic() {
  const [e, r] = await Promise.all([
    ctx.sb.from('music_entries').select('*').order('day', { ascending: false }).order('created_at', { ascending: false }),
    ctx.sb.from('music_reports').select('*').order('created_at', { ascending: false }),
  ]);
  entries = e.data || [];
  reports = r.data || [];
  signed = {};
  const imgs = entries.filter(x => x.image_path).map(x => x.image_path).slice(0, 30);
  if (imgs.length) {
    const { data: urls } = await ctx.sb.storage.from('music').createSignedUrls(imgs, 3600);
    (urls || []).forEach(u => { if (u && u.path && u.signedUrl) signed[u.path] = u.signedUrl; });
  }
}

/* Última y penúltima medida de cada plataforma+métrica */
function latestBy() {
  const map = {};
  for (const e of entries) {
    const k = e.platform + '|' + e.metric;
    if (!map[k]) map[k] = [];
    if (map[k].length < 2) map[k].push(e);
  }
  return map;
}

function deltaPill(list) {
  if (!list || list.length < 2) return '';
  const diff = list[0].value - list[1].value;
  if (!diff) return '<span class="pill">=</span>';
  const pct = list[1].value ? Math.round(diff / list[1].value * 1000) / 10 : null;
  const up = diff > 0;
  return `<span class="pill ${up ? 'ok' : 'no'}">${up ? '▲' : '▼'} ${fmt(Math.abs(diff))}${pct !== null && Math.abs(pct) <= 999 ? ` (${up ? '+' : '−'}${Math.abs(pct)}%)` : ''}</span>`;
}

function chartSVG(rows) {
  // rows asc por día: [{day, value}]
  const W = 640, H = 190, P = 14;
  if (rows.length < 2) return `<div class="empty">Apunta esta cifra unas cuantas veces y aquí verás la curva.</div>`;
  const vals = rows.map(r => r.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = (max - min) || (max * 0.1) || 1;
  const lo = Math.max(0, min - span * 0.15), hi = max + span * 0.15;
  const x = i => P + i * (W - 2 * P) / (rows.length - 1);
  const y = v => H - P - (v - lo) * (H - 2 * P) / (hi - lo);
  const pts = rows.map((r, i) => `${x(i).toFixed(1)},${y(r.value).toFixed(1)}`).join(' ');
  const dots = rows.map((r, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(r.value).toFixed(1)}" r="4" fill="var(--acc)"/>`).join('');
  const d0 = rows[0].day.slice(5).split('-').reverse().join('/'), d1 = rows[rows.length - 1].day.slice(5).split('-').reverse().join('/');
  return `<svg viewBox="0 0 ${W} ${H}" class="mz-chart" role="img" aria-label="Evolución">
    <polyline points="${pts}" fill="none" stroke="var(--acc)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}</svg>
    <div class="row"><span class="mut small">${d0}</span><span class="grow"></span><span class="mut small">${d1}</span></div>
    <div class="row"><span class="mut small">mín ${fmt(lo)}</span><span class="grow"></span><span class="mut small">máx ${fmt(hi)}</span></div>`;
}

function vMusica() {
  const { ic, esc } = ctx;
  const by = latestBy();
  const plats = Object.keys(PLATFORMS);

  /* Panel del manager: tarjetas dinamicas por plataforma + plan numerado (petición de diseño, 22-nov-2026).
     Parsea el informe en parrafos: los que empiezan por una plataforma conocida van a su tarjeta,
     el bloque PLAN va a items numerados y el resto queda como texto introductorio. */
  const platNameToKey = Object.fromEntries(Object.entries(PLATFORMS).map(([k, v]) => [v.name.toLowerCase(), k]));
  const repCard = r => {
    const paras = (r.body || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
    const intro = [], platParas = [], planItems = [];
    let planTitle = '';
    for (const p of paras) {
      const m = p.match(/^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{2,25}):\s*([\s\S]*)$/);
      const key = m && platNameToKey[m[1].trim().toLowerCase()];
      if (key) { platParas.push({ key, text: m[2].trim() }); continue; }
      if (/^plan\b/i.test(p)) {
        const lines = p.split(/\n/).map(s => s.trim()).filter(Boolean);
        planTitle = (lines.shift() || '').replace(/:+$/, '');
        lines.forEach(l => planItems.push(l.replace(/^\d+[.)\-]\s*/, '')));
        continue;
      }
      intro.push(p);
    }
    return `<div class="card rise">
      <div class="row"><span class="link-ic">${ic('mic', 20)}</span><b class="grow">${esc(r.title || 'Informe')}</b><span class="mut small">${new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span></div>
      ${r.period ? `<div class="mut small" style="margin-top:2px">${esc(r.period)}</div>` : ''}
      ${intro.length ? `<div class="mz-report">${intro.map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}</div>` : ''}
      ${platParas.length ? `<div class="mz-rc-grid">${platParas.map(({ key, text }) => `<div class="mz-rc-plat">
        <div class="mz-rc-plathead">${platBadge(key, 30)}<b>${PLATFORMS[key].name}</b></div>
        <div class="mz-rc-text">${esc(text)}</div></div>`).join('')}</div>` : ''}
      ${planItems.length ? `<div class="mz-rc-plan"><div class="mz-rc-plantitle">${ic('target', 16)} ${esc(planTitle || 'Plan')}</div>
        ${planItems.map((t, i) => `<div class="mz-rc-item"><span class="lang-badge ja">${i + 1}</span><div class="grow">${esc(t)}</div></div>`).join('')}</div>` : ''}
    </div>`;
  };
  const repHtml = reports.length ? reports.slice(0, ui.showAllReports ? reports.length : 1).map(repCard).join('') +
    (reports.length > 1 ? `<button class="link block center" id="mz-more-rep">${ui.showAllReports ? 'Ver solo el último' : `Ver informes anteriores (${reports.length - 1})`}</button>` : '')
    : `<div class="empty">${ic('sparkle', 26)}<div>Tu manager aún no ha dejado el primer análisis. Cuando mandes capturas, aquí verás cómo van los números y el plan.</div></div>`;

  /* Widgets por plataforma (como los de Inicio): icono, cifra grande, etiqueta pequena. */
  const platWidgets = plats.map((p, i) => {
    const P = PLATFORMS[p];
    const prim = by[p + '|' + P.primary];
    const others = (METRICS[p] || []).filter(([m]) => m !== P.primary)
      .map(([m, lab]) => { const l = by[p + '|' + m]; return l ? `${fmt(l[0].value)} ${lab.toLowerCase()}` : ''; })
      .filter(Boolean).join(' · ');
    return `<div class="tile rise" style="animation-delay:${.04 + i * .02}s">
      <span class="wm" style="color:${P.color}">${platIcon(p, 96)}</span>
      <div class="lab">${P.name}</div>
      ${prim ? `<div class="big">${fmt(prim[0].value)}</div><div class="mz-unit">${metricLabel(p, P.primary).toLowerCase()}</div>`
             : `<div class="mut small" style="margin-top:8px">Sin datos todavía</div>`}
      ${prim ? `<div style="margin-top:6px">${deltaPill(prim)}</div>` : ''}
      ${others ? `<div class="mut small" style="margin-top:4px">${others}</div>` : ''}
    </div>`;
  }).join('');

  /* Gráfica */
  const chartRows = entries.filter(e => e.platform === ui.chartP && e.metric === ui.chartM)
    .map(e => ({ day: e.day, value: Number(e.value) }))
    .sort((a, b) => a.day < b.day ? -1 : 1)
    .filter((v, i, a) => a.findIndex(x => x.day === v.day) === i); // un punto por día (el primero = más reciente de ese día)

  /* Formulario */
  const mChips = (METRICS[ui.platform] || []).map(([m, lab]) =>
    `<div class="chip ${ui.metric === m ? 'on' : ''}" data-mz-metric="${m}">${lab}</div>`).join('');

  /* Histórico */
  const hist = entries.slice(0, ui.showHistory ? entries.length : 8).map(e => `
    <div class="card task rise">
      <span class="mz-dot" style="background:${PLATFORMS[e.platform]?.color || '#888'}"></span>
      <div class="grow txt"><b>${fmt(Number(e.value))}</b> <span class="mut">${metricLabel(e.platform, e.metric).toLowerCase()} · ${PLATFORMS[e.platform]?.name || e.platform}</span>
      <div class="mut small">${new Date(e.day + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}${e.note ? ' · ' + esc(e.note) : ''}</div></div>
      ${e.image_path && signed[e.image_path] ? `<a class="icon-btn" href="${signed[e.image_path]}" target="_blank" rel="noopener" title="Ver captura">${ic('link', 16)}</a>` : ''}
      <button class="icon-btn" data-mz-del="${e.id}" title="Borrar">${ic('trash', 16)}</button>
    </div>`).join('');

  return `
  <header class="top rise"><div class="grow"><h1 class="small-h">Música</h1><div class="sub">Tus números de artista y el plan de tu manager</div></div></header>

  <div class="sec rise" style="animation-delay:.03s"><h2>Cómo van los números</h2></div>
  <div class="tiles mz-widgets">${platWidgets}</div>

  <div class="sec rise" style="animation-delay:.08s"><h2>Panel del manager</h2></div>
  ${repHtml}

  ${HIDE_STATS ? '' : `<div class="sec rise" style="animation-delay:.09s"><h2>Evolución</h2></div>
  <div class="card rise" style="animation-delay:.1s">
    <div class="chips">${plats.map(p => `<div class="chip ${ui.chartP === p ? 'on' : ''}" data-mz-chartp="${p}">${PLATFORMS[p].name}</div>`).join('')}</div>
    <div class="chips">${(METRICS[ui.chartP] || []).map(([m, lab]) => `<div class="chip ${ui.chartM === m ? 'on' : ''}" data-mz-chartm="${m}">${lab}</div>`).join('')}</div>
    ${chartSVG(chartRows)}
  </div>`}

  ${HIDE_STATS ? '' : `<div class="sec rise" style="animation-delay:.12s"><h2>Apuntar números</h2></div>
  <div class="add-box rise" style="animation-delay:.13s">
    <div class="chips" id="mz-plats">${plats.map((p, i) => `<div class="chip ${ui.platform === p ? 'on' : ''}" data-mz-plat="${p}"><span class="mz-dot" style="background:${PLATFORMS[p].color}"></span> ${PLATFORMS[p].name}</div>`).join('')}</div>
    <div class="chips" id="mz-metrics">${mChips}</div>
    <div class="row">
      <input id="mz-value" class="grow" type="number" inputmode="numeric" min="0" step="1" placeholder="Cifra">
      <input id="mz-day" type="date" value="${new Date().toISOString().slice(0, 10)}" style="max-width:150px">
    </div>
    <input id="mz-note" placeholder="Nota (opcional): single, promo, vídeo..." style="margin-top:8px">
    <div class="row mt">
      <button class="btn grow" id="mz-shot">${ic('video', 16)} Adjuntar captura</button>
      <input id="mz-file" type="file" accept="image/*" hidden>
      <button class="btn primary grow" id="mz-save">${ic('plus', 16, 2.2)} Guardar</button>
    </div>
    <div class="mut small" id="mz-msg" style="margin-top:8px"></div>
  </div>`}

  ${HIDE_STATS ? '' : `<div class="sec rise" style="animation-delay:.16s"><h2>Histórico</h2>${entries.length > 8 ? `<button class="link" id="mz-hist-more">${ui.showHistory ? 'Ver menos' : 'Ver todo'}</button>` : ''}</div>
  ${hist || `<div class="empty">${ic('target', 26)}<div>Sin números todavía. Apunta los primeros arriba: oyentes de Spotify, seguidores...</div></div>`}`}`;
}

async function compressImage(file) {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const MAX = 1600;
  const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.82));
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

function bindMusica() {
  const { sb, app } = ctx;
  const q = s => app.querySelector(s);
  const qa = s => [...app.querySelectorAll(s)];
  const rerender = () => {
    const m = ctx.app.querySelector('main');
    const y = m ? m.scrollTop : 0;
    ctx.app.innerHTML = ctx.shell(vMusica());
    ctx.bindNav(); bindMusica();
    const m2 = ctx.app.querySelector('main');
    if (m2) m2.scrollTop = y;
    ctx.app.querySelectorAll('.rise').forEach(e => { e.style.animation = 'none'; });
  };

  const more = q('#mz-more-rep');
  if (more) more.onclick = () => { ui.showAllReports = !ui.showAllReports; rerender(); };
  const histMore = q('#mz-hist-more');
  if (histMore) histMore.onclick = () => { ui.showHistory = !ui.showHistory; rerender(); };

  qa('[data-mz-plat]').forEach(c => c.onclick = () => {
    ui.platform = c.dataset.mzPlat;
    ui.metric = PLATFORMS[ui.platform].primary;
    rerender();
  });
  qa('[data-mz-metric]').forEach(c => c.onclick = () => { ui.metric = c.dataset.mzMetric; rerender(); });
  qa('[data-mz-chartp]').forEach(c => c.onclick = () => { ui.chartP = c.dataset.mzChartp; ui.chartM = PLATFORMS[ui.chartP].primary; rerender(); });
  qa('[data-mz-chartm]').forEach(c => c.onclick = () => { ui.chartM = c.dataset.mzChartm; rerender(); });

  qa('[data-mz-del]').forEach(b => b.onclick = async () => {
    if (!confirm('¿Borrar este apunte?')) return;
    const e = entries.find(x => x.id === b.dataset.mzDel);
    await sb.from('music_entries').delete().eq('id', e.id);
    if (e.image_path) await sb.storage.from('music').remove([e.image_path]);
    entries = entries.filter(x => x.id !== e.id);
    rerender();
  });

  const fileInp = q('#mz-file');
  let pendingFile = null;
  if (fileInp) {
  q('#mz-shot').onclick = () => fileInp.click();
  fileInp.onchange = () => {
    const f = fileInp.files && fileInp.files[0];
    pendingFile = f || null;
    q('#mz-msg').textContent = f ? 'Captura lista: ' + f.name : '';
  };
  }

  const saveBtn = q('#mz-save');
  if (saveBtn) saveBtn.onclick = async () => {
    const msg = q('#mz-msg');
    const val = parseFloat(q('#mz-value').value.replace(',', '.'));
    if (!(val >= 0)) { msg.textContent = 'Pon la cifra primero.'; return; }
    const day = q('#mz-day').value || new Date().toISOString().slice(0, 10);
    const note = q('#mz-note').value.trim() || null;
    const btn = q('#mz-save');
    btn.disabled = true; msg.textContent = 'Guardando...';
    let image_path = null;
    if (pendingFile) {
      msg.textContent = 'Comprimiendo y subiendo captura...';
      const f = await compressImage(pendingFile);
      const path = ctx.session.user.id + '/' + Date.now() + '.jpg';
      const { error: upErr } = await sb.storage.from('music').upload(path, f, { cacheControl: '3600', upsert: false });
      if (upErr) { msg.textContent = 'No se pudo subir la captura. Se guarda sin ella.'; }
      else image_path = path;
    }
    const row = { day, platform: ui.platform, metric: ui.metric, value: val, note, image_path };
    const { data, error } = await sb.from('music_entries').insert(row).select().single();
    btn.disabled = false;
    if (error || !data) { msg.textContent = 'No se pudo guardar. Inténtalo de nuevo.'; return; }
    entries.unshift(data);
    if (image_path) {
      const { data: su } = await sb.storage.from('music').createSignedUrl(image_path, 3600);
      if (su && su.signedUrl) signed[image_path] = su.signedUrl;
    }
    pendingFile = null;
    rerender();
  };
}

export async function openMusic(c) {
  ctx = c;
  ctx.app.innerHTML = ctx.shell(`<div class="mut center" style="padding:60px 0">Cargando música...</div>`);
  ctx.bindNav();
  await loadMusic();
  ctx.app.innerHTML = ctx.shell(vMusica());
  ctx.bindNav();
  bindMusica();
}
