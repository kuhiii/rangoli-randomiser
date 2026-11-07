/* Figurative and traditional motifs, drawn the way they are actually made on the floor.
 *
 * Studied from photos of real, hand-made rangolis (Wikimedia Commons: Category:Rangoli,
 * Category:Alpana), not from illustrations. What makes them read as rangoli:
 *   - shapes are poured by hand, so every line swells and tapers and every petal or leaf has a
 *     curving spine and a softly curled tip, never a ruled line or a perfect circle
 *   - flat-ish powder fills that deepen toward the base of each petal/feather/leaf (gradient)
 *   - either a thick white rice-flour outline (kolam style) or colour bands edge to edge
 *   - curls are an accent where real ones put them (line ends, antennae, crests), not everywhere
 *
 * Every motif draws into a 100 × 100 box: draw(c, k) where c = { a, b, c, d, e, o } colours
 * (o: outline colour, or 'none') and k is a small kit that collects per-shape gradients.
 */
(function () {
  const { U } = R;
  const f1 = (v) => Math.round(v * 10) / 10;
  let gid = 0;
  function kit() {
    const k = { defs: '' };
    // gradient along a shape, from its base (deeper) to its tip (lighter)
    k.grad = (col, x1, y1, x2, y2, deep = 14, light = 12) => {
      const id = 'mg' + gid++;
      k.defs += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}">` +
        `<stop offset="0" stop-color="${U.shade(col, -deep)}"/><stop offset="1" stop-color="${U.shade(col, light)}"/></linearGradient>`;
      return `url(#${id})`;
    };
    k.radial = (col, cx, cy, r) => {
      const id = 'mg' + gid++;
      k.defs += `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}">` +
        `<stop offset="0" stop-color="${U.shade(col, 12)}"/><stop offset="1" stop-color="${U.shade(col, -12)}"/></radialGradient>`;
      return `url(#${id})`;
    };
    k.id = (p = 'mu') => p + gid++;
    return k;
  }

  /* ---------------------------------------------------------------- geometry */
  const bez = (p0, p1, p2, p3, n = 28) => Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  });
  // a filled stroke along a spine of points; wf(t) gives the half-width at t ∈ [0, 1]
  function tube(pts, wf) {
    const L = [], R2 = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = wf(i / (pts.length - 1));
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
      R2.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    // round caps at both ends, so a poured stroke never ends in a straight cut
    const P = (p) => `${f1(p[0])} ${f1(p[1])}`, n = pts.length - 1;
    const w0 = Math.max(0.05, wf(0)), w1 = Math.max(0.05, wf(1));
    return 'M' + L.map(P).join('L') + `A${f1(w1)} ${f1(w1)} 0 0 0 ${P(R2[n])}` +
      'L' + R2.slice().reverse().map(P).join('L') + `A${f1(w0)} ${f1(w0)} 0 0 0 ${P(L[0])}Z`;
  }
  // width profiles
  const leafW = (w) => (t) => w * Math.pow(Math.sin(Math.PI * t), 0.75) * (1 - 0.15 * t);      // pointed both ends
  const petalW = (w) => (t) => w * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.08)), 0.6);   // round shoulder, sharp tip
  const commaW = (w) => (t) => w * Math.pow(1 - t, 0.7) + 0.3;                                  // poured: thick → thin
  const featherW = (w) => (t) => w * (0.2 + 0.8 * Math.pow(t, 1.6));                         // thin quill → round eye end
  // a curved spine from base to tip, bending sideways by `bend` and curling its tip by `curl`
  function spine(bx, by, tx, ty, bend = 0, curl = 0) {
    const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    return bez([bx, by], [bx + dx * 0.33 + nx * bend, by + dy * 0.33 + ny * bend],
      [bx + dx * 0.72 + nx * (bend + curl), by + dy * 0.72 + ny * (bend + curl)], [tx + nx * curl * 0.4, ty + ny * curl * 0.4]);
  }
  function spiral(cx, cy, r0, r1, turns, a0, dir = 1, n = 40) {
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n, a = a0 + dir * t * turns * Math.PI * 2, r = r0 + (r1 - r0) * t;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
  }
  // outline in the rice-flour colour; c.ow scales it so big figures and small repeats get the same line
