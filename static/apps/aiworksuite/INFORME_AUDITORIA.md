# INFORME DE AUDITORÍA INTEGRAL — AIWorkSuite v4

**Fecha:** 25/04/2026  
**Auditor:** Roo (Debug Mode)  
**Versión analizada:** v4 (pre-lanzamiento)  
**Propósito:** Identificar bugs, problemas arquitectónicos, code smells y oportunidades de mejora antes del lanzamiento.

---

## ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Bugs Críticos](#2-bugs-críticos)
3. [Bugs Graves](#3-bugs-graves)
4. [Bugs Leves](#4-bugs-leves)
5. [Problemas Arquitectónicos](#5-problemas-arquitectónicos)
6. [Code Smells y Duplicación](#6-code-smells-y-duplicación)
7. [Problemas de Seguridad](#7-problemas-de-seguridad)
8. [Problemas de UX/UI](#8-problemas-de-uxui)
9. [Problemas de Rendimiento](#9-problemas-de-rendimiento)
10. [Backend y Cloudflare](#10-backend-y-cloudflare)
11. [Plan de Acción Recomendado](#11-plan-de-acción-recomendado)

---

## 1. Resumen Ejecutivo

AIWorkSuite v4 es una aplicación web SPA (Single Page Application) construida con **HTML5 + CSS + JavaScript vanilla**, desplegada en **Cloudflare Pages** con funciones serverless. Es una suite de herramientas IA para freelancers que incluye CRM, generación de propuestas, biblioteca de prompts, equipos IA, y herramientas Prospectly (B2B y Automatizaciones).

### Estado general: 🟡 **PRE-LANZAMIENTO — Requiere refactorización mayor**

Se han identificado **2 bugs críticos**, **4 bugs graves**, **5 bugs leves**, **6 problemas arquitectónicos** y múltiples code smells. El problema más grave es la **existencia de dos versiones divergentes del código** dentro del mismo proyecto, lo que hace que la aplicación no pueda funcionar correctamente en su estado actual.

---

## 2. Bugs Críticos

### 🐛 CR-01: Dos versiones divergentes del código — index.html vs app.js

**Archivos implicados:**
- [`index.html`](index.html) (6313 líneas) — Versión auto-contenida con UI de **sidenav**
- [`app.js`](app.js) (3188 líneas) — Versión más nueva con UI de **dock bar** (macOS-style)
- [`styles.css`](styles.css) — CSS para dock bar
- CSS embebido en [`index.html`](index.html:65) (líneas 65-1317) — CSS para sidenav

**Descripción:**
El proyecto contiene **DOS implementaciones completas e incompatibles** de la misma aplicación:

| Aspecto | `index.html` (embebido) | `app.js` |
|---------|------------------------|----------|
| UI principal | Sidenav (barra lateral expandible) | Dock bar (barra inferior estilo macOS) |
| Clases i18n dinámicas | `nav-tip`, `nav-label` | `dock-tip`, `dock-label` |
| `workspaceHistory` | Stub vacío (no guarda nada) | Implementación completa con localStorage |
| `renderBusinessMetrics` | Sin check de licencia Pro | Con `tierSystem.isPro()` check |
| `openReminderModal` | Stub con toast "próximamente" | Implementación completa con localStorage |
| `handleDeepLink` | Checkea `CURRENT_USER` (siempre null) | No checkea CURRENT_USER |
| Boot sequence | `loadTheme(); loadLang(); applyTranslations(); if(S.get('demo_user')) launchApp(); else checkCookieConsent();` | `loadTheme(); loadLang(); applyTranslations(); checkSession();` |

**Impacto:** 🛑 **BLOQUEANTE.** La aplicación NO PUEDE funcionar correctamente. Dependiendo de qué script se ejecute primero, se renderizará una UI que no coincide con el CSS cargado, o se intentarán actualizar elementos del DOM que no existen.

**Solución propuesta:**
1. Elegir UNA versión como la definitiva (recomendado: la de `app.js` por ser más moderna y tener implementaciones completas)
2. Migrar TODO el código embebido de `index.html` (líneas 2732-5989) a archivos JS externos
3. Migrar el CSS embebido de `index.html` (líneas 65-1317) a `styles.css`
4. Dejar `index.html` solo como el shell HTML que carga los scripts y estilos externos

---

### 🐛 CR-02: Duplicación de módulos completos — prospectly.js vs prospectly-b2b.js / prospectly-auto.js

**Archivos implicados:**
- [`js/tools/prospectly.js`](js/tools/prospectly.js) (668 líneas) — Contiene **ambos** `ProspectlyB2B` y `AutomatizacionesTool`
- [`js/tools/prospectly-b2b.js`](js/tools/prospectly-b2b.js) (468 líneas) — Duplicado de `ProspectlyB2B`
- [`js/tools/prospectly-auto.js`](js/tools/prospectly-auto.js) (339 líneas) — Duplicado de `AutomatizacionesTool`

**Descripción:**
`prospectly.js` ya contiene implementaciones completas de `ProspectlyB2B` y `AutomatizacionesTool`. Pero además existen `prospectly-b2b.js` y `prospectly-auto.js` que son **reescrituras independientes** con el MISMO propósito pero implementación diferente (usan límites de uso vía localStorage, diferente UI rendering). Todos se cargan en [`index.html`](index.html:5990-5992):

```html
<script src="js/tools/prospectly.js"></script>
<script src="js/tools/prospectly-b2b.js"></script>
<script src="js/tools/prospectly-auto.js"></script>
```

Como todos exportan `window.ProspectlyB2B` y `window.ProspectlyAuto`, el último en cargarse **SOBREESCRIBE** al anterior.

**Impacto:** 🛑 **BLOQUEANTE.** La funcionalidad de Prospectly es impredecible. Dependiendo del orden de carga, puede funcionar con una versión u otra, o ninguna.

**Solución propuesta:**
1. Elegir UNA implementación de cada herramienta (recomendado: mantener `prospectly.js` como fuente única por ser la original y más completa)
2. Eliminar `prospectly-b2b.js` y `prospectly-auto.js`
3. Si se necesitan características específicas de las versiones duplicadas (como límites de uso), integrarlas en `prospectly.js`

---

## 3. Bugs Graves

### 🐛 GR-01: Typo `statechange` en lugar de `state` en Service Worker

**Archivos:**
- [`app.js`](app.js:2788)
- [`index.html`](index.html:5642)

**Código actual:**
```javascript
if (newSW.statechange === 'installed') {
```

**Código correcto:**
```javascript
if (newSW.state === 'installed') {
```

**Impacto:** ⚠️ **ALTO.** El evento de actualización del Service Worker NUNCA se dispara. Cuando se despliega una nueva versión, los usuarios nunca reciben la notificación de actualización disponible. Siguen usando la versión antigua en caché hasta que cierren todas las pestañas.

**Solución propuesta:** Corregir `statechange` → `state` en ambos archivos.

---

### 🐛 GR-02: `handleDeepLink` nunca funciona por check de `CURRENT_USER`

**Archivo:** [`index.html`](index.html:5630)

**Código actual:**
```javascript
if (view && ['crm','prop','lib','teams','ws','settings'].includes(view) && CURRENT_USER) goTo(view);
```

**Descripción:** La variable `CURRENT_USER` **nunca se define** en ningún lugar del código. Está comentada o ausente. Por tanto, los deep links (enlaces tipo `?view=crm`) nunca navegan a la vista correspondiente.

**Impacto:** ⚠️ **ALTO.** Los deep links desde el manifest.json de la PWA y desde enlaces compartidos no funcionan. Los usuarios siempre aterrizan en el dashboard.

**Solución propuesta:** Eliminar la comprobación de `CURRENT_USER` o definir la variable adecuadamente.

---

### 🐛 GR-03: API de Cohere incompatible con el formato OpenAI

**Archivo:** [`app.js`](app.js:526-554) — función `callAI`

**Descripción:** Todos los proveedores usan el formato de endpoint `/v1/chat/completions` (OpenAI-compatible), pero Cohere usa `api.cohere.com/v2/chat` que tiene un formato de request/response completamente diferente. La función `callAI` asume el mismo formato para todos los proveedores no-Anthropic, por lo que las llamadas a Cohere fallarán.

**Código actual (simplificado):**
```javascript
const prov = PROVIDERS[cfg.provider] || PROVIDERS.anthropic;
// Para todos excepto anthropic, asume formato OpenAI
const body = { model: prov.model, messages: [...], max_tokens: maxTokens };
const res = await fetch(prov.endpoint, { ... body JSON.stringify(body) ... });
```

**Impacto:** ⚠️ **ALTO.** El proveedor Cohere no funciona. El usuario pierde una de las 11 opciones de proveedor.

**Solución propuesta:** Añadir un case especial para Cohere en `callAI` que use el formato correcto de la v2 API, o cambiar Cohere a un endpoint compatible con OpenAI (si existe).

---

### 🐛 GR-04: `js/config.js` redefine todas las constantes globales

**Archivo:** [`js/config.js`](js/config.js)

**Descripción:** Este archivo define **otra vez** `PLANS`, `USER_PLAN`, `tierSystem`, `S`, `PROVIDERS`, `SUPPORTED_LANGS`, `LANG`, `MANUAL_API_KEY`. Todas estas constantes ya están definidas en `app.js` (o en el script embebido de `index.html`).

**Impacto:** ⚠️ **ALTO.** Dependiendo del orden de carga de scripts, las definiciones de `config.js` pueden sobrescribir las de `app.js` o viceversa, causando comportamiento impredecible.

**Solución propuesta:** Eliminar `config.js` o convertirlo en un archivo de configuración ligero que solo contenga valores que no se definan en otro lugar.

---

## 4. Bugs Leves

### 🐛 LV-01: Modelos obsoletos en OpenRouter

**Archivo:** [`app.js`](app.js:57-69) — dentro de `PROVIDERS.openrouter.models`

**Descripción:** La lista de modelos de OpenRouter incluye muchos modelos que ya no están disponibles o han sido renombrados:
- `gpt-neo-2.7B` (EleutherAI — obsoleto)
- `bloom-3b` (obsoleto)
- `huggingface/gpt-j-6B` (obsoleto)
- `oobabooga/ostar-2.3b-next` (nunca fue un modelo real)
- `oobabooga/koala-13b` (obsoleto)
- `OpenAssistant/oa-gpt-4.1-mini` (no existe)
- `OpenAssistant/oa-gpt-4.1` (no existe)
- `nousresearch/Nous-Hermes-13b` (obsoleto)

**Impacto:** 🔸 **BAJO.** El usuario puede seleccionar modelos que devuelven error 404 de OpenRouter.

**Solución propuesta:** Limpiar la lista de modelos de OpenRouter para incluir solo modelos actualmente disponibles y populares.

---

### 🐛 LV-02: Proveedor "Talvi" posiblemente inexistente

**Archivo:** [`app.js`](app.js:57-69) — dentro de `PROVIDERS.talvi`

**Descripción:** El proveedor `talvi` con endpoint `https://api.talvi.ai/v1/chat/completions` y modelos `talvi-3b`, `talvi-7b`, `talvi-13b`, `talvi-70b` no corresponde a ningún proveedor conocido. Podría ser un proveedor planeado pero no implementado, o un nombre inventado.

**Impacto:** 🔸 **BAJO.** El usuario puede seleccionar un proveedor que no funciona.

**Solución propuesta:** Verificar si Talvi existe como proveedor real. Si no, eliminarlo o reemplazarlo con un proveedor real alternativo.

---

### 🐛 LV-03: Sin manejo de errores para `localStorage quota exceeded`

**Archivos:** [`app.js`](app.js:51-56) — función `S.set()`, y en todo el código que usa `localStorage`

**Descripción:** En múltiples lugares, las operaciones de `localStorage.setItem()` están envueltas en try/catch con bloques catch **vacíos**. Cuando se excede la cuota de localStorage (~5-10MB), los datos se pierden silenciosamente sin notificación al usuario.

**Impacto:** 🔸 **BAJO** en condiciones normales, pero **ALTO** para usuarios con muchos datos (cientos de clientes, propuestas, equipos).

**Solución propuesta:** Añadir notificación al usuario cuando localStorage esté lleno, y ofrecer opciones de exportación/limpieza.

---

### 🐛 LV-04: `offline.html` tiene script de Ko-fi que no funcionará offline

**Archivo:** [`offline.html`](offline.html:35)

**Código actual:**
```html
<script src='https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'></script>
```

**Descripción:** La página offline carga un script externo de Ko-fi. Si el usuario está offline (que es precisamente cuándo se muestra esta página), el script no se cargará y generará un error 404 en la consola.

**Impacto:** 🔸 **BAJO.** No afecta la funcionalidad principal, pero genera errores en consola.

**Solución propuesta:** Envolver el script en un condicional que solo lo cargue si hay conexión, o eliminarlo de la página offline.

---

### 🐛 LV-05: Tema "ocean" y "forest" no existen en `styles.css`

**Archivos:**
- [`index.html`](index.html:65-1317) — CSS embebido: contiene 6 temas (dark, light, midnight, warm, ocean, forest)
- [`styles.css`](styles.css) — CSS externo: solo contiene 4 temas (dark, light, midnight, warm)

**Descripción:** Si el usuario selecciona los temas "ocean" o "forest" y se está usando la versión de `app.js` (que carga `styles.css`), las variables CSS de esos temas no estarán definidas y la aplicación se verá con colores por defecto (probablemente ilegibles).

**Impacto:** 🔸 **BAJO.** Afecta solo a 2 de 6 temas, y solo si se usa la versión de `app.js`.

**Solución propuesta:** Añadir los temas "ocean" y "forest" a `styles.css`.

---

## 5. Problemas Arquitectónicos

### 🏗 ARQ-01: Monolito extremo — archivos demasiado grandes

| Archivo | Líneas | Problema |
|---------|--------|----------|
| `index.html` | 6.313 | Contiene HTML + CSS + JS (toda la app) |
| `app.js` | 3.188 | Toda la lógica de la app en un solo archivo |
| CSS embebido en `index.html` | ~1.250 | Estilos de toda la app en línea |

**Impacto:** Mantenibilidad extremadamente difícil. Cualquier cambio requiere navegar por miles de líneas. No hay separación de concerns.

**Solución propuesta:** Dividir en módulos:
- `js/crm.js` — Lógica del CRM
- `js/proposals.js` — Generación de propuestas
- `js/teams.js` — Gestión de equipos IA
- `js/workspace.js` — Workspace de chat
- `js/i18n.js` — Traducciones (actualmente ~1350 líneas en app.js)
- `js/ui.js` — Utilidades de UI (toasts, modales, temas)
- `js/providers.js` — Configuración de proveedores IA

---

### 🏗 ARQ-02: Sin sistema de módulos — todo global

**Descripción:** No se usa ningún sistema de módulos (ES modules, CommonJS, IIFEs con encapsulación). Todas las variables y funciones son globales (`window.*`). Esto causa:
- Colisiones de nombres (como con `ProspectlyB2B`)
- Dependencia del orden de carga de scripts
- Imposibilidad de tree-shaking o análisis estático

**Solución propuesta:** Migrar a ES Modules (`type="module"` en scripts) o usar un bundler ligero (esbuild, Vite).

---

### 🏗 ARQ-03: Sin autenticación real — todo hardcodeado

**Archivos:**
- [`js/auth.js`](js/auth.js) — Stub que devuelve `{ user: null, plan: 'free' }`
- [`app.js`](app.js:18-23) — `SESSION.isLoggedIn()` siempre devuelve `true`
- [`app.js`](app.js:6-16) — `LICENSE.isPro()` siempre devuelve `true`

**Descripción:** El sistema de autenticación y licencias es completamente ficticio. No hay login real, no hay verificación de plan, no hay límites. La aplicación siempre se comporta como "pro" con todas las funciones desbloqueadas.

**Impacto:** Si se planea monetizar en el futuro, habrá que reescribir toda la capa de licencias y autenticación.

**Solución propuesta:** Decidir si esto es intencional (app 100% gratuita) o si se necesita implementar autenticación real. Si es intencional, eliminar todo el código de licencias/planes para simplificar.

---

### 🏗 ARQ-04: Backend serverless completamente stub

**Archivos:**
- [`functions/api/user-plan.js`](functions/api/user-plan.js) — Siempre devuelve `{ plan: 'pro' }`
- [`functions/api/validate-license.js`](functions/api/validate-license.js) — Siempre devuelve `{ valid: true, plan: 'pro' }`
- [`functions/api/webhook.js`](functions/api/webhook.js) — Siempre devuelve `{ ok: true }`

**Descripción:** De las 4 funciones serverless de Cloudflare, 3 son stubs que devuelven valores hardcodeados. Solo [`functions/api/chat.js`](functions/api/chat.js) (proxy Groq) y [`functions/api/demo.js`](functions/api/demo.js) (Workers AI) tienen implementación real.

**Solución propuesta:** Decidir si estas funciones son necesarias. Si no, eliminarlas para reducir el payload de deploy. Si sí, implementarlas con lógica real.

---

### 🏗 ARQ-05: D1 Database y schema.sql no utilizados

**Archivos:**
- [`wrangler.toml`](wrangler.toml) — Define binding `DB` para D1
- [`schema.sql`](schema.sql) — Define tablas `users`, `workspaces`, `subscription_events`

**Descripción:** Aunque se configura una base de datos D1 y se define su esquema, **ninguna función serverless la utiliza**. Los datos de usuario se almacenan exclusivamente en localStorage del navegador.

**Solución propuesta:** Decidir si se va a usar D1 en el futuro. Si no, eliminar la configuración para evitar confusiones. Si sí, implementar las funciones CRUD correspondientes.

---

### 🏗 ARQ-06: Sin pruebas automatizadas

**Descripción:** No se encontró ningún archivo de test (`.test.js`, `.spec.js`, `__tests__/`, etc.) en todo el proyecto. Una aplicación de ~10.000 líneas de JavaScript sin pruebas es extremadamente frágil.

**Solución propuesta:** Implementar pruebas unitarias para las funciones críticas (`callAI`, `workspaceHistory`, `renderBusinessMetrics`, etc.) usando un framework ligero como Vitest o Node test runner.

---

## 6. Code Smells y Duplicación

### ♻️ SM-01: Duplicación masiva de TRANSLATIONS

**Archivos:**
- [`app.js`](app.js:1223-2575) — ~1.350 líneas de traducciones (5 idiomas × ~270 claves)
- [`index.html`](index.html:3987-5423) — ~1.436 líneas de traducciones (5 idiomas × ~287 claves)

**Descripción:** El objeto `TRANSLATIONS` está duplicado en ambos archivos con ligeras diferencias (el de `index.html` tiene ~17 claves adicionales). Esto duplica ~2.700 líneas de código.

**Solución propuesta:** Mover `TRANSLATIONS` a un archivo independiente `js/i18n.js` y cargarlo como script externo.

---

### ♻️ SM-02: Duplicación de LEGAL_CONTENT

**Archivos:**
- [`app.js`](app.js:2655-2725) — ~70 líneas
- [`index.html`](index.html:5506-5573) — ~67 líneas

**Descripción:** El contenido legal (privacidad, cookies, términos) está duplicado en ambos archivos.

**Solución propuesta:** Mover a `js/legal.js` o cargar desde archivos HTML estáticos (ya existen `legal/cookies.html`, `legal/privacidad.html`, `legal/terminos.html`).

---

### ♻️ SM-03: Duplicación de PLANS, tierSystem, S, PROVIDERS

**Archivos:**
- [`app.js`](app.js:30-69) — Definiciones originales
- [`index.html`](index.html:2732-2800) — Definiciones duplicadas
- [`js/config.js`](js/config.js) — Tercera definición

**Descripción:** Las constantes `PLANS`, `USER_PLAN`, `tierSystem`, `S`, `PROVIDERS` están definidas **TRES VECES** en el proyecto.

**Solución propuesta:** Definir UNA SOLA VEZ en un archivo compartido.

---

### ♻️ SM-04: Código CSS duplicado

**Archivos:**
- [`index.html`](index.html:65-1317) — ~1.250 líneas de CSS embebido
- [`styles.css`](styles.css) — 718 líneas de CSS externo

**Descripción:** Ambos contienen los mismos design tokens, temas y estilos de componentes, pero con diferencias en la UI (sidenav vs dock bar). Esto duplica ~2.000 líneas de CSS.

**Solución propuesta:** Unificar TODO el CSS en `styles.css` y eliminar el CSS embebido de `index.html`.

---

## 7. Problemas de Seguridad

### 🔒 SEC-01: API keys almacenadas en texto plano en localStorage

**Archivo:** [`app.js`](app.js:413-425) — función `saveApiSettings`

**Descripción:** Las claves de API de los 11 proveedores se guardan en `localStorage` sin ningún tipo de cifrado. Cualquier script en la misma página (incluyendo extensiones del navegador, scripts de terceros, o XSS) puede leerlas.

```javascript
localStorage.setItem('aws_api_key_anthropic', 'sk-ant-...');
localStorage.setItem('aws_api_key_openai', 'sk-...');
// etc.
```

**Riesgo:** 🔴 **ALTO** si hay scripts de terceros en la página (análisis, widgets, etc.).

**Solución propuesta:** Al menos ofuscar con un cifrado simétrico simple (ej. XOR + btoa) o usar `crypto.subtle` para derivar una clave de cifrado. Mejor aún: usar el API de Credential Management del navegador.

---

### 🔒 SEC-02: Sin protección contra XSS en renderizado de propuestas

**Archivo:** [`app.js`](app.js:766-795) — función `renderPropDB`

**Descripción:** Las propuestas se renderizan usando `innerHTML` con contenido que podría contener HTML malicioso si se importa desde una fuente externa.

**Solución propuesta:** Usar `textContent` en lugar de `innerHTML` donde sea posible, o sanitizar con DOMPurify.

---

## 8. Problemas de UX/UI

### 🎨 UX-01: La UI cargada no coincide con el CSS disponible

**Descripción:** Como se explicó en CR-01, dependiendo de qué versión se ejecute, la UI puede intentar usar clases CSS que no existen. Por ejemplo, si se ejecuta `app.js` pero el CSS cargado es el embebido de `index.html` (sidenav), los elementos con clase `dock-tip` no encontrarán estilo.

**Solución propuesta:** Resolver CR-01 primero (unificar versiones).

---

### 🎨 UX-02: Sin feedback visual durante carga de API

**Archivo:** [`app.js`](app.js:526-554) — función `callAI`

**Descripción:** Cuando se llama a la API de un proveedor IA, no hay indicador de carga visible. La función es asíncrona pero el llamante no siempre muestra un spinner o estado de carga.

**Solución propuesta:** Asegurar que todos los llamantes de `callAI` muestren un indicador de carga mientras esperan la respuesta.

---

### 🎨 UX-03: Sin skeleton screens ni lazy loading

**Descripción:** Todas las vistas se renderizan completas al cargar. No hay skeleton screens, lazy loading de secciones, ni transiciones suaves entre vistas.

**Solución propuesta:** Implementar skeleton screens para las vistas principales (CRM, propuestas, equipos) y lazy loading para secciones pesadas.

---

## 9. Problemas de Rendimiento

### ⚡ PERF-01: CSS embebido en HTML (~1.250 líneas)

**Descripción:** Tener ~1.250 líneas de CSS dentro del `<style>` en `index.html` impide el caching del navegador. Cada vez que se modifica el HTML, el CSS se descarga de nuevo.

**Solución propuesta:** Mover todo el CSS a `styles.css` (archivo cacheable).

---

### ⚡ PERF-02: Objeto TRANSLATIONS enorme en el bundle principal

**Descripción:** El objeto `TRANSLATIONS` ocupa ~1.350 líneas en `app.js`. Esto significa que todos los usuarios descargan los 5 idiomas completos, aunque solo usen uno. En una conexión lenta, esto añade ~30-40KB de JavaScript que podría ser diferido.

**Solución propuesta:** Cargar solo el idioma del usuario, o al menos diferir la carga de los idiomas no seleccionados.

---

### ⚡ PERF-03: Sin lazy loading para vistas

**Descripción:** Todas las vistas (CRM, propuestas, equipos, workspace, settings) se renderizan al cargar la aplicación, aunque el usuario solo vea una. Esto causa trabajo innecesario del DOM y JavaScript.

**Solución propuesta:** Implementar renderizado bajo demanda: solo crear el DOM de una vista cuando el usuario navega a ella.

---

## 10. Backend y Cloudflare

### ☁️ CF-01: Rate limiting de demo.js demasiado restrictivo

**Archivo:** [`functions/api/demo.js`](functions/api/demo.js:38)

**Código actual:**
```javascript
const rateLimit = 20; // llamadas/IP/hora
```

**Descripción:** 20 llamadas por hora al modo demo es muy restrictivo. Un usuario que prueba la aplicación puede agotar este límite en pocos minutos.

**Solución propuesta:** Aumentar a 50-100 llamadas/hora, o eliminar el rate limiting para usuarios con API key configurada.

---

### ☁️ CF-02: Sin validación de origen en chat.js

**Archivo:** [`functions/api/chat.js`](functions/api/chat.js:23-29)

**Descripción:** La función `isAllowedOrigin` valida el origen de la petición, pero solo contra una lista fija de orígenes permitidos. Si alguien despliega la app en un dominio personalizado no listado, el proxy de Groq no funcionará.

**Solución propuesta:** Hacer la lista de orígenes configurable vía variable de entorno, o permitir un wildcard para desarrollo.

---

### ☁️ CF-03: Sin logging ni monitoreo

**Descripción:** Ninguna de las funciones serverless tiene logging estructurado. Si algo falla en producción, no hay forma de diagnosticar sin acceso a los logs de Cloudflare.

**Solución propuesta:** Añadir logging estructurado con `console.log` con contexto (request ID, timestamp, endpoint) en todas las funciones.

---

## 11. Plan de Acción Recomendado

### Fase 1 — Corrección de Bugs Críticos (Prioridad Máxima)

| # | Tarea | Archivos | Esfuerzo |
|---|-------|----------|----------|
| 1 | Unificar index.html y app.js en una sola versión | `index.html`, `app.js`, `styles.css` | 2-3 días |
| 2 | Eliminar prospectly-b2b.js y prospectly-auto.js, consolidar en prospectly.js | `js/tools/prospectly*.js` | 1 día |
| 3 | Corregir typo `statechange` → `state` | `app.js:2788`, `index.html:5642` | 5 min |
| 4 | Corregir `handleDeepLink` (eliminar check CURRENT_USER) | `index.html:5630` | 5 min |
| 5 | Añadir soporte para Cohere v2 API en `callAI` | `app.js:526-554` | 30 min |
| 6 | Eliminar o consolidar `js/config.js` | `js/config.js` | 15 min |

### Fase 2 — Refactorización Arquitectónica

| # | Tarea | Esfuerzo |
|---|-------|----------|
| 1 | Extraer CSS embebido a `styles.css` | 1 día |
| 2 | Extraer TRANSLATIONS a `js/i18n.js` | 1 día |
| 3 | Dividir `app.js` en módulos (CRM, propuestas, equipos, providers, UI) | 2-3 días |
| 4 | Migrar a ES Modules (`type="module"`) | 1 día |
| 5 | Implementar lazy loading de vistas | 1 día |

### Fase 3 — Mejoras de Seguridad y UX

| # | Tarea | Esfuerzo |
|---|-------|----------|
| 1 | Cifrar API keys en localStorage | 1 día |
| 2 | Añadir skeleton screens | 1 día |
| 3 | Limpiar lista de modelos de OpenRouter | 30 min |
| 4 | Añadir temas ocean/forest a styles.css | 15 min |
| 5 | Mejorar manejo de errores de localStorage | 30 min |

### Fase 4 — Backend y Preparación para Producción

| # | Tarea | Esfuerzo |
|---|-------|----------|
| 1 | Decidir futuro de funciones stub (user-plan, validate-license, webhook) | 1 día |
| 2 | Decidir futuro de D1 database y schema.sql | 1 día |
| 3 | Añadir logging a funciones serverless | 1 día |
| 4 | Ajustar rate limiting de demo.js | 15 min |
| 5 | Implementar pruebas automatizadas básicas | 2-3 días |

---

*Fin del informe. Pendiente de tu confirmación para proceder con las correcciones.*
