/* Normaliza Coherente — Escala de Coherencia Universal — App logic */

/* === Utilidades */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const parse = v => {
  if (typeof v !== 'string') return NaN;
  v = v.trim().replace(',', '.').replace(/−/g,'-');
  if (v === '') return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const clamp01 = x => Math.min(1, Math.max(0, x));
const FACTOR_STR = '0.999999999999990';
const FACTOR_NUM = 0.99999999999999; // para cálculo; el string conserva el “0” final
const DEC_EXT = 50; // 50 decimales exactos en el extendido

// i18n helper
const i18n = window.CUi18n || { loadLanguage:()=>{}, t:(k, d)=>d ?? k };

// Temas
const THEME_STORAGE_KEY = 'cu_theme';

// === Elementos
const inObs = $('#inObs'), inMin = $('#inMin'), inMax = $('#inMax');
const outCU = $('#outCU'), outCUExt = $('#outCUExt');
const outCUExtRich = $('#outCUExtRich');
const msg = $('#msg'), factorBadge = $('#factorBadge');
const modeEP = $('#modeEP'), modeNR = $('#modeNR');

// Toast (no invade el área de errores)
const toastBox = $('#toast');
let toastTimer = null;

// Botones frecuentes
const btnClear = $('#btnClear');
const copyCUBtn = $('#copyCU');
const copyCUExtBtn = $('#copyCUExt');

// Contadores de cifras
const cntObs = $('#cntObs'), cntMin = $('#cntMin'), cntMax = $('#cntMax');

// Fórmula (visual)
const fObs = $('#fObs'), fMin = $('#fMin'), fMin2 = $('#fMin2'), fMax = $('#fMax');
const fSign = $('#fSign'), fFactor = $('#fFactor'), fResult = $('#fResult');

// Reconversión
const normName = $('#normName'), normUnit = $('#normUnit');
const normValue = $('#normValue'), normMin = $('#normMin'), normMax = $('#normMax');
const normList = $('#normList');
const templateSelect = $('#scaleTemplates');
const templateNote  = $('#templateNote');
const STORAGE_KEY = 'cu_norms_v1';

// UI adicional
const activeTemplateTag = $('#activeTemplateTag');
const btnVmO = $('#btnVmO');
const btnVMO = $('#btnVMO');
const btnSaveFromTemplate = $('#btnSaveFromTemplate');
const btnApplyNow = $('#btnApplyNow');
const btnUseNorm = $('#btnUseNorm');

// Menú engranaje
const gearButton = $('#gearButton');
const gearMenu = $('#gearMenu');
const langDialog = $('#langDialog');
const themeDialog = $('#themeDialog');
const installMenuBtn = $('#installMenuBtn');

// Valores conocidos (modal)
const openConstantsBtn = $('#openConstants');
const constantsDialog = $('#constantsDialog');
const constantsList = $('#constantsList');
const constantsPrevPage = $('#constantsPrevPage');
const constantsNextPage = $('#constantsNextPage');
const constantsPageLabel = $('#constantsPageLabel');
let constantsPage = 0;

// Utilidades (modal)
const openUtilsBtn = $('#openUtils');
const utilsDialog = $('#utilsDialog');
const utilsPrevPage = $('#utilsPrevPage');
const utilsNextPage = $('#utilsNextPage');
const utilsPageLabel = $('#utilsPageLabel');
const uOriginText = $('#uOriginText');
const uTargetText = $('#uTargetText');
const uOriginIso = $('#uOriginIso');
const uTargetIso = $('#uTargetIso');
const uUnit = $('#uUnit');
const uCalc = $('#uCalc');
const uResult = $('#uResult');
const uCopy = $('#uCopy');
let utilsPage = 0; // por ahora 1 página

// === Modo inverso (CU → Observado)
const invMode = $('#invMode');
const invFromCU = $('#invFromCU');
const invFromCUExt = $('#invFromCUExt');
const invSideRow = $('#invSideRow');
const invSideBelow = $('#invSideBelow');
const invSideAbove = $('#invSideAbove');
const invDo = $('#invDo');
const invStatus = $('#invStatus');

// === Plantillas de escalas (incluye Tiempo)
const SCALE_TEMPLATES = [
  {id:'tempK', group:'Temperatura', label:'Temperatura (Kelvin, K)', name:'Temperatura (Kelvin)', unit:'K',   min:0,        max:5.5e12,   note:'0 K = cero absoluto; récords en plasmas ~5.5×10¹² K.'},
  {id:'tempC', group:'Temperatura', label:'Temperatura (Celsius, °C)', name:'Temperatura (Celsius)', unit:'°C', min:-273.15, max:5.5e12,   note:'−273.15 °C = 0 K; máximos extrapolados desde K.'},
  {id:'tempF', group:'Temperatura', label:'Temperatura (Fahrenheit, °F)', name:'Temperatura (Fahrenheit)', unit:'°F', min:-459.67, max:9.9e12,   note:'−459.67 °F = 0 K; máximos extrapolados desde K.'},

  {id:'ph',    group:'Química',     label:'pH (0–14 clásico)',              name:'pH',                   unit:'',    min:0,        max:14,       note:'Puede ser <0 o >14 en casos extremos.'},
  {id:'phx',   group:'Química',     label:'pH (extremo, −1 a 15)',          name:'pH (extremo)',         unit:'',    min:-1,       max:15,       note:'Soluciones muy concentradas.'},

  {id:'ml',    group:'Geofísica',   label:'Magnitud sísmica local (ML)',    name:'Magnitud sísmica (ML)', unit:'ML', min:-1,       max:9.5,      note:'Histórico hasta ~9.5.'},
  {id:'mw',    group:'Geofísica',   label:'Magnitud de momento (Mw)',       name:'Magnitud de momento (Mw)', unit:'Mw', min:-1,    max:9.5,      note:'Observados hasta ~9.6.'},

  {id:'bf',    group:'Meteorología', label:'Viento (Beaufort)',             name:'Viento (Beaufort)',   unit:'Bf',  min:0,        max:12,       note:'0=calma…12=huracán violento.'},
  {id:'ssh',   group:'Meteorología', label:'Huracanes (Saffir–Simpson)',    name:'Huracanes (Saffir–Simpson)', unit:'Cat', min:1, max:5,       note:'TS por debajo de 1 (no incluida).'},
  {id:'ef',    group:'Meteorología', label:'Tornados (Enhanced Fujita)',    name:'Tornados (EF)',       unit:'EF',  min:0,        max:5,        note:'EF0–EF5.'},

  {id:'mohs',  group:'Materiales',  label:'Dureza (Mohs)',                  name:'Dureza (Mohs)',       unit:'',    min:1,        max:10,       note:''},

  {id:'spl',   group:'Acústica',    label:'Sonido (dB SPL)',                name:'Sonido (SPL)',        unit:'dB',  min:0,        max:194,      note:'Techo práctico en aire ~194 dB.'},

  {id:'mag',   group:'Astronomía',  label:'Magnitud estelar aparente (mag)', name:'Magnitud estelar aparente', unit:'mag', min:-26.74, max:32, note:'Sol ≈ −26.74; JWST/HST ≈ +31–32.'},
  {id:'albedo',group:'Fotometría',  label:'Albedo (0–1)',                   name:'Albedo',              unit:'',    min:0,        max:1,        note:'0=negro perfecto; 1=reflector ideal.'},
  {id:'tcolor',group:'Fotometría',  label:'Temperatura de color (K)',       name:'Temperatura de color', unit:'K',   min:1000,     max:40000,    note:'Uso práctico en iluminación.'},

  {id:'prob',  group:'Estadística', label:'Probabilidad (0–1)',             name:'Probabilidad',        unit:'',    min:0,        max:1,        note:''},
  {id:'probp', group:'Estadística', label:'Probabilidad (%)',               name:'Probabilidad (%)',    unit:'%',   min:0,        max:100,      note:''},

  {id:'bmi',   group:'Salud',       label:'Índice de Masa Corporal (IMC)',  name:'IMC',                 unit:'kg/m²', min:10,     max:188,      note:'Casos humanos extremos ~10–188.'},
  {id:'iq',    group:'Psicometría', label:'CI (IQ de desviación)',          name:'CI (IQ)',             unit:'',    min:40,       max:160,      note:'Depende del test.'},
  {id:'lik5',  group:'Encuestas',   label:'Escala Likert (1–5)',            name:'Likert (1–5)',        unit:'',    min:1,        max:5,        note:''},
  {id:'lik7',  group:'Encuestas',   label:'Escala Likert (1–7)',            name:'Likert (1–7)',        unit:'',    min:1,        max:7,        note:''},

  {id:'shu',   group:'Gastronomía', label:'Picor (Scoville, SHU)',          name:'Picor (Scoville)',    unit:'SHU', min:0,        max:16000000, note:'Capsaicina pura ≈ 16 M.'},

  {id:'uv',    group:'Clima',       label:'Índice UV',                      name:'Índice UV',           unit:'',    min:0,        max:43,       note:'11+ = extremo; récords ≈ 43.'},

  {id:'distkm',group:'Distancia',   label:'Distancia (km) — circunferencia terrestre', name:'Distancia', unit:'km', min:0,       max:40075,    note:'Circunferencia terrestre ≈ 40 075 km.'},
  {id:'freq',  group:'Señales',     label:'Frecuencia (Hz) — audio humano', name:'Frecuencia',          unit:'Hz',  min:0,        max:20000,    note:'≈20–20 000 Hz; aquí 0–20 000 (incluye silencio).'},
  {id:'luma',  group:'Imaging',     label:'Luminancia (cd/m²) — pantallas HDR', name:'Luminancia',     unit:'cd/m²', min:0,      max:10000,    note:'HDR alto ≈ 10 000 cd/m².'},
  {id:'alt',   group:'Geografía',   label:'Altitud (m) — Mar Muerto → Everest', name:'Altitud',        unit:'m',   min:-500,     max:9000,     note:'Aproximado: −430 a 8849 m.'},
  {id:'lambda',group:'Física',      label:'Longitud de onda visible (nm)',  name:'Longitud de onda (visible)', unit:'nm', min:380, max:740, note:'Espectro visible aproximado.'},

  /* Tiempo */
  {id:'time',  group:'Tiempo',      label:'Tiempo (s) — t_P → año',          name:'Tiempo (s)',         unit:'s',   min:5.391247e-44, max:31557600, note:'t_P ≈ 5.391247×10⁻⁴⁴ s; año juliano ≈ 31 557 600 s.'},
];

// === Rótulo del header: “Normaliza Coherente” ===
(function buildTagline(){
  const container = $('#tagline');
  if (!container) return;
  const words = ['Normaliza','Coherente'];

  words.forEach((w, idx) => {
    if (!w) return;
    const first = document.createElement('span');
    first.className = 'glyph orb-gold';
    first.textContent = w[0];
    container.appendChild(first);

    for (let i = 1; i < w.length; i++){
      const s = document.createElement('span');
      s.className = 'glyph sun-i';
      s.textContent = w[i];
      container.appendChild(s);
    }

    if (idx < words.length - 1){
      const gap = document.createElement('span');
      gap.className = 'tag-gap';
      gap.textContent = ' ';
      container.appendChild(gap);
    }
  });
})();

/* ===================== UI: toast ====================================== */
function toast(text, type='info', timeout=2600){
  const t = String(text || '').trim();
  if (!t) return;

  // fallback si no existe el contenedor
  if (!toastBox){
    msg.textContent = t;
    setTimeout(()=>{ if (msg.textContent === t) msg.textContent = ''; }, timeout);
    return;
  }

  toastBox.textContent = t;
  toastBox.dataset.type = type;
  toastBox.hidden = false;
  toastBox.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{
    toastBox.classList.remove('show');
    // espera la transición antes de ocultar para evitar salto visual
    setTimeout(()=>{ toastBox.hidden = true; }, 200);
  }, timeout);
}

