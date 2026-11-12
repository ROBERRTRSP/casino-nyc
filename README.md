# 🎰 Casino NYC

**Lobby de casino recreativo** para teléfono y computadora. Solo usa créditos ficticios; no acepta dinero real, depósitos ni retiros.

## Funciones disponibles

- **Inicio:** portada, acceso rápido al juego, créditos de demostración y regalo diario ficticio.
- **Juegos:** catálogo, búsqueda, categorías y fichas marcadas `Próximamente` para juegos aún no desarrollados.
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
- `manifest.webmanifest` e `icons/casino-nyc.svg` — metadatos e icono.
- [`ESTUDIO_CASINO_NYC.md`](ESTUDIO_CASINO_NYC.md) — arquitectura, UX, pruebas, riesgos y hoja de ruta.

> No hay cuentas reales, servidores de pagos ni premios canjeables. `localStorage` solo conserva datos recreativos dentro del navegador. La versión actual no ha sido certificada para uso comercial.
