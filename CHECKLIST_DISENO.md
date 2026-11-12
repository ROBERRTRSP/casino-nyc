# ✅ CHECKLIST DE DISEÑO — Casino NYC

**Quick Reference Guide** para mejoras prioritarias identificadas en la auditoría.

---

## 🔴 CRÍTICO — Acción Inmediata

- [ ] **Pruebas en iPhone Safari Real**
  - Probar lobby en iOS Safari
  - Verificar safe areas y notch
  - Comprobar ruleta en landscape
  - **Responsable:** QA/Dev
  - **Estimado:** 2-3 horas

- [ ] **Auditoría de Contraste WCAG AA**
  ```
  Herramientas:
  - https://webaim.org/resources/contrastchecker/
  - Chrome DevTools > Lighthouse > Accessibility
  
  Verificar:
  - Texto secundario (#afa7bb sobre fondos oscuros)
  - Labels pequeños (10px-12px)
  - Botones deshabilitados
  ```
  - **Responsable:** Designer
  - **Estimado:** 1-2 horas

- [ ] **Manejo de Errores de localStorage**
  ```javascript
  // Agregar en todos los setItem:
  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        showToast('Almacenamiento lleno. Limpia datos antiguos.');
      }
      console.error('Error guardando:', e);
      return false;
    }
  }
  ```
  - **Archivo:** `lobby.js`, `arcade-slot.js`
  - **Responsable:** Dev
  - **Estimado:** 1 hora

---

## 🟡 IMPORTANTE — Esta Semana

- [ ] **Confirmación de Acciones Destructivas**
  ```javascript
  // En botón "Restablecer créditos demo"
  const confirmReset = () => {
    if (!confirm('¿Seguro? Perderás tus créditos actuales.')) {
      return;
    }
    // ... código de reset
  };
  ```
  - **Archivo:** `lobby.js`
  - **Responsable:** Dev
  - **Estimado:** 30 min

- [ ] **Service Worker Básico**
  ```javascript
  // sw.js nuevo
  const CACHE_NAME = 'casino-nyc-v1';
  const urlsToCache = [
    '/',
    '/lobby.css',
    '/lobby.js',
    '/icons/casino-nyc.svg'
  ];
  
  self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
  });
  ```
  - **Nuevos archivos:** `sw.js`, actualizar `manifest.webmanifest`
  - **Responsable:** Dev
  - **Estimado:** 2-3 horas

- [ ] **Minificación en Build**
  ```bash
  # Instalar herramientas
  npm install --save-dev csso-cli terser
  
  # package.json
  {
    "scripts": {
      "build:css": "csso lobby.css -o lobby.min.css",
      "build:js": "terser lobby.js -o lobby.min.js -c -m",
      "build": "npm run build:css && npm run build:js"
    }
  }
  ```
  - **Nuevo archivo:** `package.json`
  - **Responsable:** DevOps
  - **Estimado:** 1-2 horas

- [ ] **Validación de Datos de localStorage**
  ```javascript
  function loadProfile() {
    try {
      const raw = localStorage.getItem('casino_nyc_profile');
      const data = JSON.parse(raw);
      
      // Validar estructura
      if (!data || typeof data.nickname !== 'string') {
        return getDefaultProfile();
      }
      
      return data;
    } catch (e) {
      console.error('Datos corruptos:', e);
      return getDefaultProfile();
    }
  }
  ```
  - **Archivos:** `lobby.js`, `arcade-slot.js`
  - **Responsable:** Dev
  - **Estimado:** 1 hora

---

## 🟢 MEJORAS — Este Mes

- [ ] **Linter y Formatter**
  ```bash
  npm install --save-dev eslint prettier stylelint
  
  # .eslintrc.json
  {
    "env": { "browser": true, "es2021": true },
    "extends": "eslint:recommended",
    "parserOptions": { "ecmaVersion": 12 }
  }
  
  # .prettierrc
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2
  }
  ```
  - **Nuevos archivos:** `.eslintrc.json`, `.prettierrc`, `.stylelintrc.json`
  - **Responsable:** Dev Lead
  - **Estimado:** 2 horas setup + revisar código

- [ ] **Tests Automatizados (Playwright)**
  ```bash
  npm install --save-dev @playwright/test
  
  # tests/lobby.spec.js
  import { test, expect } from '@playwright/test';
  
  test('búsqueda filtra juegos correctamente', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-nav="juegos"]');
    await page.fill('#gameSearch', 'campana');
    
    const cards = await page.locator('.game-card:visible').count();
    expect(cards).toBe(1);
  });
  ```
  - **Nuevos archivos:** `tests/*.spec.js`, `playwright.config.js`
  - **Responsable:** QA/Dev
  - **Estimado:** 4-6 horas (escribir suite completa)

- [ ] **Content Security Policy**
  ```html
  <!-- En <head> de index.html y juegos -->
  <meta http-equiv="Content-Security-Policy" 
        content="default-src 'self'; 
                 script-src 'self'; 
                 style-src 'self' 'unsafe-inline'; 
                 img-src 'self' data:;">
  ```
  - **Archivos:** Todos los `.html`
  - **Responsable:** Security/Dev
  - **Estimado:** 1 hora

