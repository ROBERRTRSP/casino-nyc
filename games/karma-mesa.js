(() => {
  'use strict';

  const C = window.CasinoCore;
  const B = window.KarmaBoard;
  const $ = (id) => document.getElementById(id);

  const TONES = [
    { cents: 1000, color: '#1a1a1a', edge: '#e0c27a', ink: '#f3e2b8' },
    { cents: 500, color: '#c45c12', edge: '#f0d48a', ink: '#fff6ec' },
    { cents: 400, color: '#5c3d8f', edge: '#f0d48a', ink: '#f6f1ff' },
    { cents: 300, color: '#1c7a46', edge: '#f0d48a', ink: '#f7fff8' },
    { cents: 200, color: '#b43338', edge: '#f3d7a2', ink: '#fff8f6' },
    { cents: 100, color: '#1d4f8f', edge: '#f0d48a', ink: '#f4f8ff' },
  ];

  function chipTone(cents) {
    return TONES.find((tone) => cents >= tone.cents) ?? TONES[TONES.length - 1];
  }

  function chipFace(cents) {
    const mark = B.chipMark(cents);
    return Number.isInteger(mark) ? String(mark) : mark.toFixed(1);
  }

  function chipHtml(cents, { selected = false, small = false } = {}) {
    const tone = chipTone(cents);
    const cls = `chip${small ? ' chip-sm' : ''}${selected ? ' chip-selected' : ''}`;
    return `<span class="${cls}" style="--chip:${tone.color};--edge:${tone.edge};--ink:${tone.ink}"><span>${chipFace(cents)}</span></span>`;
  }

  function box(rect) {
    return {
      left: `${(rect.x / B.feltSize.w) * 100}%`,
      top: `${(rect.y / B.feltSize.h) * 100}%`,
      width: `${(rect.w / B.feltSize.w) * 100}%`,
      height: `${(rect.h / B.feltSize.h) * 100}%`,
    };
  }

  function styleBox(rect) {
    const s = box(rect);
    return `left:${s.left};top:${s.top};width:${s.width};height:${s.height}`;
  }

  const LINE = new Set(['split', 'street', 'corner', 'line', 'trio', 'basket']);
  const HISTORY_KEY = 'casino_nyc_roulette_history';
  const JACKPOT_KEY = 'casino_nyc_roulette_jackpot';
  const WIN_TAUNTS = [
    '¡ESO ES, CARAJO! ¡CORONASTE CON LOS CUARTOS!',
    '¡PAGANDO! ¡EL MONO TE BENDICE!',
    '¡BIEN JUGADO! ¡LA MESA TE SONRÍE!',
  ];
  const LOSE_TAUNTS = [
    '¡JAJA PERDEDOR! ¡GRACIAS POR LOS CUARTOS, PELAO!',
    '¡LA BANCA SE QUEDA TODO!',
    '¡OTRA VEZ! ¡EL PAÑO TIENE HAMBRE!',
  ];

  function pickWheelApi() {
    const prefer = window.__KarmaWheel3D;
    const fallback = window.__KarmaWheel2D || window.CasinoKarmaWheel;
    if (prefer) {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');
        if (gl) {
          window.CasinoKarmaWheel = prefer;
          return prefer;
        }
      } catch {}
    }
    window.CasinoKarmaWheel = fallback;
    return fallback;
  }

  const K = pickWheelApi();
  let wheel;
  try {
    wheel = new K.KarmaWheel($('karmaCanvas'));
  } catch (err) {
    console.warn('Fallo al montar la rueda preferida, usando Canvas 2D de KARMA.', err);
    const F = window.__KarmaWheel2D;
    if (!F) throw err;
    window.CasinoKarmaWheel = F;
    wheel = new F.KarmaWheel($('karmaCanvas'));
  }

  let chip = 100;
  let bets = new Map();
  let stack = [];
  let previous = [];
  let busy = false;
  let lastPayout = 0;
  let lastPocket = null;
  let history = C.read(HISTORY_KEY, []) || [];
  let jackpot = Number(C.read(JACKPOT_KEY, 125000)) || 125000;
  let verdict = null;
  let bannerTimer = null;

  function totalStake() {
    let sum = 0;
    for (const v of bets.values()) sum += v;
    return sum;
  }

  function betsList() {
    return [...bets.entries()].map(([spotId, stakeCents]) => ({ spotId, stakeCents }));
  }

  function setNotice(msg) {
    const el = $('mesaNotice');
    if (el) el.textContent = msg || '';
  }

  function renderBeads() {
    $('beads').innerHTML = history
      .slice(0, 14)
      .map((pocket) => `<span class="bead ${B.pocketColor(pocket)}">${pocket}</span>`)
      .join('');
  }

  function renderChipsTray() {
    $('trayChips').innerHTML = B.CHIP_CENTS.map(
      (cents) =>
        `<button type="button" class="tray-btn" data-chip="${cents}" aria-label="Ficha ${chipFace(cents)} · ${C.money(cents)}" ${busy ? 'disabled' : ''}>${chipHtml(cents, { selected: chip === cents })}</button>`,
    ).join('');
  }

  function renderFelt() {
    const spots = B.spotsInPaintOrder();
    const areas = spots.filter((spot) => !LINE.has(spot.kind) && spot.kind !== 'straight');
    const winning = lastPocket;
    let html = '';

    html += `<div class="paint num green-ink${winning === 0 ? ' win win-num' : ''}" style="${styleBox({ x: 0, y: 0, w: B.FELT.zeroW, h: B.FELT.rowH * 3 })}">0</div>`;
    for (let n = 1; n <= 36; n += 1) {
      const color = B.pocketColor(n);
      html += `<div class="paint num ${color === 'red' ? 'red-ink' : 'black-ink'}${winning === n ? ' win win-num' : ''}" style="${styleBox(B.numberCell(n))}">${n}</div>`;
    }

    for (const spot of areas) {
      const swatch = spot.kind === 'red' || spot.kind === 'black';
      const kindClass = spot.kind === 'dozen' ? 'dozen' : spot.kind === 'column' ? 'column' : 'outside';
      const hit = winning != null && spot.numbers.includes(winning);
      let inner;
      if (swatch) inner = `<i class="diamond ${spot.kind}"></i>`;
      else if (spot.kind === 'column') inner = '<span class="column-label">2 a 1</span>';
      else inner = spot.label;
      html += `<div class="paint ${kindClass}${swatch ? ' swatch' : ''}${hit ? ' win' : ''}" style="${styleBox(spot.hit)}">${inner}</div>`;
    }

    for (const spot of spots.filter((s) => LINE.has(s.kind))) {
      html += `<i class="pip-mark" style="left:${(spot.anchor.x / B.feltSize.w) * 100}%;top:${(spot.anchor.y / B.feltSize.h) * 100}%"></i>`;
    }

    for (const spot of spots) {
      html += `<button type="button" class="hit" style="${styleBox(spot.hit)}" aria-label="${spot.label}" data-spot="${spot.id}" ${busy ? 'disabled' : ''}></button>`;
    }

    for (const [spotId, stakeCents] of bets) {
      const spot = B.spotById(spotId);
      if (!spot || stakeCents <= 0) continue;
      const hit = winning != null && spot.numbers.includes(winning);
      html += `<span class="bet-chip${hit ? ' bet-chip-win' : ''}" style="left:${(spot.anchor.x / B.feltSize.w) * 100}%;top:${(spot.anchor.y / B.feltSize.h) * 100}%">${chipHtml(stakeCents, { small: true })}</span>`;
    }

    html += '<div class="felt-sweep" aria-hidden="true"></div>';
    $('feltCloth').innerHTML = html;
    $('feltCloth').classList.toggle('is-locked', busy);
  }

  function renderPlaque(pocket, payout) {
    const plaque = $('plaque');
    if (pocket == null) {
      plaque.hidden = true;
      return;
    }
    plaque.hidden = false;
    plaque.innerHTML = `<strong class="${B.pocketColor(pocket)}">${pocket}</strong>${
      payout != null
        ? `<em>${payout > 0 ? `Premio ${C.money(payout)}` : 'Sin premio'}</em>`
        : ''
    }`;
  }

  function renderVerdict(mode, pocket, payout) {
    const root = $('mesaRoot');
    root.classList.remove('is-win', 'is-lose');
    const existing = $('hitFx');
    if (existing) existing.remove();
    if (!mode) {
      verdict = null;
      return;
    }
    verdict = mode;
    root.classList.add(mode === 'win' ? 'is-win' : 'is-lose');
    const taunt = (mode === 'win' ? WIN_TAUNTS : LOSE_TAUNTS)[Math.floor(Math.random() * 3)];
    const img = mode === 'win' ? '../assets/monkey-win.jpg' : '../assets/monkey-lose.jpg';
    const fx = document.createElement('div');
    fx.id = 'hitFx';
    fx.className = `hit-fx hit-${mode}`;
    fx.setAttribute('role', 'status');
    fx.innerHTML = `
      <div class="hit-flash"></div>
      <div class="hit-vignette"></div>
      <div class="hit-rays"></div>
      <div class="hit-shockwave"></div>
      <div class="hit-shockwave hit-shockwave-2"></div>
      ${mode === 'win' ? `<span class="coins" aria-hidden="true">${Array.from({ length: 24 }, () => '<i></i>').join('')}</span>` : ''}
      <div class="hit-stamp">
        <div class="mascot-wrap mascot-wrap-${mode}" aria-hidden="true">
          <div class="mascot-bubble"><span>${taunt}</span></div>
          <div class="mascot-monkey mascot-${mode}"><img class="mascot-canvas" src="${img}" alt=""></div>
        </div>
        <span class="hit-pocket ${B.pocketColor(pocket)}">${pocket}</span>
        <span class="hit-kicker">${mode === 'win' ? 'CORONASTE · EL MONO PAGA' : 'TE PELASTE · LA BANCA GANA'}</span>
        <strong>${mode === 'win' ? '¡GANASTE!' : '¡PERDEDOR!'}</strong>
        <em>${mode === 'win' ? C.money(payout) : 'Sin premio · La banca se queda todo'}</em>
      </div>`;
    root.appendChild(fx);
    setTimeout(() => {
      if (fx.parentNode) fx.remove();
      root.classList.remove('is-win', 'is-lose');
      verdict = null;
    }, 4100);
  }

  function update() {
    const w = C.wallet();
    const stake = totalStake();
    $('creditValue').textContent = C.money(w.credit);
    $('jackpotValue').textContent = C.money(jackpot);
    $('phasePill').textContent = busy ? 'Girando' : `Apuesta ${C.money(stake)}`;
    $('spinBtn').disabled = busy || !stake || w.credit < stake;
    $('spinBtn').textContent = busy ? 'Girando' : 'Girar';
    $('undoBtn').disabled = busy || !stack.length;
    $('clearBtn').disabled = busy || !stake;
    $('repeatBtn').disabled = busy || !previous.length || stake > 0;
    renderChipsTray();
    renderFelt();
    renderBeads();
  }

  function placeBet(spotId) {
    if (busy) return;
    if (!B.spotById(spotId)) return;
    if (C.wallet().credit < totalStake() + chip) {
      setNotice('No quedan créditos demo suficientes para esa ficha.');
      return;
    }
    bets.set(spotId, (bets.get(spotId) || 0) + chip);
    stack.push({ spotId, value: chip });
    C.playSound('tap');
    setNotice('');
    update();
  }

  function showBanner(show) {
    const el = $('noMoreBets');
    if (!el) return;
    el.hidden = !show;
    if (bannerTimer) clearTimeout(bannerTimer);
    if (show) {
      bannerTimer = setTimeout(() => {
        el.hidden = true;
      }, 2800);
    }
  }

  $('feltCloth').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-spot]');
    if (btn) placeBet(btn.dataset.spot);
  });

  $('trayChips').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-chip]');
    if (!btn || busy) return;
    chip = Number(btn.dataset.chip);
    C.playSound('tap');
    update();
  });

  $('undoBtn').addEventListener('click', () => {
    if (busy || !stack.length) return;
    const { spotId, value } = stack.pop();
    const next = (bets.get(spotId) || 0) - value;
    if (next > 0) bets.set(spotId, next);
    else bets.delete(spotId);
    setNotice('Última ficha retirada.');
    update();
  });

  $('clearBtn').addEventListener('click', () => {
    if (busy) return;
    bets.clear();
    stack = [];
    setNotice('Mesa limpia. Coloca nuevas fichas.');
    update();
  });

  $('repeatBtn').addEventListener('click', () => {
    if (busy || !previous.length || totalStake()) return;
    const v = previous.reduce((n, item) => n + item[1], 0);
    if (v > C.wallet().credit) {
      setNotice('No hay créditos suficientes para repetir esa apuesta.');
      return;
    }
    bets = new Map(previous);
    stack = previous.map(([spotId, value]) => ({ spotId, value }));
    setNotice('Apuestas anteriores repetidas.');
    update();
  });

  $('spinBtn').addEventListener('click', () => {
    if (busy || !totalStake()) return;
    const stake = totalStake();
    if (!C.updateWallet(-stake, 1)) {
      setNotice('Saldo demo insuficiente.');
      update();
      return;
    }
    busy = true;
    lastPayout = 0;
    lastPocket = null;
    previous = [...bets.entries()];
    stack = [];
    renderVerdict(null);
    renderPlaque(null);
    showBanner(true);
    setNotice(window.CasinoKarmaWheel?.mode === 'three' ? 'No más apuestas. Rueda 3D de KARMA…' : 'No más apuestas. La bola está girando…');
    C.playSound('spin');
    update();

    const outcome = C.randint(37);
    const ok = wheel.start(outcome, (pocket) => {
      showBanner(false);
      const payout = B.payoutForPocket(betsList(), pocket);
      lastPocket = pocket;
      lastPayout = payout;
      if (payout) {
        C.updateWallet(payout);
        C.playSound('win');
        setNotice(`¡Salió ${pocket}! Cobras ${C.money(payout)} créditos ficticios.`);
        renderVerdict('win', pocket, payout);
      } else {
        setNotice(`Salió ${pocket} · Sin premio esta ronda.`);
        renderVerdict('lose', pocket, 0);
      }
      // Jackpot cosmético local (no afecta saldo): ~2¢ por dólar apostado
      jackpot += Math.max(2, Math.floor(stake / 50));
      C.write(JACKPOT_KEY, jackpot);
      history.unshift(pocket);
      history = history.slice(0, 24);
      C.write(HISTORY_KEY, history);
      renderPlaque(pocket, payout);
      bets.clear();
      busy = false;
      update();
    });

    if (!ok) {
      C.updateWallet(stake, -1);
      busy = false;
      showBanner(false);
      setNotice('No se pudo iniciar el giro.');
      update();
    }
  });

  document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.mesa-root')) e.preventDefault();
  });

  window.addEventListener('pageshow', update);
  window.addEventListener('storage', update);
  renderPlaque(null);
  update();
})();
