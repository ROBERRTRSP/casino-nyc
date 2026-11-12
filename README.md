# 🎰 Casino NYC

**Lobby de casino recreativo** para teléfono y computadora. Solo usa créditos ficticios; no acepta dinero real, depósitos ni retiros.

## Funciones disponibles

- **Inicio:** portada, acceso rápido al juego, créditos de demostración y regalo diario ficticio.
- **Juegos:** catálogo, búsqueda, categorías y acceso a los cuatro juegos funcionales.
- **Favoritos:** selección de juegos guardada localmente en el navegador.
- **Premios:** consulta informativa de los cuatro premios ficticios de Campana Link.
- **Perfil:** apodo local, sonido, restablecer créditos demo.
- **Campana Link:** cinco rodillos animados, diez líneas, bonificación de campanas y **giro automático de 5 / 10 / 25 / 50 giros**, con parada manual.
- Diseño adaptable a móviles y metadatos de app web.

## Ejecutar o publicar

Se puede servir la carpeta como sitio estático con cualquier servidor HTTP. Para publicar en GitHub Pages:

1. Abrir el repositorio y entrar a **Settings → Pages**.
2. En `Build and deployment` elegir `Deploy from a branch`.
3. Escoger rama `MAIN` y carpeta `/(root)`.
4. Pulsar `Save`.
5. Cuando se complete la publicación, entrar en https://roberrtrsp.github.io/casino-nyc/.

Abrir la dirección publicada en Safari o Chrome (la vista previa de HTML en algunas aplicaciones bloquea JavaScript).

## Organización

- `index.html` — pantalla principal / lobby.
- `lobby.css` y `lobby.js` — estilos y funciones interactivas.
- `games/campana-link.html` — tragamonedas completa.
- `games/diamond-stars.html` y `games/fortuna-7.html` — tragamonedas adicionales.
- `games/arcade-slot.js` y `games/slot.css` — motor de rodillos físicos y tabla de pagos.
- `games/ruleta-europea.html` — ruleta adaptada de KARMA.
- `games/karma-wheel.js` — orden europeo y trayectoria de giro adaptados del proyecto KARMA; dibujado en Canvas 2D de alta densidad.
- `games/roulette.js` y `games/karma-roulette.css` — controles, apuestas especiales y mesa de ruleta.
- `manifest.webmanifest` e `icons/casino-nyc.svg` — metadatos e icono.
- [`ESTUDIO_CASINO_NYC.md`](ESTUDIO_CASINO_NYC.md) — arquitectura, UX, pruebas, riesgos y hoja de ruta.

> No hay cuentas reales, servidores de pagos ni premios canjeables. `localStorage` solo conserva datos recreativos dentro del navegador. La versión actual no ha sido certificada para uso comercial.

## Juegos disponibles (fase 2)

- **Campana Link:** cinco rodillos animados, diez líneas y giro automático.
- **Diamond Stars:** cinco rodillos con cinta deslizante y frenada progresiva, comodines, tabla de pagos y bono de cinco giros gratis al salir tres símbolos ✨.
- **Fortuna 7:** tragamonedas clásica de tres rodillos con giro vertical suave, cinco líneas y tabla de premios.
- **Ruleta KARMA:** rueda europea de un cero, trayectoria de la bola y orden de casillas adaptados del código de KARMA, apuestas a números, colores, paridad, docenas, columnas, semiplenos, calles, cuadros, seisenas y tríos; deshacer, limpiar y repetir.

**Límite importante:** la ruleta del repositorio original de KARMA es un componente WebGL/Three.js integrado con Next.js y con un servidor POS. Esta versión es una **adaptación visual y matemática propia en Canvas 2D** para poder servir Casino NYC como web estática; **no copia el componente Three.js ni el servidor**, ni comparte autenticación, saldos, fondos, jackpots, cajeros o bases de datos.

Los cuatro comparten un mismo saldo de prueba mediante `localStorage`, **sin dinero real**.


## Probabilidades y gráficos
La versión demo incluye probabilidades documentadas y símbolos mejorados. Consulta [PROBABILIDADES_Y_GRAFICOS.md](PROBABILIDADES_Y_GRAFICOS.md).


## Mejora gráfica v5 · 12 de noviembre de 2026

- Diamond Stars y Fortuna 7 ahora muestran los recursos gráficos locales de `games/casino-symbols.css` en los **rodillos y en la tabla de premios**, sustituyendo las fuentes emoji que variaban según el sistema operativo.
- Se ajusta la presentación del símbolo BAR, del siete y de las campanas para evitar recortes.
- El catálogo del lobby incluye tres portadas nuevas de alta resolución, disponibles en `.webp` y en versión vectorial `.svg` en `assets/`.
- La ruleta mantiene su lógica actual: nuevo emblema original de crupier, cabecera compacta y rueda más equilibrada en móvil.
- `graphics-lobby.css` y `games/graphics-polish.css` contienen los ajustes visuales de esta fase.

Los recursos se incluyen directamente en el repositorio y no necesitan servicios externos. Los gráficos vectoriales conservan su nitidez al escalar; las fotografías preexistentes de frutas provienen del prototipo y **no son capturas 4K nativas**.

**Pruebas:** inspección en Chromium con anchos de 320, 393 y 1366 píxeles, comprobación visual del giro y la ruleta, y verificación de ausencia de desbordamiento horizontal. Queda pendiente comprobar el resultado en Safari en un iPhone físico.

## Diseño para teléfonos (v6)
- Interfaces optimizadas para 320–430 px de ancho y modo horizontal.
- Rodillos y botones de jugar/autogiro dimensionados para pantalla táctil.
- Campana Link muestra los cuatro jackpots sin recortes en móvil.
- Ruleta: la mesa pasa a 3 columnas táctiles, números de al menos 44 px de alto y botón de giro siempre visible abajo; se puede desplazarse verticalmente para ver todas las apuestas.
- El escritorio conserva su diseño de mayor tamaño.

Pruebas locales con navegador móvil simulado en 320×568, 393×852, 852×393 y escritorio 1366×768. No sustituyen una prueba física en Safari o Android.
