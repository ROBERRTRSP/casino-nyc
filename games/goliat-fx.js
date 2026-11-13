(() => {
  'use strict';
  // Solo aparece en premio grande (≥ 10× la apuesta).
  const BIG_MULT = 10;
  const BIG_LINES = [
    '¡PREMIO GRANDE!',
    '¡GOLIAT PAGA EN GRANDE!',
    '¡MEGA COMBINACIÓN!',
  ];

  let fxTimer = 0;

  function assetBase() {
    if (window.GoliatFxBase) return window.GoliatFxBase;
    return 'assets/';
  }

  function isBigWin(payout, stake) {
    const p = Number(payout) || 0;
    const s = Math.max(Number(stake) || 0, 1);
    return p > 0 && p >= s * BIG_MULT;
  }

  function goliatImg() {
    return `<img class="goliat-photo" src="${assetBase()}goliat-win.png" alt="Goliat el chimpancé celebrando" width="512" height="512" decoding="async">`;
  }

  function clear() {
    const fx = document.getElementById('slotFx');
    if (fx) fx.remove();
    document.querySelector('.stage')?.classList.remove('is-slot-win', 'is-slot-lose', 'is-slot-bonus');
    document.querySelector('.mesa-root')?.classList.remove('is-slot-win', 'is-slot-lose', 'is-slot-bonus');
    document.querySelector('.app')?.classList.remove('is-slot-win', 'is-slot-lose', 'is-slot-bonus');
    document.body.classList.remove('is-slot-celebrate');
    if (fxTimer) {
      clearTimeout(fxTimer);
      fxTimer = 0;
    }
  }

  function show(amountText, detail) {
    clear();
    const stage =
      document.querySelector('.stage') ||
      document.querySelector('.mesa-root') ||
      document.querySelector('.app') ||
      document.body;
    if (stage && stage !== document.body) stage.classList.add('is-slot-win');
    document.body.classList.add('is-slot-celebrate');

    const kicker = BIG_LINES[Math.floor(Math.random() * BIG_LINES.length)];
    const coins = `<span class="slot-fx-coins" aria-hidden="true">${Array.from({ length: 42 }, () => '<i></i>').join('')}</span>`;
    const bananas = `<span class="slot-fx-bananas" aria-hidden="true">${Array.from({ length: 10 }, () => '<i>🍌</i>').join('')}</span>`;
    const sparks = `<span class="slot-fx-sparks" aria-hidden="true">${Array.from({ length: 12 }, () => '<b></b>').join('')}</span>`;

    const fx = document.createElement('div');
    fx.id = 'slotFx';
    fx.className = 'slot-fx is-win';
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
        <div class="slot-fx-mono is-left is-goliat" aria-hidden="true">${goliatImg()}</div>
        <div class="slot-fx-stamp">
          <span class="slot-fx-icon">🦍</span>
          <span class="slot-fx-kicker">${kicker}</span>
          <strong>¡PREMIO GRANDE!</strong>
          <em>${detail || amountText || ''}</em>
          <span class="slot-fx-goliat-tag">GOLIAT</span>
        </div>
        <div class="slot-fx-mono is-right is-goliat" aria-hidden="true">${goliatImg()}</div>
      </div>`;
    document.body.appendChild(fx);

    window.CasinoCore?.playSound?.('coins');
    fxTimer = window.setTimeout(clear, 4200);
  }

  /** Solo dispara si payout ≥ 10× stake (créditos enteros). */
  function showIfBig(payout, stake, amountText, detail) {
    if (!isBigWin(payout, stake)) return false;
    show(amountText, detail);
    return true;
  }

  window.GoliatFx = { show, showIfBig, isBigWin, clear, BIG_MULT };
  // Compat: showOutcomeFx solo si kind es win/bonus y se pasa {payout,stake} en 4º arg opcional vía objeto.
  window.showOutcomeFx = (kind, amountText, detail, meta) => {
    if (kind === 'lose') return;
    if (meta && typeof meta === 'object') {
      showIfBig(meta.payout, meta.stake, amountText, detail);
      return;
    }
    // Sin meta no mostramos (evita spam); tests pueden llamar GoliatFx.show directo.
  };
  window.clearOutcomeFx = clear;
})();
