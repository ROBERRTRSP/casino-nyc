# ⚡ Guía Rápida: Activar Diseño iOS

## 🚀 3 Formas de Implementar

---

## OPCIÓN 1: Vista Previa Inmediata (Sin Cambios)

```bash
# Solo abre en tu navegador:
file:///ruta/a/casino-nyc/index-ios.html

# O si está publicado:
https://tudominio.com/index-ios.html
```

✅ **Ventaja:** Sin modificar nada  
❌ **Desventaja:** URL diferente

---

## OPCIÓN 2: Reemplazar Diseño Actual

```bash
cd casino-nyc

# 1. Backup del diseño original
mv lobby.css lobby-original.css
mv graphics-lobby.css graphics-lobby-original.css
mv mobile-lobby.css mobile-lobby-original.css
mv index.html index-original.html

# 2. Activar iOS como predeterminado
mv lobby-ios.css lobby.css
mv graphics-lobby-ios.css graphics-lobby.css
mv mobile-lobby-ios.css mobile-lobby.css
mv index-ios.html index.html

# 3. Git commit
git add -A
git commit -m "style: Activar diseño iOS como predeterminado"
git push

# 4. Publicar
# GitHub Pages se actualizará automáticamente
```

✅ **Ventaja:** iOS como diseño principal  
⚠️ **Nota:** Puedes volver atrás revirtiendo el commit

---

## OPCIÓN 3: Selector de Tema (Recomendado)

### Paso 1: Crear Theme Switcher

Agrega esto al `<head>` de `index.html`:

```html
<!-- Estilos originales por defecto -->
<link rel="stylesheet" href="lobby.css" id="theme-original">
<link rel="stylesheet" href="graphics-lobby.css" id="theme-original-graphics">
<link rel="stylesheet" href="mobile-lobby.css" id="theme-original-mobile">

<!-- Estilos iOS deshabilitados inicialmente -->
<link rel="stylesheet" href="lobby-ios.css" id="theme-ios" disabled>
<link rel="stylesheet" href="graphics-lobby-ios.css" id="theme-ios-graphics" disabled>
<link rel="stylesheet" href="mobile-lobby-ios.css" id="theme-ios-mobile" disabled>
```

### Paso 2: Agregar Botón de Cambio

Agrega antes del `</footer>` en `index.html`:

```html
<div style="text-align: center; margin: 32px 0;">
  <button onclick="toggleTheme()" id="theme-toggle" 
          style="min-height: 48px; padding: 12px 24px; 
                 border-radius: 14px; font-weight: 600;
                 background: var(--accent, #ffcc00); 
                 color: #000; border: none; cursor: pointer;">
    🍎 Cambiar a Diseño iOS
  </button>
</div>

<script>
function toggleTheme() {
  const isIOS = localStorage.getItem('theme') === 'ios';
  const newTheme = isIOS ? 'original' : 'ios';
  
  // Alternar hojas de estilo
  document.getElementById('theme-original').disabled = !isIOS;
  document.getElementById('theme-original-graphics').disabled = !isIOS;
  document.getElementById('theme-original-mobile').disabled = !isIOS;
  
  document.getElementById('theme-ios').disabled = isIOS;
  document.getElementById('theme-ios-graphics').disabled = isIOS;
  document.getElementById('theme-ios-mobile').disabled = isIOS;
  
  // Guardar preferencia
  localStorage.setItem('theme', newTheme);
  
  // Actualizar botón
  const btn = document.getElementById('theme-toggle');
  btn.textContent = isIOS ? '🍎 Cambiar a Diseño iOS' : '🎰 Cambiar a Diseño Original';
  
  // Toast de confirmación
  showToast(`Diseño ${isIOS ? 'Original' : 'iOS'} activado`);
}

// Aplicar tema guardado al cargar
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'ios') {
    toggleTheme();
    const btn = document.getElementById('theme-toggle');
    btn.textContent = '🎰 Cambiar a Diseño Original';
  }
});
</script>
```

### Paso 3: Auto-detectar Dispositivo Apple (Opcional)

Modifica el script para detectar automáticamente:

```javascript
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  const isApple = /iPhone|iPad|Mac/.test(navigator.platform) || 
                  /iPhone|iPad|iPod/.test(navigator.userAgent);
  
  // Si es Apple y no hay preferencia guardada, activar iOS
  if (!savedTheme && isApple) {
    toggleTheme();
  } else if (savedTheme === 'ios') {
    toggleTheme();
  }
});
```

✅ **Ventajas:**
- Los usuarios eligen su preferencia
- Detecta automáticamente dispositivos Apple
- Guarda la elección
- A/B testing natural

---

## 📱 Solo para Juegos

Si quieres aplicar iOS solo a los juegos individuales:

```html
<!-- En games/campana-link.html, cambiar: -->
<link rel="stylesheet" href="slot.css">

<!-- Por: -->
<link rel="stylesheet" href="slot-ios.css">
```

