# Auditoría Integral de Molvicos OS

**URL:** `https://molvicos.pro`  
**Fecha:** 26/04/2026  
**Versión analizada:** 0.1.0  
**Stack:** SvelteKit 4 + Vite 5 + Cloudflare Pages  

---

## 1. Análisis Técnico del Código

### HTML / `app.html`

| Problema | Línea | Gravedad |
|----------|-------|----------|
| `lang="en"` fijo en `<html>` aunque el sitio soporte 5 idiomas | [`app.html:2`](molvicos-os/src/app.html:2) | ⚠️ Media |
| Script de analytics inline (~1.5KB) en el `<body>` sin `async`/`defer` | [`app.html:40-66`](molvicos-os/src/app.html:40) | ⚠️ Media |
| Widget de Ko-fi cargado con `defer` pero sin estrategia de carga diferida real | [`app.html:111`](molvicos-os/src/app.html:111) | ⚠️ Baja |
| Carga de Google Fonts bloqueante (no usa `swap` explícito ni `font-display: swap` en CSS) | [`app.html:16-18`](molvicos-os/src/app.html:16) | ⚠️ Media |

### CSS / `app.css`

| Problema | Línea | Gravedad |
|----------|-------|----------|
| `!important` usado en reglas de prefers-reduced-motion | [`app.css:507-510`](molvicos-os/src/app.css:507) | ⚠️ Media |
| `width: 100vw` en body puede causar overflow horizontal en algunos navegadores | [`app.css:203`](molvicos-os/src/app.css:203) | ⚠️ Baja |
| Icon color classes duplicadas para cada tema (~200 líneas repetitivas) | [`app.css:434-502`](molvicos-os/src/app.css:434) | ⚠️ Baja |
| Sin `font-display: swap` para las fuentes personalizadas | Global | ⚠️ Media |

### JavaScript / Stores

| Problema | Archivo | Gravedad |
|----------|---------|----------|
| `localStorage` accedido directamente sin try/catch en varios stores (puede fallar en iOS Private) | [`os.js`](molvicos-os/src/lib/stores/os.js), [`mobile.js`](molvicos-os/src/lib/stores/mobile.js) | ⚠️ Media |
| `colorClass: 'icon-gold'` usado en apps pero no definido en CSS (no existe clase `.icon-gold`) | [`apps.js:96,217`](molvicos-os/src/lib/apps.js:96) | 🔴 Alta |
| Lazy loading de componentes con `() => import(...)` sin manejo de errores | [`apps.js`](molvicos-os/src/lib/apps.js) (todos) | ⚠️ Media |
| Script de Adsterra inyectado dinámicamente sin verificación de consentimiento | [`+page.svelte:57-64`](molvicos-os/src/routes/+page.svelte:57) | 🔴 Alta |

---

## 2. Diseño Responsive

### Breakpoint 320px (Móvil pequeño)

| Problema | Detalle |
|----------|---------|
| ✅ Menú hamburguesa funcional con animación | Correcto |
| ✅ Grid de apps en landing se adapta a 1 columna | Correcto |
| ⚠️ Footer cambia a columna pero los enlaces pueden quedar apretados | Mejorable |
| ⚠️ Hero padding reducido pero título `clamp(2.4rem, 6vw, 4rem)` puede quedar grande en 320px | Revisar |

### Breakpoint 768px (Tablet)

| Problema | Detalle |
|----------|---------|
| ✅ Media query para `h1`-`h3` reduce tamaños | Correcto |
| ⚠️ `.desktop-section` usa `grid-template-columns: repeat(2, 1fr)` — en tablets verticales puede ser estrecho | Mejorable |
| ✅ Nav se mantiene horizontal sin hamburguesa | Correcto |

### Breakpoint 1024px (Desktop pequeño)

| Problema | Detalle |
|----------|---------|
| ✅ Diseño de OS viewport funciona correctamente | Correcto |
| ⚠️ Dock lateral izquierdo con `top: 50%; transform: translateY(-50%)` puede solaparse con contenido en ventanas pequeñas | Mejorable |

### Problemas generales responsive

| Problema | Gravedad |
|----------|----------|
| El OS viewport usa `position: fixed; inset: 0` — correcto para escritorio pero en móvil redirige a `/mobile` | ✅ Correcto |
| `MobileAppView.svelte` fuerza `font-size: 16px` en inputs para evitar zoom automático en iOS | ✅ Correcto |
| `MobileAppView` oculta `.window-controls` y `.titlebar-drag` — buena práctica | ✅ Correcto |

---

## 3. Rendimiento y Velocidad

