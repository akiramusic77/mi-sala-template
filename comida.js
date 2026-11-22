/* ---------- Comida: ideas sanas y completas ---------- */
/* Módulo cargado bajo demanda desde app.js (openComida). */

const KINDS = [['curro', 'Para llevar al curro'], ['casa', 'En casa'], ['rapido', 'Rápida']];
const kindLabel = k => (KINDS.find(x => x[0] === k) || [k, k])[1];

let ctx = null;
let items = [];
let ui = { filter: 'todas', pick: null, kind: 'curro', openRec: null };

async function loadComida() {
  const { data } = await ctx.sb.from('food_items').select('*').order('fav', { ascending: false }).order('name');
  items = data || [];
}

function vComida() {
  const { ic, esc } = ctx;
  const filters = [['todas', 'Todas'], ['fav', '★ Favoritas'], ...KINDS];
  let list = items;
  if (ui.filter === 'fav') list = items.filter(i => i.fav);
  else if (ui.filter !== 'todas') list = items.filter(i => i.kind === ui.filter);

  const cards = list.map((f, i) => `
    <div class="card rise ${ui.pick === f.id ? 'fd-pick' : ''}" style="animation-delay:${Math.min(.05 + i * .02, .3)}s">
      <div class="row fd-row" style="align-items:flex-start">
        <button class="icon-btn fd-star ${f.fav ? 'on' : ''}" data-fd-fav="${f.id}" title="${f.fav ? 'Quitar de favoritas' : 'Marcar favorita'}">${f.fav ? '★' : '☆'}</button>
        <div class="grow"><b style="font-size:14px">${esc(f.name)}</b>
        ${(f.kcal || f.grams) ? `<div class="mut small">≈ ${f.kcal ? f.kcal + ' kcal' : ''}${f.kcal && f.grams ? ' · ' : ''}${f.grams ? f.grams + ' g de ración' : ''} (aprox)</div>` : ''}
        ${f.note ? `<div class="mut small">${esc(f.note)}</div>` : ''}</div>
        <span class="pill">${kindLabel(f.kind)}</span>
        ${f.recipe ? `<button class="icon-btn fd-chev ${ui.openRec === f.id ? 'open' : ''}" data-fd-rec="${f.id}" title="${ui.openRec === f.id ? 'Cerrar receta' : 'Ver receta'}">${ic('chev', 15)}</button>` : ''}
        ${f.mine ? `<button class="icon-btn" data-fd-del="${f.id}" title="Borrar">${ic('trash', 15)}</button>` : ''}
      </div>
      ${ui.openRec === f.id && f.recipe ? `<div class="fd-rec">
        <div class="fd-rec-sec"><b>Ingredientes</b>
          <ul>${(f.recipe.ing || []).map(x => `<li><span>${esc(x[0])}</span><span class="fd-qty">${esc(x[1])}</span></li>`).join('')}</ul>
        </div>
        ${(f.recipe.steps && f.recipe.steps.length) ? `<div class="fd-rec-sec"><b>Pasos</b>
          <ol>${f.recipe.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
        </div>` : ''}
      </div>` : ''}
    </div>`).join('');

  return `
  <header class="top rise"><div class="grow"><h1 class="small-h">Comida</h1><div class="sub">Ideas sanas y que llenan, para elegir sin pensar</div></div></header>

  <button class="btn primary block rise" style="animation-delay:.04s" id="fd-pick">${ic('sparkle', 16, 2.2)} ¿Qué como hoy?</button>
  ${ui.pick ? (() => { const f = items.find(x => x.id === ui.pick); return f ? `<div class="card rise fd-pick" style="animation-delay:.05s"><div class="kicker">Toca:</div><b style="font-size:16px">${esc(f.name)}</b>${(f.kcal || f.grams) ? `<div class="mut small" style="margin-top:4px">≈ ${f.kcal ? f.kcal + ' kcal' : ''}${f.kcal && f.grams ? ' · ' : ''}${f.grams ? f.grams + ' g de ración' : ''} (aprox)</div>` : ''}${f.note ? `<div class="mut small" style="margin-top:4px">${esc(f.note)}</div>` : ''}</div>` : ''; })() : ''}

  <div class="chips rise" style="animation-delay:.07s;margin-top:12px" id="fd-filters">
    ${filters.map(([k, lab]) => `<div class="chip ${ui.filter === k ? 'on' : ''}" data-fd-filter="${k}">${lab}</div>`).join('')}
  </div>
  ${cards || `<div class="empty">${ic('sparkle', 26)}<div>Nada por aquí. Cambia de filtro o añade una idea tuya.</div></div>`}

  <div class="sec rise" style="animation-delay:.12s"><h2>Añadir idea mía</h2></div>
  <div class="add-box rise" style="animation-delay:.13s">
    <input id="fd-name" placeholder="Nombre del plato">
    <div class="chips" id="fd-kinds" style="margin-top:8px">
      ${KINDS.map(([k, lab]) => `<div class="chip ${ui.kind === k ? 'on' : ''}" data-fd-kind="${k}">${lab}</div>`).join('')}
    </div>
    <div class="row" style="margin-top:8px;gap:8px">
      <input id="fd-kcal" type="number" min="0" placeholder="kcal aprox (opcional)" style="flex:1">
      <input id="fd-grams" type="number" min="0" placeholder="gramos (opcional)" style="flex:1">
    </div>
    <input id="fd-note" placeholder="Nota (opcional): dónde la compras, cómo la haces...">
    <button class="btn primary block mt" id="fd-save">${ic('plus', 16, 2.2)} Añadir</button>
    <div class="mut small" id="fd-msg" style="margin-top:8px"></div>
  </div>`;
}