**Nota:** `slot-ios.css` aún no existe. Puedes crearlo basándote en `lobby-ios.css`.

---

## 🔄 Volver al Diseño Original

### Si usaste Opción 1 (Vista Previa)
- Solo cierra `index-ios.html` y abre `index.html`

### Si usaste Opción 2 (Reemplazo)
```bash
git revert HEAD
# o restaurar archivos manualmente
```

### Si usaste Opción 3 (Selector)
- Haz clic en el botón "Cambiar a Diseño Original"
- O borra localStorage: `localStorage.removeItem('theme')`

---

## 🎨 Personalizar el Diseño iOS

### Cambiar Color de Acento

En `lobby-ios.css`, línea ~13:

```css
:root {
  --accent: #ff9f0a; /* Naranja iOS en lugar de amarillo */
}
```

Colores iOS disponibles:
- `#0a84ff` — Azul
- `#30d158` — Verde
- `#ff453a` — Rojo
- `#ff9f0a` — Naranja
- `#ffd60a` — Amarillo (actual)
- `#bf5af2` — Morado

### Ajustar Intensidad del Blur

En `lobby-ios.css`, busca `backdrop-filter`:

```css
/* Menos blur (mejor performance) */
backdrop-filter: blur(20px) saturate(140%);

/* Más blur (más dramático) */
backdrop-filter: blur(60px) saturate(200%);

/* Sin blur (fallback) */
backdrop-filter: none;
background: var(--bg-secondary); /* Fondo sólido */
```

### Cambiar Tamaño de Fuente Base

```css
:root {
  font-size: 16px; /* iOS usa 17px por defecto */
}
```

---

## ✅ Checklist de Verificación

Después de activar el diseño iOS, verifica:

- [ ] Sidebar tiene efecto glass con blur
- [ ] Colores son más fríos (negro puro, no azulado)
- [ ] Botones son planos (sin gradientes)
- [ ] Sombras son sutiles
- [ ] Toggle switch tiene estilo iOS nativo
- [ ] Wallet muestra glassmorphism
- [ ] Game cards tienen hover con elevación
- [ ] Todo se ve nítido en Retina display
- [ ] Performance es aceptable en tu dispositivo
- [ ] Mobile nav tiene blur en la parte inferior

---

## 🐛 Solución de Problemas

### El blur no funciona

**Causa:** Navegador o GPU antigua no soporta `backdrop-filter`

**Solución:**
```css
/* Agregar fallback en lobby-ios.css */
@supports not (backdrop-filter: blur(40px)) {
  .sidebar, .wallet, .mobnav {
    background: var(--bg-secondary);
    backdrop-filter: none;
  }
}
```

### Performance bajo en móvil

**Causa:** `blur(40px)` es costoso

**Solución:** Reducir blur a 20px:
```css
backdrop-filter: blur(20px) saturate(160%);
```

### Colores se ven mal

**Causa:** Monitor no calibrado o modo noche activado

**Solución:** Desactiva Night Shift / Dark Mode del navegador

### Textos ilegibles

**Causa:** Contraste bajo en algunos fondos

**Solución:** Aumentar opacidad de fondos:
```css
--glass-bg: rgba(28, 28, 30, 0.85); /* Era 0.72 */
```

---

## 📊 Métricas de Éxito

Después de 1 semana con el diseño iOS, mide:

- [ ] **Bounce rate** (¿bajó?)
- [ ] **Tiempo en sitio** (¿subió?)
- [ ] **Clicks en juegos** (¿mejoraron?)
- [ ] **Feedback de usuarios** (¿positivo?)
- [ ] **Performance** (¿60fps en tu target?)

---

## 🚀 Publicar en GitHub Pages

```bash
# El diseño se publicará automáticamente al hacer push
git add -A
git commit -m "style: Activar diseño iOS"
git push origin MAIN

# Espera 2-3 minutos y visita:
# https://roberrtrsp.github.io/casino-nyc/
# O para iOS directo:
# https://roberrtrsp.github.io/casino-nyc/index-ios.html
```

---

## 💬 Feedback

Si implementas el diseño iOS, considera agregar un botón de feedback:

```html
<button onclick="sendFeedback()" style="...">
  💬 ¿Te gusta el nuevo diseño?
</button>

<script>
function sendFeedback() {
  const likes = confirm('¿Te gusta el nuevo diseño iOS?');
  localStorage.setItem('design-feedback', likes ? 'yes' : 'no');
  showToast(likes ? '¡Gracias! 😊' : 'Gracias por tu feedback');
}
</script>
```

---

**¡Listo!** Ahora tienes un diseño iOS limpio y moderno para Casino NYC. 🎰✨

¿Dudas? Revisa:
- [`DISENO_IOS.md`](DISENO_IOS.md) — Documentación completa
- [`COMPARACION_DISENOS.md`](COMPARACION_DISENOS.md) — Original vs iOS
- [`AUDITORIA_DISENO.md`](AUDITORIA_DISENO.md) — Auditoría técnica
