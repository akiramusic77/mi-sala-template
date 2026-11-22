/* ---------- Dinero: control de autónomo (modelos 130/303) y ahorro ---------- */
/* Módulo cargado bajo demanda desde app.js (openDinero). */

const fmtE = v => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(v);
const quarterOf = d => Math.floor(new Date(d + 'T00:00:00').getMonth() / 3) + 1;
const yearOf = d => new Date(d + 'T00:00:00').getFullYear();
const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const monthKeyOf = d => d.slice(0, 7);

let ctx = null;
let entries = [];
let goal = null; // objetivo de ahorro mensual (sala_settings)
let ui = { kind: 'ingreso', iva: true, showAll: false };

async function loadDinero() {
  const [e, g] = await Promise.all([
    ctx.sb.from('fin_entries').select('*').order('day', { ascending: false }).order('created_at', { ascending: false }),
    ctx.sb.from('sala_settings').select('*').eq('key', 'savings_goal'),
  ]);
  entries = e.data || [];
  goal = (g.data && g.data[0] && parseFloat(g.data[0].value)) || null;
}

function sums(list) {
  let ing = 0, gas = 0, ivaRep = 0, ivaSop = 0;
  for (const e of list) {
    const base = Number(e.amount);
    if (e.kind === 'ingreso') { ing += base; if (e.iva) ivaRep += base * 0.21; }
    else { gas += base; if (e.iva) ivaSop += base * 0.21; }
  }
  return { ing, gas, net: ing - gas, ivaRep, ivaSop, m303: ivaRep - ivaSop, m130: Math.max(0, (ing - gas) * 0.20) };
}

function vDinero() {
  const { ic, esc } = ctx;
  const nowQ = quarterOf(todayKey()), nowY = yearOf(todayKey()), nowM = monthKeyOf(todayKey());
  const qList = entries.filter(e => quarterOf(e.day) === nowQ && yearOf(e.day) === nowY);
  const mList = entries.filter(e => monthKeyOf(e.day) === nowM);
  const q = sums(qList), m = sums(mList);
  const QN = ['', '1T', '2T', '3T', '4T'][nowQ];

  const list = entries.slice(0, ui.showAll ? entries.length : 10).map(e => `
    <div class="card task rise">
      <span class="mz-dot" style="background:${e.kind === 'ingreso' ? 'var(--ok)' : 'var(--danger)'}"></span>
      <div class="grow txt"><b>${e.kind === 'ingreso' ? '+' : '−'}${fmtE(Number(e.amount))}</b> <span class="mut">${esc(e.concept)}</span>
      <div class="mut small">${new Date(e.day + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}${e.iva ? ' · IVA 21%' : ' · sin IVA'}${e.note ? ' · ' + esc(e.note) : ''}</div></div>
      <button class="icon-btn" data-fin-del="${e.id}" title="Borrar">${ic('trash', 16)}</button>
    </div>`).join('');

  return `
  <header class="top rise"><div class="grow"><h1 class="small-h">Dinero</h1><div class="sub">Tu trimestre de autónomo y tu ahorro, sin líos</div></div></header>

  <div class="tiles rise" style="animation-delay:.04s">
    <div class="tile"><div class="lab">${ic('plus', 13)} Neto ${QN} ${nowY}</div>
      <div class="big">${fmtE(q.net)}</div>
      <div class="mut small">${fmtE(q.ing)} ingresos · ${fmtE(q.gas)} gastos</div></div>
    <div class="tile"><div class="lab">${ic('target', 13)} Ahorro este mes</div>
      <div class="big">${fmtE(m.net)}</div>
      <div class="mut small">${goal ? `objetivo ${fmtE(goal)} · ${m.net >= goal ? '¡conseguido! 🎉' : 'a ' + fmtE(goal - m.net) + ' de tu meta'}` : 'sin objetivo (pon uno abajo)'}</div></div>
  </div>

  <div class="card rise" style="animation-delay:.07s">
    <div class="row"><b class="grow">Estimación Hacienda ${QN}</b><span class="pill acc">orientativa</span></div>
    <div class="mz-minis" style="margin-top:10px">
      <div class="mz-mini"><span>Modelo 130 (20% IRPF)</span><b>${fmtE(q.m130)}</b></div>
      <div class="mz-mini"><span>Modelo 303 (IVA)</span><b>${fmtE(q.m303)}</b></div>
      <div class="mz-mini"><span>Total aprox.</span><b>${fmtE(q.m130 + q.m303)}</b></div>
    </div>
    <div class="mut small" style="margin-top:8px">Sin contar retenciones, pagos fraccionados de otros trimestres ni la minoración de 100 €. Tu gestoría tiene la última palabra.</div>
  </div>

  <div class="sec rise" style="animation-delay:.1s"><h2>Apuntar movimiento</h2></div>
  <div class="add-box rise" style="animation-delay:.11s">
    <div class="chips" id="fin-kind">
      <div class="chip ${ui.kind === 'ingreso' ? 'on' : ''}" data-fin-kind="ingreso">Ingreso</div>
      <div class="chip ${ui.kind === 'gasto' ? 'on' : ''}" data-fin-kind="gasto">Gasto</div>
    </div>
    <input id="fin-concept" placeholder="Concepto: bolos, Motocrossity, gasolina...">
    <div class="row" style="margin-top:8px">
      <input id="fin-amount" class="grow" type="number" inputmode="decimal" min="0" step="0.01" placeholder="Importe sin IVA (€)">
      <input id="fin-day" type="date" value="${todayKey()}" style="max-width:150px">
    </div>
    <div class="chips" id="fin-iva" style="margin-top:8px">
      <div class="chip ${ui.iva ? 'on' : ''}" data-fin-iva="1">Lleva IVA 21%</div>
      <div class="chip ${!ui.iva ? 'on' : ''}" data-fin-iva="0">Sin IVA</div>
    </div>
    <button class="btn primary block" id="fin-save">${ic('plus', 16, 2.2)} Guardar</button>
    <div class="mut small" id="fin-msg" style="margin-top:8px"></div>
  </div>

  <div class="card rise" style="animation-delay:.13s">
    <div class="row"><b class="grow" style="font-size:14px">Objetivo de ahorro mensual</b></div>
    <div class="row" style="margin-top:8px">
      <input id="fin-goal" class="grow" type="number" inputmode="decimal" min="0" step="10" placeholder="Ej.: 510" value="${goal ?? ''}">
      <button class="btn" id="fin-goal-save">Guardar</button>
    </div>
  </div>

  <div class="sec rise" style="animation-delay:.16s"><h2>Movimientos</h2>${entries.length > 10 ? `<button class="link" id="fin-more">${ui.showAll ? 'Ver menos' : 'Ver todos'}</button>` : ''}</div>
  ${list || `<div class="empty">${ic('target', 26)}<div>Sin movimientos todavía. Apunta el primero arriba.</div></div>`}`;
}