/* ===================== Cálculo directo (Obs → CU) ====================== */
function compute() {
  if (invMode?.checked) { updateCounters(); return; }

  msg.textContent = '';

  const obs = parse(inObs.value);
  const vmin = parse(inMin.value);
  const vmax = parse(inMax.value);

  // Actualiza fórmula (visual)
  fObs.textContent = isFinite(obs) ? obs : 'Obs';
  fMin.textContent = isFinite(vmin) ? vmin : 'Min';
  fMin2.textContent = isFinite(vmin) ? vmin : 'Min';
  fMax.textContent = isFinite(vmax) ? vmax : 'Max';
  fFactor.textContent = FACTOR_STR;

  // Contadores
  updateCounters();

  if (!isFinite(obs) || !isFinite(vmin) || !isFinite(vmax)) {
    outCU.value = '—';
    outCUExt.value = '—';
    outCUExtRich.textContent = '—';
    updateFactorSign('+', false);
    fResult.textContent = '—';
    return;
  }

  if (vmax === vmin) {
    msg.textContent = i18n.t('errors.equalMinMax','Máximo y mínimo no pueden ser iguales.');
    outCU.value = '—';
    outCUExt.value = '—';
    outCUExtRich.textContent = '—';
    updateFactorSign('+', false);
    fResult.textContent = '—';
    return;
  }

  const min = Math.min(vmin, vmax);
  const max = Math.max(vmin, vmax);

  const base = (obs - min) / (max - min);
  const inside = (obs >= min && obs <= max);
  const sign = inside ? +1 : -1;
  const signChar = sign > 0 ? '+' : '−';
  updateFactorSign(signChar, true);

  let magnitude;
  if (modeNR.checked) {
    magnitude = clamp01(Math.abs(base));
    if (!inside) {
      msg.textContent = i18n.t(
        'errors.outOfRangeNR',
        'Observado fuera de rango; en NR se acota a [0,1]. Considera redefinir Mín/Máx.'
      );
    }
  } else {
    magnitude = Math.abs(base); // EP: sin recorte
  }

  const cu = sign * magnitude * FACTOR_NUM;

  // Formatos
  outCU.value = formatGMS(cu, 14);
  const plainExt = formatFixed(cu, DEC_EXT);
  outCUExt.value = plainExt;
  outCUExtRich.innerHTML = buildCUExtRich(plainExt);
  fResult.textContent = outCU.value;
}

function formatGMS(x, dec){ return (Number(x).toFixed(dec) + '0'); }
function formatFixed(x, dec){ return Number(x).toFixed(dec); }

function buildCUExtRich(plain){
  if (!plain || plain==='—') return '—';
  const neg = plain.startsWith('-');
  const s = neg ? plain.slice(1) : plain;
  const [intPart, decsRaw] = s.split('.');
  const decs = (decsRaw || '');
  const N = decs.length;          // 50
  const K = 16*3;                  // 48
  const rem = Math.max(0, N - K);  // 2

  const r  = decs.slice(0, rem);
  const g3 = decs.slice(rem, rem+16);
  const g2 = decs.slice(rem+16, rem+32);
  const g1 = decs.slice(rem+32, rem+48);

  const signChar = neg ? '−' : '';
  return `${signChar}${intPart}.${[
    r,
    `<span class="dg g3">${g3}</span>`,
    `<span class="dg g2">${g2}</span>`,
    `<span class="dg g1">${g1}</span>`
  ].join('')}`;
}

function updateFactorSign(signChar, show){
  factorBadge.textContent = `${signChar} ${FACTOR_STR}`;
  fSign.textContent = show ? signChar : '±';
}

/* === Contadores de cifras */
function countDigits(str){ if (typeof str !== 'string') return 0; return (str.replace(/[^0-9]/g,'') || '').length; }
function updateCounters(){
  cntObs.textContent = countDigits(inObs.value);
  cntMin.textContent = countDigits(inMin.value);
  cntMax.textContent = countDigits(inMax.value);
}

// === Eventos directos
[inObs, inMin, inMax].forEach(el => el?.addEventListener('input', compute));
modeEP?.addEventListener('change', ()=>{ compute(); if(invMode.checked) inverseMaybe(); });
modeNR?.addEventListener('change', ()=>{ compute(); if(invMode.checked) inverseMaybe(); });

