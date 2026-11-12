(() => {
  'use strict';

  const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  function pocketColor(pocket) {
    if (pocket === 0) return 'green';
    if (REDS.has(pocket)) return 'red';
    return 'black';
  }

  /** Valor en centavos. La ficha impresa 10 vale $1, la 20 vale $2 y la 100 vale $10. */
  const CHIP_CENTS = [100, 200, 300, 400, 500, 1000];

  function chipMark(cents) {
    return cents / 10;
  }

  const FELT = {
    zeroW: 82,
    colW: 72,
    rowH: 96,
    sideW: 70,
    dozenH: 72,
    outH: 72,
    pip: 34,
  };

  const feltSize = {
    w: FELT.zeroW + 12 * FELT.colW + FELT.sideW,
    h: 3 * FELT.rowH + FELT.dozenH + FELT.outH,
  };

  const ODDS = {
    straight: 35,
    split: 17,
    street: 11,
    corner: 8,
    line: 5,
    trio: 11,
    basket: 8,
    dozen: 2,
    column: 2,
    red: 1,
    black: 1,
    even: 1,
    odd: 1,
    low: 1,
    high: 1,
  };

  function rect(x, y, w, h) {
    return { x, y, w, h };
  }
  function mid(box) {
    return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
  }
  function pip(x, y) {
    const size = FELT.pip;
    return { x: x - size / 2, y: y - size / 2, w: size, h: size };
  }

  function numberCell(n) {
    const column = Math.floor((n - 1) / 3);
    const stack = (n - 1) % 3;
    const row = 2 - stack;
    return rect(FELT.zeroW + column * FELT.colW, row * FELT.rowH, FELT.colW, FELT.rowH);
  }

  function streetOf(column) {
    const base = column * 3;
    return [base + 1, base + 2, base + 3];
  }

  function sortedId(prefix, numbers) {
    return `${prefix}:${[...numbers].sort((a, b) => a - b).join('-')}`;
  }

  function range(from, to) {
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }

  function add(spots, spot) {
    spots.push({ ...spot, odds: spot.odds ?? ODDS[spot.kind] });
  }

  function buildSpots() {
    const spots = [];
    const zero = rect(0, 0, FELT.zeroW, FELT.rowH * 3);
    add(spots, {
      id: 'straight:0',
      kind: 'straight',
      numbers: [0],
      label: 'Pleno 0',
      hit: zero,
      anchor: mid(zero),
      color: 'green',
    });

    for (let n = 1; n <= 36; n += 1) {
      const cell = numberCell(n);
      add(spots, {
        id: `straight:${n}`,
        kind: 'straight',
        numbers: [n],
        label: `Pleno ${n}`,
        hit: cell,
        anchor: mid(cell),
        color: pocketColor(n),
      });
    }

    for (let column = 0; column < 11; column += 1) {
      for (let stack = 0; stack < 3; stack += 1) {
        const a = column * 3 + stack + 1;
        const b = a + 3;
        const left = numberCell(a);
        const point = { x: left.x + left.w, y: left.y + left.h / 2 };
        add(spots, {
          id: sortedId('split', [a, b]),
          kind: 'split',
          numbers: [a, b],
          label: `Semipleno ${a}/${b}`,
          hit: pip(point.x, point.y),
          anchor: point,
        });
      }
    }

    for (let column = 0; column < 12; column += 1) {
      for (let stack = 0; stack < 2; stack += 1) {
        const a = column * 3 + stack + 1;
        const b = a + 1;
        const cell = numberCell(a);
        const point = { x: cell.x + cell.w / 2, y: cell.y };
        add(spots, {
          id: sortedId('split', [a, b]),
          kind: 'split',
          numbers: [a, b],
          label: `Semipleno ${a}/${b}`,
          hit: pip(point.x, point.y),
          anchor: point,
        });
      }
    }

    for (const n of [1, 2, 3]) {
      const cell = numberCell(n);
      const point = { x: FELT.zeroW, y: cell.y + cell.h / 2 };
      add(spots, {
        id: sortedId('split', [0, n]),
        kind: 'split',
        numbers: [0, n],
        label: `Semipleno 0/${n}`,
        hit: pip(point.x, point.y),
        anchor: point,
      });
    }

    for (let column = 0; column < 11; column += 1) {
      for (let stack = 0; stack < 2; stack += 1) {
        const a = column * 3 + stack + 1;
        const numbers = [a, a + 1, a + 3, a + 4];
        const cell = numberCell(a);
        const point = { x: cell.x + cell.w, y: cell.y };
        add(spots, {
          id: sortedId('corner', numbers),
          kind: 'corner',
          numbers,
          label: `Cuadro ${numbers.slice().sort((x, y) => x - y).join('/')}`,
          hit: pip(point.x, point.y),
          anchor: point,
        });
      }
    }

    for (let column = 0; column < 12; column += 1) {
      const numbers = streetOf(column);
      const bottom = numberCell(numbers[0]);
      const point = { x: bottom.x + bottom.w / 2, y: FELT.rowH * 3 };
      add(spots, {
        id: `street:${numbers[0]}`,
        kind: 'street',
        numbers,
        label: `Calle ${numbers.join('/')}`,
        hit: pip(point.x, point.y),
        anchor: point,
      });
    }

    for (let column = 0; column < 11; column += 1) {
      const numbers = [...streetOf(column), ...streetOf(column + 1)];
      const bottom = numberCell(streetOf(column)[0]);
      const point = { x: bottom.x + bottom.w, y: FELT.rowH * 3 };
      add(spots, {
        id: `line:${numbers[0]}`,
        kind: 'line',
        numbers,
        label: `Línea ${numbers[0]}–${numbers[numbers.length - 1]}`,
        hit: pip(point.x, point.y),
        anchor: point,
      });
    }

    for (const numbers of [
      [0, 1, 2],
      [0, 2, 3],
    ]) {
      const rowEdge = numbers.includes(1) ? FELT.rowH * 2 : FELT.rowH;
      const point = { x: FELT.zeroW, y: rowEdge };
      add(spots, {
        id: sortedId('trio', numbers),
        kind: 'trio',
        numbers,
        label: `Trío ${numbers.join('/')}`,
        hit: pip(point.x, point.y),
        anchor: point,
      });
    }

    const basket = [0, 1, 2, 3];
    const basketPoint = { x: FELT.zeroW, y: FELT.rowH * 3 };
    add(spots, {
      id: 'basket:0',
      kind: 'basket',
      numbers: basket,
      label: 'Cuadro 0/1/2/3',
      hit: pip(basketPoint.x, basketPoint.y),
      anchor: basketPoint,
    });

    for (let dozen = 1; dozen <= 3; dozen += 1) {
      const start = (dozen - 1) * 12 + 1;
      const numbers = Array.from({ length: 12 }, (_, index) => start + index);
      const hit = rect(FELT.zeroW + (dozen - 1) * 4 * FELT.colW, FELT.rowH * 3, 4 * FELT.colW, FELT.dozenH);
      add(spots, {
        id: `dozen:${dozen}`,
        kind: 'dozen',
        numbers,
        label: dozen === 1 ? '1–12' : dozen === 2 ? '13–24' : '25–36',
        hit,
        anchor: mid(hit),
      });
    }

    for (let column = 1; column <= 3; column += 1) {
      const numbers = Array.from({ length: 12 }, (_, index) => index * 3 + column);
      const row = 3 - column;
      const hit = rect(FELT.zeroW + 12 * FELT.colW, row * FELT.rowH, FELT.sideW, FELT.rowH);
      add(spots, {
        id: `column:${column}`,
        kind: 'column',
        numbers,
        label: `Columna ${column}`,
        hit,
        anchor: mid(hit),
      });
    }

    const outsideY = FELT.rowH * 3 + FELT.dozenH;
    const outsideW = 2 * FELT.colW;
    const outside = [
      { id: 'low', kind: 'low', label: '1–18', numbers: range(1, 18) },
      { id: 'even', kind: 'even', label: 'Par', numbers: range(1, 36).filter((n) => n % 2 === 0) },
      { id: 'red', kind: 'red', label: 'Rojo', numbers: range(1, 36).filter((n) => pocketColor(n) === 'red'), color: 'red' },
      { id: 'black', kind: 'black', label: 'Negro', numbers: range(1, 36).filter((n) => pocketColor(n) === 'black'), color: 'black' },
      { id: 'odd', kind: 'odd', label: 'Impar', numbers: range(1, 36).filter((n) => n % 2 === 1) },
      { id: 'high', kind: 'high', label: '19–36', numbers: range(19, 36) },
    ];
    outside.forEach((bet, index) => {
      const hit = rect(FELT.zeroW + index * outsideW, outsideY, outsideW, FELT.outH);
      add(spots, { ...bet, hit, anchor: mid(hit) });
    });

    return spots;
  }

  const SPOTS = Object.freeze(buildSpots());
  const BY_ID = new Map(SPOTS.map((spot) => [spot.id, spot]));

  function spotById(id) {
    return BY_ID.get(id);
  }

  function spotsInPaintOrder() {
    return [...SPOTS].sort((a, b) => b.hit.w * b.hit.h - a.hit.w * a.hit.h);
  }

  /** Pago total (stake + premio) según la fórmula de KARMA. */
  function returnCents(stakeCents, odds) {
    return stakeCents * (odds + 1);
  }

  function payoutForPocket(bets, pocket) {
    let sum = 0;
    for (const bet of bets) {
      const spot = spotById(bet.spotId);
      if (!spot) continue;
      if (spot.numbers.includes(pocket)) sum += returnCents(bet.stakeCents, spot.odds);
    }
    return sum;
  }

  window.KarmaBoard = {
    CHIP_CENTS,
    FELT,
    feltSize,
    SPOTS,
    chipMark,
    numberCell,
    pocketColor,
    spotById,
    spotsInPaintOrder,
    returnCents,
    payoutForPocket,
    REDS,
  };
})();