function bindComida() {
  const { sb, app } = ctx;
  const q = s => app.querySelector(s);
  const qa = s => [...app.querySelectorAll(s)];
  const rerender = (keep) => {
    const m = ctx.app.querySelector('main');
    const y = keep && m ? m.scrollTop : 0;
    ctx.app.innerHTML = ctx.shell(vComida());
    ctx.bindNav(); bindComida();
    if (keep) {
      const m2 = ctx.app.querySelector('main');
      if (m2) m2.scrollTop = y;
      ctx.app.querySelectorAll('.rise').forEach(e => { e.style.animation = 'none'; });
    }
  };

  qa('[data-fd-filter]').forEach(c => c.onclick = () => { ui.filter = c.dataset.fdFilter; ui.pick = null; rerender(); });
  qa('[data-fd-kind]').forEach(c => c.onclick = () => { ui.kind = c.dataset.fdKind; rerender(); });

  qa('[data-fd-rec]').forEach(b => b.onclick = () => {
    ui.openRec = ui.openRec === b.dataset.fdRec ? null : b.dataset.fdRec;
    rerender(true);
  });
  qa('[data-fd-fav]').forEach(b => b.onclick = async () => {
    const f = items.find(x => x.id === b.dataset.fdFav);
    f.fav = !f.fav; rerender(true);
    await sb.from('food_items').update({ fav: f.fav }).eq('id', f.id);
  });
  qa('[data-fd-del]').forEach(b => b.onclick = async () => {
    if (!confirm('¿Borrar esta idea?')) return;
    await sb.from('food_items').delete().eq('id', b.dataset.fdDel);
    items = items.filter(x => x.id !== b.dataset.fdDel);
    if (ui.pick === b.dataset.fdDel) ui.pick = null;
    rerender(true);
  });

  q('#fd-pick').onclick = () => {
    let pool = items;
    if (ui.filter === 'fav') pool = items.filter(i => i.fav);
    else if (ui.filter !== 'todas') pool = items.filter(i => i.kind === ui.filter);
    if (!pool.length) return;
    ui.pick = pool[Math.floor(Math.random() * pool.length)].id;
    rerender();
  };

  q('#fd-save').onclick = async () => {
    const msg = q('#fd-msg');
    const name = q('#fd-name').value.trim();
    if (!name) { msg.textContent = 'Pon el nombre del plato.'; return; }
    const kcal = parseInt(q('#fd-kcal').value, 10);
    const grams = parseInt(q('#fd-grams').value, 10);
    const row = { name, kind: ui.kind, note: q('#fd-note').value.trim() || null, kcal: kcal > 0 ? kcal : null, grams: grams > 0 ? grams : null, fav: false, mine: true };
    const btn = q('#fd-save');
    btn.disabled = true; msg.textContent = 'Guardando...';
    const { data, error } = await sb.from('food_items').insert(row).select().single();
    btn.disabled = false;
    if (error || !data) { msg.textContent = 'No se pudo guardar. Inténtalo de nuevo.'; return; }
    items.push(data);
    rerender();
  };
}

export async function openComida(c) {
  ctx = c;
  ctx.app.innerHTML = ctx.shell(`<div class="mut center" style="padding:60px 0">Cargando comida...</div>`);
  ctx.bindNav();
  await loadComida();
  ctx.app.innerHTML = ctx.shell(vComida());
  ctx.bindNav();
  bindComida();
}