btnClear?.addEventListener('click', () => {
  inObs.value = ''; inMin.value = ''; inMax.value = '';
  msg.textContent = ''; fResult.textContent = '—';
  updateFactorSign('+', false);
  outCU.value = '—'; outCUExt.value = '—';
  outCUExtRich.textContent = '—';
  updateCounters();
  if (activeTemplateTag){
    activeTemplateTag.textContent = '';
    activeTemplateTag.hidden = true;
  }
});

copyCUBtn?.addEventListener('click', ()=> copy(outCU.value));
copyCUExtBtn?.addEventListener('click', ()=> copy(outCUExt.value));

async function copy(t){
  const txt = (t || '').trim();
  if (!txt || txt === '—') return;
  try{
    await navigator.clipboard?.writeText(txt);
    toast(i18n.t('common.copied','Copiado.'), 'ok');
  }catch{
    // fallback básico
    try{
      const ta = document.createElement('textarea');
      ta.value = txt;
      ta.setAttribute('readonly','');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast(i18n.t('common.copied','Copiado.'), 'ok');
    }catch{ /* noop */ }
  }
}

/* ===================== Reconversión de escala (guardar/usar) ================== */
function loadNorms(){
  try{
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(arr)) {
      return arr.map(r => ({
        name: r.name,
        unit: r.unit || '',
        min: r.min,
        max: r.max,
        value: (typeof r.value === 'number' && isFinite(r.value)) ? r.value : undefined
      }));
    }
    return [];
  }catch{ return []; }
}
function saveNorms(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }
function refreshNormList(){
  const arr = loadNorms();
  const prevVal = normList.value;
  normList.innerHTML = '';
  if (arr.length === 0){
    const opt = document.createElement('option');
    opt.textContent = i18n.t('reconv.noNorms','— No hay normalizaciones guardadas —');
    opt.value = '';
    normList.appendChild(opt);
    normName.value = ''; normUnit.value = ''; normValue.value = ''; normMin.value = ''; normMax.value = '';
    return;
  }
  arr.forEach((n,i)=>{
    const opt = document.createElement('option');
    const unit = n.unit ? ` [${n.unit}]` : '';
    opt.textContent = `${n.name}${unit} — min:${n.min} · max:${n.max}`;
    opt.value = String(i);
    normList.appendChild(opt);
  });
  if (prevVal && Number(prevVal) < arr.length) { normList.value = prevVal; } else { normList.value = '0'; }
  normList.dispatchEvent(new Event('change'));
}
function loadSelectedNormToFields(){
  const idx = Number(normList.value);
  const arr = loadNorms();
  const rec = arr[idx];
  if (!rec) return;
  normName.value = rec.name || '';
  normUnit.value = rec.unit || '';
  normMin.value = isFinite(rec.min) ? String(rec.min) : '';
  normMax.value = isFinite(rec.max) ? String(rec.max) : '';
  if (typeof rec.value === 'number' && isFinite(rec.value)) {
    normValue.value = String(rec.value);
  }
  toast(
    i18n.t('reconv.loaded','Cargada “{name}” en Reconversión.').replace('{name}', rec.name || ''),
    'ok'
  );

  if (templateSelect) templateSelect.value = '';
  templateNote.textContent = '';
  if (activeTemplateTag){ activeTemplateTag.textContent = ''; activeTemplateTag.hidden = true; }

  if (invMode.checked) inverseMaybe();
}
normList?.addEventListener('change', loadSelectedNormToFields);

$('#btnSaveNorm')?.addEventListener('click', ()=>{
  const name = normName.value.trim();
  const unit = normUnit.value.trim();
  const vmin = parse(normMin.value);
  const vmax = parse(normMax.value);
  const val  = parse(normValue.value);

  if (!name){ toast(i18n.t('reconv.errors.noName','Ponle un nombre a la normalización.'), 'warn'); return; }
  if (!isFinite(vmin) || !isFinite(vmax)){ toast(i18n.t('reconv.errors.revMinMax','Revisa Mín y Máx.'), 'warn'); return; }
  if (vmin === vmax){ toast(i18n.t('errors.equalMinMax','Mín y Máx no pueden ser iguales.'), 'bad'); return; }

  const arr = loadNorms();
  const existingIdx = arr.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
  const rec = { name, unit, min: vmin, max: vmax };
  if (isFinite(val)) rec.value = val;

  if (existingIdx >= 0) arr[existingIdx] = rec; else arr.push(rec);
  saveNorms(arr);
  refreshNormList();
  const idx = arr.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
  if (idx >= 0) { normList.value = String(idx); loadSelectedNormToFields(); }
  toast(i18n.t('reconv.saved','Normalización guardada.'), 'ok');
});

btnApplyNow?.addEventListener('click', ()=>{
  if (invMode.checked){
    toast(i18n.t('inverse.blocked','Modo inverso activo: introduce CU en Resultados.'), 'warn');
    return;
  }

  const val = parse(normValue.value);
  const vmin = parse(normMin.value);
  const vmax = parse(normMax.value);
  if (!isFinite(val) || !isFinite(vmin) || !isFinite(vmax)){
    toast(i18n.t('reconv.errors.complete','Completa Valor/Mín/Máx.'), 'warn');
    return;
  }
  inObs.value = String(val);
  inMin.value = String(vmin);
  inMax.value = String(vmax);
  compute();
  toast(i18n.t('reconv.applied','Aplicado a Entradas.'), 'ok');
});

btnUseNorm?.addEventListener('click', ()=>{
  if (invMode.checked){
    toast(i18n.t('inverse.blockedObs','Modo inverso activo: el modo directo está bloqueado.'), 'warn');
    return;
  }
  const vmin = parse(normMin.value);
  const vmax = parse(normMax.value);
  const val  = parse(normValue.value);
  if (!isFinite(vmin) || !isFinite(vmax)) {
    toast(i18n.t('reconv.errors.revMinMax','Revisa Mín/Máx en Reconversión.'), 'warn');
    return;
  }
  inMin.value = String(vmin);
  inMax.value = String(vmax);
  inObs.value = isFinite(val) ? String(val) : '';
  compute();
  const name = normName.value.trim();
  toast(name
    ? i18n.t('reconv.useNamed','Usando “{name}” en Entradas.').replace('{name}', name)
    : i18n.t('reconv.use','Normalización aplicada a Entradas.'),
    'ok'
  );
});

$('#btnDeleteNorm')?.addEventListener('click', ()=>{
  const idx = Number(normList.value);
  const arr = loadNorms();
  if (!arr[idx]) return;
  const name = arr[idx].name;
  arr.splice(idx,1);
  saveNorms(arr);
  refreshNormList();
  toast(i18n.t('reconv.deleted','Eliminada “{name}”.').replace('{name}', name || ''), 'ok');
});

/* ===================== Tiempo (plantillas dinámicas) ====================== */

const PLANCK_TIME_S = 5.391247e-44; // aprox.
const TARGET_UTC = { y: 2025, m: 12, d: 31, hh: 23, mm: 59, ss: 59 }; // 31-dic-2025 23:59:59

function tsUTC(y, m, d, hh=0, mm=0, ss=0){
  const t = new Date(0);
  t.setUTCFullYear(y, (m|0)-1, (d|0));
  t.setUTCHours((hh|0), (mm|0), (ss|0), 0);
  return t.getTime();
}
function secBetween(a, b){
  const A = tsUTC(a.y, a.m, a.d, a.hh, a.mm, a.ss);
  const B = tsUTC(b.y, b.m, b.d, b.hh, b.mm, b.ss);
  return Math.max(0, Math.floor((B - A) / 1000));
}
function monthsBetween(a, b){
  let m = (b.y - a.y) * 12 + (b.m - a.m);
  const prior =
    (b.d < a.d) ||
    (b.d === a.d && (b.hh < a.hh ||
      (b.hh === a.hh && (b.mm < a.mm || (b.mm === a.mm && b.ss < a.ss)))));
  if (prior) m -= 1;
  return Math.max(0, m);
}
function yearsBetween(a, b){
  let y = b.y - a.y;
  const prior =
    (b.m < a.m) ||
    (b.m === a.m && ((b.d < a.d) ||
      (b.d === a.d && (b.hh < a.hh ||
        (b.hh === a.hh && (b.mm < a.mm || (b.mm === a.mm && b.ss < a.ss)))))));
  if (prior) y -= 1;
  return Math.max(0, y);
}