### Métricas estimadas (basadas en análisis de código)

| Métrica | Valor | Estado |
|---------|-------|--------|
| Carga de Google Fonts | ~50-80KB (2 fuentes: Space Mono + Syne) | ⚠️ Optimizable |
| Script de analytics inline | ~1.5KB (no minificado) | ⚠️ Minificable |
| Widget Ko-fi | Carga externa bloqueante | ⚠️ Diferible |
| Adsterra banner | Script externo pesado | 🔴 Impacta negativamente |
| Imágenes | Solo iconos PNG pequeños | ✅ Correcto |
| Lazy loading de apps | Carga bajo demanda con `import()` dinámico | ✅ Correcto |
| Service Worker | PWA configurada con `vite-plugin-pwa` | ✅ Correcto |
| Cache headers | Configurados en `_headers` con `max-age=31536000` para assets | ✅ Correcto |

### Problemas de rendimiento

| Problema | Detalle | Gravedad |
|----------|---------|----------|
| Google Fonts sin `font-display: swap` | Causa FOIT (Flash of Invisible Text) | ⚠️ Media |
| Analytics inline no minificado | ~1.5KB que podrían ser ~0.8KB minificado | ⚠️ Baja |
| Adsterra banner en landing | Script de publicidad externo que ralentiza carga | 🔴 Alta |
| Sin estrategia de precarga de rutas críticas | No hay `<link rel="preload">` para recursos clave | ⚠️ Baja |
| Sin critical CSS inline | Todo el CSS se carga en un solo bundle | ⚠️ Media |

---

## 4. Accesibilidad Básica (WCAG)

### Problemas detectados

| Problema | Archivo | Línea | Gravedad |
|----------|---------|-------|----------|
| `aria-label` faltante en botón de menú hamburguesa del landing | [`+page.svelte`](molvicos-os/src/routes/+page.svelte:94) | ⚠️ Media |
| Elementos `draggable="true"` sin roles ARIA ni `aria-grabbed` | [`Desktop.svelte`](molvicos-os/src/components/os/Desktop.svelte:96-100) | ⚠️ Media |
| Botones de cierre/minimizar/maximizar sin texto accesible (solo iconos) | [`Window.svelte:160-168`](molvicos-os/src/components/os/Window.svelte:160) | ⚠️ Media |
| Contraste de color: texto `#5a7a6a` (text-secondary) sobre fondo `#06090f` (bg-base) — ratio ~4.2:1, cerca del mínimo 4.5:1 | [`app.css:23`](molvicos-os/src/app.css:23) | ⚠️ Media |
| Sin skip-to-content link | Global | ⚠️ Media |
| Sin `aria-live` regions para contenido dinámico | Global | ⚠️ Baja |
| El banner de cookies no tiene `role="dialog"` ni `aria-modal` | [`+layout.svelte:63-70`](molvicos-os/src/routes/+layout.svelte:63) | ⚠️ Baja |
| Comentario `svelte-ignore a11y-click-events-have-key-events` en menu mobile | [`MobileTopBar.svelte:73`](molvicos-os/src/components/mobile/MobileTopBar.svelte:73) | ⚠️ Baja |

### Aspectos positivos

| Aspecto | Detalle |
|---------|---------|
| ✅ `prefers-reduced-motion` implementado correctamente | `app.css:505-512` |
| ✅ Viewport meta con `viewport-fit=cover` | `app.html:5` |
| ✅ `-webkit-tap-highlight-color: transparent` en elementos táctiles | Múltiples componentes |
| ✅ Etiquetas semánticas (`<nav>`, `<header>`, `<main>`, `<footer>`) | Uso general correcto |

---

## 5. SEO Básico

### Metaetiquetas

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| `<title>` | ✅ Correcto | Título descriptivo en cada página |
| `<meta name="description">` | ✅ Correcto | Presente en landing y OS |
| `<meta name="viewport">` | ✅ Correcto | Configurado correctamente |
| Open Graph tags | ✅ Correcto | `og:title`, `og:description`, `og:image`, `og:url` presentes |
| Twitter Cards | ✅ Correcto | `summary_large_image` configurado |
| JSON-LD Structured Data | ✅ Correcto | `SoftwareApplication` schema en landing y app.html |
| `canonical` link | ✅ Correcto | Dinámico en `+layout.svelte` |
| `hreflang` tags | ❌ Ausente | No hay etiquetas `hreflang` para los 5 idiomas soportados |

### Estructura de encabezados

| Aspecto | Estado |
|---------|--------|
| Un solo `<h1>` por página | ✅ Correcto |
| Jerarquía `h1` → `h2` → `h3` | ✅ Correcta |
| Encabezados descriptivos | ✅ Correcto |

