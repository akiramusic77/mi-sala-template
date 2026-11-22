import {UNITS} from './jp-content.js';

const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const stamp=()=>new Date().toISOString();
const date=s=>new Date(s).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
const fresh=()=>({version:1,placement:null,progress:{},active:null,history:[]});
const unit=id=>UNITS.find(u=>u.id===id);
const byId=id=>UNITS.flatMap(u=>u.qs.map(q=>({...q,unit:u.id}))).find(q=>q.id===id);
/* Recomendación del día para la página Hoy: el repaso que toca o la siguiente lección, según su progreso real. */
export async function jpToday(sb){
  try{
    const {data:{user}}=await sb.auth.getUser();
    if(!user)return null;
    const {data}=await sb.from('jp_learning').select('payload').eq('user_id',user.id).maybeSingle();
    const state=data?.payload?.version===1?{...fresh(),...data.payload}:fresh();
    const now=Date.now();
    const due=UNITS.filter(u=>state.progress[u.id]?.due&&new Date(state.progress[u.id].due).getTime()<=now).sort((a,b)=>new Date(state.progress[a.id].due)-new Date(state.progress[b.id].due));
    let rec;
    if(due.length)rec={u:due[0],review:true};
    else{
      const next=UNITS.find(u=>!state.progress[u.id]?.mastered&&!(state.placement?.scores[u.id]===3&&!state.progress[u.id]));
      rec=next?{u:next,review:false}:{u:[...UNITS].sort((a,b)=>(state.progress[a.id]?.lastScore??1)-(state.progress[b.id]?.lastScore??1))[0],review:true};
    }
    return {
      title:rec.u.title,
      review:rec.review,
      done:UNITS.filter(u=>state.progress[u.id]?.mastered).length,
      total:UNITS.length,
      started:!!(state.placement||Object.keys(state.progress).length||state.active)
    };
  }catch(e){return null;}
}