const SEC_PER_MIN = 60, SEC_PER_H = 3600, SEC_PER_D = 86400, SEC_PER_W = 604800;
const SEC_PER_Y_JUL = 31557600;
const SEC_PER_MO_JUL = SEC_PER_Y_JUL / 12;
function planckIn(unit){
  switch(unit){
    case 's':   return PLANCK_TIME_S;
    case 'min': return PLANCK_TIME_S / SEC_PER_MIN;
    case 'h':   return PLANCK_TIME_S / SEC_PER_H;
    case 'd':   return PLANCK_TIME_S / SEC_PER_D;
    case 'sem': return PLANCK_TIME_S / SEC_PER_W;
    case 'mes': return PLANCK_TIME_S / SEC_PER_MO_JUL;
    case 'año': return PLANCK_TIME_S / SEC_PER_Y_JUL;
    default:    return PLANCK_TIME_S;
  }
}

const EPOCHS = [
  { key:'A', label:'Año 1 (seg. 1) → 31‑12‑2025 23:59:59',          origin:{ y:1, m:1, d:1, hh:0, mm:0, ss:1 } },
  { key:'B', label:'10000 a.C. (seg. 1) → 31‑12‑2025 23:59:59',     origin:{ y:-9999, m:1, d:1, hh:0, mm:0, ss:1 } },
  { key:'C', label:'Natividad (seg. 1) → 31‑12‑2025 23:59:59',      origin:{ y:0, m:12, d:25, hh:0, mm:0, ss:1 } },
];

function buildTimeTemplates(){
  const out = [];
  const U = [
    { u:'s',   unit:'s',    make:(a)=> secBetween(a, TARGET_UTC) },
    { u:'min', unit:'min',  make:(a)=> Math.floor(secBetween(a, TARGET_UTC) / SEC_PER_MIN) },
    { u:'h',   unit:'h',    make:(a)=> Math.floor(secBetween(a, TARGET_UTC) / SEC_PER_H) },
    { u:'d',   unit:'d',    make:(a)=> Math.floor(secBetween(a, TARGET_UTC) / SEC_PER_D) },
    { u:'sem', unit:'sem',  make:(a)=> Math.floor(secBetween(a, TARGET_UTC) / SEC_PER_W) },
    { u:'mes', unit:'mes',  make:(a)=> monthsBetween(a, TARGET_UTC) },
    { u:'año', unit:'año',  make:(a)=> yearsBetween(a, TARGET_UTC) },
  ];
  for (const ep of EPOCHS){
    for (const kv of U){
      const maxVal = kv.make(ep.origin);
      const minVal = planckIn(kv.u);
      out.push({
        id: `time_${kv.u}_${ep.key}`,
        group: 'Tiempo',
        label: `Tiempo (${kv.unit}) — ${ep.label}`,
        name: `Tiempo (${kv.unit}) — ${ep.key}`,
        unit: kv.unit,
        min: minVal,
        max: maxVal,
        note: [
          `Origen: ${ep.label.replace(' → 31‑12‑2025 23:59:59','')}.`,
          `Destino: 31‑12‑2025 23:59:59 (UTC).`,
          `Mínimo: tₚ (tiempo de Planck) en ${kv.unit}.`,
          (kv.u==='mes' || kv.u==='año')
            ? 'Meses/años: conteo discreto por calendario. Para convertir tₚ se usa año juliano (365.25 d).'
            : 'Unidades exactas vía segundos UTC.',
          'Calendario: gregoriano proléptico; año 0 = 1 a.C.'
        ].join(' ')
      });
    }
  }
  return out;
}

const MONTHS_ES = {
  'enero':1,'febrero':2,'marzo':3,'abril':4,'mayo':5,'junio':6,
  'julio':7,'agosto':8,'septiembre':9,'setiembre':9,'octubre':10,'noviembre':11,'diciembre':12
};
function normStr(s){
  return (s||'').toLowerCase().normalize('NFD')
    .replace(/\p{Diacritic}/gu,'')
    .replace(/[.,]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function parseYearAstronomical(raw){
  const s = normStr(raw);
  const m = s.match(/(-?\d{1,7})\s*(ac|a\.c\.|a c|antes de cristo|bc|bce)?$/i);
  if(!m) return null;
  const y = parseInt(m[1], 10);
  const isBCE = !!m[2];
  return isBCE ? (1 - Math.abs(y)) : y;
}
function parseDateSmart(input){
  const s = normStr(input);
  if(!s) return null;

  let re1 = /(\d{1,2})\s+de\s+([a-z]+)\s+de\s+([-\dac .]+)(?:\s+a\s+las\s+(\d{1,2})(?::(\d{1,2})(?::(\d{1,2}))?)?\s*(am|pm)?)?(?:\s+(\d{1,2})\s*seg(?:undos?)?)?/i;
  let m = s.match(re1);
  if(m){
    let d = +m[1];
    let monName = m[2]; let mo = MONTHS_ES[monName]; if(!mo) return null;
    let y = parseYearAstronomical(m[3]); if(y===null) return null;
    let hh = +(m[4]||0), mm = +(m[5]||0), ss = +(m[6]||0);
    const ampm = m[7]; const extraSec = +(m[8]||0);
    if(ampm === 'am'){ if(hh===12) hh = 0; }
    if(ampm === 'pm'){ if(hh<12) hh += 12; }
    ss += extraSec;
    return { y, m:mo, d, hh, mm, ss };
  }

  let re3 = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](-?\d{1,7})(?:[ t](\d{1,2})(?::(\d{1,2})(?::(\d{1,2}))?)?)?$/;
  m = s.match(re3);
  if(m){
    let d = +m[1], mo=+m[2]; let y = parseYearAstronomical(m[3]); if(y===null) y = parseInt(m[3],10);
    let hh=+(m[4]||0), mm=+(m[5]||0), ss=+(m[6]||0);
    return { y, m:mo, d, hh, mm, ss };
  }

  let re2 = /^(-?\d{1,7})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[ t](\d{1,2})(?::(\d{1,2})(?::(\d{1,2}))?)?)?$/;
  m = s.match(re2);
  if(m){
    let y = parseYearAstronomical(m[1]); if(y===null) y = parseInt(m[1],10);
    let mo = +m[2], d = +m[3], hh=+(m[4]||0), mm=+(m[5]||0), ss=+(m[6]||0);
    return { y, m:mo, d, hh, mm, ss };
  }

  return null;
}
function isoLabel(o){
  if(!o) return '—';
  const pad=(n)=>String(n).padStart(2,'0');
  const y=o.y; return `${y}-${pad(o.m)}-${pad(o.d)} ${pad(o.hh)}:${pad(o.mm)}:${pad(o.ss)} UTC`;
}
function toMillisUTC(o){
  if(!o) return NaN;
  const {y,m,d,hh,mm,ss} = o;
  return tsUTC(y, m, d, hh, mm, ss);
}

function ordinalBetween(origin, target, unit){
  const A = toMillisUTC(origin), B = toMillisUTC(target);
  if(!Number.isFinite(A) || !Number.isFinite(B)) return { ok:false, msg:i18n.t('utils.errors.revDates','Revisa las fechas.') };
  if(B < A) return { ok:false, msg:i18n.t('utils.errors.targetBefore','El destino debe ser posterior o igual al origen.') };
  const deltaSec = Math.floor((B - A) / 1000);

  if(unit==='mes')  return { ok:true, val: monthsBetween(origin, target) + 1 };
  if(unit==='año')  return { ok:true, val: yearsBetween(origin, target) + 1 };

  if(unit==='lustro'){ const y = yearsBetween(origin, target); return { ok:true, val: Math.floor(y/5)+1 }; }
  if(unit==='decada'){ const y = yearsBetween(origin, target); return { ok:true, val: Math.floor(y/10)+1 }; }
  if(unit==='c25'){ const y = yearsBetween(origin, target); return { ok:true, val: Math.floor(y/25)+1 }; }
  if(unit==='c50'){ const y = yearsBetween(origin, target); return { ok:true, val: Math.floor(y/50)+1 }; }
  if(unit==='c75'){ const y = yearsBetween(origin, target); return { ok:true, val: Math.floor(y/75)+1 }; }
  if(unit==='c100'){ const y = yearsBetween(origin, target); return { ok:true, val: Math.floor(y/100)+1 }; }

  const SEC_PER = { s:1, min:SEC_PER_MIN, h:SEC_PER_H, d:SEC_PER_D, sem:SEC_PER_W }[unit] || 1;
  const k = Math.floor(deltaSec / SEC_PER) + 1;
  return { ok:true, val: k };
}

