# Casino NYC — Modelo matemático y recursos gráficos

**Versión:** simulador recreativo, sin dinero real ni pagos.

## Ruleta Europea
- Se selecciona un resultado uniforme entre los 37 números del 0 al 36, mediante `crypto.getRandomValues` cuando está disponible.
- Probabilidad de un pleno: **1/37 = 2,7027 %**; pago **35:1** (se devuelve 36 veces la ficha).
- Rojo/negro, par/impar y alto/bajo: **18/37 = 48,6486 %**, pago 1:1.
- Docena/columna: **12/37 = 32,4324 %**, pago 2:1.
- Semipleno: 2/37 y 17:1; calle y trío: 3/37 y 11:1; cuadro/cero-1-2-3: 4/37 y 8:1; seisena: 6/37 y 5:1.
- Retorno teórico: **36/37 = 97,2973 %**. Ventaja matemática: **1/37 = 2,7027 %**.
- La trayectoria visual se calcula para coincidir con el resultado elegido; no es una predicción de física ni modifica la probabilidad.

## Fortuna 7
- **Tres rodillos** con 115 posiciones virtuales por rodillo. Cada parada se selecciona independientemente y sin sesgo a través de WebCrypto.
- Se muestran tres símbolos consecutivos por rodillo, como en las tiras de una tragamonedas.
- Tabla de pagos real del simulador, multiplicadores de apuesta por línea:

| Símbolo | Frecuencia / 115 | Triple (x) |
|---|---:|---:|
| 7 | 8 | 425 |
| Cerezas | 21 | 28 |
| Campanas | 15 | 64 |
| Limones | 20 | 21 |
| Diamantes | 12 | 106 |
| BAR | 14 | 71 |
| Estrellas | 6 | 142 |
| Naranja | 19 | 25 |

Por linealidad de esperanza, la suma de las cinco líneas tiene retorno teórico total **94,7512 %** de las apuestas. La probabilidad individual de una línea con triple premiado es aproximadamente **2,15 %**; esto no es la probabilidad de ganar en un giro completo, que depende de las correlaciones entre líneas.

## Diamond Stars
- **Cinco rodillos** con 100 posiciones virtuales por rodillo; cada uno tiene cuatro símbolos de bono separados para que nunca aparezcan dos bonos a la vez en el mismo rodillo visible.
- 10 líneas. Comodín ⭐ que sustituye símbolos comunes. Un bono se activa si aparecen 3 o más ✨ entre los 15 símbolos visibles; paga 5 giros gratis, con posibilidad de reactivación.
- Frecuencias por rodillo: diamante 15, ⭐ 5, corona 12, rubí 17, orbe 14, luna 18, siete 15, ✨ 4.
- Tabla de premios (x apuesta por línea): diamante 14/42/155; ⭐ 22/70/280; corona 14/34/126; rubí 11/28/84; orbe 8/22/68; luna 9/17/53; siete 14/36/112 (premios para 3/4/5).
- Retorno base teórico por evaluación exacta de 8^5 símbolos ponderados: **88,0647 %**.
- Probabilidad exacta del bono: `P(Binomial(5, 0.12) ≥ 3)` = **1,43188992 %** por giro, dado que hay 4 símbolos de bono en cada tira y tres símbolos visibles por rodillo, sin solaparse.
- Retorno total incluyendo los cinco giros gratuitos y reactivaciones: `RTP = RTP_base / (1 - 5*p_bono)` = **94,8559 %**.

**Nota:** estos porcentajes corresponden a modelos originales reproducibles de Casino NYC, **no a los porcentajes reales de una marca o máquina comercial específica**. Para eso se necesita su hoja oficial de configuración, tiras de rodillos y tabla de premios. Un RTP teórico no garantiza resultados a corto plazo. Las máquinas comerciales deben cumplir con regulaciones y certificación aplicables; este proyecto no pretende dicha certificación.

## Gráficos
- Los gráficos de frutas, BAR y corona son imágenes que ya pertenecían a la versión creada de Campana Link, recuperadas e integradas como recursos locales, sin pedirlos a servidores externos en cada jugada.
- Bell (sin etiquetas ni cortes), diamantes, rubí, cristal, luna, sietes y estrellas se dibujaron como iconos vectoriales SVG originales y se integraron en `games/casino-symbols.css`, con escala nítida para pantallas Retina.
- Licencias de terceros **no incorporadas**: se evaluaron packs CC0/CC-BY para mejoras futuras, pero no se incluyeron archivos descargados de otras páginas, porque no se pudieron obtener con integridad comprobable.
- Recomendación gráfica posterior: sustituir las imágenes fotográficas recortadas restantes por símbolos originales con transparencia verdadera y resolución de 1024 px o más; no etiquetar la versión actual como «4K nativa».
