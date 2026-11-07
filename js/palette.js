/* Palette generation — Coolors-style: locked swatches stay, the rest harmonise around them. */
(function () {
  const { U } = R;

  // Festive starting points (rangoli powders: kumkum, haldi, marigold, peacock, indigo…)
  const PRESETS = [
    ['#d7263d', '#f46036', '#ffb627', '#2e294e', '#1b998b'],
    ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#e9c46a'],
    ['#9d0208', '#dc2f02', '#f48c06', '#ffba08', '#370617'],
    ['#ff006e', '#fb5607', '#ffbe0b', '#8338ec', '#3a86ff'],
    ['#003049', '#d62828', '#f77f00', '#fcbf49', '#2b9348'],
    ['#5f0f40', '#9a031e', '#fb8b24', '#e36414', '#0f4c5c'],
    ['#1d3557', '#457b9d', '#e63946', '#f1c453', '#2a9d8f'],
    ['#7b2cbf', '#c77dff', '#ff9e00', '#ff0054', '#00a6a6'],
    ['#b5179e', '#f72585', '#4361ee', '#4cc9f0', '#ffb703'],
    ['#6a994e', '#a7c957', '#bc4749', '#386641', '#f2a541'],
    ['#14213d', '#fca311', '#e85d04', '#9d4edd', '#06a77d'],
    ['#c1121f', '#780000', '#fdb833', '#669bbc', '#003049'],
  ];

  const SCHEMES = {
    analogous: [0, 28, -28, 56, -56],
    complementary: [0, 180, 22, 202, -22],
    triadic: [0, 120, 240, 22, 142],
    split: [0, 150, 210, 25, -25],
    tetradic: [0, 90, 180, 270, 35],
    festive: [0, 35, -35, 180, 70],
    mono: [0, 8, -8, 16, -16],
  };

  function fromHue(base) {
    const scheme = U.weighted({ analogous: 2, complementary: 2, triadic: 2, split: 2, tetradic: 1, festive: 3, mono: 0.6 });
    const offs = SCHEMES[scheme];
    const Ls = U.shuffle([22, 36, 48, 58, 68]);
    return offs.map((o, i) => {
      const L = Ls[i];
      const S = L < 30 ? U.rand(45, 75) : U.rand(58, 92);
      return U.hslToHex((base + o + U.rand(-7, 7) + 720) % 360, S, L);
    });
  }

  function fromPreset() {
    const shift = U.rand(-12, 12);
    return U.shuffle(U.pick(PRESETS)).map((h) => {
      const c = U.hexToHsl(h);
      return U.hslToHex((c.h + shift + 360) % 360, U.clamp(c.s + U.rand(-6, 6), 20, 100), U.clamp(c.l + U.rand(-5, 5), 12, 74));
    });
  }

  function generate(cur) {
    cur = cur && cur.length ? cur : Array.from({ length: 5 }, () => ({ hex: '#888888', locked: false }));
    const locked = cur.filter((c) => c.locked);
    const cand = !locked.length && U.chance(0.45)
      ? fromPreset()
      : fromHue(locked.length ? U.hexToHsl(U.pick(locked).hex).h : U.rand(360));
    // 6th / 7th colours: more of the same harmony, around the first colour's hue
    while (cand.length < cur.length) cand.push(...fromHue(U.hexToHsl(cand[0]).h).slice(1));
    return cur.map((c, i) => (c.locked ? { ...c } : { hex: cand[i], locked: false }));
  }

  function rerollOne(cur, i) {
    const others = cur.filter((_, j) => j !== i);
    return U.pick(fromHue(U.hexToHsl(U.pick(others).hex).h));
  }

  const MIN = 5, MAX = 7;
  R.palette = { generate, rerollOne, MIN, MAX };
})();