const TIME_TEMPLATES = buildTimeTemplates();
SCALE_TEMPLATES.push(...TIME_TEMPLATES);

function buildTemplateSelect(){
  if (!templateSelect) return;
  templateSelect.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = i18n.t('reconv.templatePlaceholder','— Selecciona plantilla —');
  templateSelect.appendChild(placeholder);
  const groups = [...new Set(SCALE_TEMPLATES.map(t => t.group || 'General'))];
  for (const g of groups){
    const og = document.createElement('optgroup');
    og.label = g;
    SCALE_TEMPLATES.filter(t => (t.group || 'General') === g).forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.label;
      og.appendChild(opt);
    });
    templateSelect.appendChild(og);
  }
}
function applyTemplateById(id){
  const t = SCALE_TEMPLATES.find(x => x.id === id);
  if (!t) { templateNote.textContent = ''; return; }
  normName.value = t.name || '';
  normUnit.value = t.unit || '';
  normMin.value = String(t.min);
  normMax.value = String(t.max);
  normValue.value = '';
  templateNote.textContent = t.note || '';
  toast(i18n.t('reconv.templateApplied','Plantilla aplicada. Completa “Valor a normalizar”.'), 'ok');

  if (activeTemplateTag){
    activeTemplateTag.textContent = t.label;
    activeTemplateTag.hidden = false;
  }

  if (invMode.checked) inverseMaybe();
}
templateSelect?.addEventListener('change', (e)=>{
  const id = e.target.value;
  if (!id) {
    templateNote.textContent = '';
    if (activeTemplateTag){
      activeTemplateTag.textContent = '';
      activeTemplateTag.hidden = true;
    }
    return;
  }
  applyTemplateById(id);
});

btnSaveFromTemplate?.addEventListener('click', ()=>{
  const id = templateSelect?.value;
  const t = SCALE_TEMPLATES.find(x => x.id === id);
  if (!t){
    toast(i18n.t('reconv.errors.selectTemplate','Selecciona primero una plantilla.'), 'warn');
    return;
  }

  const name = (normName.value.trim() || t.name || t.label || 'Rango');
  const unit = (normUnit.value.trim() || t.unit || '');
  const vmin = isFinite(parse(normMin.value)) ? parse(normMin.value) : t.min;
  const vmax = isFinite(parse(normMax.value)) ? parse(normMax.value) : t.max;

  if (!isFinite(vmin) || !isFinite(vmax)) {
    toast(i18n.t('reconv.errors.revMinMaxSave','Revisa Mín y Máx antes de guardar.'), 'warn');
    return;
  }
  if (vmin === vmax) {
    toast(i18n.t('errors.equalMinMax','Mín y Máx no pueden ser iguales.'), 'bad');
    return;
  }

  const arr = loadNorms();
  const existingIdx = arr.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
  const rec = { name, unit, min: vmin, max: vmax };
  if (isFinite(parse(normValue.value))) rec.value = parse(normValue.value);

  if (existingIdx >= 0) arr[existingIdx] = rec; else arr.push(rec);
  saveNorms(arr);
  refreshNormList();
  const idx = arr.findIndex(x => x.name.toLowerCase() === name.toLowerCase());
  if (idx >= 0) { normList.value = String(idx); loadSelectedNormToFields(); }
  toast(i18n.t('reconv.savedFromTemplate','Guardado como normalización.'), 'ok');
});

/* === Atajos VmO / VMO en Entradas === */
btnVmO?.addEventListener('click', ()=>{ inMin.value = '0.000000000000010'; compute(); });
btnVMO?.addEventListener('click', ()=>{ inMax.value = '0.999999999999990'; compute(); });

/* === Valores conocidos (60 números, 6 páginas) === */
const KNOWN_CONSTANTS = [
  { name:'VmO (Valor Mínimo Observable)', value:'0.000000000000010', desc:'Mínimo operativo asintótico (positivo).' },
  { name:'VMO (Valor Máximo Observable)', value:'0.999999999999990', desc:'Máximo operativo asintótico (positivo).' },
  { name:'Centro estructural ideal (Cₛ)', value:'0.000000000000000', desc:'Límite ideal inalcanzable en la escala CU.' },

  { name:'π (pi)', value:'3.141592653589793', desc:'Razón circunferencia/diámetro.' },
  { name:'e (Euler)', value:'2.718281828459045', desc:'Base de logaritmos naturales.' },
  { name:'φ (razón áurea)', value:'1.618033988749895', desc:'(1+√5)/2.' },
  { name:'√2', value:'1.4142135623730951', desc:'Raíz cuadrada de 2.' },
  { name:'ln(2)', value:'0.6931471805599453', desc:'Logaritmo natural de 2.' },
  { name:'γ (Euler–Mascheroni)', value:'0.5772156649015329', desc:'Constante de Euler–Mascheroni.' },
  { name:'G (Catalan)', value:'0.915965594177219', desc:'Constante de Catalan.' },

  { name:'c (velocidad de la luz)', value:'299792458', desc:'m/s (exacta, SI).' },
  { name:'h (constante de Planck)', value:'6.62607015e-34', desc:'J·s (exacta, SI).' },
  { name:'ħ (Planck reducida)', value:'1.054571817e-34', desc:'J·s (≈).' },
  { name:'k (Boltzmann)', value:'1.380649e-23', desc:'J/K (exacta, SI).' },
  { name:'Nₐ (Avogadro)', value:'6.02214076e23', desc:'mol⁻¹ (exacta, SI).' },
  { name:'R (constante de los gases)', value:'8.314462618', desc:'J/(mol·K).' },
  { name:'e (carga elemental)', value:'1.602176634e-19', desc:'C (exacta, SI).' },
  { name:'G (gravitación universal)', value:'6.67430e-11', desc:'m³/(kg·s²) (≈).' },
  { name:'σ (Stefan–Boltzmann)', value:'5.670374419e-8', desc:'W/(m²·K⁴) (≈).' },
  { name:'b (Wien)', value:'2.897771955e-3', desc:'m·K (≈).' },

  { name:'mₑ (masa del electrón)', value:'9.1093837015e-31', desc:'kg (≈).' },
  { name:'mₚ (masa del protón)', value:'1.67262192369e-27', desc:'kg (≈).' },
  { name:'mₙ (masa del neutrón)', value:'1.67492749804e-27', desc:'kg (≈).' },
  { name:'α (estructura fina)', value:'7.2973525693e-3', desc:'Constante adimensional (≈).' },
  { name:'a₀ (radio de Bohr)', value:'5.29177210903e-11', desc:'m (≈).' },
  { name:'R∞ (Rydberg)', value:'10973731.568160', desc:'m⁻¹ (≈).' },
  { name:'Z₀ (impedancia del vacío)', value:'376.730313668', desc:'Ω (≈).' },
  { name:'ε₀ (permitividad del vacío)', value:'8.8541878128e-12', desc:'F/m (≈).' },
  { name:'μ₀ (permeabilidad del vacío)', value:'1.25663706212e-6', desc:'N/A² (≈).' },
  { name:'F (Faraday)', value:'96485.33212', desc:'C/mol (≈).' },

  { name:'tₚ (tiempo de Planck)', value:'5.391247e-44', desc:'s (≈).' },
  { name:'ℓₚ (longitud de Planck)', value:'1.616255e-35', desc:'m (≈).' },
  { name:'mₚ (masa de Planck)', value:'2.176434e-8', desc:'kg (≈).' },
  { name:'Tₚ (temperatura de Planck)', value:'1.416784e32', desc:'K (≈).' },
  { name:'1 eV (en joules)', value:'1.602176634e-19', desc:'J (exacta, SI).' },
  { name:'atm estándar (presión)', value:'101325', desc:'Pa.' },
  { name:'g₀ (gravedad estándar)', value:'9.80665', desc:'m/s².' },
  { name:'0 °C (en K)', value:'273.15', desc:'K (exacta por definición de °C).' },
  { name:'100 °C (en K)', value:'373.15', desc:'K (punto de ebullición del agua a 1 atm).' },

  { name:'1 minuto (segundos)', value:'60', desc:'s.' },
  { name:'1 hora (segundos)', value:'3600', desc:'s.' },
  { name:'1 día (segundos)', value:'86400', desc:'s.' },
  { name:'1 semana (segundos)', value:'604800', desc:'s.' },
  { name:'Año juliano (segundos)', value:'31557600', desc:'s (365.25 días).' },
  { name:'Mes juliano (segundos)', value:'2629800', desc:'s (año juliano/12).' },
  { name:'Frecuencia audio sup. típica', value:'20000', desc:'Hz (≈ límite humano).' },
  { name:'Techo SPL en aire (aprox.)', value:'194', desc:'dB SPL (≈).' },
  { name:'Índice UV extremo (récord aprox.)', value:'43', desc:'Valor muy alto reportado en condiciones excepcionales.' },
  { name:'Scoville (capsaicina pura)', value:'16000000', desc:'SHU (≈).' },

  { name:'Radio medio de la Tierra', value:'6371000', desc:'m (≈).' },
  { name:'Circunferencia terrestre', value:'40075000', desc:'m (≈ 40 075 km).' },
  { name:'Masa de la Tierra', value:'5.9722e24', desc:'kg (≈).' },
  { name:'Unidad astronómica (AU)', value:'149597870700', desc:'m (exacta, SI).' },
  { name:'Año luz', value:'9.4607304725808e15', desc:'m (≈).' },
  { name:'Parsec', value:'3.08567758149137e16', desc:'m (≈).' },
  { name:'Masa del Sol', value:'1.98847e30', desc:'kg (≈).' },
  { name:'Radio del Sol', value:'6.957e8', desc:'m (≈).' },
  { name:'Distancia media Tierra–Luna', value:'384400000', desc:'m (≈).' },
  { name:'Velocidad del sonido (20 °C)', value:'343', desc:'m/s (≈ en aire seco).' },
];

