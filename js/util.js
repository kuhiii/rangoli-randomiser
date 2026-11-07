/* Shared helpers: randomness, numbers, colour maths. Everything hangs off window.R */
(function () {
  const U = {};
  U.TAU = Math.PI * 2;
  U.rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  U.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.chance = (p) => Math.random() < p;
  U.weighted = (obj) => {
    const e = Object.entries(obj).filter(([, w]) => w > 0);
    let r = Math.random() * e.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of e) if ((r -= w) <= 0) return k;
    return e[e.length - 1][0];
  };
  U.shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.uid = () => Math.random().toString(36).slice(2, 10);
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.n = (v) => Math.round(v * 100) / 100; // svg number, 2dp
  U.n3 = (v) => Math.round(v * 1000) / 1000;
  U.deg = (rad) => Math.round((rad * 180) / Math.PI * 100) / 100;
  U.clone = (o) => JSON.parse(JSON.stringify(o));

  U.hslToHex = (h, s, l) => {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return '#' + [f(0), f(8), f(4)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
  };
  U.hexToRgb = (hex) => {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  U.hexToHsl = (hex) => {
    const [r, g, b] = U.hexToRgb(hex).map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
  };
  U.luminance = (hex) => {
    const [r, g, b] = U.hexToRgb(hex).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  // lighten (+) / darken (−) a colour by HSL lightness points
  U.shade = (hex, dl) => {
    const c = U.hexToHsl(hex);
    return U.hslToHex(c.h, c.s, U.clamp(c.l + dl, 4, 96));
  };
  // small deterministic PRNG so "random" scatter stays the same on every redraw
  U.seeded = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.textOn =(hex) => (U.luminance(hex) > 0.4 ? '#1f1b16' : '#ffffff');

  window.R = { U };
})();
