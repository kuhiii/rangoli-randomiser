/* The setting around the rangoli: the floor it's drawn on, the toran (jhalar) hung over the door,
 * and festive stickers you can place around it. All plain SVG strings.
 *
 * Floors repeat as one seamless tile (used as a CSS background on screen and as an SVG <pattern>
 * in the exported picture). Stickers are drawn in a 100 × 100 box with a white die-cut edge.
 */
(function () {
  const { U } = R;
  const n = (v) => Math.round(v * 100) / 100;

  /* ================================================================ floors */
  // Simple Athangudi: a plain cement square with a small white four-point star where four tiles
  // meet, the pattern of old Chettinad and coastal verandahs. Small, so it never fights the rangoli.
  function starTile(base, star, edge, grout, warm) {
    let s = `<rect width="100" height="100" fill="${base}"/>`;
    // hand-made cement: gentle cloudy shading and fine pits (one octave keeps it cheap)
    s += `<filter id="fA" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="1" seed="4" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 1  0 0 0 0 ${warm ? '.86' : '.97'}  0 0 0 0 ${warm ? '.5' : '1'}  1.5 0 0 0 -.7"/></filter>` +
      `<filter id="fB" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="9" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 .3  0 0 0 0 .3  0 0 0 0 .3  2.2 0 0 0 -1.4"/></filter>` +
      `<rect width="100" height="100" filter="url(#fA)" opacity=".35"/><rect width="100" height="100" filter="url(#fB)" opacity=".1"/>`;
    s += `<rect x=".4" y=".4" width="99.2" height="99.2" fill="none" stroke="${grout}" stroke-opacity=".45" stroke-width=".6"/>`;
    const st = `<path d="M0 -21C6 -13 6 -5 0 0C-6 -5 -6 -13 0 -21Z"/>`;
    for (const [x, y] of [[0, 0], [100, 0], [0, 100], [100, 100]]) {
      s += `<g transform="translate(${x} ${y})" fill="${star}" stroke="${edge}" stroke-width=".7" stroke-linejoin="round">`;
      for (const r of [0, 90, 180, 270]) s += `<g transform="rotate(${r})">${st}</g>`;
      for (const r of [45, 135, 225, 315]) s += `<path transform="rotate(${r})" d="M0 -11C3 -7 3 -3 0 0C-3 -3 -3 -7 0 -11Z"/>`;
      s += `<circle r="2.6" fill="${base}" stroke="none"/></g>`;
    }
    return { w: 100, h: 100, inner: s };
  }
  const athangudi = () => starTile('#f7e7a3', '#fffdf7', '#e2c46e', '#e6d08a', true);
  // Coastal blue, in the style of Jaipur blue pottery tiles: a framed powder-blue square with a
  // white eight-petal flower in the middle, a cobalt heart, and small cobalt leaves toward each corner.
  function coastal() {
    const base = '#a9cfe0', white = '#fbfdff', cobalt = '#2f5f9e';
    let s = `<rect width="100" height="100" fill="${base}"/>`;
    s += `<filter id="fC" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="1" seed="6" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.4 0 0 0 -.7"/></filter><rect width="100" height="100" filter="url(#fC)" opacity=".3"/>`;
    // calm version: one soft frame line, a small white flower, a single leaf toward each corner
    s += `<rect x="6" y="6" width="88" height="88" fill="none" stroke="#8dbad0" stroke-width="1"/>`;
    for (const [x, y, r] of [[20, 20, 135], [80, 20, 225], [80, 80, 315], [20, 80, 45]]) {
      s += `<path transform="translate(${x} ${y}) rotate(${r})" d="M0 0C2.4 -2.4 2.4 -6.5 0 -9C-2.4 -6.5 -2.4 -2.4 0 0Z" fill="${cobalt}" opacity=".55"/>`;
    }
    s += '<g transform="translate(50 50)">';
    for (let i = 0; i < 8; i++) s += `<path transform="rotate(${i * 45})" d="M0 -3C3.6 -6 3.6 -11 0 -15C-3.6 -11 -3.6 -6 0 -3Z" fill="${white}" opacity=".9"/>`;
    s += `<circle r="3.4" fill="${cobalt}" opacity=".7"/></g>`;
    s += `<rect x=".4" y=".4" width="99.2" height="99.2" fill="none" stroke="#93bfd2" stroke-opacity=".5" stroke-width=".6"/>`;
    return { w: 100, h: 100, inner: s };
  }
  // Red oxide: the polished deep-red floor of old South Indian homes, laid in large panels.
  function redoxide() {
    const s = `<rect width="200" height="200" fill="#8c2b1d"/>` +
      `<filter id="fR" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="2" seed="2" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 .3  0 0 0 0 .05  0 0 0 0 .02  1.5 0 0 0 -.55"/></filter>` +
      `<filter id="fL" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed="11" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 1  0 0 0 0 .6  0 0 0 0 .45  1.6 0 0 0 -.9"/></filter>` +
      `<filter id="fP" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="1" seed="5" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2 0 0 0 -1.3"/></filter>` +
      `<rect width="200" height="200" filter="url(#fR)" opacity=".7"/><rect width="200" height="200" filter="url(#fL)" opacity=".35"/>` +
      `<rect width="200" height="200" filter="url(#fP)" opacity=".25"/>` +
      `<rect x=".5" y=".5" width="199" height="199" fill="none" stroke="#3d0f08" stroke-opacity=".55" stroke-width="1"/>`;
    return { w: 200, h: 200, inner: s };
  }
  // Kota stone: blue-grey limestone slabs, staggered, with soft streaky veins.
  function kota() {
    const s = `<rect width="240" height="240" fill="#7a8682"/>` +
      `<rect y="120" width="120" height="120" fill="#6f7c78"/><rect x="120" y="120" width="120" height="120" fill="#83918c"/>` +
      `<filter id="fK" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".006 .03" numOctaves="2" seed="8" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 .2  0 0 0 0 .26  0 0 0 0 .25  1.6 0 0 0 -.6"/></filter>` +
      `<filter id="fK2" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="1" seed="3" stitchTiles="stitch"/>` +
      `<feColorMatrix values="0 0 0 0 .9  0 0 0 0 .95  0 0 0 0 .92  2 0 0 0 -1.25"/></filter>` +
      `<rect width="240" height="240" filter="url(#fK)" opacity=".6"/><rect width="240" height="240" filter="url(#fK2)" opacity=".3"/>` +
      `<path d="M0 .6H240M0 120H240M120 120V240M.6 0V120" stroke="#3e4745" stroke-opacity=".6" stroke-width="1.3"/>`;
    return { w: 240, h: 240, inner: s };
  }
  const FLOORS = {
    athangudi: { name: 'Athangudi', noWash: true, tile: athangudi, scale: 0.62 },
    coastal: { name: 'Coastal', noWash: true, tile: coastal, scale: 0.8 },
    redoxide: { name: 'Red oxide', tile: redoxide, scale: 1 },
    kota: { name: 'Kota stone', tile: kota, scale: 1 },
  };
  const tileCache = {};
  // tile → { w, h (css px), url (data URL), inner }
  function floorTile(key) {
    const F = FLOORS[key];
    if (!F || !F.tile) return null;
    if (tileCache[key]) return tileCache[key];
    const t = F.tile();
    const w = t.w * F.scale, h = t.h * F.scale;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${t.w} ${t.h}">${t.inner}</svg>`;
    return (tileCache[key] = { w, h, vw: t.w, vh: t.h, inner: t.inner, url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) });
  }

  /* ============================================== toran (door jhalar) */
  // A marigold seen from above: layers of frilly, scalloped petals getting deeper toward a ruffled
  // centre, with fine radial lines for the petal folds. Not a smooth ball.
  function scallop(r, lobes, rot, depth) {
    let d = '';
    for (let i = 0; i <= lobes; i++) {
      const a0 = rot + (i / lobes) * Math.PI * 2, a1 = rot + ((i + 0.5) / lobes) * Math.PI * 2;
      const ix = Math.cos(a0) * r * depth, iy = Math.sin(a0) * r * depth;
      if (i === 0) { d += `M${n(ix)} ${n(iy)}`; continue; }
      d += `Q${n(Math.cos(a1 - Math.PI / lobes) * r * 1.12)} ${n(Math.sin(a1 - Math.PI / lobes) * r * 1.12)} ${n(ix)} ${n(iy)}`;
    }
    return d + 'Z';
  }
  function mari(x, y, r, c) {
    const rot = ((x * 7.3 + y * 3.1) % 6.28);
    const c2 = U.shade(c, -7), c3 = U.shade(c, -15), line = U.shade(c, -24);
    let s = `<g transform="translate(${n(x)} ${n(y)})">`;
    s += `<path d="${scallop(r, r > 8 ? 18 : 12, rot, 0.8)}" fill="${c}"/>`;
    s += `<path d="${scallop(r * 0.7, r > 8 ? 14 : 10, rot + 0.2, 0.78)}" fill="${c2}"/>`;
    s += `<path d="${scallop(r * 0.42, 9, rot + 0.5, 0.75)}" fill="${c3}"/>`;
    if (r > 7) {
      let ln = '';
      for (let i = 0; i < 16; i++) {
        const a = rot + (i / 16) * Math.PI * 2;
        ln += `M${n(Math.cos(a) * r * 0.48)} ${n(Math.sin(a) * r * 0.48)}L${n(Math.cos(a) * r * 0.86)} ${n(Math.sin(a) * r * 0.86)}`;
      }
      s += `<path d="${ln}" stroke="${line}" stroke-width="${n(r * 0.05)}" opacity=".45"/>`;
    }
    s += `<circle r="${n(r * 0.16)}" fill="${line}" opacity=".7"/><circle cx="${n(-r * 0.3)}" cy="${n(-r * 0.32)}" r="${n(r * 0.18)}" fill="#fff" opacity=".18"/></g>`;
    return s;
  }
  const MARI = ['#f28a14', '#f7b511', '#f28a14', '#ef6a12', '#f7b511'];
  // a hanging neem sprig: a thin stem with paired, curved, pointed leaflets and one at the tip
  function neem(x, y, L, rot, rnd) {
    const bend = (rnd() - 0.5) * 8;
    let s = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})">`;
    s += `<path d="M0 0Q${n(bend)} ${n(L / 2)} 0 ${n(L)}" stroke="#55732a" stroke-width="1.1" fill="none"/>`;
    const pairs = Math.max(4, Math.round(L / 8.5));
    const greens = ['#3c7a22', '#4a8c2c', '#5a9d36', '#447f27'];
    for (let i = 0; i < pairs; i++) {
      const t = (i + 0.7) / (pairs + 0.5), py = L * t, px = bend * 2 * t * (1 - t);
      const ll = 9 + 7 * Math.sin(Math.PI * Math.min(1, t * 1.15)), w = ll * 0.28;
      for (const side of [1, -1]) {
        const a = side === 1 ? 38 + rnd() * 14 : 142 - rnd() * 14;
        const col = greens[Math.floor(rnd() * greens.length)];
        s += `<g transform="translate(${n(px)} ${n(py)}) rotate(${n(a)})${side === -1 ? ' scale(1 -1)' : ''}">` +
          `<path d="M0 0C${n(ll * 0.3)} ${n(-w)} ${n(ll * 0.72)} ${n(-w * 0.85)} ${n(ll)} ${n(w * 0.3)}C${n(ll * 0.68)} ${n(w * 0.5)} ${n(ll * 0.3)} ${n(w * 0.55)} 0 0Z" fill="${col}"/>` +
          `<path d="M1 0Q${n(ll * 0.5)} ${n(-w * 0.2)} ${n(ll * 0.94)} ${n(w * 0.22)}" stroke="#9cc46a" stroke-width=".45" fill="none" opacity=".8"/></g>`;
      }
    }
    s += `<g transform="translate(0 ${n(L)}) rotate(90)"><path d="M0 0C4 -3.4 9 -3 13 0C9 2.6 4 2.6 0 0Z" fill="#4a8c2c"/></g>`;
    return s + '</g>';
  }
  // a string of marigolds ending in a little green bud and tassel
  function strand(x, y, count, r, rnd, shift = 0) {
    let s = `<path d="M${n(x)} ${n(y)}V${n(y + count * r * 1.75 + 4)}" stroke="#a37a3a" stroke-width="1"/>`;
    for (let i = 0; i < count; i++) s += mari(x + (rnd() - 0.5) * 1.2, y + r + i * r * 1.75, r * (0.92 + rnd() * 0.12), MARI[(i + shift) % MARI.length]);
    const ty = y + count * r * 1.75 + 2;
    s += `<path d="M${n(x)} ${n(ty)}l-3 9h6z" fill="#c2271f"/><circle cx="${n(x)}" cy="${n(ty)}" r="2.6" fill="#3f8a2a"/>`;
    return s;
  }
  // The toran across the top: a rope of marigolds with neem sprigs and marigold strings hanging
  // below, and longer strands falling at both ends like the sides of a door frame.
  function toran(W, compact) {
    const rnd = U.seeded(17), H = compact ? 190 : 240;
    const r = compact ? 5.2 : 6.4, ropeY = r + 2;
    let back = '', front = '';
    const step = compact ? 26 : 32;
    let k = 0;
    for (let x = step * 0.7; x < W - step * 0.4; x += step, k++) {
      if (k % 3 === 1) back += strand(x, ropeY + r * 0.6, compact ? 5 : 6, r * 0.82, rnd, k);
      else back += neem(x + (rnd() - 0.5) * 6, ropeY + 2, (compact ? 52 : 66) + rnd() * 12, (rnd() - 0.5) * 12, rnd);
    }
    // long strands at the ends
    const ends = compact ? [[10, 13], [22, 17], [34, 10]] : [[12, 16], [26, 21], [40, 13]];
    for (const [dx, cnt] of ends) {
      back += strand(dx, ropeY, Math.round(cnt * (compact ? 0.75 : 1)), r * 0.95, rnd, dx);
      back += strand(W - dx, ropeY, Math.round(cnt * (compact ? 0.75 : 1)), r * 0.95, rnd, dx + 1);
    }
    front += `<path d="M0 ${n(ropeY)}H${W}" stroke="#8a5a26" stroke-width="2.4"/>`;
    for (let x = r * 0.6, i = 0; x < W + r; x += r * 1.55, i++) front += mari(x, ropeY + Math.sin(i * 1.7) * 0.8, r, MARI[i % MARI.length]);
    return { H, inner: back + front };
  }

  /* ============================================================== stickers */
  const lg = (id, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const rg = (id, a, b, cx = 0.38, cy = 0.32, r = 0.75) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient>`;
  const glowG = (id, c) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity=".75"/><stop offset=".45" stop-color="${c}" stop-opacity=".28"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const flameDefs = (p) => lg(p + 'fl', '#ffe066', '#f26b0f') + glowG(p + 'gl', '#ffc845');
  const flame = (p, x, y, s = 1, glow = true) =>
    `<g transform="translate(${n(x)} ${n(y)}) scale(${s})">${glow ? `<circle cy="-11" r="17" fill="url(#${p}gl)"/>` : ''}` +
    `<path d="M0 0C-6.5 -4 -6 -13 0 -24C6 -13 6.5 -4 0 0Z" fill="url(#${p}fl)"/><path d="M0 -2C-2.8 -4 -2.6 -9 0 -14C2.6 -9 2.8 -4 0 -2Z" fill="#fff6c9"/>` +
    `<path d="M0 0v3" stroke="#3a2a1a" stroke-width="1.4"/></g>`;
  // sprinkle of small dots in a circle (laddoo boondi, powder grain)
  const speckle = (rnd, cx, cy, r, count, col, size, op = 0.75) => {
    let s = '';
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r;
      s += `<circle cx="${n(cx + Math.cos(a) * d)}" cy="${n(cy + Math.sin(a) * d)}" r="${n(size * (0.7 + rnd() * 0.6))}" fill="${col}" opacity="${op}"/>`;
    }
    return s;
  };
  const sparks = (rnd, cx, cy, count, r0, r1, a0, a1, cols) => {
    let s = '';
    for (let i = 0; i < count; i++) {
      const a = a0 + rnd() * (a1 - a0), l = r0 + rnd() * (r1 - r0), c = cols[Math.floor(rnd() * cols.length)];
      const x1 = cx + Math.cos(a) * r0 * 0.4, y1 = cy + Math.sin(a) * r0 * 0.4, x2 = cx + Math.cos(a) * l, y2 = cy + Math.sin(a) * l;
      s += `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" stroke="${c}" stroke-width="${n(0.8 + rnd() * 1.3)}" stroke-linecap="round"/>`;
      if (rnd() < 0.45) s += `<circle cx="${n(x2)}" cy="${n(y2)}" r="${n(1 + rnd() * 1.2)}" fill="${c}"/>`;
    }
    return s;
  };
  const spiralD = (cx, cy, R, turns, a0 = 0) => {
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const t = i / 80, a = a0 + t * turns * Math.PI * 2, r = 2 + (R - 2) * t;
      pts.push(`${n(cx + Math.cos(a) * r)} ${n(cy + Math.sin(a) * r)}`);
    }
    return 'M' + pts.join('L');
  };
  const blossom = (x, y, r, c) => mari(x, y, r, c);

  const ST = {
    /* ---------------------------------------------------------------- sweets */
    laddoo: { name: 'Laddoos', cat: 'Sweets', art(p) {
      const rnd = U.seeded(3);
      let s = `<defs>${rg(p + 'b', '#ffc65a', '#dd7410')}${lg(p + 'pl', '#f2cd62', '#b07a1c')}</defs>`;
      s += `<ellipse cx="50" cy="80" rx="43" ry="13" fill="url(#${p}pl)"/><ellipse cx="50" cy="78" rx="35" ry="9" fill="#e9bd4e"/>`;
      for (const [x, y] of [[29, 68], [50, 70], [71, 68], [39, 51], [61, 51], [50, 34]]) {
        s += `<circle cx="${x}" cy="${y}" r="12.5" fill="url(#${p}b)" stroke="#c4650b" stroke-width=".8"/>`;
        s += speckle(rnd, x, y, 10, 11, '#c9620a', 1.2) + speckle(rnd, x - 2, y - 2, 8, 4, '#ffe3a1', 1);
      }
      s += `<path d="M47 24l5 -3 2 3z" fill="#7bb342"/>`;
      return s;
    } },
    jalebi: { name: 'Jalebi', cat: 'Sweets', art(p) {
      let s = `<path d="M6 70C26 38 72 36 95 60C74 86 30 92 6 70Z" fill="#3e8a37"/><path d="M8 69C38 62 66 60 93 60" stroke="#7cc06a" stroke-width="1.4" fill="none"/>`;
      for (let i = 0; i < 6; i++) s += `<path d="M${22 + i * 12} 66l${4 + i} -14" stroke="#5aa64a" stroke-width=".8"/>`;
      for (const [x, y, R, a] of [[34, 60, 17, 0.4], [64, 58, 18, 2], [49, 44, 16, 4]]) {
        const d = spiralD(x, y, R, 2.6, a);
        s += `<path d="${d}" stroke="#b95707" stroke-width="7.5" fill="none" stroke-linecap="round"/>` +
          `<path d="${d}" stroke="#f39114" stroke-width="5.2" fill="none" stroke-linecap="round"/>` +
          `<path d="${d}" stroke="#ffd48c" stroke-width="1.4" fill="none" stroke-dasharray="5 7" stroke-linecap="round"/>`;
      }
      return s;
    } },
    kaju: { name: 'Kaju katli', cat: 'Sweets', art(p) {
      const rnd = U.seeded(5);
      let s = `<defs>${rg(p + 'pl', '#ffffff', '#b9c0c8', 0.4, 0.35, 0.8)}</defs><circle cx="50" cy="52" r="42" fill="url(#${p}pl)"/><circle cx="50" cy="52" r="36" fill="none" stroke="#a9b1ba" stroke-width="1"/>`;
      for (const [x, y, r] of [[32, 40, -8], [56, 34, 6], [74, 52, -4], [44, 60, 10], [64, 72, -12], [26, 64, 4]]) {
        s += `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 -15L11.5 0L0 15L-11.5 0Z" fill="#e6d2a8"/><path d="M0 -13L10 0L0 13L-10 0Z" fill="#f4e6c8"/>` +
          `<path d="M0 -11L8 0L0 11L-8 0Z" fill="#e9edf1" opacity=".8"/>${speckle(rnd, 0, 0, 6, 5, '#ffffff', 0.9, 0.9)}</g>`;
      }
      return s;
    } },
    jamun: { name: 'Gulab jamun', cat: 'Sweets', art(p) {
      let s = `<defs>${rg(p + 'j', '#a24a1c', '#4a1606', 0.35, 0.3, 0.7)}${lg(p + 'sy', '#e59a2a', '#a8540d')}${lg(p + 'bw', '#ffffff', '#cfd6df')}</defs>`;
      s += `<ellipse cx="50" cy="52" rx="38" ry="10" fill="#1f4d8f"/><ellipse cx="50" cy="52" rx="34" ry="8" fill="url(#${p}sy)"/>`;
      for (const [x, y] of [[36, 48], [62, 47], [49, 42]]) s += `<circle cx="${x}" cy="${y}" r="12" fill="url(#${p}j)"/><ellipse cx="${x - 4}" cy="${y - 5}" rx="3.5" ry="2" fill="#fff" opacity=".55"/>`;
      s += `<path d="M12 52C14 82 32 92 50 92S86 82 88 52C80 60 66 62 50 62S20 60 12 52Z" fill="url(#${p}bw)"/>`;
      s += `<path d="M16 64C30 74 70 74 84 64" stroke="#2a5ba3" stroke-width="2.4" fill="none"/>`;
      for (let i = 0; i < 7; i++) s += `<circle cx="${22 + i * 9.4}" cy="${77 + Math.sin(i / 6 * Math.PI) * 4}" r="1.6" fill="#2a5ba3"/>`;
      return s;
    } },
    barfi: { name: 'Barfi', cat: 'Sweets', art(p) {
      const rnd = U.seeded(8);
      let s = `<defs>${rg(p + 'th', '#f6d27a', '#b98221', 0.45, 0.4, 0.75)}</defs><circle cx="50" cy="52" r="43" fill="url(#${p}th)"/><circle cx="50" cy="52" r="37" fill="none" stroke="#9c6d18" stroke-width="1"/>`;
      const cols = [['#f6a9bd', '#d77b95'], ['#a9d47f', '#7cab55'], ['#f8f1e2', '#d6c8ad']];
      let i = 0;
      for (const [x, y] of [[32, 38], [52, 34], [72, 40], [30, 60], [50, 58], [70, 64]]) {
        const [c, e] = cols[i++ % 3], r = (rnd() - 0.5) * 18;
        s += `<g transform="translate(${x} ${y}) rotate(${n(r)})"><rect x="-10" y="-8" width="20" height="19" fill="${e}"/><rect x="-10" y="-10" width="20" height="18" fill="${c}"/>`;
        s += `<path d="M-4 -4l3 1M3 -1l2 3M-2 3l3 -1" stroke="#5f9e3c" stroke-width="1.6" stroke-linecap="round"/></g>`;
      }
      return s;
    } },

    /* --------------------------------------------------- candles & lights */
    diya: { name: 'Painted diya', cat: 'Lights', art(p) {
      let s = `<defs>${flameDefs(p)}${lg(p + 'b', '#d8672d', '#8a3210')}</defs>`;
      s += `<circle cx="78" cy="34" r="30" fill="url(#${p}gl)"/>`;
      s += `<path d="M14 56C16 80 32 88 50 88S84 80 86 56Z" fill="url(#${p}b)"/>`;
      s += `<path d="M78 58C88 54 94 46 94 40C88 48 82 50 74 52Z" fill="#b8481b"/>`;
      s += `<ellipse cx="50" cy="56" rx="36" ry="8" fill="#a6421a"/><ellipse cx="50" cy="56" rx="30" ry="5" fill="#f0b02f"/>`;
      s += `<path d="M20 68l6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6" stroke="#ffd36b" stroke-width="2" fill="none" stroke-linejoin="round"/>`;
      for (let i = 0; i < 6; i++) s += `<circle cx="${25 + i * 10}" cy="81" r="1.8" fill="#fff4d6"/>`;
      return s + flame(p, 92, 41, 0.85, false);
    } },
    lotuscandle: { name: 'Lotus candle', cat: 'Lights', art(p) {
      // A lotus tealight holder seen from slightly above. Lotus petals are broad and spoon-shaped
      // with a sharp tip, pale at the base and blushing pink toward the tip, with fine veins.
      // Two rings laid out on an oval (perspective), drawn back to front around a tealight.
      const cx = 50, cy = 62;
      let s = `<defs>${flameDefs(p)}` +
        `<radialGradient id="${p}po" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="44"><stop offset="0" stop-color="#fff6f9"/><stop offset=".45" stop-color="#fbd3e2"/><stop offset=".8" stop-color="#f28db3"/><stop offset="1" stop-color="#e05b90"/></radialGradient>` +
        `<radialGradient id="${p}pi" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy - 6}" r="32"><stop offset="0" stop-color="#fff8fa"/><stop offset=".5" stop-color="#fcd9e6"/><stop offset="1" stop-color="#ee7fa9"/></radialGradient>` +
        `${lg(p + 'tl', '#f4f6f8', '#aeb6bf')}</defs>`;
      // broad spoon-shaped petal from base B to tip T
      const petal = (bx, by, tx, ty, w, fill) => {
        const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
        const at = (t, k) => [bx + dx * t + nx * w * k, by + dy * t + ny * w * k];
        const [a1, a2, a3, a4] = [at(0.05, 0.55), at(0.62, 1.05), at(0.62, -1.05), at(0.05, -0.55)];
        const [s1, s2] = [at(0.88, 0.62), at(0.88, -0.62)];
        let d = `M${n(bx)} ${n(by)}C${n(a1[0])} ${n(a1[1])} ${n(a2[0])} ${n(a2[1])} ${n(s1[0])} ${n(s1[1])}`;
        d += `Q${n(bx + dx * 0.97 + nx * w * 0.2)} ${n(by + dy * 0.97 + ny * w * 0.2)} ${n(tx)} ${n(ty)}`;
        d += `Q${n(bx + dx * 0.97 - nx * w * 0.2)} ${n(by + dy * 0.97 - ny * w * 0.2)} ${n(s2[0])} ${n(s2[1])}`;
        d += `C${n(a3[0])} ${n(a3[1])} ${n(a4[0])} ${n(a4[1])} ${n(bx)} ${n(by)}Z`;
        let v = '';
        for (const k of [-0.45, 0, 0.45]) { const m = at(0.55, k * 0.9), e = at(0.86, k * 0.45); v += `M${n(bx + dx * 0.12)} ${n(by + dy * 0.12)}Q${n(m[0])} ${n(m[1])} ${n(e[0])} ${n(e[1])}`; }
        return `<path d="${d}" fill="url(#${p}${fill})" stroke="#d65287" stroke-opacity=".7" stroke-width=".6"/><path d="${v}" stroke="#e58aae" stroke-width=".45" fill="none" opacity=".8"/>`;
      };
      // petals behind the candle stand up; the ones in front open toward you
      // petals grow from a ring around the candle (base radius r0), not from its middle
      const ring = (count, r0, R, lift, w, off, fill) => Array.from({ length: count }, (_, i) => {
        const a = off + (i / count) * Math.PI * 2, z = Math.sin(a);
        const tx = cx + Math.cos(a) * R, ty = cy + z * R * 0.48 - lift * (0.3 + 0.7 * (1 - z) / 2);
        return { z, d: petal(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 0.48, tx, ty, w, fill) };
      });
      const outer = ring(8, 13, 44, 14, 11, Math.PI / 8, 'po'), inner = ring(6, 9, 28, 30, 9, 0, 'pi');
      const draw = (list, front) => list.filter((q) => (front ? q.z >= 0 : q.z < 0)).sort((a, b) => a.z - b.z).map((q) => q.d).join('');
      s += draw(outer, false) + draw(inner, false);
      s += `<path d="M40 56v5c0 2.2 4.5 3.8 10 3.8s10-1.6 10-3.8v-5z" fill="url(#${p}tl)"/><ellipse cx="50" cy="56" rx="10" ry="3.4" fill="#d5dbe1"/>` +
        `<ellipse cx="50" cy="56" rx="8.4" ry="2.6" fill="#fff6e2"/>` + flame(p, 50, 55, 0.72);
      // inner petals facing you would be seen edge-on and hide the candle: only the side ones show
      s += inner.filter((q) => q.z >= 0 && q.z < 0.4).sort((a, b) => a.z - b.z).map((q) => q.d).join('') + draw(outer, true);
      return s;
    } },
    twist: { name: 'Twisty candle', cat: 'Lights', art(p) {
      let s = `<defs>${flameDefs(p)}${lg(p + 'br', '#f5cf63', '#a87a1c')}<clipPath id="${p}c"><rect x="40" y="24" width="20" height="60" rx="3"/></clipPath></defs>`;
      s += `<circle cx="50" cy="16" r="20" fill="url(#${p}gl)"/>`;
      s += `<rect x="40" y="24" width="20" height="60" rx="3" fill="#f8c6da"/><g clip-path="url(#${p}c)">`;
      for (let y = 18; y < 92; y += 13) s += `<path d="M38 ${y}L62 ${y - 9}V${y - 3}L38 ${y + 6}Z" fill="#35b3a6"/>`;
      s += `<rect x="40" y="24" width="5" height="60" fill="#fff" opacity=".25"/></g>`;
      s += `<path d="M42 24c0 6 3 7 3 3s2 -3 2 2 2 1 2 -4c3 0 6 0 9 -1z" fill="#fde6ef"/>`;
      s += `<ellipse cx="50" cy="86" rx="22" ry="5" fill="url(#${p}br)"/><path d="M36 86h28l-4 7H40z" fill="#c49530"/><ellipse cx="50" cy="93" rx="16" ry="3" fill="#a87a1c"/>`;
      return s + flame(p, 50, 23, 0.7, false);
    } },
    jar: { name: 'Jar candle', cat: 'Lights', art(p) {
      let s = `<defs>${flameDefs(p)}${rg(p + 'in', '#ffe7a3', '#f6b54a', 0.5, 0.4, 0.7)}</defs>`;
      s += `<rect x="24" y="28" width="52" height="62" rx="9" fill="url(#${p}in)" opacity=".55"/>`;
      s += `<rect x="29" y="56" width="42" height="30" rx="6" fill="#f7e6c4"/><ellipse cx="50" cy="56" rx="21" ry="4" fill="#fff4dd"/>`;
      s += flame(p, 50, 55, 0.75);
      s += `<rect x="24" y="28" width="52" height="62" rx="9" fill="#d8eef7" fill-opacity=".25" stroke="#8fb2c4" stroke-width="1.6"/>`;
      s += `<rect x="29" y="33" width="5" height="50" rx="2.5" fill="#fff" opacity=".5"/>`;
      s += `<rect x="22" y="32" width="56" height="6" fill="#c8464b"/><path d="M70 38l6 12 -9 -3z" fill="#e0b94e"/><circle cx="70" cy="37" r="2.4" fill="#e0b94e"/>`;
      return s;
    } },
    kandil: { name: 'Akash kandil', cat: 'Lights', art(p) {
      let s = `<defs>${rg(p + 'st', '#ffd35c', '#e8541c', 0.5, 0.45, 0.6)}${glowG(p + 'gl', '#ffb648')}</defs>`;
      s += `<path d="M50 2V16" stroke="#6b4a2a" stroke-width="1.2"/><circle cx="50" cy="44" r="40" fill="url(#${p}gl)"/>`;
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 13 : 31; pts.push(`${n(50 + Math.cos(a) * r)} ${n(44 + Math.sin(a) * r)}`); }
      const strips = ['#d8262c', '#f6b511', '#c2185b', '#f6b511', '#d8262c'];
      strips.forEach((c, i) => { const x = 36 + i * 7; s += `<path d="M${x} 58C${x - 3} 70 ${x + 3} 80 ${x} 94" stroke="${c}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`; });
      s += `<path d="M${pts.join('L')}Z" fill="url(#${p}st)" stroke="#a8360d" stroke-width="1.6" stroke-linejoin="round"/>`;
      for (let i = 0; i < 10; i += 2) s += `<path d="M50 44L${pts[i]}" stroke="#c74512" stroke-width=".9" opacity=".6"/>`;
      s += `<circle cx="50" cy="44" r="6" fill="#fff3c4"/>`;
      return s;
    } },
    tealights: { name: 'Tealights', cat: 'Lights', art(p) {
      let s = `<defs>${flameDefs(p)}${lg(p + 'm', '#f1f3f5', '#9aa3ad')}</defs>`;
      for (const [x, y] of [[30, 76], [70, 78], [50, 58]].sort((a, b) => a[1] - b[1])) {
        s += `<path d="M${x - 15} ${y}v8c0 3 7 5 15 5s15 -2 15 -5v-8z" fill="url(#${p}m)"/><ellipse cx="${x}" cy="${y}" rx="15" ry="5" fill="#c9cfd6"/>`;
        s += `<ellipse cx="${x}" cy="${y}" rx="12.5" ry="3.8" fill="#fbf3e2"/>` + flame(p, x, y - 1, 0.62);
      }
      return s;
    } },

    /* ---------------------------------------------------------- crackers */
    anar: { name: 'Anar', cat: 'Crackers', art(p) {
      const rnd = U.seeded(21);
      let s = `<defs>${glowG(p + 'gl', '#ffd166')}${lg(p + 'pot', '#e04a2c', '#9e1f12', 1, 0)}</defs>`;
      s += `<ellipse cx="50" cy="40" rx="36" ry="32" fill="url(#${p}gl)"/>`;
      s += sparks(rnd, 50, 56, 46, 12, 46, -Math.PI * 0.85, -Math.PI * 0.15, ['#fff7c2', '#ffd23f', '#ff9a2e', '#ffffff']);
      s += `<path d="M30 90C30 70 40 60 50 56C60 60 70 70 70 90Z" fill="url(#${p}pot)"/>`;
      s += `<path d="M33 76H67M31 84H69" stroke="#f2c14e" stroke-width="2.4"/><ellipse cx="50" cy="90" rx="20" ry="3.6" fill="#7d180d"/>`;
      return s;
    } },
    chakri: { name: 'Chakri', cat: 'Crackers', art(p) {
      const rnd = U.seeded(4);
      let s = `<defs>${glowG(p + 'gl', '#ffd166')}</defs><circle cx="50" cy="50" r="46" fill="url(#${p}gl)"/>`;
      for (let i = 0; i < 56; i++) {
        const a = (i / 56) * Math.PI * 2 + rnd() * 0.1, r0 = 27, l = 8 + rnd() * 13, c = ['#fff7c2', '#ffd23f', '#ff9a2e'][i % 3];
        const x1 = 50 + Math.cos(a) * r0, y1 = 50 + Math.sin(a) * r0, x2 = 50 + Math.cos(a + 0.35) * (r0 + l), y2 = 50 + Math.sin(a + 0.35) * (r0 + l);
        s += `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" stroke="${c}" stroke-width="${n(1 + rnd())}" stroke-linecap="round"/>`;
      }
      const d = spiralD(50, 50, 24, 3.2);
      s += `<path d="${d}" stroke="#2c7d39" stroke-width="7" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#d93a2b" stroke-width="7" fill="none" stroke-dasharray="7 7"/>`;
      s += `<path d="${d}" stroke="#ffffff" stroke-opacity=".35" stroke-width="1.4" fill="none"/><circle cx="50" cy="50" r="4" fill="#f2c14e" stroke="#8a5a14"/>`;
      return s;
    } },
    rocket: { name: 'Rocket', cat: 'Crackers', art(p) {
      // The classic Diwali rocket: a slim red paper tube with gold bands and a cone tip, tied to a
      // long bamboo stick that stands in an empty glass bottle, ready to launch.
      let s = `<defs>${lg(p + 'r', '#f0503c', '#a91d13', 1, 0)}${lg(p + 'c', '#f6d36b', '#c89520', 1, 0)}${lg(p + 'g', '#bfe6cf', '#6fae8f', 1, 0)}</defs>`;
      s += '<g transform="rotate(-9 50 72)">';
      s += `<path d="M55.5 30V92" stroke="#b98a4f" stroke-width="1.8" stroke-linecap="round"/>`; // bamboo stick
      s += `<path d="M45 18L49.5 5L54 18Z" fill="url(#${p}c)"/>`; // cone tip
      s += `<rect x="45" y="18" width="9" height="30" rx="1.2" fill="url(#${p}r)"/>`; // paper tube
      s += `<path d="M45 24H54M45 41H54" stroke="#f2c14e" stroke-width="2"/><path d="M47.5 30l2 2.4 2-2.4" stroke="#f2c14e" stroke-width="1.1" fill="none"/>`;
      s += `<path d="M44 27H57M44 44H57" stroke="#3a2a1a" stroke-width="1.2"/>`; // twine binding tube to stick
      s += `<path d="M49.5 48c0 3 -2 4 -1 7" stroke="#3a2a1a" stroke-width="1.2" fill="none"/><circle cx="48.6" cy="55.4" r="1.1" fill="#3a2a1a"/>`; // fuse
      s += '</g>';
      // the bottle: glass, with the stick showing through
      s += `<path d="M52 64h8v8c0 2 8 5 8 13v10H44V85c0-8 8-11 8-13z" fill="url(#${p}g)" fill-opacity=".55" stroke="#4f8a6c" stroke-width="1.5" stroke-linejoin="round"/>`;
      s += `<rect x="51" y="61.5" width="10" height="3.5" rx="1" fill="#4f8a6c"/>`;
      s += `<path d="M48 80v12" stroke="#fff" stroke-opacity=".7" stroke-width="2.2" stroke-linecap="round"/>`;
      return s;
    } },
    sparkler: { name: 'Phuljhari', cat: 'Crackers', art(p) {
      const rnd = U.seeded(13);
      let s = `<defs>${glowG(p + 'gl', '#fff1a8')}</defs><circle cx="66" cy="32" r="32" fill="url(#${p}gl)"/>`;
      s += `<path d="M16 92L64 34" stroke="#8a8f96" stroke-width="2.6" stroke-linecap="round"/><path d="M48 53L64 34" stroke="#4d4f53" stroke-width="4.5" stroke-linecap="round"/>`;
      s += sparks(rnd, 66, 32, 60, 6, 28, 0, Math.PI * 2, ['#ffffff', '#fff3b0', '#ffd23f', '#ff9a2e']);
      for (let i = 0; i < 6; i++) {
        const a = rnd() * Math.PI * 2, d = 18 + rnd() * 12, x = 66 + Math.cos(a) * d, y = 32 + Math.sin(a) * d;
        s += `<path d="M${n(x - 3)} ${n(y)}H${n(x + 3)}M${n(x)} ${n(y - 3)}V${n(y + 3)}" stroke="#fff" stroke-width="1.2"/>`;
      }
      return s + `<circle cx="66" cy="32" r="4" fill="#fff"/>`;
    } },
    bomb: { name: 'Sutli bomb', cat: 'Crackers', art(p) {
      const rnd = U.seeded(6);
      let s = `<defs>${rg(p + 'b', '#d39a58', '#7a4a1e')}<clipPath id="${p}c"><circle cx="50" cy="60" r="28"/></clipPath></defs>`;
      s += `<circle cx="50" cy="60" r="28" fill="url(#${p}b)"/><g clip-path="url(#${p}c)" fill="none" stroke="#5a3414" stroke-width="1.3" opacity=".7">`;
      for (let i = 0; i < 9; i++) s += `<ellipse cx="50" cy="60" rx="29" ry="${8 + i * 2.5}" transform="rotate(${n(i * 23 + rnd() * 10)} 50 60)"/>`;
      s += `</g><rect x="34" y="54" width="32" height="12" fill="#d8262c" transform="rotate(-12 50 60)"/><path d="M38 60h24" stroke="#f6c945" stroke-width="2" transform="rotate(-12 50 60)" stroke-dasharray="4 3"/>`;
      s += `<path d="M50 32C50 24 56 22 60 14" stroke="#3a2a1a" stroke-width="2" fill="none"/>`;
      s += sparks(rnd, 60, 13, 16, 3, 11, 0, Math.PI * 2, ['#fff3b0', '#ffd23f', '#ff7a1a']);
      return s;
    } },
    ladi: { name: 'Ladi', cat: 'Crackers', art(p) {
      let s = '';
      const pts = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([14 + t * 72, 18 + t * 64 + Math.sin(t * Math.PI) * -10]); }
      s += `<path d="M${pts.map((q) => q.map(n).join(' ')).join('L')}" stroke="#7a5a2a" stroke-width="1.6" fill="none"/>`;
      pts.slice(1, 12).forEach(([x, y], i) => {
        for (const side of [1, -1]) {
          const a = 35 + side * 55;
          s += `<g transform="translate(${n(x)} ${n(y)}) rotate(${a})"><rect x="1" y="-2.6" width="15" height="5.2" rx="1.4" fill="#d6262a"/><rect x="11" y="-2.6" width="2.4" height="5.2" fill="#f2c14e"/><rect x="15" y="-2" width="2.5" height="4" fill="#3a2a1a"/></g>`;
        }
      });
      s += `<path d="M14 18l-6 -6" stroke="#3a2a1a" stroke-width="1.6"/><circle cx="7" cy="11" r="3" fill="#ffb648"/>`;
      return s;
    } },

    /* ------------------------------------------------------------- decor */
    marigolds: { name: 'Marigold pile', cat: 'Decor', art() {
      const rnd = U.seeded(19);
      let s = '';
      for (const [x, y, a] of [[18, 70, -30], [80, 66, 30], [50, 86, 90]]) s += `<path transform="translate(${x} ${y}) rotate(${a})" d="M0 0C6 -6 18 -6 26 0C18 6 6 6 0 0Z" fill="#3f8a2a"/>`;
      const spots = [];
      for (let i = 0; i < 15; i++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 28; spots.push([50 + Math.cos(a) * d * 1.15, 58 + Math.sin(a) * d * 0.85]); }
      spots.sort((a, b) => a[1] - b[1]).forEach(([x, y], i) => { s += blossom(x, y, 10 + rnd() * 3, MARI[i % MARI.length]); });
      return s;
    } },
    colours: { name: 'Rangoli colours', cat: 'Decor', art(p) {
      const rnd = U.seeded(23);
      let s = '';
      const bowls = [[30, 36, '#e8457a'], [70, 38, '#f5c02e'], [50, 70, '#3d7fd6']];
      s += speckle(rnd, 72, 82, 10, 40, '#3d7fd6', 0.9, 0.5);
      bowls.forEach(([x, y, c], i) => {
        s += `<defs>${rg(p + i, U.shade(c, 14), U.shade(c, -12), 0.4, 0.35, 0.7)}</defs>`;
        s += `<circle cx="${x}" cy="${y}" r="19" fill="#c9973a"/><circle cx="${x}" cy="${y}" r="15.5" fill="#8f6420"/><circle cx="${x}" cy="${y}" r="14" fill="url(#${p}${i})"/>`;
        s += speckle(rnd, x, y, 12, 26, U.shade(c, -22), 0.7, 0.6) + speckle(rnd, x - 3, y - 3, 8, 12, '#ffffff', 0.6, 0.35);
      });
      return s;
    } },
    gift: { name: 'Gift box', cat: 'Decor', art(p) {
      let s = `<defs>${lg(p + 'b', '#d81b72', '#8e0f48')}${lg(p + 'l', '#ec3c8a', '#a8134f')}</defs>`;
      s += `<rect x="22" y="44" width="56" height="46" fill="url(#${p}b)"/>`;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) s += `<circle cx="${29 + i * 14}" cy="${54 + j * 13}" r="1.8" fill="#f6c945" opacity=".8"/>`;
      s += `<rect x="45" y="44" width="10" height="46" fill="#f2c14e"/><rect x="18" y="34" width="64" height="13" fill="url(#${p}l)"/><rect x="45" y="34" width="10" height="13" fill="#f6d06a"/>`;
      s += `<path d="M50 34C40 18 24 22 30 32C34 36 44 35 50 34ZM50 34C60 18 76 22 70 32C66 36 56 35 50 34Z" fill="#f2c14e" stroke="#c4952a" stroke-width="1.2"/>`;
      s += `<circle cx="50" cy="34" r="4" fill="#e0ad35"/>`;
      return s;
    } },
  };
  const CATS = ['Sweets', 'Lights', 'Crackers', 'Decor'];

  // white die-cut edge + soft shadow, like a real sticker
  const cutFilter = (p) =>
    `<filter id="${p}cut" x="-15%" y="-15%" width="130%" height="135%" color-interpolation-filters="sRGB">` +
    // trace the cut from solid parts only: faint glows stay outside the white edge as real glow
    `<feComponentTransfer in="SourceAlpha" result="a"><feFuncA type="discrete" tableValues="0 0 0 0 1"/></feComponentTransfer>` +
    `<feMorphology in="a" operator="dilate" radius="3.2" result="d"/>` +
    `<feGaussianBlur in="d" stdDeviation="2.4" result="b"/><feOffset in="b" dy="2.2" result="o"/>` +
    `<feFlood flood-color="#2a1608" flood-opacity=".28"/><feComposite in2="o" operator="in" result="sh"/>` +
    `<feFlood flood-color="#ffffff"/><feComposite in2="d" operator="in" result="w"/>` +
    `<feMerge><feMergeNode in="sh"/><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  const artCache = {};
  // inner markup of a sticker in a 0..100 box (ids are unique per sticker type)
  function stickerInner(t) {
    if (artCache[t]) return artCache[t];
    const p = 'k' + t + '_';
    return (artCache[t] = `<defs>${cutFilter(p)}</defs><g filter="url(#${p}cut)">${ST[t].art(p)}</g>`);
  }
  // Tight frame around each sticker's artwork (plus room for the white edge and shadow), measured
  // once from the drawing, so the selection box hugs the art instead of a fixed 100 × 100 square.
  const boxCache = {};
  function stickerBox(t) {
    if (boxCache[t]) return boxCache[t];
    const ns = 'http://www.w3.org/2000/svg';
    const tmp = document.createElementNS(ns, 'svg');
    tmp.setAttribute('viewBox', '0 0 100 100');
    tmp.style.cssText = 'position:absolute;left:-9999px;top:0;width:100px;height:100px;visibility:hidden';
    tmp.innerHTML = `<g>${ST[t].art('m' + t + '_')}</g>`;
    document.body.appendChild(tmp);
    let b;
    try { b = tmp.firstChild.getBBox(); } catch (e) { b = { x: 0, y: 0, width: 100, height: 100 }; }
    tmp.remove();
    const pad = 7;
    const x = b.x - pad, y = b.y - pad, w = b.width + pad * 2, h = b.height + pad * 2 + 2, m = Math.max(w, h);
    return (boxCache[t] = { x, y, w, h, aw: w / m, ah: h / m, vb: `${n(x)} ${n(y)} ${n(w)} ${n(h)}` });
  }
  const urlCache = {};
  function stickerURL(t) {
    if (urlCache[t]) return urlCache[t];
    const B = stickerBox(t);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${B.vb}" width="${Math.round(240 * B.aw)}" height="${Math.round(240 * B.ah)}">${stickerInner(t)}</svg>`;
    return (urlCache[t] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }

  R.scene = { FLOORS, floorTile, toran, ST, CATS, stickerInner, stickerURL, stickerBox };
})();