/* NUEVO: asignar un valor conocido a Mín / Obs / Máx (Reconversión) */
function assignKnownConstant(target, c){
  if (!c) return;

  if (invMode?.checked){
    toast(i18n.t('inverse.blocked','Modo inverso activo: introduce CU en Resultados.'), 'warn');
    return;
  }

  const map = {
    min: { el: normMin,  label: i18n.t('constants.fieldMin','Mínimo') },
    obs: { el: normValue,label: i18n.t('constants.fieldObs','Valor (observado)') },
    max: { el: normMax,  label: i18n.t('constants.fieldMax','Máximo') },
  };

  const dest = map[target];
  if (!dest?.el) return;

  dest.el.value = c.value;

  // Un pequeño enfoque “amable” solo en Observado
  if (target === 'obs') dest.el.focus?.({ preventScroll:true });

  toast(
    i18n.t('constants.assignedTo','Asignado “{name}” a {field}.')
      .replace('{name}', c.name)
      .replace('{field}', dest.label),
    'ok'
  );
}

function renderConstantsPage(){
  const perPage = 10;

  if (!Array.isArray(KNOWN_CONSTANTS) || KNOWN_CONSTANTS.length === 0){
    constantsList.innerHTML = `<div class="tiny muted">${i18n.t('constants.empty','No hay valores cargados.')}</div>`;
    if (constantsPageLabel) constantsPageLabel.textContent = '—';
    if (constantsPrevPage) constantsPrevPage.disabled = true;
    if (constantsNextPage) constantsNextPage.disabled = true;
    return;
  }

  const totalPages = Math.ceil(KNOWN_CONSTANTS.length / perPage);
  constantsPage = Math.max(0, Math.min(constantsPage, totalPages - 1));
  const start = constantsPage * perPage;
  const items = KNOWN_CONSTANTS.slice(start, start + perPage);

  constantsList.innerHTML = '';
  for (const c of items){
    const card = document.createElement('div');
    card.className = 'const-item';

    const name = document.createElement('div');
    name.className = 'const-name';
    name.textContent = c.name;

    const value = document.createElement('div');
    value.className = 'const-value mono';
    value.textContent = c.value;

    // Acciones: 3 botones (Mín / Obs / Máx)
    const actions = document.createElement('div');
    actions.className = 'const-actions';

    const bMin = document.createElement('button');
    bMin.className = 'btn small const-action';
    bMin.type = 'button';
    bMin.textContent = i18n.t('constants.toMin','→ Mín');
    bMin.title = i18n.t('constants.useMin','Poner en Mínimo');
    bMin.addEventListener('click', ()=> assignKnownConstant('min', c));

    const bObs = document.createElement('button');
    bObs.className = 'btn small const-action';
    bObs.type = 'button';
    bObs.textContent = i18n.t('constants.toObs','→ Obs');
    bObs.title = i18n.t('constants.useObs','Poner en Valor (observado)');
    bObs.addEventListener('click', ()=> assignKnownConstant('obs', c));

    const bMax = document.createElement('button');
    bMax.className = 'btn small const-action';
    bMax.type = 'button';
    bMax.textContent = i18n.t('constants.toMax','→ Máx');
    bMax.title = i18n.t('constants.useMax','Poner en Máximo');
    bMax.addEventListener('click', ()=> assignKnownConstant('max', c));

    actions.appendChild(bMin);
    actions.appendChild(bObs);
    actions.appendChild(bMax);

    const desc = document.createElement('div');
    desc.className = 'const-desc';
    desc.textContent = c.desc || '';

    card.appendChild(name);
    card.appendChild(value);
    card.appendChild(actions);
    card.appendChild(desc);
    constantsList.appendChild(card);
  }

  if (constantsPageLabel) constantsPageLabel.textContent = `Página ${constantsPage+1}/${totalPages}`;
  if (constantsPrevPage) constantsPrevPage.disabled = constantsPage <= 0;
  if (constantsNextPage) constantsNextPage.disabled = constantsPage >= totalPages - 1;
}

/* ===================== Utilidades (Conversor fecha → ordinal) ====================== */

function renderUtilsPager(){
  const totalPages = 1;
  utilsPage = Math.max(0, Math.min(utilsPage, totalPages - 1));
  if (utilsPageLabel) utilsPageLabel.textContent = `Página ${utilsPage+1}/${totalPages}`;
  if (utilsPrevPage) utilsPrevPage.disabled = true;
  if (utilsNextPage) utilsNextPage.disabled = true;
}
function updateUtilsIsoPreviews(){
  if (!uOriginIso || !uTargetIso) return;
  const o = parseDateSmart(uOriginText?.value);
  const t = parseDateSmart(uTargetText?.value);
  uOriginIso.textContent = isoLabel(o);
  uTargetIso.textContent = isoLabel(t);
}
function utilsCalc(){
  updateUtilsIsoPreviews();
  const o = parseDateSmart(uOriginText?.value);
  const t = parseDateSmart(uTargetText?.value);
  if (!o || !t){
    if (uResult) uResult.value = '—';
    toast(i18n.t('utils.errors.revDates','Revisa las fechas (Origen y Destino).'), 'warn');
    return;
  }
  const unit = uUnit?.value || 's';
  const res = ordinalBetween(o, t, unit);
  if (!res.ok){
    if (uResult) uResult.value = '—';
    toast(res.msg || i18n.t('utils.errors.generic','No se pudo calcular.'), 'bad');
    return;
  }
  if (uResult) uResult.value = String(res.val);
}

