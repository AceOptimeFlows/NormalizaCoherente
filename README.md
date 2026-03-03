# Normaliza Coherente

**Normaliza Coherente** is a **100% offline Progressive Web App (PWA)** that converts observed values into the **Universal Coherence (CU) Scale** using configurable **Min/Max reference ranges** and an operational factor **±0.999999999999990**.

It includes **scale templates** (physical + human), **saved normalization management**, **extended CU output (50 decimals)**, and an **inverse mode** to reconstruct the observed value from CU.

---

## Features

- **Direct mode (Observed → CU)** with two calculation modes:
  - **EP (Pure Structural):** no magnitude clipping (|CU| can exceed 1 if the observed value is far outside the reference range).
  - **NR (Reference‑Normalized):** magnitude is clamped to **[0, 1]** and applies **±0.999…990** (with an out‑of‑range warning).
- **Extended CU output (50 decimals)** for auditing and exact copy/paste.
- **Inverse mode (CU → Observed)** to reconstruct the observed value using the selected **Min/Max**.
- **Scale templates** (physical + human scales) to fill Min/Max quickly.
- **Saved normalizations** stored locally in the browser (`localStorage`).
- **Installable + fully offline** via **Service Worker caching**.

---

## How CU is computed (concept)

The app uses the relative position inside a reference range:

- Base ratio: `(Obs − Min) / (Max − Min)`
- Operational ceiling: multiply by `±0.999999999999990` (instead of ±1 to preserve an asymptotic margin)

Sign convention:
- **+** when `Obs ∈ [Min, Max]`
- **−** when outside the range (EP preserves magnitude; NR clamps magnitude)

The UI also works with operational bounds such as:
- `VmO = 0.000000000000010`
- `VMO = 0.999999999999990`

---

## Run locally

> **Note:** Service Workers typically require **HTTPS** or **localhost**.

Recommended (simple local server):

```bash
python -m http.server 8000
```

Then open:

- `http://localhost:8000`

---

## Install as a PWA (offline app)

### Desktop (Chrome / Edge)

1. Open the app over **HTTPS** or **localhost**.
2. Use the browser’s **Install** option (or the app’s **Install** entry when available).
3. Once installed, it runs like a standalone app and works offline after the first successful load.

### Android (Chrome)

1. Open the app in Chrome.
2. Tap **Install app** / **Add to Home screen**.
3. Launch from the installed icon (offline supported after first load).

### iOS (Safari)

iOS Safari does not support the same install prompt flow. Use:

1. Open the app in Safari.
2. Tap **Share** → **Add to Home Screen**.
3. Launch from the home screen icon.

---

## Offline behavior (important)

- On the first visit, the app must load **at least once while online** to cache resources.
- After caching, it can run **fully offline**, including language switching (language JSON files are cached).
- When you publish updates, bump the cache version in `sw.js` (`CACHE_NAME`) so users receive the latest assets.

---

## Internationalization (i18n)

UI languages included (cached for offline use):

- `es`, `en`, `pt-br`, `fr`, `de`, `it`, `ko`, `zh`, `ja`, `ru`, `hi`, `cat`

Language files live in:

- `/lang/*.json`

---

## Project structure

```text
/
├─ index.html
├─ styles.css
├─ app.js
├─ i18n.js
├─ sw.js
├─ manifest.webmanifest
├─ assets/
│  └─ img/
│     ├─ logo.png
│     ├─ normalizacoherente180.png
│     ├─ normalizacoherente192.png
│     └─ normalizacoherente512.png
└─ lang/
   ├─ es.json
   ├─ en.json
   ├─ pt-br.json
   ├─ fr.json
   ├─ de.json
   ├─ it.json
   ├─ ko.json
   ├─ zh.json
   ├─ ja.json
   ├─ ru.json
   ├─ hi.json
   └─ cat.json
```

---

## Citation / Reference

### Software DOI (Zenodo)

Add your Zenodo DOI here once published:

- **Software DOI (Zenodo, concept DOI):** 10.5281/zenodo.18838925    
- **Software DOI (Zenodo, version DOI):** 10.5281/zenodo.18838925    

> Tip: Use the **concept DOI** for “cite the project in general”, and the **version DOI** for “cite this exact release”.