export async function openJapanese({sb,app,shell,bindNav,onBack}) {
  let state=fresh(),view='home',busy=false,pending=null,error='',saved='',alive=true;
  const {data:{user},error:authError}=await sb.auth.getUser();
  if(authError||!user){alert('Tu sesión ha caducado. Vuelve a entrar.');return;}
  const style=document.getElementById('jp-style')||document.createElement('style');
  style.id='jp-style';style.textContent=`.ja-learn{font-size:16px;letter-spacing:normal;text-align:left}.ja-learn .jp-label{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--acc);font-weight:700}.ja-learn h2{font-size:22px;line-height:1.3;margin:7px 0 12px}.ja-learn p{margin:10px 0;line-height:1.65}.ja-learn .jp-lead{background:linear-gradient(135deg,var(--acc-soft),var(--surface));border:1px solid rgba(124,135,248,.25)}.ja-learn button{touch-action:manipulation}.ja-learn .jp-opt{display:block;width:100%;text-align:left;padding:14px 16px;min-height:48px;margin-top:9px;border:1px solid var(--line);border-radius:12px;background:var(--surface2);color:var(--txt);font:inherit;overflow-wrap:anywhere}.ja-learn .jp-opt:focus-visible{outline:2px solid var(--acc);outline-offset:2px}.ja-learn .jp-good{border-color:var(--ok);background:var(--ok-soft)}.ja-learn .jp-bad{border-color:var(--danger);background:var(--danger-soft)}.ja-learn .jp-question{font-size:22px;line-height:1.6;overflow-wrap:anywhere}.ja-learn .jp-save{font-size:12px;color:var(--mut);min-height:22px;margin:8px 0}.ja-learn .jp-error{padding:12px;border:1px solid var(--danger);border-radius:12px;color:var(--danger);margin:10px 0}.ja-learn details summary{cursor:pointer;padding:8px 0}.ja-learn .jp-row{display:flex;gap:12px;justify-content:space-between;align-items:center}.ja-learn .jp-mini{font-size:13px;color:var(--mut)}.ja-learn .jp-stat{font-size:28px;font-weight:750}.ja-learn .jp-pill{font-size:12px;color:var(--ok)}.ja-learn .jp-line{height:1px;background:var(--line);margin:12px 0}.ja-learn .jp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ja-learn .jp-grid .card{margin:0}.ja-learn a{color:var(--acc)}.ja-learn button:disabled{opacity:.6}.ja-learn .jp-review{border-left:3px solid var(--acc)}.ja-learn .jp-num{font-size:13px;color:var(--acc);min-width:23px}`;
  if(!style.isConnected)document.head.append(style);
  const {data,error:loadError}=await sb.from('jp_learning').select('payload').eq('user_id',user.id).maybeSingle();
  if(loadError){drawLoadError();return;}
  if(data?.payload?.version===1)state={...fresh(),...data.payload};
  draw();
  function drawLoadError(){app.innerHTML=shell(`<section class="ja-learn"><header class="top"><button class="btn ghost" id="jp-back">← Idiomas</button></header><div class="card"><h2>No puedo cargar tu progreso</h2><p>No hemos cambiado nada. Revisa la conexión y vuelve a intentarlo.</p><button class="btn primary block" id="jp-reload">Reintentar</button></div></section>`);bindNav();document.getElementById('jp-back').onclick=onBack;document.getElementById('jp-reload').onclick=()=>openJapanese({sb,app,shell,bindNav,onBack});}
  function recommended(){
    const now=Date.now();
    const due=UNITS.filter(u=>state.progress[u.id]?.due&&new Date(state.progress[u.id].due).getTime()<=now).sort((a,b)=>new Date(state.progress[a.id].due)-new Date(state.progress[b.id].due));
    if(due.length)return {u:due[0],review:true,reason:'Toca repasar para consolidarlo.'};
    const next=UNITS.find(u=>!state.progress[u.id]?.mastered&&!(state.placement?.scores[u.id]===3&&!state.progress[u.id]));
    if(next)return {u:next,review:false,reason:state.progress[next.id]?'Reforzamos los errores antes de avanzar.':'La primera base que conviene trabajar.'};
    const weakest=[...UNITS].sort((a,b)=>(state.progress[a.id]?.lastScore??1)-(state.progress[b.id]?.lastScore??1))[0];
    return {u:weakest,review:true,reason:'Has recorrido las bases disponibles. Mantén la práctica; todavía no hay un bloque avanzado.'};
  }
  async function persist(next){
    if(busy)return false;busy=true;error='';pending=next;draw();
    try{
      const {error:e}=await sb.from('jp_learning').upsert({user_id:user.id,payload:next,updated_at:stamp()});
      if(e)throw e;
      state=next;pending=null;saved='Guardado en tu cuenta';return true;
    }catch(e){error='No se ha guardado este paso. Reintenta antes de continuar; no cierres esta pantalla.';return false;}
    finally{busy=false;draw();}
  }
  function prep(q){const order=shuffle(q.opts.map((_,i)=>i));return {id:q.id,order};}
  async function startPlacement(){
    const next=structuredClone(state);next.active={kind:'placement',items:UNITS.flatMap(u=>u.qs.slice(0,3).map(prep)),answers:[],index:0,started:stamp(),finished:false};view='run';await persist(next);
  }
  async function startLesson(id,review=false){
    const u=unit(id);const errors=state.progress[id]?.errors||[];
    const qs=[...u.qs.slice(3)].sort((a,b)=>Number(errors.includes(b.id))-Number(errors.includes(a.id)));
    const next=structuredClone(state);next.active={kind:'lesson',unit:id,review,items:qs.map(prep),answers:[],index:0,started:stamp(),finished:false,reading:true};view='run';await persist(next);
  }
  async function answer(value){
    const r=state.active;if(!r||r.finished||r.answers.length>r.index||busy||pending)return;
    const q=byId(r.items[r.index].id);const next=structuredClone(state);
    next.active.answers.push({id:q.id,chosen:value,ok:value===q.a});await persist(next);
  }
  async function advance(){
    if(busy||pending)return;const next=structuredClone(state),r=next.active;
    if(r.index+1<r.items.length){r.index++;await persist(next);return;}
    r.finished=true;r.finishedAt=stamp();
    const score=r.answers.filter(a=>a.ok).length;
    if(r.kind==='placement'){
      const scores=Object.fromEntries(UNITS.map(u=>[u.id,r.answers.filter(a=>byId(a.id).unit===u.id&&a.ok).length]));
      next.placement={at:stamp(),scores,total:score};
    }else{
      const old=next.progress[r.unit]||{},ratio=score/r.items.length,passed=ratio>=.8;
      const stage=passed?Math.min((old.stage||0)+1,4):0;
      next.progress[r.unit]={attempts:(old.attempts||0)+1,mastered:passed,stage,lastScore:ratio,lastAt:stamp(),due:new Date(Date.now()+(passed?[0,1,3,7,14][stage]:0)*86400000).toISOString(),errors:r.answers.filter(a=>!a.ok).map(a=>a.id)};
    }
    next.history=[{kind:r.kind,unit:r.unit||null,at:stamp(),score,total:r.items.length},...next.history].slice(0,60);
    await persist(next);
  }
  function B(id,text,cls='primary'){return `<button class="btn ${cls} block" style="margin-top:10px" id="${id}" ${busy||pending?'disabled':''}>${text}</button>`;}
  function home(){
    const rec=recommended(),done=UNITS.filter(u=>state.progress[u.id]?.mastered).length,p=state.placement;
    return `<div class="card jp-lead"><div class="jp-label">Tu japonés, paso a paso</div><h2>${state.active?'Tienes una sesión guardada':p?(rec.review?'Un repaso a tiempo':'Tu siguiente paso'):'Empezamos donde estés'}</h2><p>${state.active?'Puedes continuar justo donde lo dejaste.':p?E(rec.reason):'No damos nada por sabido. Una prueba corta nos ayuda a elegir por dónde empezar.'}</p>${state.active?B('jp-resume','Continuar sesión'):p?`<b>${E(rec.u.title)}</b>`+B('jp-next',rec.review?'Hacer repaso':'Abrir lección'):B('jp-test','Hacer prueba de nivel')}<div class="jp-mini" style="margin-top:12px">${p?'El plan se adapta con cada intento.':'30 preguntas · unos 8–12 min · sin tiempo límite'}</div></div>
    <div class="jp-grid"><div class="card"><div class="jp-stat">${done}<span class="jp-mini"> / ${UNITS.length}</span></div><div class="jp-mini">lecciones consolidadas</div></div><div class="card"><div class="jp-stat">${state.history.filter(x=>x.kind==='lesson').length}</div><div class="jp-mini">sesiones en el historial</div></div></div>
    ${p?`<div class="card" style="margin-top:14px"><div class="jp-label">Punto de partida · ${date(p.at)}</div><h2>Un mapa, no una nota</h2><p>${E(placementText(p))}</p><details><summary>Ver áreas de la prueba</summary>${UNITS.map(u=>`<div class="jp-row jp-mini" style="margin:10px 0"><span>${E(u.title)}</span><b>${p.scores[u.id]}/3</b></div>`).join('')}</details><p class="jp-mini">Solo una muestra por área. Acertar 3/3 permite saltar esa lección inicial, pero no demuestra dominio completo.</p></div>`:''}
    <div class="sec"><h2>Tu recorrido</h2><span class="count">10 lecciones</span></div>
    ${UNITS.map((u,i)=>{const pr=state.progress[u.id];const label=pr?(pr.mastered?`Consolidada · repaso ${date(pr.due)}`:'A reforzar'):p?.scores[u.id]===3?'Base detectada en la prueba':'Por explorar';return `<button class="card clickable" data-jp-unit="${u.id}" style="display:block;width:100%;text-align:left;color:inherit;font:inherit"><div class="jp-row"><span class="jp-num">${String(i+1).padStart(2,'0')}</span><div class="grow"><b>${E(u.title)}</b><div class="jp-mini">${label}</div></div><span>›</span></div></button>`;}).join('')}
    <details class="card"><summary>Cómo funciona y qué incluye</summary><p>Lee una explicación corta, practica y revisa cada error. Con al menos un 80 % de aciertos consolidamos la lección. Si no, recomendamos reforzarla y ponemos los errores primero.</p><p>Tras acertar, los repasos se espacian a 1, 3, 7 y 14 días según los repasos superados. Son sugerencias dentro de la Sala, no notificaciones ni seguimiento fuera de ella.</p><p>Guardamos la prueba, la sesión en curso y tus lecciones en tu cuenta. No compartimos tus respuestas con otras personas.</p><p>Es un bloque inicial de lectura y gramática básica. No evalúa comprensión oral, pronunciación ni escritura a mano. No equivale a un nivel oficial ni es un curso completo. Los ejercicios se repiten para afianzar.</p><p class="jp-mini">Las explicaciones son originales. Referencia gramatical: <a href="https://www.tofugu.com/japanese-grammar/" target="_blank" rel="noopener">índice de Tofugu</a>.</p></details>
    <details class="card"><summary>Historial reciente</summary>${state.history.slice(0,15).map(x=>`<div class="jp-mini" style="margin:10px 0">${date(x.at)} · ${x.kind==='placement'?'Prueba de nivel':E(unit(x.unit)?.title)} · ${x.score}/${x.total}</div>`).join('')||'<p class="jp-mini">Tu primera sesión aparecerá aquí.</p>'}</details>
    ${p&&!state.active?B('jp-retest','Repetir prueba de nivel','ghost'):''}`;
  }
  function placementText(p){const first=UNITS.find(u=>p.scores[u.id]<3);if(!first)return 'La muestra de bases ha salido bien en todas las áreas. Puedes afianzarlas con repasos. Este bloque no mide un nivel más avanzado.';return `Empezaremos por «${first.title}». Las áreas que ya reconoces quedan disponibles sin obligarte a repetirlas. Tu punto de partida cambiará con la práctica.`;}
  function intro(){return `<div class="card jp-lead"><div class="jp-label">Prueba de nivel orientativa</div><h2>Sin presión y sin adivinar</h2><p>Son 30 preguntas progresivas: hiragana, katakana, palabras y gramática básica. Marca «Todavía no lo sé» siempre que lo necesites.</p><p>No mostramos correcciones hasta el final para no influir en las respuestas. Puedes salir y continuar después: guardamos cada respuesta.</p><p class="jp-mini">Es una orientación sobre estas bases, no un examen JLPT. No mide conversación ni comprensión oral. Si repites la prueba, conservamos tus lecciones.</p>${B('jp-begin-test','Empezar prueba')}${B('jp-home','Ahora no','ghost')}</div>`;}
  function run(){
    const r=state.active;if(!r)return '<div class="card"><p>Preparando tu sesión…</p></div>';
    if(r.finished)return result();
    if(r.reading){const u=unit(r.unit);return `<div class="card jp-lead"><div class="jp-label">${r.review?'Repaso':'Lección'} · 5–10 min</div><h2>${E(u.title)}</h2><p>${E(u.desc)}</p></div><div class="card">${u.notes.map(n=>`<p>${E(n)}</p>`).join('')}</div><div class="card"><p class="jp-mini">Después hay ${r.items.length} preguntas. Necesitas al menos un 80 % para consolidar. Si fallas, te explicamos el porqué.</p>${B('jp-practice','Practicar')}</div>`;}
    const item=r.items[r.index],q=byId(item.id),ans=r.answers[r.index],feedback=r.kind==='lesson'&&ans;
    return `<div class="jp-row"><span class="jp-label">${r.kind==='placement'?'Prueba de nivel':r.review?'Repaso':'Práctica'}</span><span class="jp-mini">${r.index+1} / ${r.items.length}</span></div><div class="bar"><i style="width:${Math.round(r.index/r.items.length*100)}%"></i></div><div class="card"><div class="jp-mini">${E(unit(q.unit).title)}</div><h2 class="jp-question">${E(q.q)}</h2><div role="group" aria-label="Respuestas">${item.order.map(i=>`<button class="jp-opt ${feedback?(i===q.a?'jp-good':i===ans.chosen?'jp-bad':''):ans?.chosen===i?'jp-good':''}" data-jp-answer="${i}" ${ans||busy||pending?'disabled':''}>${E(q.opts[i])}${feedback&&i===q.a?' ✓':''}</button>`).join('')}<button class="jp-opt" data-jp-answer="-1" ${ans||busy||pending?'disabled':''}>Todavía no lo sé</button></div>${feedback?`<div role="status" style="margin-top:16px"><b>${ans.ok?'Bien hecho.':ans.chosen===-1?'Lo aprendemos ahora.':'Vamos a fijarlo.'}</b><p>${E(q.why)}</p></div>`:''}${ans?`${!feedback?'<p class="jp-mini">Respuesta registrada. La corrección llega al final.</p>':''}${B('jp-advance',r.index+1===r.items.length?'Ver resultado':'Siguiente')}`:''}</div>${r.kind==='lesson'?`<details class="card"><summary>Consultar explicación</summary>${unit(r.unit).notes.map(n=>`<p>${E(n)}</p>`).join('')}</details>`:''}`;
  }
  function result(){
    const r=state.active,score=r.answers.filter(a=>a.ok).length,pass=score/r.items.length>=.8;
    return `<div class="card jp-lead"><div class="jp-label">${r.kind==='placement'?'Tu punto de partida':'Sesión terminada'}</div><h2>${r.kind==='placement'?'Ya tenemos un mapa':pass?'Una base más firme':'Ya sabemos qué reforzar'}</h2><div class="jp-stat">${score}<span class="jp-mini"> / ${r.items.length}</span></div><p>${r.kind==='placement'?E(placementText(state.placement)):pass?'Lección consolidada. Te propondremos un repaso cuando toque.':'No hace falta correr. La siguiente recomendación refuerza esta lección, con tus errores primero.'}</p>${B('jp-finish','Guardar y ver mi siguiente paso')}</div><div class="sec"><h2>Revisión de respuestas</h2></div>${r.answers.map((a,i)=>{const q=byId(a.id);return `<details class="card jp-review"><summary>${a.ok?'✓':'↻'} ${i+1}. ${E(q.q)}</summary><p class="jp-mini">Tu respuesta: ${a.chosen===-1?'Todavía no lo sé':E(q.opts[a.chosen])}</p><p><b>Correcta: ${E(q.opts[q.a])}</b></p><p>${E(q.why)}</p></details>`;}).join('')}`;
  }
  function draw(){
    if(!alive)return;
    app.innerHTML=shell(`<section class="ja-learn"><header class="top"><button class="btn ghost" id="jp-back" ${busy||pending?'disabled':''}>← ${view==='home'?'Idiomas':'Mi japonés'}</button><div class="grow"><h1 class="small-h">Japonés</h1></div><span class="lang-badge ja">あ</span></header><div class="jp-save" role="status">${busy?'Guardando en tu cuenta…':E(saved)}</div>${error?`<div class="jp-error" role="alert">${E(error)}<button class="btn ghost block" id="jp-retry">Reintentar guardado</button></div>`:''}${view==='home'?home():view==='intro'?intro():run()}</section>`);
    bindNav();
    app.querySelectorAll('[data-tab]').forEach(el=>{el.disabled=busy||!!pending;el.addEventListener('click',()=>{alive=false;},{once:true});});
    const on=(id,fn)=>{const el=document.getElementById(id);if(el)el.onclick=fn;};
    on('jp-back',()=>{if(view==='home'){alive=false;onBack();}else{view='home';draw();}});
    on('jp-home',()=>{view='home';draw();});on('jp-test',()=>{view='intro';draw();});on('jp-retest',()=>{view='intro';draw();});on('jp-begin-test',startPlacement);
    on('jp-resume',()=>{view='run';draw();});on('jp-next',()=>{const r=recommended();startLesson(r.u.id,r.review);});
    on('jp-retry',async()=>{const target=pending;pending=null;await persist(target);});
    on('jp-practice',async()=>{const next=structuredClone(state);next.active.reading=false;await persist(next);});
    on('jp-advance',advance);on('jp-finish',async()=>{const next=structuredClone(state);next.active=null;view='home';await persist(next);});
    app.querySelectorAll('[data-jp-answer]').forEach(el=>el.onclick=()=>answer(Number(el.dataset.jpAnswer)));
    app.querySelectorAll('[data-jp-unit]').forEach(el=>el.onclick=()=>{if(busy||pending)return;if(state.active){view='run';draw();return;}startLesson(el.dataset.jpUnit,!!state.progress[el.dataset.jpUnit]);});
  }
    }