uOriginText?.addEventListener('input', updateUtilsIsoPreviews);
uTargetText?.addEventListener('input', updateUtilsIsoPreviews);
uCalc?.addEventListener('click', utilsCalc);
uCopy?.addEventListener('click', ()=> copy(uResult?.value));
uResult?.addEventListener('click', ()=>{
  const v = uResult?.value;
  if (v && v !== '—'){
    if (invMode.checked){
      toast(i18n.t('inverse.blocked','Modo inverso activo: introduce CU en Resultados.'), 'warn');
      return;
    }
    normValue.value = v;
    utilsDialog?.close();
    toast(i18n.t('utils.toValue','Trasladado a “Valor a normalizar”.'), 'ok');
  }
});

/* ===================== Modo inverso (CU → Observado) ====================== */

function setInvStatus(text, isWarn=false){
  invStatus.textContent = text || '';
  invStatus.classList.toggle('error', !!isWarn);
}
function updateCUExtRichFromInput(){
  outCUExtRich.innerHTML = buildCUExtRich(outCUExt.value);
}
function getActiveCUValue(){
  const useExt = invFromCUExt.checked;
  const v = useExt ? parse(outCUExt.value) : parse(outCU.value);
  return { useExt, val: v };
}
function updateInvSideVisibility(){
  if (!invMode.checked) { invSideRow.hidden = true; return; }
  if (modeNR.checked) { invSideRow.hidden = true; return; }
  const { val } = getActiveCUValue();
  invSideRow.hidden = !(val < 0);
}

function lockDirectInputs(on){
  [inObs, inMin, inMax].forEach(el => { if (el) el.disabled = on; });
  btnVmO && (btnVmO.disabled = on);
  btnVMO && (btnVMO.disabled = on);
  btnClear && (btnClear.disabled = on);
}

function toggleInverseUI(){
  const on = !!invMode.checked;

  // Bloquea “Valor a normalizar” (pero permite copiar)
  if (normValue){
    normValue.readOnly = on;
    normValue.classList.toggle('is-locked', on);
    if (on) normValue.value = '';
  }

  // Bloquea botones que no tienen sentido en inverso
  if (btnApplyNow) btnApplyNow.disabled = on;
  if (btnUseNorm) btnUseNorm.disabled = on;
  if (openConstantsBtn) openConstantsBtn.disabled = on;
  if (openUtilsBtn) openUtilsBtn.disabled = on;

  // Bloquea panel de Entradas (porque compute queda congelado)
  lockDirectInputs(on);

  if (on){
    // Limpia placeholders “—” para que el usuario pueda escribir directo
    if (outCU.value === '—') outCU.value = '';
    if (outCUExt.value === '—') outCUExt.value = '';
    if (invFromCUExt.checked){
      outCU.readOnly = true;
      outCUExt.readOnly = false;
    } else {
      outCU.readOnly = false;
      outCUExt.readOnly = true;
    }
  } else {
    outCU.readOnly = true;
    outCUExt.readOnly = true;
    setInvStatus('');
    compute(); // vuelve a modo directo
  }

  const hasBounds = isFinite(parse(normMin.value)) && isFinite(parse(normMax.value));
  invDo.disabled = !on || !hasBounds;

  if (on) { inverseMaybe(); }
  updateInvSideVisibility();
}

function inverseCompute(){
  if (!invMode.checked) return;

  const cuObj = getActiveCUValue();
  const vcu = cuObj.val;
  const vmin = parse(normMin.value);
  const vmax = parse(normMax.value);

  if (!isFinite(vmin) || !isFinite(vmax)){
    setInvStatus(i18n.t('inverse.revMinMax','Completa Mín y Máx en Reconversión.'));
    invDo.disabled = true;
    return;
  } else {
    invDo.disabled = false;
  }

  if (!isFinite(vcu)){
    setInvStatus(i18n.t('inverse.revCU','Introduce un CU válido en Resultados.'));
    return;
  }

  const min = Math.min(vmin, vmax), max = Math.max(vmin, vmax);
  const span = max - min;
  if (span === 0){
    setInvStatus(i18n.t('errors.equalMinMax','Mín y Máx no pueden ser iguales.'), true);
    return;
  }

  const sign = vcu >= 0 ? +1 : -1;
  let mag = Math.abs(vcu) / FACTOR_NUM;
  if (!Number.isFinite(mag)){
    setInvStatus(i18n.t('inverse.invalidCU','CU inválido.'), true);
    return;
  }

  let base;
  setInvStatus('');

  if (modeNR.checked){
    mag = clamp01(mag);
    base = mag;
    if (sign < 0){
      setInvStatus(i18n.t('inverse.noteNR','En NR el signo fuera de rango no es reversible; se asume dentro del rango.'));
    }
  } else {
    if (sign >= 0){
      base = mag;
    } else {
      if (invSideAbove.checked){
        base = mag;
      } else {
        base = -mag;
      }
    }
  }

  const obs = min + base * span;
  normValue.value = String(obs);
  toast(i18n.t('inverse.done','Calculado Observado desde CU → enviado a Reconversión.'), 'ok');
}

function inverseMaybe(){
  if (!invMode.checked) return;
  const { val } = getActiveCUValue();
  const vmin = parse(normMin.value);
  const vmax = parse(normMax.value);
  if (!isFinite(val) || !isFinite(vmin) || !isFinite(vmax)) return;
  inverseCompute();
}

invMode?.addEventListener('change', toggleInverseUI);
invFromCU?.addEventListener('change', ()=>{
  if (!invMode.checked) return;
  outCU.readOnly = false; outCUExt.readOnly = true;
  updateInvSideVisibility(); inverseMaybe();
});
invFromCUExt?.addEventListener('change', ()=>{
  if (!invMode.checked) return;
  outCU.readOnly = true; outCUExt.readOnly = false;
  updateInvSideVisibility(); inverseMaybe();
});
invSideBelow?.addEventListener('change', ()=>{ if (invMode.checked) inverseMaybe(); });
invSideAbove?.addEventListener('change', ()=>{ if (invMode.checked) inverseMaybe(); });

outCU?.addEventListener('input', ()=>{ if (invMode.checked){ updateInvSideVisibility(); inverseMaybe(); } });
outCUExt?.addEventListener('input', ()=>{ updateCUExtRichFromInput(); if (invMode.checked){ updateInvSideVisibility(); inverseMaybe(); } });

[normMin, normMax].forEach(el=> el?.addEventListener('input', ()=>{
  if (invMode.checked){
    const hasBounds = isFinite(parse(normMin.value)) && isFinite(parse(normMax.value));
    invDo.disabled = !hasBounds;
    inverseMaybe();
  }
}));

invDo?.addEventListener('click', inverseCompute);

/* ===================== Menú engranaje, idioma y temas ====================== */

function closeGearMenu(){
  gearMenu?.classList.remove('open');
  gearButton?.setAttribute('aria-expanded','false');
  gearMenu?.setAttribute('aria-hidden','true');
}
function openGearMenu(){
  gearMenu?.classList.add('open');
  gearButton?.setAttribute('aria-expanded','true');
  gearMenu?.setAttribute('aria-hidden','false');
  // Enfoca el primer item para accesibilidad teclado
  requestAnimationFrame(()=>{
    gearMenu?.querySelector('button.gear-item')?.focus({ preventScroll:true });
  });
}
gearButton?.addEventListener('click', (e)=>{
  e.stopPropagation();
  if (gearMenu?.classList.contains('open')){
    closeGearMenu();
  } else {
    openGearMenu();
  }
});

gearButton?.addEventListener('keydown', (e)=>{
  if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    if (!gearMenu?.classList.contains('open')) openGearMenu();
  }
});

gearMenu?.addEventListener('click', (e)=>{
  const item = e.target.closest('.gear-item');
  if (item) closeGearMenu();
});

document.addEventListener('click', (e)=>{
  if (!gearMenu || !gearButton) return;
  if (!gearMenu.contains(e.target) && !gearButton.contains(e.target)){
    closeGearMenu();
  }
});

document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape' && gearMenu?.classList.contains('open')){
    closeGearMenu();
  }
});

function updateMetaThemeColor(){
  const meta = document.getElementById('metaThemeColor');
  if (!meta) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (bg) meta.setAttribute('content', bg);
}

function getCurrentTheme(){
  return document.documentElement.getAttribute('data-theme') || 'default';
}