### Reference document / conceptual framework

- **DOI:** `10.5281/zenodo.18714577`  
- **Link:** https://doi.org/10.5281/zenodo.18714577

---

## License

MIT License.  
(Inside the app, you can open it via the **MIT** button in the footer.)

---

# Normaliza Coherente (ES)

**Normaliza Coherente** es una **PWA 100% offline** que convierte valores observados a la **Escala de Coherencia Universal (CU)** usando rangos de referencia **Mín/Máx** configurables y un factor operativo **±0.999999999999990**.

Incluye **plantillas de escalas** (físicas y humanas), **gestión de normalizaciones guardadas**, **CU extendido (50 decimales)** y un **modo inverso** para reconstruir el observado desde CU.

---

## Funcionalidades

- **Modo directo (Observado → CU)** con dos modos de cálculo:
  - **EP (Estructural Puro):** sin recorte de magnitud (|CU| puede superar 1 si el observado está muy fuera del rango).
  - **NR (Normalizado por Referencia):** acota la magnitud a **[0, 1]** y aplica **±0.999…990** (con aviso fuera de rango).
- **CU extendido (50 decimales)** para auditoría y copia exacta.
- **Modo inverso (CU → Observado)** con reconstrucción usando **Mín/Máx**.
- **Plantillas** para rellenar Mín/Máx rápidamente.
- **Normalizaciones guardadas** en el navegador (`localStorage`).
- **Instalable y offline** gracias al **Service Worker**.

---

## Cómo se calcula CU (concepto)

La app usa la posición relativa dentro de un rango:

- Cociente base: `(Obs − Min) / (Max − Min)`
- Techo operativo: multiplicar por `±0.999999999999990` (en lugar de ±1 para mantener margen asintótico)

Convención de signo:
- **+** si `Obs ∈ [Min, Max]`
- **−** si está fuera del rango (EP conserva magnitud; NR recorta magnitud)

La interfaz también trabaja con límites operativos como:
- `VmO = 0.000000000000010`
- `VMO = 0.999999999999990`

---

## Ejecutar en local

> **Nota:** el Service Worker normalmente requiere **HTTPS** o **localhost**.

Servidor local recomendado:

```bash
python -m http.server 8000
```

Luego abre:

- `http://localhost:8000`

---

## Instalar como PWA (modo offline)

### Escritorio (Chrome / Edge)

1. Abre la app bajo **HTTPS** o **localhost**.
2. Usa la opción de **Instalar** del navegador (o la entrada **Instalar** de la app cuando esté disponible).
3. Tras instalar, se ejecuta como app y funcionará offline después de la primera carga correcta.

### Android (Chrome)

1. Abre la app en Chrome.
2. Pulsa **Instalar app** / **Añadir a pantalla de inicio**.
3. Abre desde el icono instalado (offline soportado tras la primera carga).

### iOS (Safari)

En iOS no aparece el mismo prompt. Usa:

1. Abre la app en Safari.
2. **Compartir** → **Añadir a pantalla de inicio**.
3. Abre desde el icono.

---

## Offline (importante)

- La primera vez la app debe cargarse **al menos una vez con conexión** para cachear recursos.
- Después puede funcionar **100% offline**, incluido el cambio de idioma (los JSON de idiomas quedan en caché).
- Para publicar actualizaciones, incrementa la versión del caché en `sw.js` (`CACHE_NAME`).

---

## Internacionalización (i18n)

Idiomas incluidos (cacheados para offline):

- `es`, `en`, `pt-br`, `fr`, `de`, `it`, `ko`, `zh`, `ja`, `ru`, `hi`, `cat`

Carpeta:

- `/lang/*.json`

---

## Cita / Referencia

### DOI del software (Zenodo)

Añade aquí el DOI cuando publiques:

- **DOI del software (Zenodo, DOI conceptual):** 10.5281/zenodo.18838925  
- **DOI del software (Zenodo, DOI de versión):** 10.5281/zenodo.18838925  

### Ensayo / documento de referencia (marco conceptual)

- **DOI:** `10.5281/zenodo.18714577`  
- **Link:** https://doi.org/10.5281/zenodo.18714577

---

## Licencia

MIT.  
(En la app, accesible desde el botón **MIT** del footer.)