- [ ] **Indicadores de Carga**
  ```html
  <!-- En transiciones de juegos -->
  <div class="loading-overlay" hidden>
    <div class="spinner"></div>
    <p>Cargando juego...</p>
  </div>
  ```
  ```css
  .spinner {
    border: 3px solid var(--panel);
    border-top-color: var(--gold);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 0.8s linear infinite;
  }
  ```
  - **Archivos:** `index.html`, `lobby.css`, `lobby.js`
  - **Responsable:** Designer + Dev
  - **Estimado:** 1-2 horas

- [ ] **Mejorar `alt` en Imágenes**
  ```html
  <!-- Cambiar: -->
  <img src="assets/diamond-cover.svg" alt="">
  
  <!-- Por: -->
  <img src="assets/diamond-cover.svg" 
       alt="Diamante brillante sobre fondo azul estrellado">
  ```
  - **Archivos:** `index.html`, `games/*.html`
  - **Responsable:** Content/Dev
  - **Estimado:** 30 min

---

## 🔵 OPCIONALES — Backlog

- [ ] **Modo Claro (Light Theme)**
  ```css
  @media (prefers-color-scheme: light) {
    :root {
      --bg: #f5f5f0;
      --panel: #ffffff;
      --cream: #1a1a1a;
      /* ... resto de tokens invertidos */
    }
  }
  ```
  - **Archivo:** `lobby.css`
  - **Esfuerzo:** 3-4 horas

- [ ] **Internacionalización (i18n)**
  ```javascript
  const i18n = {
    es: { welcome: 'Bienvenido', play: 'Jugar' },
    en: { welcome: 'Welcome', play: 'Play' }
  };
  ```
  - **Nuevos archivos:** `i18n/*.json`
  - **Esfuerzo:** 6-8 horas

- [ ] **Animaciones Avanzadas**
  - Transiciones suaves entre secciones
  - Parallax en hero
  - Hover effects en tarjetas
  - **Esfuerzo:** 4-5 horas

- [ ] **Analytics Sin PII**
  ```javascript
  function trackEvent(category, action) {
    const events = JSON.parse(localStorage.getItem('analytics') || '[]');
    events.push({ category, action, timestamp: Date.now() });
    localStorage.setItem('analytics', JSON.stringify(events));
  }
  ```
  - **Archivo:** Nuevo `analytics.js`
  - **Esfuerzo:** 2-3 horas

- [ ] **WebP + Fallback para Futuras Fotos**
  ```html
  <picture>
    <source srcset="hero.webp" type="image/webp">
    <source srcset="hero.jpg" type="image/jpeg">
    <img src="hero.jpg" alt="...">
  </picture>
  ```
  - **Nota:** Actualmente solo SVG, aplicar cuando se agreguen fotos
  - **Esfuerzo:** 1 hora por imagen

---

## 📊 MÉTRICAS DE ÉXITO

Después de implementar las tareas críticas e importantes:

### Performance
- [ ] Lighthouse Performance Score: **>90**
- [ ] LCP (Largest Contentful Paint): **<1.5s**
- [ ] FID (First Input Delay): **<100ms**
- [ ] CLS (Cumulative Layout Shift): **<0.1**

### Accesibilidad
- [ ] Lighthouse Accessibility Score: **>95**
- [ ] Todos los textos cumplen WCAG AA (4.5:1)
- [ ] Navegación completa por teclado funcional
- [ ] Screen reader testing: **Sin errores críticos**

### PWA
- [ ] Lighthouse PWA Score: **>90**
- [ ] Service Worker registrado: **✅**
- [ ] Instalable en móvil: **✅**
- [ ] Funciona offline básico: **✅**

### Calidad de Código
- [ ] ESLint: **0 errores**
- [ ] Prettier: **Código formateado**
- [ ] Tests: **>80% cobertura crítica**

---

## 🛠️ COMANDOS RÁPIDOS

```bash
# Desarrollo
npm run dev          # Servidor local
npm run lint         # Verificar código
npm run format       # Formatear código
npm run test         # Tests

# Build
npm run build        # Minificar todo
npm run build:css    # Solo CSS
npm run build:js     # Solo JS

# Auditoría
npx lighthouse https://roberrtrsp.github.io/casino-nyc/ --view
npx axe https://roberrtrsp.github.io/casino-nyc/
```

---

## 📅 CRONOGRAMA SUGERIDO

### Semana 1
- ✅ Auditoría completa (realizada)
- 🔴 Pruebas iPhone Safari
- 🔴 Auditoría contraste WCAG
- 🔴 Manejo errores localStorage

### Semana 2
- 🟡 Confirmación acciones destructivas
- 🟡 Service Worker básico
- 🟡 Minificación build

### Semana 3
- 🟡 Validación datos
- 🟢 Linter + Prettier
- 🟢 CSP headers

### Semana 4
- 🟢 Tests automatizados
- 🟢 Indicadores de carga
- 🟢 Mejoras `alt` texto

---

## 📞 CONTACTOS

**Para consultas sobre esta auditoría:**
- Documento completo: `AUDITORIA_DISENO.md`
- Repositorio: https://github.com/ROBERRTRSP/casino-nyc
- Código fuente: `/agent/repos/casino-nyc`

---

**Última actualización:** 12 de noviembre de 2026  
**Próxima revisión:** Después de implementar tareas críticas