const O = (c, w = 2.4) => (c.o === 'none' ? '' : ` stroke="${c.o}" stroke-width="${f1(w * (c.ow || 1) * 100) / 100}" stroke-linejoin="round"`);
  const WHITE = '#fff6e6';
  const dot = (x, y, r, fill) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${fill}"/>`;
  // a petal or leaf with a base→tip gradient
  function petal(k, c, col, bx, by, tx, ty, w, bend = 0, curl = 0, prof = petalW) {
    return `<path d="${tube(spine(bx, by, tx, ty, bend, curl), prof(w))}" fill="${k.grad(col, bx, by, tx, ty)}"${O(c)}/>`;
  }
  // a white curl: a poured spiral that thins out (used only where real rangolis have them)
  const curlStroke = (cx, cy, r, a0, dir, w = 1.8, col = WHITE) => `<path d="${tube(spiral(cx, cy, r, r * 0.15, 0.85, a0, dir), commaW(w))}" fill="${col}"/>`;

  // a peacock eye-feather as poured: a teardrop from a thin quill to a round end, with nested
  // rings of colour (outer, middle, eye) like the real rangolis
  function eyeFeather(k, c, bx, by, tx, ty, W, bend) {
    const p = spine(bx, by, tx, ty, bend, 0), n = p.length - 1;
    const drop = (from, w) => tube(p.slice(Math.round(from * n)), (t) => w * (0.12 + 0.88 * Math.pow(t, 1.3)));
    return `<path d="${drop(0, W)}" fill="${k.grad(c.d, bx, by, tx, ty, 18, 8)}"${O(c, 2)}/>` +
      `<path d="${drop(0.45, W * 0.66)}" fill="${c.e}"/>` + `<path d="${drop(0.62, W * 0.4)}" fill="${c.c}"/>` +
      dot(p[n][0] - (p[n][0] - p[n - 3][0]) * 0.6, p[n][1] - (p[n][1] - p[n - 3][1]) * 0.6, W * 0.16, c.a);
  }
  // beak (top base, bottom base, tip), eye, and an optional crest of three tufts from the crown
  function bird(c, ax, ay, bx2, by2, tx, ty, ex, ey, cx, cy, crest) {
    let s = `<path d="M${ax} ${ay}Q${(ax + tx) / 2} ${ay - 0.6} ${tx} ${ty}Q${(bx2 + tx) / 2} ${by2 + 0.2} ${bx2} ${by2}Z" fill="${c.e}"/>`;
    s += `<ellipse cx="${ex}" cy="${ey}" rx="2" ry="1.5" fill="${WHITE}"/>` + dot(ex, ey, 0.9, '#1b1b1b');
    if (crest) for (const d of [-4.5, 0, 4.5]) {
      const tx2 = cx + d, ty2 = cy - 9 + Math.abs(d) * 0.3;
      s += `<path d="${tube(bez([cx, cy + 0.5], [cx + d * 0.2, cy - 3], [tx2, ty2 + 3], [tx2, ty2]), commaW(0.8))}" fill="${c.c}"/>` + dot(tx2, ty2, 1.5, c.e);
    }
    return s;
  }


  const M = {
    /* Peacock in profile (from a step-by-step peacock drawing). */
    peacockSide: { name: 'Peacock (profile)', draw(c, k) {
      // like a classic step-by-step peacock drawing: round head on a long upright neck that curves
      // into the body, a teardrop wing with eye spots, and a cascade of rounded tail feathers below
      let s = '';
      // tail: long rounded feathers hanging from under the wing, outer ones first so the middle overlaps
      const tips = [[22, 84], [80, 85], [31, 93], [70, 94], [50, 98], [41, 98], [60, 98]];
      const sep = c.o === 'none' ? ` stroke="${U.shade(c.d, -14)}" stroke-width=".7"` : O(c, 2);
      for (const [tx, ty] of tips) {
        const p = spine(52, 54, tx, ty, (tx - 52) * 0.1, 0), n = p.length - 1;
        s += `<path d="${tube(p, (t) => 8.6 * (0.3 + 0.7 * Math.pow(t, 0.7)))}" fill="${k.grad(c.d, 52, 54, tx, ty, 16, 10)}"${sep}/>`;
        const ex = p[n][0] - (p[n][0] - p[n - 5][0]) * 0.2, ey = p[n][1] - (p[n][1] - p[n - 5][1]) * 0.2;
        s += `<ellipse cx="${f1(ex)}" cy="${f1(ey)}" rx="3.8" ry="4.4" fill="${c.e}"/>` + dot(ex, ey + 0.5, 2.4, c.c) + dot(ex - 0.7, ey - 0.3, 0.7, WHITE);
      }
      let b = '';
      // head, neck and body in one shape
      b += `<path d="M34 8C39 8 42 11.5 42 16C42 20.5 40.5 23 41 28L42 46L80 78C66 78 48 77 40 74C32 71 28.5 66 28.5 58L28.5 30C28.5 26 27.5 23 27.5 21C26.5 18 26 15 27 12.5C28.2 9.8 31 8 34 8Z" fill="${k.grad(c.c, 34, 8, 40, 74, 4, 14)}"${O(c)}/>`;
      // teardrop wing with three eye spots
      b += `<path d="M40 50C40 40 52 38 60 46C68 54 76 66 84 80C70 78 56 76 46 70C40 66 40 58 40 50Z" fill="${k.grad(c.d, 46, 44, 80, 78, 10, 12)}"${O(c)}/>`;
      for (const [x, y] of [[50, 50], [56, 60], [47, 63]]) b += `<ellipse cx="${x}" cy="${y}" rx="2.8" ry="2.3" fill="${c.e}"/>` + dot(x, y, 1.4, c.c);
      // beak, eye and crest
      b += `<path d="M27.4 14.2L20.5 17.6L27.6 18.6Z" fill="${c.e}"/>`;
      b += dot(33, 14, 2, '#1b1b1b') + dot(33.6, 13.4, 0.7, WHITE);
      for (const [tx, ty] of [[29, 1.5], [34, 0.5], [39, 1.5]]) b += `<path d="M34 8.2L${tx} ${ty + 1.6}" stroke="${c.c}" stroke-width="0.9" stroke-linecap="round"/>` + dot(tx, ty, 1.5, c.d);
      s += `<g transform="translate(9 2) scale(.78)">${b}</g>`;
      return `<g transform="translate(5 3) scale(.9)">${s}</g>`;
    } },

    /* Peacock with its tail fanned — a flat, geometric style: twelve feathers radiate from the body,
       each widening to a round end with a yellow eye and a dark centre, split by thin white lines;
       a slim bird in profile in front with an eye patch, a crest, a scaled wing and legs. */
    peacockFan: { name: 'Peacock (fanned tail)', draw(c, k) {
      let s = '';
      const cx = 50, cy = 52, L = 40, Rr = 8, n = 12;
      const line = c.o === 'none' ? ` stroke="${WHITE}" stroke-width=".9" stroke-linejoin="round"` : O(c, 2);
      for (let i = 0; i < n; i++) {
        const a = (145 + (i * 250) / (n - 1)) * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a);
        const tx = cx + ux * L, ty = cy + uy * L;
        const p = bez([cx + ux * 4, cy + uy * 4], [cx + ux * 16, cy + uy * 16], [cx + ux * 28, cy + uy * 28], [tx, ty]);
        s += `<path d="${tube(p, (t) => Rr * (0.08 + 0.92 * Math.pow(t, 1.7)))}" fill="${k.grad(c.d, cx, cy, tx, ty, 18, 6)}"${line}/>`;
        const ex = cx + ux * (L - 1.5), ey = cy + uy * (L - 1.5), deg = (a * 180) / Math.PI;
        s += `<ellipse cx="${f1(ex)}" cy="${f1(ey)}" rx="5.2" ry="3.9" transform="rotate(${f1(deg)} ${f1(ex)} ${f1(ey)})" fill="${c.e}"/>` + dot(ex + ux * 0.8, ey + uy * 0.8, 2.3, c.c);
      }
      // the bird, facing right
      s += `<path d="M61 28.5C65 28.5 67.5 31 67.5 34.5C67.5 37 66 38.5 64.5 39.5C62.5 42 63 50 66 56C69 62 68 70 62 74C57 77 48 78 42 76C38 75 34 78 30 82C32 76 34 70 38 64C42 58 50 54 55 52C57 48 56.5 42 56.5 37C56 32 57.5 28.5 61 28.5Z" fill="${k.grad(c.c, 61, 28, 50, 78, 4, 14)}"${O(c)}/>`;
      // wing: scaled feathers clipped to a teardrop, with a yellow stripe under it
      const wid = 'mw' + Math.random().toString(36).slice(2, 8);
      const WING = 'M62 56C62 64 54 72 36 76C40 68 46 58 54 55C57 54 60 54 62 56Z';
      s += `<clipPath id="${wid}"><path d="${WING}"/></clipPath><path d="${WING}" fill="${c.d}"/>`;
      let sc = '';
      for (let r = 0; r < 4; r++) for (let j = 0; j < 6; j++) sc += dot(38 + j * 4.6 + (r % 2) * 2.3, 56 + r * 4.4, 2.6, U.shade(c.d, r % 2 ? 14 : 4));
      s += `<g clip-path="url(#${wid})">${sc}</g><path d="M63 60C59 68 50 73 37 77.5" stroke="${c.e}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
      for (const [x, y] of [[57, 70], [61, 67], [52, 73], [64, 63]]) s += dot(x, y, 0.6, U.shade(c.c, -25));
      // legs
      s += `<path d="M50 76.5L48.5 87M55 76L57 87" stroke="${U.shade(c.c, -40)}" stroke-width="1.4" stroke-linecap="round"/>`;
      // eye patch, beak, crest
      s += `<ellipse cx="63" cy="33.6" rx="3.2" ry="2.6" fill="${WHITE}"/>` + dot(63.4, 33.6, 1.5, c.e) + dot(63.6, 33.6, 0.8, '#1b1b1b');
      s += `<path d="M67.2 33.4Q70.5 34.5 71.8 37.6Q69.5 36.8 66.9 36.4Z" fill="${U.shade(c.c, -30)}"/>`;
      for (const [tx, ty] of [[55, 21.5], [57.8, 20], [60.8, 19.6], [63.4, 21]]) s += `<path d="M60.5 28.7L${tx} ${ty + 1.2}" stroke="${c.c}" stroke-width=".7" stroke-linecap="round"/>` + dot(tx, ty, 1.3, c.d);
      return s;
    } },

    /* Lotus, side view — from the Pongal kolam: a cup of curving petals with curled tips, over two
       sweeping leaves and a bud-shaped base. */
    lotusSide: { name: 'Lotus (side view)', draw(c, k) {
      let s = petal(k, c, c.d, 50, 74, 8, 72, 9, -7, -4, leafW) + petal(k, c, c.d, 50, 74, 92, 72, 9, 7, 4, leafW);
      s += petal(k, c, c.b, 50, 74, 50, 96, 10, 0, 0, leafW);
      for (const [tx, ty, bend, col] of [[14, 40, -8, c.b], [86, 40, 8, c.b], [28, 22, -6, c.a], [72, 22, 6, c.a]]) s += petal(k, c, col, 50, 74, tx, ty, 10, bend, bend * 0.5);
      s += petal(k, c, c.a, 50, 74, 50, 12, 12, 0, 0);
      return s;
    } },

    /* Lotus bud — "Contrast lotus kolam": a closed bud held by two outward-curling petals. */
    lotusBud: { name: 'Lotus bud', draw(c, k) {
      let s = `<path d="${tube(bez([50, 98], [46, 88], [54, 82], [50, 74]), (t) => 2.4 - t * 0.6)}" fill="${c.d}"/>`;
      s += petal(k, c, c.d, 50, 88, 22, 82, 5, 4, 0, leafW);
      s += petal(k, c, c.b, 50, 74, 18, 48, 9, -9, -6) + petal(k, c, c.b, 50, 74, 82, 48, 9, 9, 6);
      s += petal(k, c, c.a, 50, 76, 50, 18, 14, 0, 0);
      s += `<path d="${tube(bez([50, 70], [49, 56], [51, 44], [50, 32]), commaW(1))}" fill="${WHITE}" opacity=".7"/>`;
      return s;
    } },

    /* Round flower — the butterfly kolam's big flower, softened: petals that swirl slightly,
       a solid centre with a ring of dots, two leaves. */
    flower: { name: 'Round flower', draw(c, k) {
      let s = petal(k, c, c.d, 50, 50, 10, 90, 10, 8, 3, leafW) + petal(k, c, c.d, 50, 50, 92, 12, 10, 8, 3, leafW);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, tx = 50 + Math.cos(a) * 42, ty = 50 + Math.sin(a) * 42;
        s += petal(k, c, c.c, 50 + Math.cos(a) * 10, 50 + Math.sin(a) * 10, tx, ty, 12, 4, 2);
      }
      s += `<circle cx="50" cy="50" r="17" fill="${k.radial(c.a, 46, 46, 18)}"${O(c)}/>`;
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; s += dot(50 + Math.cos(a) * 11, 50 + Math.sin(a) * 11, 1.6, c.e); }
      return s + dot(50, 50, 3.2, c.e);
    } },

    /* Butterfly — from the butterfly kolam: rounded wings with dots, a striped body, and curled
       antennae (one of the places real kolams do curl). */
    butterfly: { name: 'Butterfly', draw(c, k) {
      let s = '';
      for (const sx of [-1, 1]) {
        const X = (x) => 50 + sx * (x - 50);
        s += `<path d="M50 44C${X(40)} 20 ${X(6)} 18 ${X(10)} 40C${X(12)} 56 ${X(34)} 58 50 52Z" fill="${k.grad(c.c, 50, 46, X(14), 30)}"${O(c)}/>`;
        s += `<path d="M50 56C${X(36)} 56 ${X(18)} 70 ${X(26)} 84C${X(34)} 92 ${X(46)} 80 50 64Z" fill="${k.grad(c.c, 50, 58, X(26), 86)}"${O(c)}/>`;
        for (const [x, y, r] of [[28, 34, 2.4], [22, 42, 1.8], [34, 44, 1.6], [36, 72, 2], [30, 78, 1.5]]) s += dot(X(x), y, r, c.e);
      }
      s += `<path d="${tube(bez([50, 38], [52, 54], [48, 70], [50, 86]), (t) => 4.4 * Math.sin(Math.PI * (0.15 + t * 0.85)) + 1)}" fill="${k.grad(c.a, 50, 38, 50, 86)}"${O(c)}/>`;
      for (const y of [48, 56, 64, 72]) s += `<path d="M46.4 ${y}q3.6 1.6 7.2 0" stroke="${c.b}" stroke-width="1.6" fill="none"/>`;
      s += dot(50, 33, 5, c.e);
      s += curlStroke(41, 18, 4, 0, -1, 1.5) + curlStroke(59, 18, 4, Math.PI, 1, 1.5);
      return s;
    } },

    /* Sun — Pongal kolam: a disc ringed by poured rays that swell and taper, long and short. */
    sun: { name: 'Sun', draw(c, k) {
      let s = '';
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, r1 = 23, r2 = i % 2 ? 36 : 46;
        s += `<path d="${tube(spine(50 + Math.cos(a) * r1, 50 + Math.sin(a) * r1, 50 + Math.cos(a) * r2, 50 + Math.sin(a) * r2, 2.5, 0), leafW(2.4))}" fill="${WHITE}"/>`;
      }
      s += `<circle cx="50" cy="50" r="19" fill="${k.radial(c.e, 46, 45, 20)}"${O(c)}/>`;
      return s + `<circle cx="50" cy="50" r="10" fill="${k.radial(c.a, 48, 47, 11)}"/>`;
    } },

    /* Diya, as poured on the floor: a curving bowl with a spout, a row of dots, a flame. */
    diya: { name: 'Diya (drawn)', draw(c, k) {
      let s = `<path d="M14 56C16 76 30 88 50 88C68 88 82 78 84 60C88 56 94 52 95 46C88 50 82 54 76 56Z" fill="${k.grad(c.b, 50, 88, 50, 56)}"${O(c)}/>`;
      s += `<path d="M18 58C34 64 66 64 80 58" stroke="${WHITE}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i < 6; i++) s += dot(28 + i * 9, 74 + Math.sin((i / 5) * Math.PI) * 4, 1.9, WHITE);
      s += petal(k, c, c.e, 50, 58, 50, 14, 10, 0, 0) + petal(k, c, c.a, 50, 56, 50, 30, 5, 0, 0);
      return s;
    } },

    /* Kalash with mango leaves — the pot of the Pongal kolam, crowned with leaves instead of rice. */
    kalash: { name: 'Kalash', draw(c, k) {
      let s = '';
      for (const [tx, ty, b] of [[14, 30, -6], [30, 14, -4], [50, 8, 0], [70, 14, 4], [86, 30, 6]]) s += petal(k, c, c.d, 50, 44, tx, ty, 6.5, b, b * 0.6, leafW);
      s += `<path d="M30 48C18 60 20 86 50 90C80 86 82 60 70 48Z" fill="${k.grad(c.c, 50, 90, 50, 48)}"${O(c)}/>`;
      s += `<path d="M34 42H66C68 42 70 44 70 46V50H30V46C30 44 32 42 34 42Z" fill="${k.grad(c.e, 50, 50, 50, 42)}"${O(c)}/>`;
      s += `<path d="M26 66C34 72 42 62 50 68C58 74 66 62 74 68" stroke="${WHITE}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      for (const x of [34, 42, 50, 58, 66]) s += dot(x, 78, 1.6, c.e);
      return s;
    } },

    /* Paisley — the alpana boteh: a fat teardrop whose tip curls back, nested bands, and a comb of
       short poured strokes along its back. */
    paisley: { name: 'Paisley (alpana)', draw(c, k) {
      const body = (q) => {
        const T = (x, y) => `${f1(46 + (x - 46) * q)} ${f1(58 + (y - 58) * q)}`;
        return `M${T(46, 92)}C${T(16, 90)} ${T(10, 58)} ${T(26, 38)}C${T(38, 22)} ${T(62, 16)} ${T(76, 26)}C${T(88, 36)} ${T(82, 52)} ${T(70, 52)}` +
          `C${T(62, 52)} ${T(60, 44)} ${T(66, 42)}C${T(64, 54)} ${T(78, 62)} ${T(76, 74)}C${T(74, 86)} ${T(60, 92)} ${T(46, 92)}Z`;
      };
      let s = `<path d="${body(1)}" fill="${k.grad(c.c, 40, 90, 70, 26)}"${O(c)}/>`;
      s += `<path d="${body(0.7)}" fill="${k.grad(c.e, 40, 84, 64, 36)}"/><path d="${body(0.42)}" fill="${k.grad(c.a, 42, 76, 56, 46)}"/>`;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.55 + i * 0.13), x1 = 44 + Math.cos(a) * 38, y1 = 58 + Math.sin(a) * 38;
        s += `<path d="${tube(spine(x1, y1, 44 + Math.cos(a) * 47, 58 + Math.sin(a) * 47, 0.8, 0), leafW(1.6))}" fill="${WHITE}"/>`;
      }
      return s;
    } },

    /* Swastika with four dots — the upright Hindu form; arms poured by hand, dots in each quarter. */
    swastika: { name: 'Swastika with dots', draw(c, k) {
      const arms = [[[50, 50], [50, 26], [68, 26]], [[50, 50], [74, 50], [74, 68]], [[50, 50], [50, 74], [32, 74]], [[50, 50], [26, 50], [26, 32]]];
      let s = '';
      for (const [p0, p1, p2] of arms) {
        const d = `M${p0.join(' ')}L${p1.join(' ')}L${p2.join(' ')}`;
        if (c.o !== 'none') s += `<path d="${d}" fill="none" stroke="${c.o}" stroke-width="13.5" stroke-linecap="round" stroke-linejoin="round"/>`;
        s += `<path d="${d}" fill="none" stroke="${k.grad(c.a, p0[0], p0[1], p2[0], p2[1], 10, 8)}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      for (const [x, y] of [[62, 38], [62, 62], [38, 62], [38, 38]]) s += `<circle cx="${x}" cy="${y}" r="4.6" fill="${k.radial(c.e, x - 1, y - 1, 5)}"${O(c, 1.6)}/>`;
      return s;
    } },

    /* Mango leaves — three curving leaves on one stalk, with a white midrib. */
    leaves: { name: 'Mango leaves', draw(c, k) {
      let s = '';
      for (const [tx, ty, b] of [[12, 34, -8], [50, 8, 0], [88, 34, 8]]) {
        s += petal(k, c, c.d, 50, 88, tx, ty, 10, b, b * 0.6, leafW);
        s += `<path d="${tube(spine(50, 86, 50 + (tx - 50) * 0.85, 88 + (ty - 88) * 0.85, b * 0.9, b * 0.5), commaW(1))}" fill="${WHITE}" opacity=".85"/>`;
      }
      return s;
    } },

    /* Hamsa (swan) — a favourite of alpana and Sanskar Bharati work: an S neck, a boat-shaped
       body and a wing of sweeping strokes. */
    swan: { name: 'Hamsa (swan)', draw(c, k) {
      // traced from a swan drawing (coordinates in the drawing's pixels, scaled into the 100 box):
      // a full chest rising into a neck that arcs over the top and hooks down, the head hanging in
      // front with the beak pointing down, and three layered wing feathers sweeping back
      const S = 8.1, sw = 2.4 * S * (c.ow || 1); // S: drawing pixels per motif unit
      const BODY = 'M80 488C62 470 40 420 33 370C25 300 40 240 80 215C130 185 250 185 300 230C335 265 330 330 300 400C270 470 228 520 228 578C300 515 470 490 580 545C610 560 605 590 590 605C650 615 700 635 725 662C715 690 650 725 570 738C625 755 630 790 590 815C540 850 420 862 300 862C190 860 110 820 60 740C25 680 30 600 60 545C100 480 160 452 196 400C222 360 222 318 202 298C182 282 146 290 131 320C119 350 123 400 118 440C110 465 95 480 80 488Z';
      const WINGS = [
        'M240 790C330 760 480 745 570 738C625 755 630 790 590 815C540 850 420 862 330 850C290 840 260 815 240 790Z',
        'M360 705C470 690 560 640 600 605C650 615 700 635 725 662C715 690 650 725 570 738C500 760 420 760 360 705Z',
        'M228 578C300 515 470 490 580 545C610 560 605 590 590 605C520 660 420 700 300 710C250 712 220 650 228 578Z',
      ];
      const white = '#f7f4ee', feather = '#e3e7ee', line = '#aeb6c4';
      let s = '';
      // one outline around the whole bird: stroke every part first, then fill on top
      if (c.o !== 'none') s += [BODY, ...WINGS].map((d) => `<path d="${d}" fill="none" stroke="${c.o}" stroke-width="${2 * sw}" stroke-linejoin="round"/>`).join('');
      s += `<path d="${BODY}" fill="${k.grad(white, 300, 860, 180, 200, 8, 3)}" stroke="${line}" stroke-width="${0.9 * S}" stroke-linejoin="round"/>`;
      WINGS.forEach((d, i) => { s += `<path d="${d}" fill="${k.grad(feather, 260, 760, 700, 640, 6 + i * 2, 4)}" stroke="${line}" stroke-width="${0.9 * S}" stroke-linejoin="round"/>`; });
      // black mask, orange beak, eye
      s += `<path d="M76 318C84 335 100 345 112 360L120 398C105 393 86 396 70 406C55 396 45 380 50 365C60 355 72 340 76 318Z" fill="#1d1a18"/>`;
      s += `<path d="M70 406C86 396 105 393 120 398C118 432 100 470 80 488C70 462 66 432 70 406Z" fill="${k.grad(c.e, 95, 400, 80, 488, 4, 8)}"/>`;
      s += `<circle cx="96" cy="356" r="${0.9 * S}" fill="${white}"/>`;
      return `<g transform="translate(7 9) scale(.123) translate(-30 -190)">${s}</g>`;
    } },

    /* Sanskar Bharati flower — eight poured comma strokes around a dot, the way the style is drawn
       with a pinch of powder: thick where the fingers start, trailing off. */
    sanskar: { name: 'Sanskar Bharati flower', draw(c, k) {
      let s = '';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, b = a + 0.5;
        const p = bez([50 + Math.cos(a) * 10, 50 + Math.sin(a) * 10], [50 + Math.cos(a) * 26, 50 + Math.sin(a) * 26],
          [50 + Math.cos(b) * 36, 50 + Math.sin(b) * 36], [50 + Math.cos(b + 0.3) * 42, 50 + Math.sin(b + 0.3) * 42]);
        s += `<path d="${tube(p, commaW(5.5))}" fill="${k.grad(i % 2 ? c.a : c.b, p[0][0], p[0][1], p[28][0], p[28][1], 8, 14)}"/>`;
        s += dot(50 + Math.cos(a + 0.4) * 22, 50 + Math.sin(a + 0.4) * 22, 1.6, c.e);
      }
      return s + `<circle cx="50" cy="50" r="7" fill="${k.radial(c.e, 48, 48, 8)}"/>`;
    } },

    /* Dot kolam (pulli) — white lines poured around a grid of dots, ending in small curls. */
    kolamLoops: { name: 'Dot kolam (pulli)', draw() {
      let s = '';
      const g = [30, 50, 70];
      for (const y of g) for (const x of g) s += dot(x, y, 2.6, WHITE);
      const w = commaW(1.3), line = (p) => `<path d="${tube(p, (t) => 1.25 + 0.3 * Math.sin(t * 9))}" fill="${WHITE}"/>`;
      for (const y of g) for (const x of g) {
        s += line(bez([x, y - 9], [x + 13, y - 10], [x + 10, y + 13], [x, y + 9])) + line(bez([x, y + 9], [x - 13, y + 10], [x - 10, y - 13], [x, y - 9]));
      }
      for (const [x, y] of [[40, 40], [60, 40], [40, 60], [60, 60]]) s += line(bez([x - 10, y - 10], [x - 3, y - 3], [x + 3, y + 3], [x + 10, y + 10])) + line(bez([x + 10, y - 10], [x + 3, y - 3], [x - 3, y + 3], [x - 10, y + 10]));
      for (const [x, y, a, d] of [[30, 16, Math.PI * 1.5, 1], [84, 30, 0, 1], [70, 84, Math.PI * 0.5, 1], [16, 70, Math.PI, 1]]) s += curlStroke(x, y, 4.5, a, d, 1.4);
      void w;
      return s;
    } },

    /* Pookalam — spiral arms of graded flower colours, each band a soft curving wedge. */
    pookalam: { name: 'Pookalam spiral', draw(c, k) {
      let s = '';
      const cols = [c.a, c.b, c.e, WHITE, c.d];
      for (let arm = 0; arm < 6; arm++) {
        for (let j = 0; j < cols.length; j++) {
          const r0 = 10 + j * 8, r1 = r0 + 8, a0 = (arm / 6) * Math.PI * 2 + j * 0.24, a1 = a0 + Math.PI / 3;
          const P = (r, a) => `${f1(50 + Math.cos(a) * r)} ${f1(50 + Math.sin(a) * r)}`;
          const col = arm % 2 ? cols[(j + 2) % 5] : cols[j];
          s += `<path d="M${P(r0, a0)}A${r0} ${r0} 0 0 1 ${P(r0, a1)}L${P(r1, a1 + 0.24)}A${r1} ${r1} 0 0 0 ${P(r1, a0 + 0.24)}Z" fill="${col === WHITE ? WHITE : k.grad(col, 50 + Math.cos(a0) * r0, 50 + Math.sin(a0) * r0, 50 + Math.cos(a1) * r1, 50 + Math.sin(a1) * r1, 8, 10)}"/>`;
        }
      }
      return s + `<circle cx="50" cy="50" r="10" fill="${k.radial(c.c, 48, 48, 11)}"/>`;
    } },

    /* Dot-grid steps — the 32-dot rangoli: blocky zigzags (this style *is* geometric). */
    stepped: { name: 'Dot-grid steps', draw(c, k) {
      let s = `<rect x="10" y="10" width="80" height="80" fill="${k.grad(c.d, 10, 90, 90, 10, 8, 8)}"/>`;
      const step = (col, off) => {
        let d = `M10 ${50 + off}`;
        for (let i = 0; i < 4; i++) d += `L${20 + i * 20} ${50 + off}L${20 + i * 20} ${40 + off}L${30 + i * 20} ${40 + off}L${30 + i * 20} ${50 + off}`;
        return `<path d="${d}L90 ${50 + off}L90 ${60 + off}L10 ${60 + off}Z" fill="${k.grad(col, 10, 60 + off, 90, 40 + off, 8, 8)}"/>`;
      };
      s += step(c.a, -24) + step(c.e, -4) + step(c.c, 16);
      // a filled diamond in the middle (closed shapes are always poured solid)
      return s + `<path d="M50 26L74 50L50 74L26 50Z" fill="${WHITE}"/>` +
        `<path d="M50 32L68 50L50 68L32 50Z" fill="${k.grad(c.b, 50, 68, 50, 32)}"/>` + dot(50, 50, 4, WHITE);
    } },
    /* Lakshmi footprints — a pair of small feet walking in, toes as dots, the soles decorated
       with white dots (alta / kumkum red), as drawn at doorways for Diwali. */
    footprints: { name: 'Lakshmi footprints', draw(c, k) {
      const foot = (tx, ty, flip) => {
        const g = (x, y) => `${f1(tx + x * 1.35 * flip)} ${f1(ty + y)}`;
        const d = `M${g(0, 30)}C${g(-7, 30)} ${g(-8.5, 22)} ${g(-7.5, 16)}C${g(-6.5, 8)} ${g(-3.5, 2)} ${g(-5.5, -6)}C${g(-7.5, -14)} ${g(-6, -22)} ${g(0, -24)}C${g(7, -25)} ${g(10.5, -18)} ${g(9.5, -10)}C${g(8.5, -2)} ${g(6, 6)} ${g(7, 16)}C${g(8, 24)} ${g(6, 30)} ${g(0, 30)}Z`;
        let s = `<path d="${d}" fill="${k.grad(c.a, tx, ty + 30, tx, ty - 24, 10, 10)}"${O(c, 2)}/>`;
        for (const [x, y, r] of [[-4.5, -30.5, 3.3], [0.8, -32, 2.5], [5, -31, 2.2], [8.3, -28.4, 1.9], [10.8, -24.8, 1.6]]) s += `<circle cx="${f1(tx + x * 1.35 * flip)}" cy="${f1(ty + y)}" r="${f1(r * 1.25)}" fill="${c.a}"${O(c, 1.4)}/>`;
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; s += dot(tx + Math.cos(a) * 3.6 * flip, ty - 12 + Math.sin(a) * 3.6, 0.9, WHITE); }
        return s + dot(tx, ty - 12, 1.3, c.e) + dot(tx + 0.5 * flip, ty + 20, 2, WHITE);
      };
      return foot(34, 60, -1) + foot(66, 50, 1);
    } },

    /* Hand (hasta) — an open palm with a flower in the middle and henna-dark fingertips. */
    hand: { name: 'Hand (hasta)', draw(c, k) {
      const fingers = [[[37, 62], [22, 47], 5.2, -4], [[42, 48], [39, 21], 4.6, 1], [[50, 46], [50, 16], 4.8, 0], [[58, 48], [61, 21], 4.6, -1], [[65, 52], [72, 31], 4, -2]];
      const PALM = 'M36 50C38 43 62 42 67 50C71 62 67 78 59 86L41 86C33 79 32 64 36 50Z', CUFF = 'M40 85L60 85L61 93L39 93Z';
      const parts = fingers.map(([b, t, w, bend]) => tube(spine(b[0], b[1], t[0], t[1], bend, 0), () => w));
      let s = '';
      if (c.o !== 'none') s += [...parts, PALM, CUFF].map((d) => `<path d="${d}" fill="none" stroke="${c.o}" stroke-width="${f1(4.8 * (c.ow || 1) * 10) / 10}" stroke-linejoin="round"/>`).join('');
      parts.forEach((d, i) => { const [b, t] = fingers[i]; s += `<path d="${d}" fill="${k.grad(c.a, b[0], b[1], t[0], t[1], 6, 10)}"/>`; });
      s += `<path d="${PALM}" fill="${k.grad(c.a, 50, 86, 50, 44, 10, 6)}"/><path d="${CUFF}" fill="${c.e}"/>`;
      fingers.forEach(([b, t, w]) => { s += dot(t[0], t[1], w * 0.95, U.shade(c.a, -28)); s += dot(b[0] + (t[0] - b[0]) * 0.55, b[1] + (t[1] - b[1]) * 0.55, 0.9, WHITE); });
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; s += petal(k, c, c.e, 50, 66, 50 + Math.cos(a) * 9, 66 + Math.sin(a) * 9, 2.6, 0, 0, leafW); }
      s += dot(50, 66, 3, c.b) + dot(50, 66, 1.2, WHITE);
      for (const x of [43, 47, 51, 55, 59]) s += dot(x, 89, 0.9, WHITE);
      return s;
    } },

    /* Om — poured as a few thick strokes: the two bowls of the 3, the sweeping tail, the crescent
       and the bindu above. */
    om: { name: 'Om', draw(c, k) {
      const sw = (w) => (t) => w * (0.6 + 0.4 * Math.sin(Math.PI * t));
      const strokes = [
        [bez([27, 30], [44, 18], [58, 34], [38, 47]), sw(4.6)],
        [bez([38, 47], [62, 46], [60, 82], [30, 76]), (t) => 5 * (1 - 0.55 * t * t)],
        [bez([47, 49], [66, 38], [82, 56], [71, 72]), (t) => 4.6 * (1 - 0.6 * t)],
        [spiral(66.5, 70, 5.5, 1.2, 0.8, 0.2, 1), (t) => 1.9 * (1 - 0.7 * t) + 0.3],
        [bez([55, 21], [61, 30], [75, 30], [81, 21]), (t) => 2.8 * Math.sin(Math.PI * t) + 0.4],
      ];
      let s = '';
      if (c.o !== 'none') s += strokes.map(([p, w]) => `<path d="${tube(p, w)}" fill="none" stroke="${c.o}" stroke-width="${f1(3.6 * (c.ow || 1) * 10) / 10}" stroke-linejoin="round"/>`).join('') + `<circle cx="68" cy="11" r="4.2" fill="${c.o}"/>`;
      s += strokes.map(([p, w]) => `<path d="${tube(p, w)}" fill="${k.grad(c.a, 30, 80, 70, 20, 10, 10)}"/>`).join('');
      return s + `<circle cx="68" cy="11" r="3.4" fill="${k.radial(c.e, 67, 10, 4)}"/>`;
    } },

    /* Conch (shankh) — an ivory spiral shell with banded spire and a pink lip. */
    conch: { name: 'Conch (shankh)', draw(c, k) {
      const BODY = 'M50 8C58 16 72 30 74 50C76 66 68 80 54 92C50 94 46 92 44 88C34 76 26 62 28 46C30 30 42 16 50 8Z';
      let s = `<path d="${BODY}" fill="${k.grad('#f3eadb', 50, 92, 50, 8, 10, 4)}"${O(c)}/>`;
      s += `<path d="M60 44C71 50 73 70 60 85C65 70 65 57 60 44Z" fill="${k.grad(c.b, 60, 44, 62, 85, 4, 14)}"/>`;
      for (const [x0, y0, cx, cy, x1, y1, w] of [[45, 17, 51, 22, 55, 14, 1.3], [38, 27, 51, 34, 63, 23, 1.6], [32, 39, 50, 48, 69, 35, 1.9], [30, 52, 42, 60, 56, 54, 1.5]]) {
        s += `<path d="${tube(bez([x0, y0], [x0 + (cx - x0) * 0.66, y0 + (cy - y0) * 0.66], [x1 + (cx - x1) * 0.66, y1 + (cy - y1) * 0.66], [x1, y1]), () => w)}" fill="${c.e}"/>`;
      }
      for (let i = 0; i < 5; i++) s += dot(40 + i * 3, 66 + i * 4.6, 1.2, c.a);
      return s;
    } },

    /* Fish (matsya) — a plump fish facing left with a forked tail, fins, scales and a big eye. */
    fish: { name: 'Fish (matsya)', draw(c, k) {
      const BODY = 'M10 50C22 33 52 29 70 44L88 31C85 42 85 58 88 69L70 56C52 71 22 67 10 50Z';
      let s = petal(k, c, c.a, 40, 38, 56, 24, 5, -3, -2, leafW) + petal(k, c, c.a, 46, 61, 56, 72, 3.2, 2, 1, leafW);
      s += `<path d="${BODY}" fill="${k.grad(c.c, 12, 50, 86, 50, 14, 8)}"${O(c)}/>`;
      for (let r = 0; r < 3; r++) for (let j = 0; j < 4; j++) {
        const x = 34 + j * 8 + (r % 2) * 4, y = 41 + r * 6.5;
        s += `<path d="M${x} ${y}q3 4 6 0" stroke="${c.e}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
      }
      s += `<path d="M27 39q-4 11 0 22" stroke="${c.e}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
      for (const y of [41, 50, 59]) s += `<path d="M73 50L85 ${y}" stroke="${c.e}" stroke-width="1.1" stroke-linecap="round"/>`;
      return s + dot(20, 46, 3.6, WHITE) + dot(19.4, 46, 2, '#1b1b1b') + dot(18.8, 45.3, 0.6, WHITE);
    } },
  };

  R.motifs = M;
  R.motifKit = kit;
  // geometry for other modules (vines and flourishes are poured the same way)
  R.motifGeo = { bez, tube, spine, spiral, leafW, petalW, commaW, f1 };
})();
