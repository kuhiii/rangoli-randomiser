/* Vector renderer: turns a design state into a top-down rangoli in SVG.
 *
 * What makes it read as rangoli rather than clip-art:
 *  - coloured powder fills with soft base→tip shading (per-colour gradients)
 *  - white rice-flour outlines and white bindu dots separating colours
 *  - solid coloured "ground" bands so the design is filled, not sparse
 *  - a powder texture filter: grainy fill + slightly rough, hand-poured edges
 *  - real motifs seen from above: layered lotus, marigolds, clay diyas with flames,
 *    peacock-feather eyes, paisleys, pookalam segments and spirals, vines, loose petals
 *
 * Coordinates: viewBox centred on 0,0. Angle t = 0 points up, clockwise.
 * A motif is drawn in a local frame: base at (0,0), tip at (0,-h), half-width hw.
 */
(function () {
  const { U } = R;
  const { n, n3, deg, TAU } = U;
  const CREAM = '#fffaf0';
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  /* ---------------------------------------------------------------- types */
  // sp = instance spacing relative to band height, fill = how much of the spacing a motif covers
  const RT = {
    petals:    { name: 'Lotus petals', sp: 0.62, fill: 1.06, motif: 'petal', maxW: 0.8 },
    lotus2:    { name: 'Double lotus', sp: 0.6, fill: 1.08, motif: 'petal', special: 'lotus2', maxW: 0.8 },
    leaves:    { name: 'Leaves', sp: 0.5, fill: 1, motif: 'leaf' },
    paisley:   { name: 'Paisleys', sp: 0.8, fill: 0.95, motif: 'paisley', asym: true },
    dots:      { name: 'Dots', sp: 1.15, fill: 0.8, motif: 'dot' },
    drops:     { name: 'Teardrops', sp: 0.62, fill: 1, motif: 'drop' },
    diyas:     { name: 'Diyas', sp: 0.95, fill: 0.92, motif: 'diya' },
    marigolds: { name: 'Marigolds', sp: 1.0, fill: 1.02, motif: 'marigold' },
    peacock:   { name: 'Peacock feathers', sp: 0.62, fill: 1.04, motif: 'feather' },
    vine:      { name: 'Flower vine', sp: 0.95, fill: 1, motif: 'sprig', cont: 'stem' },
    segments:  { name: 'Pookalam segments', sp: 0.75, cont: 'segments' },
    spiral:    { name: 'Spiral swirl', sp: 0.5, cont: 'spiral' },
    teeth:     { name: 'Triangles', sp: 0.7, fill: 1, motif: 'tooth' },
    diamonds:  { name: 'Diamonds', sp: 0.7, fill: 0.95, motif: 'diamond' },
    kolam:     { name: 'Kolam loops', sp: 0.6, fill: 0.9, motif: 'loop' },
    scallops:  { name: 'Scallops', sp: 0.9, fill: 1, motif: 'scallop' },
    stars:     { name: 'Stars', sp: 1.2, fill: 0.85, motif: 'star' },
    swirls:    { name: 'Swirls', sp: 0.8, fill: 0.9, motif: 'swirl', asym: true },
    chevrons:  { name: 'Chevrons', sp: 0.8, fill: 0.92, motif: 'chevron' },
    chain:     { name: 'Chain', sp: 0.85, fill: 1.45, motif: 'link', maxW: 0.5 },
    band:      { name: 'Solid band', sp: 2.6, cont: 'band' },
    zigzag:    { name: 'Zigzag', sp: 0.55, cont: 'zigzag' },
    wave:      { name: 'Wave', sp: 1.1, cont: 'wave' },
    lines:     { name: 'Double line', sp: 1.6, cont: 'lines' },
    motifs:    { name: 'Motif ring', sp: 1, special: 'motifs' },
  };
  const CT = {
    lotus: { name: 'Lotus' }, marigold: { name: 'Marigold' }, diya: { name: 'Diya on lotus' },
    star: { name: 'Star centre' }, rose: { name: 'Kolam rose' }, seed: { name: 'Seed of life' },
    sun: { name: 'Sunburst' }, bindu: { name: 'Bindu' }, plain: { name: 'Centre disc' },
  };
  const AT = {
    diya: { name: 'Diyas' }, marigold: { name: 'Marigolds' }, scatter: { name: 'Loose petals' },
    paisley: { name: 'Paisley accent' }, flower: { name: 'Flower accent' }, bud: { name: 'Lotus bud accent' }, dots: { name: 'Dot cluster' },
  };

  /* ------------------------------------------------------------- geometry */
  function rho(form, t) {
    switch (form.shape) {
      case 'poly': {
        const k = form.k, seg = TAU / k;
        const a = (((t + (form.off || 0)) % seg) + seg) % seg;
        return Math.cos(Math.PI / k) / Math.cos(a - Math.PI / k);
      }
      case 'flower': return 0.92 + 0.08 * Math.abs(Math.cos((form.k * t) / 2));
      default: return 1; // circle (ovals were dropped — they don't read as rangoli)
    }
  }
  function warp(form, L, tb) {
    if (form.mode === 'mirror') return { t: tb + form.wa * Math.sin(tb), s: 1 + form.wb * Math.cos(tb) };
    if (form.mode === 'free') return { t: tb + form.wa * Math.sin(tb + L.phi), s: 1 + form.wb * Math.sin(2 * tb + L.phi2) };
    return { t: tb, s: 1 };
  }
  function span(form, L) {
    if (form.mode === 'free' && L.arc < 1) return [L.arcStart, L.arcStart + L.arc * TAU, false];
    return [0, TAU, true];
  }
  function angles(form, L, count, half) {
    const [a0, a1, full] = span(form, L);
    const step = (a1 - a0) / count;
    let off = form.mode === 'free' ? 0.5 : L.half ? 0.5 : 0;
    if (half) off += 0.5;
    const rot = form.mode === 'free' && full ? L.rot : 0;
    return Array.from({ length: count }, (_, i) => a0 + rot + (i + off) * step);
  }
  // Hand-drawable counts: a person marks 8 / 12 / 16 guide lines and fills each section, so motifs
  // per ring stay countable (a whole multiple of the fold) instead of dozens of tiny repeats.
  const MAX_N = { dots: 48, band: 48, lines: 48, chain: 40, segments: 32, scallops: 32, drops: 32, kolam: 24, spiral: 24 };
  function countFor(form, L, T, rMid, h) {
    const [a0, a1] = span(form, L);
    const raw = ((a1 - a0) * rMid) / (h * T.sp) * L.density;
    const cap = MAX_N[L.type] || 24;
    if (form.mode === 'radial') {
      const f = form.fold;
      return f * U.clamp(Math.round(raw / f), 1, Math.max(1, Math.floor(cap / f)));
    }
    if (form.mode === 'mirror') return U.clamp(2 * Math.round(raw / 2), 4, cap);
    return U.clamp(Math.round(raw), 3, cap);
  }
  function ptAt(form, L, tb, rf) {
    const { t, s } = warp(form, L, tb);
    const r = rf(s, tb) * rho(form, t);
    return [Math.sin(t) * r, -Math.cos(t) * r];
  }
  const poly = (pts, close) => 'M' + pts.map((p) => n(p[0]) + ' ' + n(p[1])).join('L') + (close ? 'Z' : '');

  // Concentric layout: centre first, rings inner → outer with small gaps (grounds bleed into them).
  function layout(state) {
    const R0 = state.form.R0 || (state.form.mode === 'radial' ? 405 : 392);
    const gap = 0.08;
    const hole = state.form.hole || 0;
    const bands = {};
    if (hole > 0) {
      // a figure sits in the middle: the centre disc is fixed, rings share the room outside it
      const tw = state.rings.reduce((a, l) => a + l.weight + gap, 0);
      const u = tw ? (R0 - hole) / Math.max(tw, 1.4) : 1;
      let r = hole;
      if (state.center) bands[state.center.id] = { r0: 0, r1: hole, pad: (gap * u) / 2 };
      for (const l of state.rings) {
        r += gap * u;
        bands[l.id] = { r0: r, r1: r + l.weight * u, pad: (gap * u) / 2 };
        r += l.weight * u;
      }
      return { bands, u };
    }
    const wc = state.center ? state.center.weight : 0.45;
    const total = wc + state.rings.reduce((a, l) => a + l.weight + gap, 0);
    const u = R0 / Math.max(total, 2.2);
    let r = wc * u;
    if (state.center) bands[state.center.id] = { r0: 0, r1: r, pad: (gap * u) / 2 };
    for (const l of state.rings) {
      r += gap * u;
      bands[l.id] = { r0: r, r1: r + l.weight * u, pad: (gap * u) / 2 };
      r += l.weight * u;
    }
    return { bands, u };
  }

  /* ----------------------------------------------------------- defs/paint */
  function defs(state, texture) {
    let d = '';
    state.palette.forEach((p, i) => {
      const dk = U.shade(p.hex, -13), lt = U.shade(p.hex, 13);
      // base of a petal is deeper, the tip catches more powder/light
      d += `<linearGradient id="lg${i}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${dk}"/><stop offset="1" stop-color="${lt}"/></linearGradient>`;
      d += `<radialGradient id="rg${i}" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="${lt}"/><stop offset="1" stop-color="${dk}"/></radialGradient>`;
    });
    d += '<radialGradient id="clay" cx=".42" cy=".4" r=".75"><stop offset="0" stop-color="#dd8a52"/><stop offset=".7" stop-color="#b65a2c"/><stop offset="1" stop-color="#8f3d1b"/></radialGradient>';
    d += '<radialGradient id="flame" cx=".5" cy=".62" r=".62"><stop offset="0" stop-color="#fffdf0"/><stop offset=".4" stop-color="#ffe066"/><stop offset=".8" stop-color="#ff9f1c"/><stop offset="1" stop-color="#e8590c"/></radialGradient>';
    d += '<radialGradient id="glow"><stop offset="0" stop-color="#ffe9a3" stop-opacity=".9"/><stop offset=".35" stop-color="#ffc861" stop-opacity=".42"/><stop offset="1" stop-color="#ff9f40" stop-opacity="0"/></radialGradient>';
    if (texture) {
      // powder: displace edges a touch (hand-poured), then modulate the fill with fine grain
      d += '<filter id="pw" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="1" seed="5" result="n"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
        '<feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="1" seed="12" result="g"/>' +
        '<feColorMatrix in="g" type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 0 1" result="gg"/>' +
        '<feComposite in="d" in2="gg" operator="arithmetic" k1=".55" k2=".76" k3="0" k4="0"/>' +
        '</filter>';
    }
    return `<defs>${d}</defs>`;
  }

  // Closed shapes (petals, circles, drops…) are always poured solid; only open line work (kolam
  // loops, lines, chains, swirls, vines, spirals, waves) may be drawn as an outline. This also
  // repaints older saved designs that had outline-only shapes.
  const OPEN_LINE = ['kolam', 'lines', 'chain', 'swirls', 'vine', 'spiral', 'wave', 'zigzag'];
  function paint(L, pal) {
    if (L.style === 'kolam' && !OPEN_LINE.includes(L.type)) L = { ...L, style: 'festive' };
    const i1 = L.c1 % pal.length, i2 = L.c2 % pal.length;
    const a = pal[i1].hex, b = pal[i2].hex;
    const hexes = pal.map((p) => p.hex);
    const dark = hexes.slice().sort((x, y) => U.luminance(x) - U.luminance(y))[0];
    const base = { a, b, A: `url(#lg${i1})`, B: `url(#lg${i2})`, RA: `url(#rg${i1})`, RB: `url(#rg${i2})`, v: L.v, dark, pal: hexes, i1 };
    if (L.style === 'kolam') {
      const sc = U.luminance(a) > 0.42 ? dark : a;
      return { ...base, style: 'kolam', A: 'none', B: 'none', RA: 'none', RB: 'none', line: sc, lw: 3, dot: sc };
    }
    if (L.style === 'geo') return { ...base, style: 'geo', line: 'none', lw: 0, dot: CREAM };
    return { ...base, style: 'festive', line: CREAM, lw: 2.2, dot: CREAM };
  }
  const swap = (P) => ({ ...P, a: P.b, b: P.a, A: P.B, B: P.A, RA: P.RB, RB: P.RA });

  const outline = (P) => (P.line !== 'none' ? ` stroke="${P.line}" stroke-width="${P.lw}" stroke-linejoin="round"` : '');
  const shape = (d, P, fill) =>
    P.style === 'kolam'
      ? `<path d="${d}" fill="none" stroke="${P.line}" stroke-width="${P.lw}" stroke-linejoin="round" stroke-linecap="round"/>`
      : `<path d="${d}" fill="${fill || P.A}"${outline(P)}/>`;
  const innerShape = (d, P, tr) =>
    P.style === 'kolam'
      ? `<path d="${d}" fill="none" stroke="${P.line}" stroke-width="${n(P.lw * 0.75)}" transform="${tr}"/>`
      : `<path d="${d}" fill="${P.B}" transform="${tr}"/>`;
  const spot = (cx, cy, r, col) => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${col}"/>`;
  const disc = (cx, cy, r, P, fill) =>
    P.style === 'kolam'
      ? `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${P.line}" stroke-width="${P.lw}"/>`
      : `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill || P.RA}"${outline(P)}/>`;
  function starD(cx, cy, Ro, Ri, k, rot = 0) {
    const pts = [];
    for (let i = 0; i < 2 * k; i++) {
      const a = rot + (i * Math.PI) / k, rr = i % 2 ? Ri : Ro;
      pts.push([cx + Math.sin(a) * rr, cy - Math.cos(a) * rr]);
    }
    return poly(pts, true);
  }

  /* ------------------------------------------------------------- flowers */
  // Marigold (genda) seen from above: stacked rings of ruffled petals, deepest outside.
  function marigoldAt(cx, cy, r, P, big) {
    if (P.style === 'kolam') {
      let o = '';
      for (const k of [1, 0.66, 0.34]) {
        const m = Math.max(6, Math.round(14 * k));
        for (let i = 0; i < m; i++) {
          const a = (i / m) * TAU, R = r * k * 0.7;
          o += `<circle cx="${n(cx + Math.sin(a) * R)}" cy="${n(cy - Math.cos(a) * R)}" r="${n(r * k * 0.3)}" fill="none" stroke="${P.line}" stroke-width="1.6"/>`;
        }
      }
      return o + spot(cx, cy, r * 0.12, P.line);
    }
    const layers = big
      ? [[1, 22, U.shade(P.a, -14)], [0.8, 19, U.shade(P.a, -5)], [0.6, 16, P.a], [0.41, 13, U.shade(P.b, 6)], [0.24, 9, U.shade(P.b, 14)]]
      : [[1, 13, U.shade(P.a, -12)], [0.72, 11, P.a], [0.46, 9, U.shade(P.b, 8)]];
    let o = '';
    layers.forEach(([k, m, col], li) => {
      const R = r * k, off = li * 0.37;
      const rx = R * Math.sin(Math.PI / m) * 1.3, ry = R * 0.36;
      const edge = U.shade(col, -16), sw = n(Math.max(0.5, r * 0.022));
      for (let i = 0; i < m; i++) {
        const a = off + (i / m) * TAU;
        const px = cx + Math.sin(a) * R * 0.66, py = cy - Math.cos(a) * R * 0.66;
        o += `<ellipse cx="${n(px)}" cy="${n(py)}" rx="${n(rx)}" ry="${n(ry)}" transform="rotate(${deg(a)} ${n(px)} ${n(py)})" fill="${col}" stroke="${edge}" stroke-width="${sw}"/>`;
      }
    });
    o += spot(cx, cy, r * 0.15, U.shade(P.b, -28));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      o += spot(cx + Math.sin(a) * r * 0.08, cy - Math.cos(a) * r * 0.08, r * 0.025, '#ffe9a8');
    }
    return o;
  }

  /* --------------------------------------------------------------- motifs */
  const M = {
    petal(hw, h, P) {
      const v = P.v % 3;
      let d;
      if (v === 0) d = `M0 0C${n(hw * 1.25)} ${n(-h * 0.25)} ${n(hw * 0.9)} ${n(-h * 0.8)} 0 ${n(-h)}C${n(-hw * 0.9)} ${n(-h * 0.8)} ${n(-hw * 1.25)} ${n(-h * 0.25)} 0 0Z`;
      else if (v === 1) d = `M0 0C${n(hw * 1.35)} ${n(-h * 0.15)} ${n(hw * 1.1)} ${n(-h)} 0 ${n(-h)}C${n(-hw * 1.1)} ${n(-h)} ${n(-hw * 1.35)} ${n(-h * 0.15)} 0 0Z`;
      else d = `M0 0Q${n(hw * 1.5)} ${n(-h * 0.5)} 0 ${n(-h)}Q${n(-hw * 1.5)} ${n(-h * 0.5)} 0 0Z`;
      let o = shape(d, P) + innerShape(d, P, `translate(0 ${n(-h * 0.1)}) scale(.58)`);
      if (P.style !== 'kolam') {
        o += `<path d="M0 ${n(-h * 0.2)}L0 ${n(-h * 0.6)}" stroke="${P.dot}" stroke-width="${n(Math.max(0.9, hw * 0.07))}" stroke-linecap="round" opacity=".85"/>`;
        o += spot(0, -h * 0.83, Math.max(1.3, hw * 0.09), P.dot);
      }
      return o;
    },
    leaf(hw, h, P) {
      const d = `M0 0Q${n(hw * 1.6)} ${n(-h * 0.5)} 0 ${n(-h)}Q${n(-hw * 1.6)} ${n(-h * 0.5)} 0 0Z`;
      const vein = P.style === 'kolam' ? P.line : P.dot;
      let o = shape(d, P) + `<path d="M0 ${n(-h * 0.08)}L0 ${n(-h * 0.84)}" stroke="${vein}" stroke-width="${n(Math.max(1, hw * 0.1))}" stroke-linecap="round"/>`;
      if (P.style !== 'kolam') for (const f of [0.35, 0.55]) {
        o += `<path d="M0 ${n(-h * f)}L${n(hw * 0.45)} ${n(-h * (f + 0.12))}M0 ${n(-h * f)}L${n(-hw * 0.45)} ${n(-h * (f + 0.12))}" stroke="${vein}" stroke-width="${n(Math.max(0.6, hw * 0.06))}" stroke-linecap="round" opacity=".7"/>`;
      }
      return o;
    },
    paisley(hw, h, P) {
      const d = `M0 0C${n(hw * 1.3)} 0 ${n(hw * 1.25)} ${n(-h * 0.55)} ${n(hw * 0.55)} ${n(-h)}C${n(hw * 0.2)} ${n(-h * 0.72)} ${n(-hw * 1.15)} ${n(-h * 0.7)} ${n(-hw)} ${n(-h * 0.32)}C${n(-hw * 0.9)} ${n(-h * 0.08)} ${n(-hw * 0.45)} 0 0 0Z`;
      let o = shape(d, P) + innerShape(d, P, `translate(${n(-hw * 0.05)} ${n(-h * 0.13)}) scale(.6)`);
      if (P.style !== 'kolam') {
        o += spot(-hw * 0.12, -h * 0.34, hw * 0.2, P.dot);
        for (const [x, y] of [[0.9, 0.2], [1.02, 0.42], [0.85, 0.66]]) o += spot(hw * x, -h * y, Math.max(1, hw * 0.07), P.dot);
      }
      return o;
    },
    dot(hw, h, P) {
      const r = Math.min(hw, h / 2) * 0.85, cy = -h / 2, v = P.v % 3;
      if (P.style === 'kolam') {
        return `<circle cy="${n(cy)}" r="${n(r * 0.7)}" fill="${P.line}"/>` +
          (v === 2 ? `<circle cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${P.line}" stroke-width="${n(Math.max(1, r * 0.18))}"/>` : '');
      }
      let o = `<circle cy="${n(cy)}" r="${n(r)}" fill="${P.RA}"${P.line !== 'none' ? ` stroke="${P.line}" stroke-width="${n(Math.min(P.lw, r * 0.3))}"` : ''}/>`;
      if (v !== 0) o += spot(0, cy, r * 0.36, v === 1 ? P.dot : P.b);
      return o;
    },
    drop(hw, h, P) {
      const R = Math.min(hw * 0.95, h * 0.33);
      const d = `M0 ${n(-h)}C${n(R * 0.4)} ${n(-h * 0.72)} ${n(R)} ${n(-R * 1.7)} ${n(R)} ${n(-R)}A${n(R)} ${n(R)} 0 0 1 ${n(-R)} ${n(-R)}C${n(-R)} ${n(-R * 1.7)} ${n(-R * 0.4)} ${n(-h * 0.72)} 0 ${n(-h)}Z`;
      let o = shape(d, P) + innerShape(d, P, `translate(0 ${n(-R * 0.3)}) scale(.55)`);
      if (P.style !== 'kolam') o += spot(0, -R * 0.85, R * 0.2, P.dot);
      return o;
    },
    // Clay diya seen from directly above: round bowl, pointed spout, oil pool, flame at the wick.
    diya(hw, h, P) {
      const R = Math.min(hw * 0.95, h * 0.36), cy = -R - h * 0.02, tip = -h * 0.95;
      const body = `M0 ${n(tip)}C${n(R * 0.5)} ${n(tip + h * 0.14)} ${n(R)} ${n(cy - R * 0.6)} ${n(R)} ${n(cy)}A${n(R)} ${n(R)} 0 0 1 ${n(-R)} ${n(cy)}C${n(-R)} ${n(cy - R * 0.6)} ${n(-R * 0.5)} ${n(tip + h * 0.14)} 0 ${n(tip)}Z`;
      const fy = tip + h * 0.12;
      if (P.style === 'kolam') return shape(body, P) + `<ellipse cy="${n(fy)}" rx="${n(R * 0.18)}" ry="${n(R * 0.3)}" fill="none" stroke="${P.line}" stroke-width="2"/>`;
      const painted = P.v % 3 === 1;
      const fill = painted ? P.A : 'url(#clay)', rim = painted ? U.shade(P.a, -28) : '#7a3416';
      let o = `<path d="${body}" fill="${fill}" stroke="${rim}" stroke-width="${n(Math.max(1.2, R * 0.09))}" stroke-linejoin="round"/>`;
      // ghee pool: smaller, warm amber with a soft sheen
      o += `<path d="${body}" fill="#8a4513" transform="translate(0 ${n(cy * 0.48)}) scale(.52)"/>`;
      o += `<ellipse cx="${n(-R * 0.12)}" cy="${n(cy - R * 0.05)}" rx="${n(R * 0.18)}" ry="${n(R * 0.1)}" fill="#e0a35a" opacity=".6"/>`;
      const dotCol = painted ? CREAM : P.a;
      for (const a of [-1.15, -0.58, 0, 0.58, 1.15]) o += spot(Math.sin(a) * R * 0.83, cy + Math.cos(a) * R * 0.83, Math.max(0.9, R * 0.08), dotCol);
      o += `<circle cy="${n(fy)}" r="${n(R * 1.15)}" fill="url(#glow)"/>`;
      o += `<ellipse cy="${n(fy)}" rx="${n(R * 0.2)}" ry="${n(R * 0.34)}" fill="url(#flame)"/>`;
      return o;
    },
    marigold(hw, h, P) { return marigoldAt(0, -h / 2, Math.min(hw, h / 2) * 0.98, P); },
    // Peacock feather "eye", viewed flat.
    feather(hw, h, P) {
      const d = `M0 0C${n(hw * 1.3)} ${n(-h * 0.22)} ${n(hw * 1.12)} ${n(-h)} 0 ${n(-h)}C${n(-hw * 1.12)} ${n(-h)} ${n(-hw * 1.3)} ${n(-h * 0.22)} 0 0Z`;
      if (P.style === 'kolam') return shape(d, P) + `<circle cy="${n(-h * 0.62)}" r="${n(hw * 0.4)}" fill="none" stroke="${P.line}" stroke-width="2"/>`;
      const ey = -h * 0.63, er = Math.min(hw * 0.42, h * 0.16);
      let o = shape(d, P) + innerShape(d, P, `translate(0 ${n(-h * 0.2)}) scale(.74)`);
      o += `<path d="M0 ${n(-h * 0.04)}L0 ${n(ey + er)}" stroke="${U.shade(P.a, -30)}" stroke-width="${n(Math.max(0.8, hw * 0.06))}"/>`;
      o += `<circle cy="${n(ey)}" r="${n(er * 1.35)}" fill="#d9a521"/>`;
      o += `<circle cy="${n(ey)}" r="${n(er)}" fill="#1b8a8a"/>`;
      o += `<ellipse cy="${n(ey + er * 0.12)}" rx="${n(er * 0.62)}" ry="${n(er * 0.7)}" fill="#13265c"/>`;
      o += spot(-er * 0.2, ey - er * 0.2, er * 0.16, CREAM);
      return o;
    },
    // vine: a pair of leaves and a little flower on the stem
    sprig(hw, h, P) {
      const PL = { ...P, A: P.B, a: P.b, B: P.A };
      const lh = h * 0.42, lw = Math.min(hw * 0.35, lh * 0.45);
      let o = `<g transform="translate(0 ${n(-h / 2)}) rotate(-58)">${M.leaf(lw, lh, PL)}</g>`;
      o += `<g transform="translate(0 ${n(-h / 2)}) rotate(122)">${M.leaf(lw, lh, PL)}</g>`;
      const fr = Math.min(hw * 0.32, h * 0.18);
      if (P.style === 'kolam') return o + `<circle cy="${n(-h / 2)}" r="${n(fr)}" fill="none" stroke="${P.line}" stroke-width="2"/>`;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU;
        o += `<circle cx="${n(Math.sin(a) * fr * 0.62)}" cy="${n(-h / 2 - Math.cos(a) * fr * 0.62)}" r="${n(fr * 0.46)}" fill="${P.a}"/>`;
      }
      return o + spot(0, -h / 2, fr * 0.34, P.style === 'festive' ? CREAM : '#ffd54a');
    },
    tooth(hw, h, P) {
      const d = `M${n(-hw)} 0L0 ${n(-h)}L${n(hw)} 0Z`;
      return shape(d, P) + innerShape(d, P, `translate(0 ${n(-h * 0.08)}) scale(.5)`);
    },
    diamond(hw, h, P) {
      const d = `M0 0L${n(hw)} ${n(-h / 2)}L0 ${n(-h)}L${n(-hw)} ${n(-h / 2)}Z`;
      return shape(d, P) + innerShape(d, P, `translate(0 ${n(-h * 0.25)}) scale(.5)`) + (P.style !== 'kolam' ? spot(0, -h / 2, Math.min(hw, h) / 8, P.dot) : '');
    },
    loop(hw, h, P) {
      const d = `M0 0C${n(hw * 1.6)} ${n(-h * 0.28)} ${n(-hw * 1.6)} ${n(-h * 0.72)} 0 ${n(-h)}C${n(hw * 1.6)} ${n(-h * 0.72)} ${n(-hw * 1.6)} ${n(-h * 0.28)} 0 0Z`;
      const col = P.style === 'kolam' ? P.line : P.a;
      const sw = Math.max(2, hw * 0.18);
      return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(sw)}" stroke-linejoin="round"/>` + spot(hw * 0.95, -h / 2, sw * 0.9, P.style === 'kolam' ? P.line : P.b);
    },
    scallop(hw, h, P) {
      const d = `M${n(-hw)} 0C${n(-hw)} ${n(-h * 1.33)} ${n(hw)} ${n(-h * 1.33)} ${n(hw)} 0Z`;
      return shape(d, P) + innerShape(d, P, 'scale(.62)') + (P.style !== 'kolam' ? spot(0, -h * 0.72, Math.min(hw, h) * 0.1, P.dot) : '');
    },
    star(hw, h, P) {
      const Ro = Math.min(hw, h / 2) * 0.95, k = 5 + (P.v % 2);
      return shape(starD(0, -h / 2, Ro, Ro * 0.45, k), P) + (P.style !== 'kolam' ? spot(0, -h / 2, Ro * 0.18, P.dot) : '');
    },
    swirl(hw, h, P) {
      const d = `M0 0C0 ${n(-h * 0.45)} ${n(hw * 1.1)} ${n(-h * 0.75)} ${n(hw * 0.4)} ${n(-h * 0.97)}C${n(-hw * 0.3)} ${n(-h * 1.12)} ${n(-hw * 0.95)} ${n(-h * 0.62)} ${n(-hw * 0.15)} ${n(-h * 0.55)}`;
      const col = P.style === 'kolam' ? P.line : P.a, sw = Math.max(1.8, hw * 0.28);
      return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(sw)}" stroke-linecap="round"/>` + spot(-hw * 0.15, -h * 0.55, sw * 0.95, P.style === 'kolam' ? P.line : P.b);
    },
    chevron(hw, h, P) {
      return shape(`M${n(-hw)} ${n(-h * 0.1)}L0 ${n(-h * 0.62)}L${n(hw)} ${n(-h * 0.1)}L${n(hw)} ${n(-h * 0.45)}L0 ${n(-h)}L${n(-hw)} ${n(-h * 0.45)}Z`, P);
    },
    link(hw, h, P) {
      const r = Math.min(hw, h * 0.5), col = P.style === 'kolam' ? P.line : P.a;
      return `<circle cy="${n(-h / 2)}" r="${n(r)}" fill="none" stroke="${col}" stroke-width="${n(U.clamp(h * 0.09, 1.8, 5))}"/>`;
    },
  };

  /* ----------------------------------------------------------------- ring */
  // Solid powder ground under a motif ring — what makes a rangoli look filled in.
  function groundArt(form, L, b, hex, P) {
    const [a0, a1, full] = span(form, L);
    const st = 180, o = [], i = [], h = b.r1 - b.r0;
    for (let k = 0; k <= st; k++) {
      const tb = a0 + ((a1 - a0) * k) / st;
      o.push(ptAt(form, L, tb, (s) => b.r0 + h * Math.max(1, s) + b.pad * 0.9));
      i.push(ptAt(form, L, tb, () => Math.max(0, b.r0 - b.pad * 0.9)));
    }
    i.reverse();
    const d = full ? poly(o, true) + poly(i, true) : poly(o.concat(i), true);
    return `<path d="${d}" fill="${hex}" fill-rule="evenodd"${P.style === 'festive' ? ` stroke="${CREAM}" stroke-width="2.4"` : ''}/>`;
  }

  function contArt(kind, form, L, P, r0, h, count, a0, a1, full) {
    const steps = U.clamp(count * 14, 96, 900);
    const samp = (rf) => {
      const a = [];
      for (let i = 0; i <= steps; i++) a.push(ptAt(form, L, a0 + ((a1 - a0) * i) / steps, rf));
      return a;
    };
    const col = P.style === 'kolam' ? P.line : P.a;
    const whiteOver = (d, sw) => (P.style === 'festive' ? `<path d="${d}" fill="none" stroke="${CREAM}" stroke-width="${n(sw * 0.3)}" stroke-linejoin="round" stroke-linecap="round"/>` : '');
    const step = (a1 - a0) / count;
    // a wedge between two base angles, optionally twisted (spiral)
    const wedge = (tA, tB, tw) => {
      const S = 8, e1 = [], e2 = [], outer = [], innerArc = [];
      for (let k = 0; k <= S; k++) {
        const f = k / S;
        e1.push(ptAt(form, L, tA + tw * f, (s) => r0 + h * s * f));
        e2.push(ptAt(form, L, tB + tw * f, (s) => r0 + h * s * f));
      }
      for (let k = 1; k < 4; k++) {
        outer.push(ptAt(form, L, tA + tw + ((tB - tA) * k) / 4, (s) => r0 + h * s));
        innerArc.push(ptAt(form, L, tB - ((tB - tA) * k) / 4, () => r0));
      }
      return poly(e1.concat(outer, e2.reverse(), innerArc), true);
    };
    switch (kind) {
      case 'band': {
        const o = samp((s) => r0 + h * s), i = samp(() => r0).reverse();
        const d = full ? poly(o, true) + poly(i, true) : poly(o.concat(i), true);
        if (P.style === 'kolam') return `<path d="${d}" fill="none" stroke="${P.line}" stroke-width="${P.lw}"/>`;
        return `<path d="${d}" fill="${P.a}" fill-rule="evenodd"${outline(P)}/>`;
      }
      case 'lines': {
        const sw = U.clamp(h * 0.09, 1.6, 5);
        return `<path d="${poly(samp((s) => r0 + h * s * 0.08), full)}${poly(samp((s) => r0 + h * s * 0.92), full)}" fill="none" stroke="${col}" stroke-width="${n(sw)}"/>`;
      }
      case 'stem': {
        const sw = U.clamp(h * 0.07, 1.4, 4);
        return `<path d="${poly(samp((s) => r0 + (h * s) / 2), full)}" fill="none" stroke="${P.style === 'kolam' ? P.line : U.shade(P.b, -10)}" stroke-width="${n(sw)}" stroke-linecap="round"/>`;
      }
      case 'zigzag': {
        const N = count * 2, pts = [];
        for (let i = 0; i <= N; i++) pts.push(ptAt(form, L, a0 + ((a1 - a0) * i) / N, (s) => r0 + h * s * (i % 2 ? 0.9 : 0.1)));
        const sw = U.clamp(h * 0.12, 2, 7), d = poly(pts, full);
        return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(sw)}" stroke-linejoin="round" stroke-linecap="round"/>` + whiteOver(d, sw);
      }
      case 'wave': {
        const d = poly(samp((s, tb) => r0 + h * s * (0.5 + 0.38 * Math.cos(count * (tb - a0)))), full);
        const sw = U.clamp(h * 0.12, 2, 7);
        return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n(sw)}" stroke-linecap="round"/>` + whiteOver(d, sw);
      }
      case 'segments': {
        // pookalam band: alternating coloured wedges, white separators, a bindu in each
        const cols = P.v % 2 ? [P.a, P.b] : [P.a, P.b, P.pal[(P.i1 + 2) % P.pal.length]];
        let o = '';
        for (let i = 0; i < count; i++) {
          const tA = a0 + i * step, tB = tA + step;
          if (P.style === 'kolam') { o += `<path d="${wedge(tA, tB, 0)}" fill="none" stroke="${P.line}" stroke-width="2"/>`; continue; }
          o += `<path d="${wedge(tA, tB, 0)}" fill="${cols[i % cols.length]}"${outline(P)}/>`;
          const c = ptAt(form, L, tA + step / 2, (s) => r0 + (h * s) / 2);
          o += P.v % 3 === 2
            ? `<path d="${starD(c[0], c[1], h * 0.16, h * 0.07, 4, tA + step / 2)}" fill="${P.dot}"/>`
            : spot(c[0], c[1], Math.min(h * 0.11, step * r0 * 0.2 + 1.5), P.dot);
        }
        return o;
      }
      case 'spiral': {
        // swirling pookalam: twisted wedges cycling through the palette
        const tw = step * (1.4 + (P.v % 3) * 0.35) * (P.v % 2 ? -1 : 1);
        const cols = [P.a, P.b, P.pal[(P.i1 + 2) % P.pal.length], P.pal[(P.i1 + 3) % P.pal.length]].slice(0, 2 + (P.v % 3));
        let o = '';
        for (let i = 0; i < count; i++) {
          const tA = a0 + i * step;
          o += P.style === 'kolam'
            ? `<path d="${wedge(tA, tA + step, tw)}" fill="none" stroke="${P.line}" stroke-width="2"/>`
            : `<path d="${wedge(tA, tA + step, tw)}" fill="${cols[i % cols.length]}"${outline(P)}/>`;
        }
        return o;
      }
    }
    return '';
  }

  // colours for a drawn motif: palette indices per slot a–e, outline by the design's look
  function motifCols(state, cm, sc) {
    const pal = state.palette.map((p) => p.hex), g = (i) => pal[(i || 0) % pal.length];
    return { a: g(cm[0]), b: g(cm[1]), c: g(cm[2]), d: g(cm[3]), e: g(cm[4]), o: state.look === 'band' ? 'none' : CREAM, ow: U.clamp(3.2 / sc / 2.4, 0.3, 1.3) };
  }
  // a motif drawn once into defs and placed with <use>, so a ring of 12 costs one drawing
  function motifUse(state, m, cm, sc) {
    const kit = R.motifKit(), id = kit.id('mu');
    const body = R.motifs[m].draw(motifCols(state, cm, sc), kit);
    return { id, defs: `<defs>${kit.defs}<g id="${id}">${body}</g></defs>` };
  }
  const MRING_N = [4, 5, 6, 8, 10, 12, 16, 20, 24];
  function motifRingArt(state, L, b) {
    const fold = state.form.fold, h = Math.max(10, b.r1 - b.r0), rMid = b.r0 + h / 2;
    const raw = ((TAU * rMid) / (h * 0.92)) * (L.density || 1);
    const ok = MRING_N.filter((c) => c % fold === 0 || fold % c === 0);
    const count = (ok.length ? ok : MRING_N).reduce((best, c) => (Math.abs(c - raw) < Math.abs(best - raw) ? c : best), 8);
    const size = Math.min(h * 1.06, ((TAU * rMid) / count) * 0.96), sc = size / 100;
    const u = motifUse(state, L.m, L.cm || [0, 1, 2, 3, 4], sc);
    const turn = L.m === 'footprints' && !L.flip ? 180 : 0; // footprints walk in toward the centre
    let o = u.defs;
    for (let i = 0; i < count; i++) {
      const t = ((i + (L.half ? 0.5 : 0)) * TAU) / count;
      const [x, y] = ptAt(state.form, L, t, () => rMid);
      o += `<use href="#${u.id}" transform="translate(${n(x)} ${n(y)}) rotate(${n(deg(t) + turn)}) scale(${n3(sc)}) translate(-50 -50)"/>`;
    }
    return o;
  }

  function ringArt(state, L, b) {
    if (L.type === 'motifs') return L.m && R.motifs[L.m] ? motifRingArt(state, L, b) : '';
    const form = state.form, T = RT[L.type], P = paint(L, state.palette);
    const r0 = b.r0, h = Math.max(4, b.r1 - b.r0), rMid = r0 + h / 2;
    const [a0, a1, full] = span(form, L);
    const count = Math.min(160, countFor(form, L, T, rMid, h));
    const spacing = ((a1 - a0) * rMid) / count;
    let out = '';
    if (L.ground >= 0 && P.style !== 'kolam') out += groundArt(form, L, b, state.palette[L.ground % state.palette.length].hex, P);
    if (T.cont) out += contArt(T.cont, form, L, P, r0, h, count, a0, a1, full);
    const motif = T.motif || (T.cont === 'band' || T.cont === 'lines' ? 'dot' : null);
    if (!motif) return out;

    const place = (mot, PP, hw, hh, half) => {
      let o = '';
      for (const tb of angles(form, L, count, half)) {
        const { t, s } = warp(form, L, tb);
        const rr = rho(form, t), sc = s * rr;
        const flip = T.asym ? (form.mode === 'mirror' ? (Math.sin(t) < -1e-6 ? -1 : 1) : form.mode === 'free' && L.flip ? -1 : 1) : 1;
        o += `<g transform="rotate(${deg(t)}) translate(0 ${n(-r0 * rr)}) scale(${n3(sc * flip)} ${n3(sc)})">${M[mot](hw, hh, PP)}</g>`;
      }
      return o;
    };

    if (T.cont === 'band' || T.cont === 'lines') {
      const hw = Math.min(spacing * 0.22, h * 0.2);
      const PP = P.style === 'kolam' ? P : { ...P, RA: T.cont === 'band' ? CREAM : P.RB, line: 'none' };
      return out + place('dot', PP, hw, h);
    }
    const hw = Math.min((spacing * T.fill) / 2, h * (T.maxW || 0.85));
    if (T.special === 'lotus2') {
      // back row in the second colour peeks between the front petals
      out += place('petal', swap(P), hw * 1.05, h, true);
      return out + place('petal', P, hw * 0.92, h * 0.8, false);
    }
    return out + place(motif, P, hw, h);
  }

  function ringHit(form, L, b) {
    const [a0, a1, full] = span(form, L);
    const st = 96, o = [], i = [], h = b.r1 - b.r0;
    for (let k = 0; k <= st; k++) {
      const tb = a0 + ((a1 - a0) * k) / st;
      o.push(ptAt(form, L, tb, (s) => b.r0 + h * Math.max(1, s) + b.pad));
      i.push(ptAt(form, L, tb, () => Math.max(0, b.r0 - b.pad)));
    }
    i.reverse();
    const d = full ? poly(o, true) + poly(i, true) : poly(o.concat(i), true);
    return `<path class="hit" d="${d}" fill="transparent" fill-rule="evenodd"/>`;
  }

  /* --------------------------------------------------------------- centre */
  function lotusAt(Rc, k, P) {
    const P2 = swap(P);
    const kk = k < 6 ? k * 2 : k;
    const rot = (a, s) => `<g transform="rotate(${deg(a)})">${s}</g>`;
    let o = '';
    const hw1 = Math.min(Rc * Math.sin(Math.PI / kk) * 1.25, Rc * 0.42);
    for (let i = 0; i < kk; i++) o += rot(((i + 0.5) * TAU) / kk, `<g transform="translate(0 ${n(-Rc * 0.16)})">${M.petal(hw1, Rc * 0.84, P2)}</g>`);
    for (let i = 0; i < kk; i++) o += rot((i * TAU) / kk, `<g transform="translate(0 ${n(-Rc * 0.13)})">${M.petal(hw1 * 0.86, Rc * 0.66, P)}</g>`);
    const k3 = Math.max(5, Math.round(kk / 2));
    for (let i = 0; i < k3; i++) o += rot(((i + 0.5) * TAU) / k3, `<g transform="translate(0 ${n(-Rc * 0.1)})">${M.petal(Rc * 0.13, Rc * 0.36, P2)}</g>`);
    return o;
  }
  function centerArt(state, C, Rc) {
    const P = paint({ ...C, type: 'center' }, state.palette);
    const P2 = swap(P);
    const k = state.form.mode === 'radial' ? state.form.fold : C.k;
    const rot = (a, s) => `<g transform="rotate(${deg(a)})">${s}</g>`;
    let o = '';
    switch (C.type) {
      case 'plain': {
        // a solid powder disc (following the design's outline shape) for a figure to sit on
        const col = state.palette[C.c1 % state.palette.length].hex, pts = [];
        for (let i = 0; i <= 120; i++) { const t = (i / 120) * TAU, r = Rc * rho(state.form, t); pts.push([Math.sin(t) * r, -Math.cos(t) * r]); }
        const line = state.look === 'band' ? '' : ` stroke="${CREAM}" stroke-width="3"`;
        o += `<path d="${poly(pts, true)}" fill="${U.shade(col, 4)}"${line}/>`;
        const m = Math.round(Rc / 9);
        for (let i = 0; i < m; i++) { const t = ((i + 0.5) * TAU) / m, r = (Rc - 9) * rho(state.form, t); o += spot(Math.sin(t) * r, -Math.cos(t) * r, 2.6, U.textOn(col) === '#ffffff' ? CREAM : U.shade(col, -30)); }
        break;
      }
      case 'lotus': {
        o += lotusAt(Rc, k, P);
        o += disc(0, 0, Rc * 0.17, P, P.RB);
        if (P.style !== 'kolam') for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TAU;
          o += spot(Math.sin(a) * Rc * 0.09, -Math.cos(a) * Rc * 0.09, Rc * 0.022, P.dot);
        }
        break;
      }
      case 'marigold':
        o += marigoldAt(0, 0, Rc, P, true);
        break;
      case 'diya': {
        o += lotusAt(Rc, k, P);
        const h = Rc * 0.95;
        o += `<g transform="translate(0 ${n(h * 0.42)})">${M.diya(Rc * 0.5, h, { ...P, v: 0 })}</g>`;
        break;
      }
      case 'star': {
        const r1 = C.half ? Math.PI / k : 0;
        o += shape(starD(0, 0, Rc, Rc * 0.52, k, r1), P, P.RA) + innerShape(starD(0, 0, Rc, Rc * 0.6, k, r1 + Math.PI / k), P, 'scale(.55)') + disc(0, 0, Rc * 0.16, P2, P2.RA);
        if (P.style !== 'kolam') for (let i = 0; i < k; i++) {
          const a = r1 + (i * TAU) / k;
          o += spot(Math.sin(a) * Rc * 0.8, -Math.cos(a) * Rc * 0.8, Rc * 0.035, P.dot);
        }
        break;
      }
      case 'rose': {
        const rose = (Rr, off) => {
          const pts = [];
          for (let i = 0; i <= 720; i++) {
            const a = (i / 720) * TAU, r = Rr * Math.abs(Math.cos((k * a) / 2));
            pts.push([Math.sin(a + off) * r, -Math.cos(a + off) * r]);
          }
          return poly(pts, true);
        };
        o += shape(rose(Rc, 0), P, P.RA) + shape(rose(Rc * 0.6, Math.PI / k), P2, P2.RA);
        for (let i = 0; i < k; i++) {
          const a = ((i + 0.5) * TAU) / k;
          o += spot(Math.sin(a) * Rc * 0.8, -Math.cos(a) * Rc * 0.8, Rc * 0.04, P.style === 'kolam' ? P.line : P.a);
        }
        o += spot(0, 0, Rc * 0.07, P.dot);
        break;
      }
      case 'seed': {
        const kk = Math.min(k, 12), st = P.style === 'kolam' ? P.line : P.a;
        if (P.style !== 'kolam') o += `<circle r="${n(Rc)}" fill="${P.b}" fill-opacity=".35"/>`;
        for (let i = 0; i < kk; i++) {
          const a = (i * TAU) / kk;
          o += `<circle cx="${n(Math.sin(a) * Rc * 0.5)}" cy="${n(-Math.cos(a) * Rc * 0.5)}" r="${n(Rc * 0.5)}" fill="${P.style === 'kolam' ? 'none' : P.a}" fill-opacity=".28" stroke="${st}" stroke-width="2.6"/>`;
        }
        o += `<circle r="${n(Rc)}" fill="none" stroke="${st}" stroke-width="3"/>` + spot(0, 0, Rc * 0.1, P.dot);
        break;
      }
      case 'sun': {
        const bw = Rc * Math.sin(Math.PI / k) * 0.55;
        for (let i = 0; i < k; i++) o += rot((i * TAU) / k, shape(`M${n(-bw)} ${n(-Rc * 0.38)}L0 ${n(-Rc)}L${n(bw)} ${n(-Rc * 0.38)}Z`, P));
        for (let i = 0; i < k; i++) o += rot(((i + 0.5) * TAU) / k, shape(`M${n(-bw * 0.7)} ${n(-Rc * 0.38)}L0 ${n(-Rc * 0.78)}L${n(bw * 0.7)} ${n(-Rc * 0.38)}Z`, P2));
        o += disc(0, 0, Rc * 0.42, P2, P2.RA);
        o += disc(0, 0, Rc * 0.26, P, P.RA) + spot(0, 0, Rc * 0.09, P.dot);
        break;
      }
      default: { // bindu: concentric powder rings with a dotted rim
        o += disc(0, 0, Rc, P, P.RA) + disc(0, 0, Rc * 0.72, P2, P2.RA) + disc(0, 0, Rc * 0.46, P, P.RA) + spot(0, 0, Rc * 0.2, P.style === 'kolam' ? P.line : P.b);
        const m = Math.max(8, k * 2);
        for (let i = 0; i < m; i++) {
          const a = ((i + 0.5) * TAU) / m;
          o += spot(Math.sin(a) * Rc * 0.86, -Math.cos(a) * Rc * 0.86, Rc * 0.04, P.dot);
        }
      }
    }
    return o;
  }

  /* --------------------------------------------------------------- accent */
  function accentArt(state, A) {
    const P = paint({ ...A, type: 'accent' }, state.palette), S = A.size;
    const piece = (idx) => {
      switch (A.type) {
        case 'diya': return `<g transform="translate(0 ${n(S * 0.45)})">${M.diya(S * 0.42, S, P)}</g>`;
        case 'marigold': {
          const PL = { ...P, A: P.B, a: P.b };
          let o = '';
          for (const a of [-2.4, 2.4, 3.14]) o += `<g transform="rotate(${deg(a)}) translate(0 ${n(-S * 0.28)})">${M.leaf(S * 0.12, S * 0.34, PL)}</g>`;
          return o + marigoldAt(0, 0, S * 0.4, P);
        }
        case 'scatter': {
          // loose petals strewn around — seeded so they don't jump on every redraw
          const rnd = U.seeded(A.v * 131 + idx * 977 + 7);
          let o = '';
          for (let i = 0; i < 11; i++) {
            const r = S * 0.55 * Math.sqrt(rnd()), a = rnd() * TAU, rot = rnd() * 360;
            const x = Math.sin(a) * r, y = Math.cos(a) * r, col = i % 3 === 2 ? P.b : P.a;
            if (P.style === 'kolam') { o += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(S * 0.05)}" ry="${n(S * 0.09)}" transform="rotate(${n(rot)} ${n(x)} ${n(y)})" fill="none" stroke="${P.line}" stroke-width="1.4"/>`; continue; }
            o += `<path d="M${n(x)} ${n(y + S * 0.1)}C${n(x + S * 0.08)} ${n(y + S * 0.02)} ${n(x + S * 0.05)} ${n(y - S * 0.09)} ${n(x)} ${n(y - S * 0.09)}C${n(x - S * 0.05)} ${n(y - S * 0.09)} ${n(x - S * 0.08)} ${n(y + S * 0.02)} ${n(x)} ${n(y + S * 0.1)}Z" transform="rotate(${n(rot)} ${n(x)} ${n(y)})" fill="${col}" stroke="${U.shade(col, -18)}" stroke-width=".6"/>`;
          }
          return o + marigoldAt(S * 0.08, -S * 0.05, S * 0.16, P);
        }
        case 'flower': {
          const k = 6 + (A.v % 2) * 2;
          let o = '';
          for (let i = 0; i < k; i++) o += `<g transform="rotate(${n((i * 360) / k)}) translate(0 ${n(-S * 0.1)})">${M.petal(S * 0.16, S * 0.4, P)}</g>`;
          return o + disc(0, 0, S * 0.13, swap(P), P.RB) + spot(0, 0, S * 0.05, P.dot);
        }
        case 'dots': {
          let o = '';
          for (let i = 0; i < 3; i++) {
            const a = (i * TAU) / 3;
            o += `<g transform="translate(${n(Math.sin(a) * S * 0.24)} ${n(-Math.cos(a) * S * 0.24 + S * 0.16)})">${M.dot(S * 0.16, S * 0.32, P)}</g>`;
          }
          return o + spot(0, 0, S * 0.07, P.style === 'kolam' ? P.line : P.a);
        }
        case 'bud': return `<g transform="translate(0 ${n(S / 2)})">${M.petal(S * 0.33, S, P)}</g>`;
        default: return `<g transform="translate(0 ${n(S / 2)})">${M.paisley(S * 0.33, S, P)}</g>`;
      }
    };
    let o = '';
    A.pos.forEach((p, idx) => {
      const r = state.form.mode === 'free' ? p.r : U.deg(Math.atan2(p.x, -p.y)) + (A.inward ? 180 : 0);
      const f = state.form.mode === 'mirror' && p.x < 0 ? -1 : 1;
      o += `<g transform="translate(${n(p.x)} ${n(p.y)}) rotate(${n(r)}) scale(${f} 1)">${piece(idx)}</g>`;
    });
    return o;
  }

  /* -------------------------------------------------------------- figures */
  function figureArt(state, F) {
    const sc = F.s / 100, u = motifUse(state, F.m, F.c, sc);
    return u.defs + F.pos.map((p) => `<use href="#${u.id}" transform="translate(${n(p.x)} ${n(p.y)}) rotate(${n(p.r)}) scale(${n3(sc * (p.f || 1))} ${n3(sc)}) translate(-50 -50)"/>`).join('');
  }

  /* -------------------------------------------------------------- strands */
  // Vines, swirls and dot trails poured along a flowing curve.
  function strandArt(state, S) {
    const G = R.motifGeo, pal = state.palette.map((p) => p.hex), col = (i) => pal[S.c[i] % pal.length];
    const outl = state.look === 'band' ? '' : ` stroke="${CREAM}" stroke-width="2.4" stroke-linejoin="round"`;
    const pts = G.bez(...S.pts, 80), N = pts.length - 1;
    const at = (t) => { const i = Math.min(N - 1, Math.max(1, Math.round(t * N))); const a = pts[i - 1], b = pts[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return { p: pts[i], tx: (b[0] - a[0]) / d, ty: (b[1] - a[1]) / d }; };
    const rnd = U.seeded(S.v * 97 + 13);
    let len = 0; for (let i = 1; i <= N; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    let o = '';
    if (S.kind === 'vine') {
      const green = col(3), w = S.w * 1.3, blooms = [];
      let bid = '', bdefs = '';
      const bloom = () => {
        if (bid) return bid;
        const kit = R.motifKit(); bid = kit.id('vb');
        bdefs = `<defs>${kit.defs}<g id="${bid}">${R.motifs.flower.draw(motifCols(state, S.c, 0.8), kit)}</g></defs>`;
        return bid;
      };
      const k = Math.max(4, Math.round(len / 58));
      for (let i = 1; i < k; i++) {
        const t = i / k, { p, tx, ty } = at(t), side = (i % 2 ? 1 : -1) * S.side, L = 46 * (1 - 0.35 * t) * (0.85 + rnd() * 0.3);
        const ang = Math.atan2(ty, tx) + side * 0.95, ex = p[0] + Math.cos(ang) * L * 1.3, ey = p[1] + Math.sin(ang) * L * 1.3;
        o += `<path d="${G.tube(G.spine(p[0], p[1], ex, ey, side * 7, side * 4), G.leafW(15 * (1 - 0.3 * t)))}" fill="${U.shade(green, i % 2 ? 6 : -6)}"${outl}/>`;
        if (i % 3 === 0 && i < k - 1) {
          // a small flower blooming off the stem every few leaves
          const q = at(t + 0.5 / k), fs = 74 * (1 - 0.3 * t), fx = q.p[0] - q.ty * -side * fs * 0.45, fy = q.p[1] + q.tx * -side * fs * 0.45;
          blooms.push(`<use href="#${bloom()}" transform="translate(${n(fx)} ${n(fy)}) scale(${n3(fs / 100)}) translate(-50 -50)"/>`);
        }
      }
      o = `<path d="${G.tube(pts, (t) => w * (1 - 0.5 * t) + 1)}" fill="${U.shade(green, -14)}"${outl}/>` + o + bdefs + blooms.join('');
      for (const t of [0.3, 0.65]) {
        const { p, tx, ty } = at(t), side = -S.side, cx = p[0] - ty * side * 22, cy = p[1] + tx * side * 22;
        o += `<path d="${G.tube(G.spiral(cx, cy, 14, 2, 0.9, Math.atan2(p[1] - cy, p[0] - cx), side), (tt) => 2.6 * (1 - 0.7 * tt) + 0.4)}" fill="${U.shade(green, -10)}"/>`;
      }
      if (S.end && R.motifs[S.end]) {
        const { p, tx, ty } = at(1), size = 190, kit = R.motifKit();
        const body = R.motifs[S.end].draw(motifCols(state, S.c, size / 100), kit);
        o += `<g transform="translate(${n(p[0] + tx * size * 0.32)} ${n(p[1] + ty * size * 0.32)}) rotate(${n(deg(Math.atan2(tx, -ty)))}) scale(${n3(size / 100)}) translate(-50 -50)"><defs>${kit.defs}</defs>${body}</g>`;
      }
      return o;
    }
    if (S.kind === 'swirl') {
      // a thick poured swoosh with a stripe of a second colour inside, ending in a curl
      const c1 = col(0), c2 = col(4), w = S.w * 2.2, end = at(1), side = S.side;
      const wf = (t) => w * Math.pow(1 - t, 0.55) + 2;
      o += `<path d="${G.tube(pts, wf)}" fill="${c1}"${outl}/>`;
      o += `<path d="${G.tube(pts.slice(0, Math.round(N * 0.85)), (t) => wf(t * 0.85) * 0.42)}" fill="${c2}"/>`;
      const cx = end.p[0] - end.ty * side * 26, cy = end.p[1] + end.tx * side * 26;
      o += `<path d="${G.tube(G.spiral(cx, cy, 26, 4, 1.1, Math.atan2(end.p[1] - cy, end.p[0] - cx), side), (t) => 4 * (1 - 0.6 * t) + 0.8)}" fill="${c1}"${outl}/>`;
      const k = Math.max(5, Math.round(len / 34));
      for (let i = 1; i < k; i++) {
        const t = i / k, { p, tx, ty } = at(t), off = (wf(t) + 16) * -side;
        o += `<circle cx="${n(p[0] - ty * off)}" cy="${n(p[1] + tx * off)}" r="${n(8 * (1 - 0.6 * t) + 2)}" fill="${col(i % 2 ? 4 : 1)}"${outl}/>`;
      }
      return o;
    }
    const k = Math.max(5, Math.round(len / 28));
    for (let i = 0; i <= k; i++) {
      const t = i / k, { p } = at(t);
      o += `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="${n(S.w * (1 - 0.6 * t))}" fill="${col([0, 4, 1][i % 3])}"${outl}/>`;
    }
    return o;
  }
  const strandPath = (S) => `M${S.pts[0].map(n).join(' ')}C${S.pts.slice(1).map((q) => q.map(n).join(' ')).join(' ')}`;

  /* --------------------------------------------------------------- badges */
  const LOCK_GLYPH = '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>';
  const badge = (x, y) =>
    `<g class="badge" transform="translate(${n(x)} ${n(y)})"><circle r="14" fill="#fffdf9" stroke="#1f1b16" stroke-opacity=".18"/><g transform="translate(-8.4 -8.6) scale(.7)" fill="none" stroke="#1f1b16" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${LOCK_GLYPH}</g></g>`;

  /* ----------------------------------------------------------- background */
  function stoneInner(thumb) {
    const rect = (extra) => `<rect x="-500" y="-500" width="1000" height="1000" ${extra}/>`;
    const vg = '<radialGradient id="stV" cx="0" cy="0" r="720" gradientUnits="userSpaceOnUse"><stop offset=".5" stop-color="#6b5a45" stop-opacity="0"/><stop offset="1" stop-color="#6b5a45" stop-opacity=".16"/></radialGradient>';
    if (thumb) return `<defs>${vg}</defs>${rect('fill="#ebe5dc"')}${rect('fill="url(#stV)"')}`;
    const f = (id, freq, oct, seed, rgb, a, b) =>
      `<filter id="${id}" x="-500" y="-500" width="1000" height="1000" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}"/><feColorMatrix values="0 0 0 0 ${rgb[0]} 0 0 0 0 ${rgb[1]} 0 0 0 0 ${rgb[2]} ${a} 0 0 0 ${b}"/></filter>`;
    return `<defs>${vg}${f('stM', 0.004, 4, 11, [0.42, 0.37, 0.31], 1.3, -0.5)}${f('stG', 0.85, 2, 4, [0.3, 0.27, 0.23], 2.2, -1.12)}${f('stW', 0.6, 1, 9, [1, 1, 1], 2.2, -1.12)}</defs>` +
      rect('fill="#ebe5dc"') + rect('filter="url(#stM)" opacity=".55"') + rect('filter="url(#stG)" opacity=".5"') + rect('filter="url(#stW)" opacity=".7"') + rect('fill="url(#stV)"');
  }

  /* ---------------------------------------------------------------- entry */
  // o.ui → hit areas, lock badges, overlay · o.texture (default true) → powder filter
  // Every element as its own piece: art, hit area and lock badge, in paint order (back → front)
  function parts(state, o = {}) {
    const ui = !!o.ui, lay = layout(state), list = [];
    for (let i = state.rings.length - 1; i >= 0; i--) {
      const L = state.rings[i], b = lay.bands[L.id];
      let badge_ = '';
      if (ui && L.locked) { const p = ptAt(state.form, L, Math.PI / 4, () => b.r1); badge_ = badge(p[0], p[1]); }
      list.push({ id: L.id, kind: 'ring', art: ringArt(state, L, b), hit: ui ? ringHit(state.form, L, b) : '', badge: badge_ });
    }
    if (state.center) {
      const C = state.center, Rc = lay.bands[C.id].r1;
      list.push({ id: C.id, kind: 'center', art: centerArt(state, C, Rc), hit: ui ? `<circle class="hit" r="${n(Rc)}" fill="transparent"/>` : '',
        badge: ui && C.locked ? badge(Rc * 0.72, -Rc * 0.72) : '' });
    }
    for (const A of state.accents) {
      list.push({ id: A.id, kind: 'accent', art: accentArt(state, A),
        hit: ui ? A.pos.map((p) => `<circle class="hit" cx="${n(p.x)}" cy="${n(p.y)}" r="${n(A.size * 0.62)}" fill="transparent"/>`).join('') : '',
        badge: ui && A.locked && A.pos[0] ? badge(A.pos[0].x + A.size * 0.45, A.pos[0].y - A.size * 0.45) : '' });
    }
    for (const S of state.strands || []) {
      list.push({ id: S.id, kind: 'strand', art: strandArt(state, S),
        hit: ui ? `<path class="hit" d="${strandPath(S)}" fill="none" stroke="transparent" stroke-width="56" stroke-linecap="round"/>` : '',
        badge: ui && S.locked ? badge(S.pts[3][0], S.pts[3][1]) : '' });
    }
    const ORDER = { corner: 0, minor: 1, obj: 2, pair: 3, main: 4 };
    for (const F of (state.figures || []).slice().sort((a, b) => (ORDER[a.role] || 0) - (ORDER[b.role] || 0))) {
      list.push({ id: F.id, kind: 'figure', art: figureArt(state, F),
        hit: ui ? F.pos.map((p) => `<circle class="hit" cx="${n(p.x)}" cy="${n(p.y)}" r="${n(F.s * 0.4)}" fill="transparent"/>`).join('') : '',
        badge: ui && F.locked ? badge(F.pos[0].x + F.s * 0.3, F.pos[0].y - F.s * 0.3) : '' });
    }
    return { defs: defs(state, o.texture !== false), list };
  }

  // o.ui → hit areas, lock badges, overlay · o.texture (default true) → powder filter
  function inner(state, o = {}) {
    const tex = o.texture !== false, P = parts(state, o);
    const body = P.list.map((l) => `<g class="layer" data-id="${l.id}" data-kind="${l.kind}">${l.hit}<g class="art"${tex ? ' filter="url(#pw)"' : ''}>${l.art}</g></g>`).join('');
    return P.defs + `<g class="art-root">${body}</g>` + (o.ui ? `<g class="badges">${P.list.map((l) => l.badge).join('')}</g><g id="overlay"></g>` : '');
  }

  function svg(state, o = {}) {
    const size = o.size ? ` width="${o.size}" height="${o.size}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-500 -500 1000 1000"${size}>${o.bg === false ? '' : stoneInner(!!o.thumb)}${inner(state, o)}</svg>`;
  }

  R.render = { RT, CT, AT, has, layout, parts, inner, svg, stoneInner };
})();
