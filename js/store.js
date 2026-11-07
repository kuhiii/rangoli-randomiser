/* Persistence: gallery in localStorage, designs encoded into the URL hash. */
(function () {
  const KEY = 'rangoli.gallery.v1';
  const MAX = 50;       // the gallery keeps the latest 50 designs
  const WARN_LEFT = 20; // heads-up when only this many free slots remain

  function loadGallery() {
    try {
      const a = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(a) ? a.slice(0, MAX) : [];
    } catch (e) { return []; }
  }
  let t;
  function saveGallerySoon(g) {
    clearTimeout(t);
    t = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(g.slice(0, MAX), rep)); }
      catch (e) { try { localStorage.setItem(KEY, JSON.stringify(g.slice(0, 25), rep)); } catch (e2) { /* storage unavailable */ } }
    }, 300);
  }

  // Round floats so links stay short and comparisons are stable.
  const rep = (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v);
  const canon = (s) => JSON.stringify(s, rep);

  const b64u = (bytes) => {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const unb64u = (str) => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const s = atob(str);
    return Uint8Array.from(s, (c) => c.charCodeAt(0));
  };
  const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

  async function encode(state) {
    const bytes = new TextEncoder().encode(canon(state));
    if (typeof CompressionStream !== 'undefined') {
      try { return 'z' + b64u(await pipe(bytes, new CompressionStream('deflate-raw'))); } catch (e) { /* fall through */ }
    }
    return 'j' + b64u(bytes);
  }
  async function decode(code) {
    const bytes = unb64u(code.slice(1));
    const raw = code[0] === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
    return JSON.parse(new TextDecoder().decode(raw));
  }

  R.store = { loadGallery, saveGallerySoon, encode, decode, canon, MAX, WARN_LEFT };
})();