function bindDinero() {
  const { sb, app } = ctx;
  const q = s => app.querySelector(s);
  const qa = s => [...app.querySelectorAll(s)];
  const rerender = () => {
    const m = ctx.app.querySelector('main');
    const y = m ? m.scrollTop : 0;
    ctx.app.innerHTML = ctx.shell(vDinero());
    ctx.bindNav(); bindDinero();
    const m2 = ctx.app.querySelector('main');
    if (m2) m2.scrollTop = y;
    ctx.app.querySelectorAll('.rise').forEach(e => { e.style.animation = 'none'; });
  };

  qa('[data-fin-kind]').forEach(c => c.onclick = () => { ui.kind = c.dataset.finKind; rerender(); });
  qa('[data-fin-iva]').forEach(c => c.onclick = () => { ui.iva = c.dataset.finIva === '1'; rerender(); });
  const more = q('#fin-more');
  if (more) more.onclick = () => { ui.showAll = !ui.showAll; rerender(); };

  qa('[data-fin-del]').forEach(b => b.onclick = async () => {
    if (!confirm('¿Borrar este movimiento?')) return;
    await sb.from('fin_entries').delete().eq('id', b.dataset.finDel);
    entries = entries.filter(x => x.id !== b.dataset.finDel);
    rerender();
  });

  q('#fin-save').onclick = async () => {
    const msg = q('#fin-msg');
    const concept = q('#fin-concept').value.trim();
    const amount = parseFloat(q('#fin-amount').value.replace(',', '.'));
    if (!concept) { msg.textContent = 'Pon el concepto.'; return; }
    if (!(amount > 0)) { msg.textContent = 'Pon el importe (sin IVA).'; return; }
    const row = { day: q('#fin-day').value || todayKey(), kind: ui.kind, concept, amount, iva: ui.iva };
    const btn = q('#fin-save');
    btn.disabled = true; msg.textContent = 'Guardando...';
    const { data, error } = await sb.from('fin_entries').insert(row).select().single();
    btn.disabled = false;
    if (error || !data) { msg.textContent = 'No se pudo guardar. Inténtalo de nuevo.'; return; }
    entries.unshift(data);
    rerender();
  };

  q('#fin-goal-save').onclick = async () => {
    const v = parseFloat(q('#fin-goal').value.replace(',', '.'));
    if (!(v >= 0)) return;
    await sb.from('sala_settings').upsert({ key: 'savings_goal', value: String(v) });
    goal = v;
    rerender();
  };
}

export async function openDinero(c) {
  ctx = c;
  ctx.app.innerHTML = ctx.shell(`<div class="mut center" style="padding:60px 0">Cargando dinero...</div>`);
  ctx.bindNav();
  await loadDinero();
  ctx.app.innerHTML = ctx.shell(vDinero());
  ctx.bindNav();
  bindDinero();
}