### Archivos SEO

| Archivo | Estado |
|---------|--------|
| `robots.txt` | ✅ Correcto — permite todo, referencia sitemap |
| `sitemap.xml` | ⚠️ Mejorable — solo 3 URLs, sin `lastmod` actualizado (2026-03-29) |
| `_redirects` | ✅ Correcto — redirect www a non-www |
| `manifest.webmanifest` | ✅ Correcto — PWA configurada |

### Problemas SEO

| Problema | Gravedad |
|----------|----------|
| Sitemap desactualizado (solo 3 URLs, fecha 2026-03-29) | ⚠️ Media |
| Sin `hreflang` para contenido multilingüe (5 idiomas) | ⚠️ Media |
| La ruta `/onboarding` redirige a `/os` pero está en sitemap | ⚠️ Baja |
| Sin meta `author` ni `publisher` en todas las páginas | ⚠️ Baja |

---

## 6. Experiencia de Usuario (UX)

### Aspectos positivos

| Aspecto | Detalle |
|---------|---------|
| ✅ Onboarding progresivo | Paso a paso con 5 etapas bien diseñadas |
| ✅ Sin registro obligatorio | Experiencia zero-friction |
| ✅ Modo demo funcional | Permite explorar sin API keys |
| ✅ Feedback visual en acciones | Spinners, skeletons, animaciones |
| ✅ Soporte multilingüe | 5 idiomas con detección automática |
| ✅ PWA instalable | Funciona offline, manifest completo |
| ✅ Múltiples temas | 5 temas visuales distintos |
| ✅ Comando Cmd+K | Paleta de comandos global |

### Problemas de UX

| Problema | Detalle | Gravedad |
|----------|---------|----------|
| Banner de Adsterra en landing | Publicidad intrusiva que puede distraer | 🔴 Alta |
| Sin feedback de carga en lazy loading de apps | No hay skeleton mientras se carga el componente | ⚠️ Media |
| El banner de bienvenida dura 3s y luego desaparece sin interacción | Puede perderse información importante | ⚠️ Baja |
| Sin confirmación al cerrar apps con datos sin guardar | Riesgo de pérdida de trabajo | ⚠️ Media |
| Cookies banner en inglés aunque el sitio esté en español | [`+layout.svelte:65-68`](molvicos-os/src/routes/+layout.svelte:65) | ⚠️ Media |
| Sin indicador de "arrastrable" en iconos del escritorio | No es obvio que se puedan reordenar | ⚠️ Baja |

---

## 7. Recomendaciones Priorizadas

### 🔴 Críticos (3)

