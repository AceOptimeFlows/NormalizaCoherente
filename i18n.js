/* i18n.js — gestor de traducciones */

const I18N_STORAGE_KEY = 'cu_lang';
let currentLang = localStorage.getItem(I18N_STORAGE_KEY) || 'es';
let i18nDict = {};

async function loadLanguage(langCode){
  try{
    const res = await fetch(`lang/${langCode}.json`, { cache:'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar el JSON');
    const dict = await res.json();
    i18nDict = dict || {};
    currentLang = langCode;
    localStorage.setItem(I18N_STORAGE_KEY, currentLang);
    applyTranslations();
  }catch(err){
    console.error('Error i18n:', err);
    if (langCode !== 'es'){
      // fallback a ES
      loadLanguage('es');
    }
  }
}

function t(path, fallback=''){
  const parts = path.split('.');
  let cur = i18nDict;
  for (const p of parts){
    if (cur && Object.prototype.hasOwnProperty.call(cur, p)){
      cur = cur[p];
    } else {
      return fallback || path;
    }
  }
  return (typeof cur === 'string') ? cur : fallback || path;
}

function applyTranslations(){
  // data-i18n -> innerText
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    el.innerHTML = t(key, el.innerHTML);
  });

  // placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key) return;
    el.placeholder = t(key, el.placeholder);
  });

  // title
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (!key) return;
    el.title = t(key, el.title);
  });
}

window.addEventListener('DOMContentLoaded', ()=>{
  loadLanguage(currentLang);
});

// Exponer para app.js
window.CUi18n = {
  loadLanguage,
  t,
  get current(){ return currentLang; }
};