function syncThemeChips(){
  if (!themeDialog) return;
  const current = getCurrentTheme();
  themeDialog.querySelectorAll('.theme-chip').forEach(btn=>{
    const t = btn.getAttribute('data-theme') || 'default';
    const active = (t === current);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.classList.toggle('active', active);
  });
}

function applyTheme(theme){
  const t = theme || 'default';
  const html = document.documentElement;
  html.setAttribute('data-theme', t);
  localStorage.setItem(THEME_STORAGE_KEY, t);
  updateMetaThemeColor();
  syncThemeChips();
}

// Idioma: botones en langDialog
langDialog?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-lang]');
  if (!btn) return;
  const lang = btn.getAttribute('data-lang');
  window.CUi18n?.loadLanguage(lang);
  toast(i18n.t('lang.applied','Idioma aplicado.'), 'ok');
  langDialog.close();
});

// Temas: chips en themeDialog
themeDialog?.addEventListener('click', (e)=>{
  const chip = e.target.closest('.theme-chip');
  if (!chip) return;
  const theme = chip.getAttribute('data-theme') || 'default';
  applyTheme(theme);
  toast(i18n.t('themes.applied','Tema aplicado.'), 'ok');
});

/* ===================== Diálogos: open/close + overlay + foco ====================== */

const dialogReturnFocus = new WeakMap();

function updateOverlayState(){
  const anyOpen = !!document.querySelector('dialog[open]');
  document.body.classList.toggle('overlay-open', anyOpen);
  if (anyOpen) document.body.classList.remove('chrome-hidden');
}

function focusFirstInDialog(dlg){
  if (!dlg) return;
  const selector = [
    '[autofocus]',
    'button',
    '[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  const el = dlg.querySelector(selector);
  el?.focus?.({ preventScroll:true });
}

function showDialog(dlg, opener){
  if (!dlg) return;
  closeGearMenu();
  // Si se abre desde el menú, devolvemos el foco al engranaje (el item queda oculto)
  const op = (opener && gearMenu && gearMenu.contains(opener)) ? gearButton : opener;
  dialogReturnFocus.set(dlg, op || document.activeElement);
  document.body.classList.remove('chrome-hidden');

  try{
    if (!dlg.open) dlg.showModal();
  }catch{
    try{ if (!dlg.open) dlg.show(); }catch{ /* noop */ }
  }

  updateOverlayState();
  requestAnimationFrame(()=> focusFirstInDialog(dlg));
}

function setupDialogs(){
  $$('dialog').forEach(dlg => {
    // click sobre el backdrop → cerrar
    dlg.addEventListener('click', (e)=>{
      if (e.target === dlg) dlg.close();
    });

    dlg.addEventListener('close', ()=>{
      updateOverlayState();
      const ret = dialogReturnFocus.get(dlg);
      if (ret && document.contains(ret)) ret.focus({ preventScroll:true });
    });

    dlg.addEventListener('cancel', ()=>{
      // Esc: el navegador cierra; nosotros solo sincronizamos estado
      updateOverlayState();
      closeGearMenu();
    });
  });
}

/* ===================== Inicialización ====================== */
function setFooterYear(){
  const y = new Date().getFullYear();
  const el = document.getElementById('f-year');
  if (el) el.textContent = String(y);
}

function updateFooterVars(){
  const footer = document.getElementById('siteFooter');
  if (!footer) return;
  const h = Math.ceil(footer.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--footer-h', `${h}px`);
  // espacio extra para que el contenido no “toque” el footer
  document.documentElement.style.setProperty('--footer-space', `${h + 24}px`);
}

function setupFooterObserver(){
  const footer = document.getElementById('siteFooter');
  if (!footer) return;

  updateFooterVars();

  if ('ResizeObserver' in window){
    const ro = new ResizeObserver(()=> updateFooterVars());
    ro.observe(footer);
  }
  window.addEventListener('resize', updateFooterVars, { passive:true });
  window.addEventListener('orientationchange', updateFooterVars);
}

function init(){
  setupDialogs();

  // Tema inicial
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme){
    document.documentElement.setAttribute('data-theme', storedTheme);
  }
  updateMetaThemeColor();
  syncThemeChips();

  buildTemplateSelect();
  refreshNormList();
  compute();
  updateCUExtRichFromInput();
  toggleInverseUI();
  renderUtilsPager();
  updateUtilsIsoPreviews();
  setFooterYear();
  setupFooterObserver();

  // El botón de instalar en el menú se mostrará cuando PWA esté lista
  if (installMenuBtn){
    installMenuBtn.hidden = true;
  }
}
init();

/* === Auto-ocultar header/footer en móvil/tablet === */
(function setupChromeAutoHide(){
  const mq = window.matchMedia('(max-width: 1024px)');
  let lastScrollY = window.scrollY || 0;
  const THRESHOLD = 10;

  function enabled(){
    // si hay un modal abierto, no ocultamos chrome
    if (document.body.classList.contains('overlay-open')) return false;
    return mq.matches;
  }

  function showChrome(){
    document.body.classList.remove('chrome-hidden');
  }

  function onScroll(){
    const current = window.scrollY || 0;

    if (!enabled()){
      showChrome();
      lastScrollY = current;
      return;
    }

    const delta = current - lastScrollY;
    if (Math.abs(delta) < THRESHOLD) return;

    if (current > lastScrollY && current > 40){
      document.body.classList.add('chrome-hidden');
    } else if (current < lastScrollY){
      showChrome();
    }

    lastScrollY = current;
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', ()=>{
    showChrome();
    lastScrollY = window.scrollY || 0;
  });
  window.addEventListener('orientationchange', ()=>{
    showChrome();
    lastScrollY = window.scrollY || 0;
  });
})();

/* === Modales (open/close) === */
document.body.addEventListener('click', (e)=>{
  const openBtn = e.target.closest('[data-open]');
  if (openBtn){
    const id = openBtn.getAttribute('data-open');
    const dlg = document.getElementById(id);
    showDialog(dlg, openBtn);
    return;
  }

  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) {
    closeBtn.closest('dialog')?.close();
  }
});

/* === Valores conocidos: open / pager === */
openConstantsBtn?.addEventListener('click', ()=>{
  renderConstantsPage();
  showDialog(constantsDialog, openConstantsBtn);
});
constantsPrevPage?.addEventListener('click', ()=>{
  constantsPage = Math.max(0, constantsPage - 1);
  renderConstantsPage();
});
constantsNextPage?.addEventListener('click', ()=>{
  const perPage = 10;
  const totalPages = Math.ceil(KNOWN_CONSTANTS.length / perPage);
  constantsPage = Math.min(totalPages - 1, constantsPage + 1);
  renderConstantsPage();
});

/* === Utilidades: abrir (previews) + pager (por ahora 1 página) === */
openUtilsBtn?.addEventListener('click', ()=>{
  renderUtilsPager();
  updateUtilsIsoPreviews();
});
utilsPrevPage?.addEventListener('click', ()=>{
  utilsPage = Math.max(0, utilsPage - 1);
  renderUtilsPager();
});
utilsNextPage?.addEventListener('click', ()=>{
  const totalPages = 1;
  utilsPage = Math.min(totalPages - 1, utilsPage + 1);
  renderUtilsPager();
});

/* === Instalación PWA === */
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn'); // en la versión anterior (botón header antiguo)

window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.hidden = false;
  if (installMenuBtn) installMenuBtn.hidden = false;
});

function triggerInstall(){
  if (!deferredPrompt) {
    toast(i18n.t('menu.installUnavailable','Instalación no disponible en este dispositivo/navegador.'), 'warn');
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice
    .catch(()=>{})
    .finally(()=>{
      deferredPrompt = null;
      if (installBtn) installBtn.hidden = true;
      if (installMenuBtn) installMenuBtn.hidden = true;
    });
}

installBtn?.addEventListener('click', ()=>{
  triggerInstall();
});
installMenuBtn?.addEventListener('click', ()=>{
  triggerInstall();
});

window.addEventListener('appinstalled', ()=>{
  if (installBtn) installBtn.hidden = true;
  if (installMenuBtn) installMenuBtn.hidden = true;
});