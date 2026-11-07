/* Random design generation with Coolors-style locking, plus state sanitising.
 *
 * Compositions follow how rangolis are actually built up from the centre:
 *   centre (lotus / marigold / diya on a lotus…) → small inner bands (dots, segments)
 *   → a "hero" ring or two (petals, paisleys, peacock feathers, marigolds, spirals)
 *   → an outer crown (petals, drops, scallops, diyas, marigolds) → optional corner accents.
 * Motif rings often sit on a solid powder ground so the design reads as filled in.
 */
(function () {
  const { U } = R;
  const { RT, CT, AT, has } = R.render;
  const { TAU } = U;
  const STYLES = ['festive', 'geo', 'kolam'];
  const OPEN_LINE = ['kolam', 'lines', 'chain', 'swirls', 'vine', 'spiral', 'wave', 'zigzag'];

  // band thickness range per ring type
  const RING_W = {
    petals: [1, 1.5], lotus2: [1.25, 1.8], leaves: [0.85, 1.25], paisley: [1, 1.45], dots: [0.32, 0.5],
    drops: [0.6, 0.95], diyas: [0.85, 1.2], marigolds: [0.65, 1], peacock: [1.05, 1.5], vine: [0.6, 0.85],
    segments: [0.45, 0.75], spiral: [0.6, 1], teeth: [0.5, 0.8], diamonds: [0.5, 0.8], kolam: [0.75, 1.1],
    scallops: [0.5, 0.75], stars: [0.45, 0.7], swirls: [0.7, 1.05], chevrons: [0.5, 0.8], chain: [0.45, 0.7],
    band: [0.28, 0.45], zigzag: [0.35, 0.55], wave: [0.35, 0.55], lines: [0.3, 0.45], motifs: [1.5, 2.1],
  };
  // overall popularity
  const RING_P = {
    petals: 3, lotus2: 2.6, leaves: 1.4, paisley: 2, dots: 2.2, drops: 2, diyas: 1.4, marigolds: 2, peacock: 1.5,
    vine: 1.4, segments: 1.8, spiral: 1.2, teeth: 0.15, diamonds: 0.4, kolam: 0.7, scallops: 1.4, stars: 0,
    swirls: 0.2, chevrons: 0, chain: 0.3, band: 1.2, zigzag: 0, wave: 0, lines: 0.8, motifs: 1.3,
  };
  // where in the design each type looks right
  const ZONE = {
    inner: ['dots', 'band', 'segments', 'petals', 'kolam', 'chain', 'lines', 'drops', 'marigolds', 'diamonds', 'spiral'],
    middle: ['motifs', 'petals', 'lotus2', 'paisley', 'marigolds', 'peacock', 'spiral', 'leaves', 'segments', 'vine', 'diyas', 'scallops', 'dots', 'band', 'lines', 'drops', 'diamonds'],
    outer: ['motifs', 'petals', 'lotus2', 'scallops', 'drops', 'diyas', 'paisley', 'marigolds', 'peacock', 'leaves'],
  };
  const BOOST = {
    festive: ['motifs', 'petals', 'lotus2', 'paisley', 'diyas', 'marigolds', 'peacock', 'drops', 'scallops'],
    geo: ['segments', 'spiral', 'diamonds', 'band', 'teeth', 'dots'],
    kolam: ['kolam', 'dots', 'lines', 'chain', 'swirls', 'vine'],
  };
  // types that always draw their own colours/fills, or carry a full fill already
  const NO_GROUND = ['motifs', 'band', 'lines', 'zigzag', 'wave', 'segments', 'spiral', 'chain', 'kolam', 'swirls'];
  const NO_KOLAM = ['diyas', 'marigolds', 'peacock', 'segments', 'spiral'];
  const CENTER_P = { lotus: 3.2, marigold: 2, diya: 2.2, star: 0.8, bindu: 0.9, sun: 0.6, rose: 0.4, seed: 0.3 };
  const CENTER_BOOST = { festive: ['lotus', 'diya', 'marigold'], geo: ['star', 'bindu', 'sun'], kolam: ['rose', 'seed'] };
  const MOTIF_TYPES = Object.keys(RT).filter((k) => !RT[k].cont || RT[k].motif);
  const BAND_TYPES = ['band', 'segments', 'spiral', 'lines', 'dots', 'drops', 'scallops'];

  // One look per design: 'outline' (white rice-flour outlines) or 'band' (colour edge to edge).
  // Open line work (kolam loops, lines…) may be drawn as bare lines in the outline look.
  let LOOK = 'outline';
  const styleFor = (mood, type) => (LOOK === 'band' ? 'geo' : OPEN_LINE.includes(type) && mood === 'kolam' && U.chance(0.6) ? 'kolam' : 'festive');
  // how many palette colours elements can use (5–7); kept in step with the current design
  let NC = 5;
  const setColors = (n) => { NC = U.clamp(n | 0, 5, 7); };
  function colors() {
    const a = U.randInt(0, NC - 1);
    let b = U.randInt(0, NC - 1);
    if (b === a) b = (a + 1 + U.randInt(0, NC - 2)) % NC;
    return [a, b];
  }
  function groundFor(c1, c2) {
    const opts = Array.from({ length: NC }, (_, i) => i).filter((i) => i !== c1 && i !== c2);
    return U.pick(opts);
  }


  /* ------------------------------------------------------------- motifs */
  // Natural colours per motif slot (a–e); each slot takes the nearest palette colour.
  const NAT0 = { a: '#c8102e', b: '#d93b7a', c: '#1f5fae', d: '#2f8a3e', e: '#f2b31a' };
  const NAT = {
    lotusSide: { a: '#d93b7a', b: '#e86a9a' }, lotusBud: { a: '#d93b7a', b: '#e86a9a' },
    flower: { a: '#e8611a', b: '#c21f3a' }, butterfly: { a: '#e8611a', b: '#c21f3a' }, sun: { a: '#e8611a', b: '#c21f3a' },
    diya: { a: '#b65a2c', b: '#c21f3a' }, kalash: { a: '#c21f3a', b: '#e8611a' }, paisley: { a: '#c21f3a', b: '#e8611a' },
    sanskar: { a: '#d93b7a', b: '#c21f3a' }, swan: { e: '#f29a1a' }, hand: { a: '#c2410c', b: '#c21f3a' },
    om: { a: '#e8611a' }, conch: { a: '#c21f3a', b: '#e86a9a' }, fish: { a: '#e8611a' },
  };
  const FACE = { peacockSide: -1, swan: -1, fish: -1 }; // -1: faces left as drawn
  const POOL = {
    main: { peacockFan: 3, peacockSide: 2.5, swan: 2.5, lotusSide: 2.5, kalash: 1.5, diya: 1.5, butterfly: 1.2, fish: 1, conch: 0.8, om: 1, hand: 0.6, sun: 0.8, sanskar: 0.6 },
    centre: { peacockFan: 3, peacockSide: 2, swan: 2, lotusSide: 2.5, kalash: 1.5, diya: 1.5, butterfly: 1.2, fish: 0.8, conch: 0.8, om: 1, hand: 0.6, sun: 1, sanskar: 1, pookalam: 0.8, swastika: 0.8, flower: 1.2, footprints: 0.4 },
    pair: { peacockSide: 3, swan: 3, fish: 1.5 },
    obj: { kalash: 3, diya: 3, lotusSide: 2, om: 1, sun: 1, flower: 1, conch: 0.6 },
    corner: { lotusBud: 2, paisley: 2, leaves: 1.5, diya: 1.5, flower: 1, footprints: 0.6, conch: 0.5, fish: 0.5, sanskar: 0.8 },
    minor: { flower: 2, lotusBud: 2, leaves: 1.5, paisley: 1.5, sanskar: 1.2, butterfly: 1, diya: 0.8 },
    ring: { lotusSide: 3, lotusBud: 2, diya: 2.5, flower: 2, paisley: 2, leaves: 1.5, sanskar: 1, butterfly: 1, kalash: 0.6, fish: 0.6, conch: 0.5, swan: 0.5, peacockSide: 0.6, hand: 0.3 },
    square: { kolamLoops: 2, stepped: 1.5, pookalam: 1.5, sanskar: 1, flower: 1.5, swastika: 1.5, sun: 1, footprints: 0.8, lotusSide: 1 },
  };
  let PAL = [];
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const cdist = (x, y) => { const a = rgb(x), b = rgb(y), r = (a[0] + b[0]) / 2; return Math.sqrt((2 + r / 256) * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + (2 + (255 - r) / 256) * (a[2] - b[2]) ** 2); };
  // slot → palette index, natural-leaning; jitter sometimes takes the second-nearest for variety
  function natMap(m, jitter = 0.25) {
    const nat = { ...NAT0, ...(NAT[m] || {}) }, used = new Set(), out = {};
    for (const slot of ['c', 'd', 'a', 'e', 'b']) {
      const order = PAL.map((h, i) => [i, cdist(h, nat[slot]) + (used.has(i) ? 70 : 0)]).sort((x, y) => x[1] - y[1]);
      const pick = order.length > 1 && U.chance(Math.min(jitter, 0.4)) ? order[1][0] : order[0][0];
      out[slot] = pick; used.add(pick);
    }
    return ['a', 'b', 'c', 'd', 'e'].map((k) => out[k]);
  }
  // only figures that have a facing direction may be mirrored (never Om, swastika, footprints…)
  const FLIPS = ['peacockSide', 'peacockFan', 'swan', 'fish', 'conch', 'hand', 'butterfly', 'paisley', 'lotusBud', 'leaves'];
  const fig = (m, s, pos, role) => ({ id: U.uid(), m, s, pos: FLIPS.includes(m) ? pos : pos.map((p) => ({ ...p, f: 1 })), c: natMap(m), role, v: U.randInt(0, 99), locked: false });
  const P0 = (x, y, r = 0, f = 1) => ({ x, y, r, f });

  /* ------------------------------------------------------------ strands */
  // a flowing curve from a to b, bowing sideways; kinds: vine (leaves + flower), swirl, dots
  function strand(kind, a, b, bow, role = 'strand') {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const pts = [a, [a[0] + dx * 0.3 + nx * bow, a[1] + dy * 0.3 + ny * bow], [a[0] + dx * 0.7 - nx * bow * 0.8, a[1] + dy * 0.7 - ny * bow * 0.8], b];
    const end = kind === 'vine' ? U.weighted({ flower: 3, lotusBud: 2, sanskar: 1 }) : null;
    return { id: U.uid(), kind, pts, w: kind === 'dots' ? U.rand(12, 17) : U.rand(10, 14), end, c: natMap(end || 'leaves'), v: U.randInt(0, 99), role, side: U.chance(0.5) ? 1 : -1, locked: false };
  }

  // spots beside a strand at the given fractions of its length, pushed out to one side
  function alongStrand(S, ts, size) {
    return ts.map((t) => {
      const u = 1 - t, p = S.pts, b = (i) => u * u * u * p[0][i] + 3 * u * u * t * p[1][i] + 3 * u * t * t * p[2][i] + t * t * t * p[3][i];
      const t2 = Math.min(1, t + 0.02), u2 = 1 - t2, b2 = (i) => u2 * u2 * u2 * p[0][i] + 3 * u2 * u2 * t2 * p[1][i] + 3 * u2 * t2 * t2 * p[2][i] + t2 * t2 * t2 * p[3][i];
      const dx = b2(0) - b(0), dy = b2(1) - b(1), d = Math.hypot(dx, dy) || 1, off = size * 0.62 * -S.side;
      return { x: U.clamp(b(0) - (dy / d) * off, -380, 380), y: U.clamp(b(1) + (dx / d) * off, -380, 380), s: size };
    });
  }

  /* ------------------------------------------------------------ layouts */
  const LAYOUTS = { mandala: 40, centre: 20, square: 15, pair: 10, cluster: 5, vine: 5, figure: 5 };
  const ringCount = () => +U.weighted({ 2: 1, 3: 3, 4: 3, 5: 2, 6: 0.8 });
  function ringsFor(mood, n, opts = {}) {
    const rings = [];
    for (let i = 0; i < n; i++) {
      const zone = opts.zone || zoneAt(i, n);
      rings.push(newRing(mood, [rings[i - 1] && rings[i - 1].type].filter(Boolean), opts.only, zone));
    }
    return rings;
  }
  // free spots for small figures, away from what's already placed
  function scatter(taken, k, size) {
    const out = [];
    for (let t = 0; t < 80 && out.length < k; t++) {
      const a = U.rand(Math.PI * 2), r = Math.sqrt(U.rand(0.05, 1)) * 360, x = Math.sin(a) * r, y = -Math.cos(a) * r;
      if ([...taken, ...out].every((q) => Math.hypot(q.x - x, q.y - y) > q.rad + size * 0.55)) out.push({ x, y, rad: size * 0.5 });
    }
    return out;
  }

  function buildLayout(layout, mood) {
    const fold = U.pick([8, 8, 8, 12, 12, 16, 6]);
    const form = { mode: 'radial', layout, fold, shape: 'circle', k: 8, off: 0, hole: 0, aspect: 1, wa: 0.12, wb: 0, locked: false };
    const out = { form, center: null, rings: [], accents: [], figures: [], strands: [] };
    const plainCenter = (hole) => ({ id: U.uid(), type: 'plain', style: LOOK === 'band' ? 'geo' : 'festive', weight: 1, k: fold, half: false, v: U.randInt(0, 99), c1: 0, c2: 1, locked: false });
    // a plain disc in the palette colour that contrasts most with a figure's colours
    const discFor = (F) => {
      const fc = [F.c[2], F.c[3], F.c[0]].map((i) => PAL[i]);
      let best = 0, bd = -1;
      PAL.forEach((h, i) => { const d = Math.min(...fc.map((x) => cdist(x, h))); if (d > bd) { bd = d; best = i; } });
      return best;
    };
    switch (layout) {
      case 'mandala': {
        const d = newForm();
        Object.assign(form, { fold: d.fold, shape: d.shape, k: d.k, off: d.off });
        out.rings = ringsFor(mood, ringCount());
        out.center = U.chance(0.96) ? newCenter(mood) : null;
        if (U.chance(0.35)) out.figures.push(fig(U.weighted(POOL.corner), U.rand(110, 150), cornerPos(372, true), 'corner'));
        else if (U.chance(0.5)) out.accents.push(newAccent(mood, form));
        break;
      }
      case 'centre': {
        const hole = U.rand(225, 290);
        form.hole = hole;
        const F = fig(U.weighted(POOL.centre), hole * 1.78, [P0(0, 0, 0, U.chance(0.5) ? -1 : 1)], 'main');
        out.figures.push(F);
        out.center = { ...plainCenter(hole), c1: discFor(F) };
        out.rings = ringsFor(mood, +U.weighted({ 1: 2, 2: 3, 3: 1.5 }), { zone: 'outer' });
        if (U.chance(0.4)) out.accents.push(newAccent(mood, form));
        break;
      }
      case 'square': {
        form.shape = 'poly'; form.k = 4; form.off = U.chance(0.5) ? Math.PI / 4 : 0; form.fold = U.pick([4, 8, 8]);
        out.rings = ringsFor(mood, +U.weighted({ 2: 2, 3: 3, 4: 1.5 }));
        if (U.chance(0.6)) {
          const hole = U.rand(150, 200);
          form.hole = hole;
          const F = fig(U.weighted(POOL.square), hole * 1.6, [P0(0, 0)], 'main');
          out.figures.push(F);
          out.center = { ...plainCenter(hole), c1: discFor(F) };
        } else out.center = newCenter(mood);
        if (form.off) form.R0 = 490; // a square measured to its corners: let it fill the frame
        const sq = form.off ? 398 : 330;
        out.figures.push(fig(U.weighted(POOL.corner), form.off ? U.rand(80, 100) : U.rand(100, 140), cornerPos(sq, true), 'corner'));
        break;
      }
      case 'pair': {
        const m = U.weighted(POOL.pair), framed = U.chance(0.6);
        const s = framed ? U.rand(330, 360) : U.rand(400, 440), x = framed ? 165 : 200, f = FACE[m] || -1;
        out.figures.push(fig(m, s, [P0(-x, 0, 0, f), P0(x, 0, 0, -f)], 'pair'));
        out.figures.push(fig(U.weighted(POOL.obj), s * U.rand(0.4, 0.46), [P0(0, s * 0.47)], 'obj'));
        if (framed) {
          form.hole = U.rand(330, 350);
          out.center = { ...plainCenter(form.hole), c1: discFor(out.figures[0]) };
          out.rings = ringsFor(mood, U.chance(0.6) ? 1 : 2, { zone: 'inner' });
        } else {
          const k = U.pick(['swirl', 'dots', 'vine']), bow = U.rand(40, 80);
          out.strands.push(strand(k, [-110, 250], [-330, 330], bow), strand(k, [110, 250], [330, 330], -bow));
          out.strands[1].side = -out.strands[0].side;
          out.figures.push(fig(U.weighted(POOL.minor), U.rand(100, 130), [P0(-250, -250, -30, 1), P0(250, -250, 30, -1)], 'minor'));
        }
        break;
      }
      case 'cluster': {
        const side = U.chance(0.5) ? 1 : -1, s = U.rand(470, 540);
        const main = fig(U.weighted(POOL.main), s, [P0(side * U.rand(60, 100), U.rand(-70, -20), 0, U.chance(0.5) ? 1 : -1)], 'main');
        out.figures.push(main);
        const mp = main.pos[0];
        const S1 = strand(U.weighted({ vine: 3, swirl: 2 }), [mp.x - side * s * 0.22, mp.y + s * 0.34], [-side * 320, U.rand(150, 320)], U.rand(70, 130) * (U.chance(0.5) ? 1 : -1));
        out.strands.push(S1);
        if (U.chance(0.35)) out.strands.push(strand(U.weighted({ swirl: 2, dots: 2 }), [mp.x + side * s * 0.12, mp.y - s * 0.4], [mp.x - side * U.rand(180, 280), -350], U.rand(-70, 70)));
        // small figures ride along the flourish, on its outer side
        alongStrand(S1, [0.5, 0.95].slice(0, U.randInt(1, 2)), U.rand(130, 170)).forEach((q) => out.figures.push(fig(U.weighted(POOL.minor), q.s, [P0(q.x, q.y, U.rand(-20, 20))], 'minor')));
        break;
      }
      case 'vine': {
        const flip = U.chance(0.5) ? 1 : -1, bow = U.rand(140, 220) * (U.chance(0.5) ? 1 : -1);
        const V = strand('vine', [-320 * flip, 310], [300 * flip, -290], bow, 'main');
        out.strands.push(V);
        out.strands.push(strand('vine', [U.rand(-40, 40), U.rand(-20, 40)], [-280 * flip, -300], -Math.sign(bow) * U.rand(60, 110), 'strand'));
        const extra = U.chance(0.6) ? U.weighted({ butterfly: 2, lotusSide: 1.5, peacockSide: 0.8, swan: 0.6, fish: 0.4 }) : U.weighted(POOL.minor);
        alongStrand(V, [0.62], U.rand(170, 220)).forEach((q) => out.figures.push(fig(extra, q.s, [P0(q.x, q.y)], 'minor')));
        break;
      }
      default: { // one figure with flourishes trailing to one side
        const side = U.chance(0.5) ? 1 : -1, s = U.rand(540, 610);
        const main = fig(U.weighted(POOL.main), s, [P0(side * U.rand(-30, 50), U.rand(-50, 10), 0, U.chance(0.5) ? -1 : 1)], 'main');
        out.figures.push(main);
        const mp = main.pos[0];
        out.strands.push(strand('swirl', [mp.x - side * s * 0.2, mp.y + s * 0.36], [-side * 320, U.rand(160, 330)], U.rand(50, 100)));
        if (U.chance(0.6)) out.strands.push(strand('dots', [mp.x + side * s * 0.3, mp.y + s * 0.32], [side * 330, U.rand(200, 330)], U.rand(-50, 50)));
        if (U.chance(0.5)) out.strands.push(strand('swirl', [mp.x + side * s * 0.25, mp.y - s * 0.4], [side * 300, -330], U.rand(-70, 70)));
        break;
      }
    }
    return out;
  }
  // four corner placements pointing outward (motif tops face the corner)
  function cornerPos(C, out) {
    return [[-C, -C], [C, -C], [C, C], [-C, C]].map(([x, y]) => P0(x, y, U.deg(Math.atan2(x, -y)) + (out ? 0 : 180)));
  }

  function newForm() {
    const mode = U.weighted({ radial: 12, mirror: 0.8, free: 0.6 });
    const fold = U.pick([8, 8, 8, 8, 12, 12, 12, 16, 6]);
    const f = { mode, fold, shape: 'circle', k: 8, off: 0, aspect: 1, wa: U.rand(0.08, 0.18), wb: U.rand(-0.05, 0.07), locked: false };
    if (mode === 'radial') {
      const divs = [4, 6, 8].filter((k) => fold % k === 0);
      f.shape = U.weighted({ circle: 5, poly: divs.length ? 1.2 : 0, flower: 2 });
      if (f.shape === 'poly') { f.k = U.pick(divs); f.off = U.chance(0.5) ? Math.PI / f.k : 0; }
      if (f.shape === 'flower') f.k = fold;
    }
    // mirrored / freeform layouts already vary their spacing — on a scalloped or polygon
    // outline they turn lumpy, so they always sit on a true circle
    return f;
  }

  function newRing(mood, avoid = [], only, zone) {
    const w = {};
    for (const k in RING_P) {
      if (only && !only.includes(k)) continue;
      let p = RING_P[k] * (BOOST[mood].includes(k) ? 2 : 1) * (avoid.includes(k) ? 0.06 : 1);
      if (zone) p *= ZONE[zone].includes(k) ? 2.5 : 0.15;
      w[k] = p;
    }
    const type = U.weighted(w);
    let [lo, hi] = RING_W[type];
    if (zone === 'outer') { lo *= 1.15; hi *= 1.2; } // the outer crown should be bold
    const [c1, c2] = colors();
    const style = styleFor(mood, type);
    const ground = !NO_GROUND.includes(type) && style !== 'kolam' && U.chance(zone === 'outer' ? 0.35 : 0.65) ? groundFor(c1, c2) : -1;
    const m = type === 'motifs' ? U.weighted(zone === 'outer' ? { ...POOL.ring, footprints: 1.4 } : POOL.ring) : undefined;
    return {
      id: U.uid(), type, style, m, cm: m ? natMap(m) : undefined, weight: U.rand(lo, hi), density: U.rand(0.85, 1.2),
      v: U.randInt(0, 99), half: U.chance(0.5), flip: U.chance(0.5), phi: U.rand(TAU), phi2: U.rand(TAU),
      rot: U.rand(TAU), arc: U.chance(0.12) ? U.rand(0.6, 0.85) : 1, arcStart: U.rand(TAU), c1, c2, ground, locked: false,
    };
  }

  function newCenter(mood) {
    const w = {};
    for (const k in CENTER_P) w[k] = CENTER_P[k] * (CENTER_BOOST[mood].includes(k) ? 2.5 : 1);
    const [c1, c2] = colors();
    const type = U.weighted(w);
    const style = styleFor(mood, type);
    return {
      id: U.uid(), type, style, weight: U.rand(1.3, 2.1), k: U.pick([6, 8, 8, 10, 12]),
      half: U.chance(0.5), v: U.randInt(0, 99), c1, c2, locked: false,
    };
  }

  function accentPos(form) {
    const C = 382;
    const corners = [[-C, -C], [C, -C], [C, C], [-C, C]];
    if (form.mode === 'radial') return corners.map(([x, y]) => ({ x, y, r: 0 }));
    if (form.mode === 'mirror') {
      const y = U.chance(0.6) ? C : -C;
      const pos = [{ x: -C, y, r: 0 }, { x: C, y, r: 0 }];
      if (U.chance(0.4)) pos.push({ x: -C, y: -y, r: 0 }, { x: C, y: -y, r: 0 });
      return pos;
    }
    return U.shuffle(corners).slice(0, U.randInt(1, 3)).map(([x, y]) => ({ x: x + U.rand(-20, 20), y: y + U.rand(-20, 20), r: U.rand(-180, 180) }));
  }

  function newAccent(mood, form) {
    const [c1, c2] = colors();
    const type = U.weighted({ diya: 3.2, marigold: 3, scatter: 2, paisley: 0.8, bud: 0.8, flower: 0.6, dots: 0.3 });
    const style = styleFor(mood, type);
    return {
      id: U.uid(), type, style, size: U.rand(84, 112), inward: U.chance(0.4), pos: accentPos(form), v: U.randInt(0, 99), c1, c2, half: false, locked: false,
    };
  }

  const zoneAt = (i, len) => {
    const f = len <= 1 ? 1 : i / (len - 1);
    return f < 0.3 ? 'inner' : f > 0.72 ? 'outer' : 'middle';
  };

  // Spacebar: everything unlocked is replaced; locked things keep their place. If anything is
  // locked the layout stays the same, and only the unlocked parts are regenerated around it.
  function generate(prev) {
    const palette = R.palette.generate(prev && prev.palette);
    setColors(palette.length);
    PAL = palette.map((p) => p.hex);
    const locked = (a) => (a || []).filter((x) => x.locked);
    const anyLocked = prev && (prev.form.locked || (prev.center && prev.center.locked) || [prev.rings, prev.accents, prev.figures, prev.strands].some((l) => locked(l).length));
    const mood = anyLocked ? prev.mood || 'festive' : U.weighted({ festive: 6, geo: 2, kolam: 1 });
    LOOK = anyLocked ? prev.look || 'outline' : U.chance(0.55) ? 'outline' : 'band';
    const layout = anyLocked ? prev.form.layout || 'mandala' : U.weighted(LAYOUTS);
    const out = buildLayout(layout, mood);
    if (anyLocked) {
      out.form = { ...prev.form };
      // rings: locked ones keep their slot, the rest are new
      const slots = prev.rings.map((r) => (r.locked ? r : null));
      const fresh = out.rings.slice();
      out.rings = slots.map((sl, i) => sl || fresh[i % Math.max(1, fresh.length)] || newRing(mood, [], null, zoneAt(i, slots.length)));
      out.rings = out.rings.map((r) => (r.locked ? r : { ...r, id: U.uid() }));
      if (prev.center && prev.center.locked) out.center = prev.center;
      else if (prev.center && prev.center.type === 'plain') out.center = { ...prev.center, locked: false, c1: out.center ? out.center.c1 : prev.center.c1 };
      // figures and strands: a locked piece replaces the new piece in the same role
      for (const key of ['figures', 'strands']) {
        for (const L of locked(prev[key])) {
          const i = out[key].findIndex((x) => x.role === L.role && !x.locked);
          if (i >= 0) out[key][i] = L; else out[key].push(L);
        }
      }
      out.accents = locked(prev.accents).length ? locked(prev.accents) : out.accents;
    }
    // two neighbouring grounds in the same colour would merge into one blob
    for (let i = 1; i < out.rings.length; i++) {
      const a = out.rings[i - 1], b = out.rings[i];
      if (!b.locked && b.ground >= 0 && a.ground === b.ground) b.ground = groundFor(b.c1, b.c2 === a.ground ? b.c2 : a.ground);
    }
    // the floor, toran and stickers belong to the setting, not the rangoli: they stay put
    const scene = prev && prev.scene ? U.clone(prev.scene) : defaultScene();
    return { v: 3, mood, look: LOOK, ...out, palette, scene };
  }
  const defaultScene = () => ({ floor: 'athangudi', toran: true, stickers: [] });

  // Per-element reroll: same motif, new variant (colours, count, details). Keeps id, place and lock.
  const ctx = (st) => { PAL = st.palette.map((p) => p.hex); setColors(PAL.length); LOOK = st.look || 'outline'; };
  function rerollRing(L, mood, st) {
    if (st) ctx(st);
    const [c1, c2] = colors();
    const g = L.ground >= 0 || U.chance(0.3) ? groundFor(c1, c2) : -1;
    return { ...L, c1, c2, ground: NO_GROUND.includes(L.type) ? -1 : g, density: U.rand(0.85, 1.2), half: !L.half, v: U.randInt(0, 99),
      flip: U.chance(0.5), cm: L.m ? natMap(L.m, 0.5) : undefined };
  }
  function rerollCenter(C, mood, st) {
    if (st) ctx(st);
    const [c1, c2] = colors();
    if (C.type === 'plain') return { ...C, c1 };
    return { ...C, c1, c2, k: U.pick([6, 8, 8, 10, 12]), half: !C.half, v: U.randInt(0, 99) };
  }
  function rerollAccent(A, mood, st) {
    if (st) ctx(st);
    const [c1, c2] = colors();
    return { ...A, c1, c2, inward: !A.inward, size: U.rand(84, 112), v: U.randInt(0, 99) };
  }
  function rerollFigure(F, st) {
    ctx(st);
    const flip = U.chance(0.5) ? -1 : 1;
    // a mirrored pair stays mirrored; a single figure may turn round
    const pos = F.pos.length === 2 || !FLIPS.includes(F.m) ? F.pos : F.pos.map((p) => ({ ...p, f: F.role === 'corner' ? p.f : p.f * flip }));
    return { ...F, c: natMap(F.m, 0.6), v: U.randInt(0, 99), pos };
  }
  function rerollStrand(S, st) {
    ctx(st);
    const a = S.pts[0], b = S.pts[3], fresh = strand(S.kind, a, b, U.rand(50, 160) * (U.chance(0.5) ? 1 : -1), S.role);
    return { ...fresh, id: S.id, locked: S.locked, end: S.end || fresh.end, c: natMap(S.end || 'leaves', 0.6) };
  }
  function recolor(el) {
    let c;
    do c = colors(); while (c[0] === el.c1 && c[1] === el.c2);
    el.c1 = c[0]; el.c2 = c[1];
    if (el.ground !== undefined && el.ground >= 0) el.ground = groundFor(c[0], c[1]);
  }

  // Validate anything loaded from a URL or storage — values end up inside SVG markup.
  function sanitize(s) {
    try {
      if (!s || typeof s !== 'object') return null;
      const num = (v, d, lo = -1e4, hi = 1e4) => { v = Number(v); return Number.isFinite(v) ? U.clamp(v, lo, hi) : d; };
      const int = (v, d, lo, hi) => Math.round(num(v, d, lo, hi));
      const id = (v) => (typeof v === 'string' && /^[a-z0-9]{1,16}$/i.test(v) ? v : U.uid());
      const style = (v) => (STYLES.includes(v) ? v : 'festive');
      const MOT = R.motifs || {};
      const cmap = (v) => (Array.isArray(v) && v.length === 5 ? v.map((x) => int(x, 0, 0, 6) % NP) : [0, 1, 2, 3, 4].map((x) => x % NP));
      const NP = U.clamp(Array.isArray(s.palette) ? s.palette.length : 5, 5, 7);
      const base = (o) => ({ id: id(o.id), style: style(o.style), v: int(o.v, 0, 0, 999), c1: int(o.c1, 0, 0, 6) % NP, c2: int(o.c2, 1, 0, 6) % NP, locked: !!o.locked, half: !!o.half });
      const f = s.form || {};
      const form = {
        mode: ['radial', 'mirror', 'free'].includes(f.mode) ? f.mode : 'radial',
        layout: Object.keys(LAYOUTS).includes(f.layout) ? f.layout : 'mandala', hole: num(f.hole, 0, 0, 400),
        fold: int(f.fold, 8, 3, 24),
        // ovals / teardrop outlines were retired — older designs fall back to a circle
        shape: ['circle', 'poly', 'flower'].includes(f.shape) ? f.shape : 'circle',
        k: int(f.k, 6, 3, 24), off: num(f.off, 0, 0, 7), aspect: 1, R0: f.R0 ? num(f.R0, 405, 300, 500) : undefined,
        wa: num(f.wa, 0.2, -0.6, 0.6), wb: num(f.wb, 0, -0.4, 0.4), locked: !!f.locked,
      };
      const palette = (Array.isArray(s.palette) ? s.palette : []).slice(0, 7).map((c) => ({
        hex: c && /^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex.toLowerCase() : '#888888', locked: !!(c && c.locked),
      }));
      while (palette.length < 5) palette.push({ hex: '#888888', locked: false });
      const rings = (Array.isArray(s.rings) ? s.rings : []).filter((r) => r && has(RT, r.type) && (r.type !== 'motifs' || has(MOT, r.m))).slice(0, 16).map((r) => ({
        ...base(r), type: r.type, weight: num(r.weight, 1, 0.2, 3), density: num(r.density, 1, 0.5, 2), flip: !!r.flip,
        phi: num(r.phi, 0, -10, 10), phi2: num(r.phi2, 0, -10, 10), rot: num(r.rot, 0, -10, 10),
        m: r.type === 'motifs' && has(MOT, r.m) ? r.m : undefined, cm: r.type === 'motifs' ? cmap(r.cm) : undefined,
        arc: num(r.arc, 1, 0.3, 1), arcStart: num(r.arcStart, 0, -10, 10), ground: (() => { const g = int(r.ground, -1, -1, 6); return g < 0 ? -1 : g % NP; })(),
      }));
      const c = s.center;
      const center = c && (has(CT, c.type) || c.type === 'plain') ? { ...base(c), type: c.type, weight: num(c.weight, 1.5, 0.5, 3), k: int(c.k, 8, 3, 24) } : null;
      const accents = (Array.isArray(s.accents) ? s.accents : []).filter((a) => a && has(AT, a.type)).slice(0, 8).map((a) => ({
        ...base(a), type: a.type, size: num(a.size, 70, 20, 160), inward: !!a.inward,
        pos: (Array.isArray(a.pos) ? a.pos : []).slice(0, 8).map((p) => ({ x: num(p && p.x, 0, -500, 500), y: num(p && p.y, 0, -500, 500), r: num(p && p.r, 0, -360, 360) })),
      }));
      const pos = (a) => (Array.isArray(a) ? a : []).slice(0, 8).map((p) => ({ x: num(p && p.x, 0, -500, 500), y: num(p && p.y, 0, -500, 500), r: num(p && p.r, 0, -360, 360), f: p && p.f === -1 ? -1 : 1 }));
      const ROLES = ['main', 'pair', 'obj', 'corner', 'minor', 'strand'];
      const role = (v) => (ROLES.includes(v) ? v : 'minor');
      const figures = (Array.isArray(s.figures) ? s.figures : []).filter((F) => F && has(MOT, F.m)).slice(0, 12).map((F) => ({
        id: id(F.id), m: F.m, s: num(F.s, 120, 30, 700), pos: pos(F.pos), c: cmap(F.c), role: role(F.role), v: int(F.v, 0, 0, 999), locked: !!F.locked,
      })).filter((F) => F.pos.length);
      const strands = (Array.isArray(s.strands) ? s.strands : []).filter((S) => S && ['vine', 'swirl', 'dots'].includes(S.kind)).slice(0, 6).map((S) => ({
        id: id(S.id), kind: S.kind, pts: (Array.isArray(S.pts) ? S.pts : []).slice(0, 4).map((p) => [num(p && p[0], 0, -500, 500), num(p && p[1], 0, -500, 500)]),
        w: num(S.w, 9, 2, 30), end: S.end && has(MOT, S.end) ? S.end : null, c: cmap(S.c), v: int(S.v, 0, 0, 999), role: role(S.role), side: S.side === -1 ? -1 : 1, locked: !!S.locked,
      })).filter((S) => S.pts.length === 4);
      const sc = s.scene && typeof s.scene === 'object' ? s.scene : {};
      const scene = {
        floor: has(R.scene.FLOORS, sc.floor) ? sc.floor : 'athangudi',
        toran: sc.toran !== false,
        stickers: (Array.isArray(sc.stickers) ? sc.stickers : []).filter((k) => k && has(R.scene.ST, k.t)).slice(0, 80).map((k) => ({
          id: id(k.id), t: k.t, x: num(k.x, 0, -4000, 4000), y: num(k.y, 0, -4000, 4000),
          s: num(k.s, 110, 30, 400), r: num(k.r, 0, -360, 360), f: !!k.f,
        })),
      };
      return { v: 3, mood: style(s.mood), look: s.look === 'band' ? 'band' : 'outline', form, palette, center, rings, accents, figures, strands, scene };
    } catch (e) {
      return null;
    }
  }

  R.gen = { setColors, defaultScene, generate, newForm, newRing, newCenter, newAccent, rerollRing, rerollCenter, rerollAccent, rerollFigure, rerollStrand, recolor, sanitize, MOTIF_TYPES, BAND_TYPES, natMap: (m, st) => { ctx(st); return natMap(m); } };
})();
