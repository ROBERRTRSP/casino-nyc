(() => {
  'use strict';
  const WIN_LINES = [
    '¡BRILLANTE! · GOLIAT PAGA',
    '¡COMBINACIÓN GANADORA!',
    '¡LAS ESTRELLAS TE SONRÍEN!',
  ];
  const LOSE_LINES = [
    'SIN PREMIO ESTA VEZ',
    'GOLIAT SE QUEDA CON TODO',
    'PRUEBA OTRA COMBINACIÓN',
  ];
  const BONUS_LINES = [
    '¡BONO DE ESTRELLAS!',
    '¡GIROS GRATIS DESBLOQUEADOS!',
    '¡SCATTER EN LLAMAS!',
  ];

  let fxTimer = 0;

  function assetBase() {
    if (window.GoliatFxBase) return window.GoliatFxBase;
    // From games/*.html → games/assets ; from pages that load ../assets prefer root.
    return 'assets/';
  }

  function goliatImg(kind) {
    const file = kind === 'lose' ? 'goliat-lose.png' : 'goliat-win.png';
    const alt = kind === 'lose' ? 'Goliat el chimpancé decepcionado' : 'Goliat el chimpancé celebrando';
    return `<img class="goliat-photo" src="${assetBase()}${file}" alt="${alt}" width="512" height="512" decoding="async">`;
  }

  function clear() {
    const fx = document.getElementById('slotFx');
    if (fx) fx.remove();
    document.querySelector('.stage')?.classList.remove('is-slot-win', 'is-slot-lose', 'is-slot-bonus');
    document.querySelector('.mesa-root')?.classList.remove('is-slot-win', 'is-slot-lose', 'is-slot-bonus');
    document.body.classList.remove('is-slot-celebrate');
    if (fxTimer) {
      clearTimeout(fxTimer);
      fxTimer = 0;
    }
  }

  function show(kind, amountText, detail) {
    clear();
    const stage = document.querySelector('.stage') || document.querySelector('.mesa-root') || document.querySelector('.app') || document.body;
    const stageClass = kind === 'win' ? 'is-slot-win' : kind === 'bonus' ? 'is-slot-bonus' : 'is-slot-lose';
    if (stage && stage !== document.body) stage.classList.add(stageClass);
    if (kind !== 'lose') document.body.classList.add('is-slot-celebrate');

    const lines = kind === 'win' ? WIN_LINES : kind === 'bonus' ? BONUS_LINES : LOSE_LINES;
    const kicker = lines[Math.floor(Math.random() * lines.length)];
    const title = kind === 'win' ? '¡GANASTE!' : kind === 'bonus' ? '¡BONO!' : '¡PERDISTE!';
    const icon = kind === 'win' ? '💎' : kind === 'bonus' ? '✨' : '💥';
    const coins =
      kind === 'lose'
        ? ''
        : `<span class="slot-fx-coins" aria-hidden="true">${Array.from({ length: 42 }, () => '<i></i>').join('')}</span>`;
    const bananas =
      kind === 'lose'
        ? ''
        : `<span class="slot-fx-bananas" aria-hidden="true">${Array.from({ length: 10 }, () => '<i>🍌</i>').join('')}</span>`;
    const sparks = `<span class="slot-fx-sparks" aria-hidden="true">${Array.from({ length: 12 }, () => '<b></b>').join('')}</span>`;

    const fx = document.createElement('div');
    fx.id = 'slotFx';
    fx.className = 'slot-fx is-' + kind;
    fx.setAttribute('role', 'status');
    fx.innerHTML = `
      <div class="slot-fx-vignette"></div>
      <div class="slot-fx-flash"></div>
      <div class="slot-fx-rays"></div>
      <div class="slot-fx-shock"></div>
      <div class="slot-fx-shock slot-fx-shock-2"></div>
      ${coins}
      ${bananas}
      ${sparks}
      <div class="slot-fx-cast">
        <div class="slot-fx-mono is-left is-goliat" aria-hidden="true">${goliatImg(kind)}</div>
        <div class="slot-fx-stamp">
          <span class="slot-fx-icon">${icon}</span>
          <span class="slot-fx-kicker">${kicker}</span>
          <strong>${title}</strong>
          <em>${detail || amountText || ''}</em>
          <span class="slot-fx-goliat-tag">GOLIAT</span>
        </div>
        <div class="slot-fx-mono is-right is-goliat" aria-hidden="true">${goliatImg(kind)}</div>
      </div>`;
    document.body.appendChild(fx);

    const C = window.CasinoCore;
    if (C?.playSound) {
      if (kind === 'lose') C.playSound('lose');
      else C.playSound('coins');
    }

    const ttl = kind === 'lose' ? 3000 : 4200;
    fxTimer = window.setTimeout(clear, ttl);
  }

  window.GoliatFx = { show, clear };
  window.showOutcomeFx = show;
  window.clearOutcomeFx = clear;
})();