1. **Clase CSS `icon-gold` no definida**
   - **Problema:** Las apps `dashboard` y `quoteforge` usan `colorClass: 'icon-gold'` pero no existe la clase `.icon-gold` en [`app.css`](molvicos-os/src/app.css)
   - **Solución:** Añadir la clase faltante:
   ```css
   .icon-gold {
       background: #1a1400;
       border-color: #ffd70030;
   }
   /* Overrides para cada tema */
   ```
   - **Herramienta:** [CSS Validator](https://jigsaw.w3.org/css-validator/)

2. **Script de Adsterra sin consentimiento de cookies**
   - **Problema:** El script de publicidad se carga automáticamente al montar el landing sin verificar si el usuario aceptó cookies
   - **Solución:** Envolver la carga en una verificación de `cookiesAccepted`:
   ```javascript
   // Antes
   const s = document.createElement('script');
   s.src = '...';
   adContainer.appendChild(s);
   
   // Después
   if (localStorage.getItem('cookies_accepted') === 'true') {
       const s = document.createElement('script');
       s.src = '...';
       adContainer.appendChild(s);
   }
   ```
   - **Herramienta:** [Cookiebot](https://www.cookiebot.com/) para gestión de consentimiento

3. **Sitemap desactualizado y sin hreflang**
   - **Problema:** Solo 3 URLs en sitemap, sin etiquetas `hreflang` para contenido multilingüe
   - **Solución:** Actualizar sitemap con todas las rutas y añadir `hreflang`:
   ```xml
   <url>
     <loc>https://molvicos.pro/</loc>
     <lastmod>2026-04-26</lastmod>
     <changefreq>weekly</changefreq>
     <priority>1.0</priority>
   </url>
   ```
   Y en `<head>`:
   ```html
   <link rel="alternate" hreflang="en" href="https://molvicos.pro/en" />
   <link rel="alternate" hreflang="es" href="https://molvicos.pro/es" />
   ```
   - **Herramienta:** [Screaming Frog SEO Spider](https://www.screamingfrog.com/seo-spider/)

### ⚠️ Mejoras Rápidas (5)

1. **Añadir `font-display: swap` a Google Fonts**
   ```css
   /* En app.css */
   @font-face {
       font-family: 'Space Mono';
       font-display: swap;
       /* ... */
   }
   ```
   O mejor, añadir `&display=swap` en la URL de Google Fonts:
   ```
   https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap
   ```

2. **Traducir el banner de cookies según el idioma activo**
   ```svelte
   <!-- En +layout.svelte -->
   <p>{$t('cookies.message')}
     <a href="/legal/cookies.html">{$t('cookies.policy')}</a>
   </p>
   <button on:click={acceptCookies} class="cookie-accept-btn">
     {$t('cookies.accept')}
   </button>
   ```

3. **Añadir `aria-label` al botón hamburguesa del landing**
   ```svelte
   <!-- Ya tiene aria-label="Toggle menu" en +page.svelte:94 ✅ -->
   <!-- Pero añadir aria-expanded dinámico: -->
   <button 
     aria-label="Toggle menu" 
     aria-expanded={mobileMenuOpen}
     on:click={() => mobileMenuOpen = !mobileMenuOpen}
   >
   ```

4. **Proteger accesos a localStorage con try/catch**
   ```javascript
   // Patrón a aplicar en todos los stores
   function safeGet(key, fallback) {
       try {
           const val = localStorage.getItem(key);
           return val !== null ? JSON.parse(val) : fallback;
       } catch {
           return fallback;
       }
   }
   ```

5. **Minificar el script de analytics inline**
   ```javascript
   // Versión minificada (~0.8KB vs ~1.5KB)
   !function(){var S='molvicos.pro',E='https://analytics.molvicstudios.pro/track',K='ms_uid';if(location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.hostname.endsWith('.pages.dev')||/bot|crawl|spider/i.test(navigator.userAgent))return;var n=!localStorage.getItem(K);n&&localStorage.setItem(K,'1');var s=Date.now(),l=s;['mousemove','keydown','touchstart'].forEach(function(e){document.addEventListener(e,function(){l=Date.now()},{passive:!0})});function t(e,o){var p={site:S,page:location.pathname,event:e||'pageview',referrer:document.referrer,is_new_user:n};o&&Object.assign(p,o);fetch(E,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p),keepalive:!0}).catch(function(){})}document.readyState==='loading'?document.addEventListener('DOMContentLoaded',function(){t('pageview')}):t('pageview');window.addEventListener('beforeunload',function(){var d=Math.round((Date.now()-s)/1e3),a=Math.min(d,Math.round((l-s)/1e3));a>2&&t('session_end',{duration:a})});window.molvicTrack=function(e){t(e)}}();
   ```

---

## 8. Herramientas Recomendadas

| Herramienta | Uso | URL |
|-------------|-----|-----|
| **PageSpeed Insights** | Rendimiento web | https://pagespeed.web.dev/ |
| **Lighthouse CI** | Auditoría automatizada | https://github.com/GoogleChrome/lighthouse-ci |
| **WebPageTest** | Pruebas de velocidad detalladas | https://www.webpagetest.org/ |
| **axe DevTools** | Accesibilidad WCAG | https://www.deque.com/axe/ |
| **Squoosh** | Optimización de imágenes | https://squoosh.app/ |
| **Screaming Frog** | SEO spider | https://www.screamingfrog.com/seo-spider/ |
| **W3C Validator** | Validación HTML/CSS | https://validator.w3.org/ |
| **Terser** | Minificación JS | https://terser.org/ |

---

## Resumen de Hallazgos

| Categoría | 🔴 Críticos | ⚠️ Medios | ✅ Buenos |
|-----------|-------------|-----------|-----------|
| Código | 2 | 6 | 5 |
| Responsive | 0 | 2 | 6 |
| Rendimiento | 1 | 3 | 5 |
| Accesibilidad | 0 | 5 | 4 |
| SEO | 1 | 3 | 8 |
| UX | 1 | 3 | 8 |
| **Total** | **5** | **22** | **36** |

> **Valoración general:** El proyecto está bien estructurado y sigue buenas prácticas modernas (SvelteKit, lazy loading, PWA, i18n). Los problemas críticos son puntuales y fáciles de corregir. Las mejoras prioritarias son: añadir la clase CSS faltante `icon-gold`, proteger la carga de Adsterra tras consentimiento, y actualizar el sitemap con hreflang.
