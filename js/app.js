/* UI: canvas interaction, palette, history, gallery drawer, share & export. */
(function () {
  const { U, render: RD, gen: G, palette: PAL, store: ST } = R;
  const $ = (s) => document.querySelector(s);
  const mqMobile = matchMedia('(max-width: 760px)');

  const ICONS = {
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.8-1.2"/>',
    dice: '<path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    petal: '<path d="M12 21c-5-4-5-11 0-18 5 7 5 14 0 18z"/>',
    ring: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>',
    center: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.8 2.8M16.2 16.2 19 19M5 19l2.8-2.8M16.2 7.8 19 5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    minus: '<path d="M5 12h14"/>',
    rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    flip: '<path d="M12 3v18"/><path d="M8 7 3 12l5 5V7z"/><path d="M16 7l5 5-5 5V7z"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9"/><path d="M12 8v13"/><path d="M12 8C10 3 6 4 7.5 7 8 8 12 8 12 8zM12 8c2-5 6-4 4.5-1C16 8 12 8 12 8z"/>',
    chevron: '<path d="M15 5l-7 7 7 7"/>',
    frame: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="16" cy="9.5" r="1.5"/>',
    transparent: '<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="2.5 2.5"/><path d="M12 7c2 2.4 2 5.6 0 8-2-2.4-2-5.6 0-8z"/><path d="M7 12c2.4-2 5.6-2 8 0-2.4 2-5.6 2-8 0z" opacity=".6"/>',
    vector: '<path d="M4 20 20 4"/><circle cx="4" cy="20" r="2"/><circle cx="20" cy="4" r="2"/><path d="M4 8V4h4M20 16v4h-4"/>',
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
  document.querySelectorAll('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));

  const stackEl = $('#stack'), svgEl = $('#canvas'), wrap = $('#canvasWrap'), tbEl = $('#toolbar'), trashEl = $('#trash');
  const palEl = $('#palette'), galEl = $('#gallery'), drawer = $('#drawer');
  const handle = $('#drawerHandle'), scrim = $('#scrim'), toastEl = $('#toast');
  // An actual little bin: the lid swings open when something is held over it.
  // A brown metal bin with ribbed sides and its round lid leaning on it, drawn in the same
  // powder style as the rangoli: grainy rough-edged fills with white rice-flour dots.
  trashEl.innerHTML = `<svg class="can" viewBox="0 0 76 100" aria-hidden="true">
    <defs>
      <filter id="binpw" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="5" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="1" seed="12" result="g"/>
        <feColorMatrix in="g" type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 0 1" result="gg"/>
        <feComposite in="d" in2="gg" operator="arithmetic" k1=".55" k2=".76" k3="0" k4="0"/>
      </filter>
      <linearGradient id="binB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a523d"/><stop offset=".45" stop-color="#946850"/><stop offset="1" stop-color="#6a4534"/></linearGradient>
      <radialGradient id="binL" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#9a6d54"/><stop offset="1" stop-color="#6a4534"/></radialGradient>
    </defs>
    <g filter="url(#binpw)">
      <path d="M1.5 31h6v7h-6zM58.5 31h6v7h-6z" fill="#553627"/>
      <path class="can-body" d="M8 24H58L53.5 93H12.5Z" fill="url(#binB)"/>
      <path class="can-tint" d="M8 24H58L53.5 93H12.5Z"/>
      <path d="M5 17H61L59.5 25.5H6.5Z" fill="#553627"/>
      <g fill="none" stroke="#3f281d" stroke-width="2" stroke-linecap="round">
        <path d="M15.5 34V80a2.6 2.6 0 0 0 5.2 0V34a2.6 2.6 0 0 0-5.2 0Z"/>
        <path d="M25.5 34V81a2.6 2.6 0 0 0 5.2 0V34a2.6 2.6 0 0 0-5.2 0Z"/>
        <path d="M35.5 34V81a2.6 2.6 0 0 0 5.2 0V34a2.6 2.6 0 0 0-5.2 0Z"/>
        <path d="M45.5 34V80a2.6 2.6 0 0 0 5.2 0V34a2.6 2.6 0 0 0-5.2 0Z"/>
      </g>
      <path d="M7 27.5H59" stroke="#f6ead6" stroke-width="1.6" stroke-linecap="round" stroke-dasharray=".1 3.4"/>
      <g class="can-lid">
        <ellipse cx="62" cy="72" rx="13" ry="18" transform="rotate(-14 62 72)" fill="#4e3226"/>
        <ellipse cx="61" cy="72" rx="11.2" ry="16" transform="rotate(-14 61 72)" fill="url(#binL)"/>
        <ellipse class="can-tint" cx="61" cy="72" rx="11.2" ry="16" transform="rotate(-14 61 72)"/>
        <ellipse cx="61" cy="72" rx="8.6" ry="12.6" transform="rotate(-14 61 72)" fill="none" stroke="#f6ead6" stroke-width="1.5" stroke-linecap="round" stroke-dasharray=".1 3.3"/>
        <rect x="62.5" y="61" width="3.4" height="8" rx="1.7" transform="rotate(32 64 65)" fill="#3f281d"/>
      </g>
    </g>
  </svg><span class="trash-label">Drag here to delete</span>`;

  /* ================================================================ state */
  let state = null;
  const hist = { stack: [], idx: -1 };
  let gallery = [];
  let currentEntry = null; // gallery entry being edited
  let sourceEntry = null;  // entry that was reused (highlighted until edited)
  let focusId = null;
  let anchor = null; // last pointer position on the focused layer (for the toolbar's safe triangle)
  let drag = null;

  let fullWarned = false;
  const newEntry = () => {
    const e = { id: U.uid(), state: U.clone(state), ts: Date.now() };
    gallery.unshift(e);
    const n = gallery.length;
    if (n > ST.MAX) gallery.length = ST.MAX;
    if (n === ST.MAX - ST.WARN_LEFT) toast(`Gallery keeps your last ${ST.MAX} designs. ${ST.WARN_LEFT} spots left, then the oldest are removed`, null, 6000);
    else if (n > ST.MAX && !fullWarned) (fullWarned = true), toast(`Gallery is full (${ST.MAX}). Your oldest design was removed`, null, 5000);
    currentEntry = e.id;
    sourceEntry = null;
  };

  // mode: 'new' → new gallery entry · 'update' → update the entry being edited · 'none'
  function commit(next, mode = 'update') {
    state = next;
    if (mode === 'new') newEntry();
    else if (mode === 'update') {
      const e = currentEntry && gallery.find((g) => g.id === currentEntry);
      if (e) { e.state = U.clone(state); e.ts = Date.now(); } else newEntry();
    }
    hist.stack = hist.stack.slice(0, hist.idx + 1);
    hist.stack.push({ s: JSON.stringify(state), e: currentEntry });
    if (hist.stack.length > 150) hist.stack.shift();
    hist.idx = hist.stack.length - 1;
    afterChange();
  }
  function restore() {
    const h = hist.stack[hist.idx];
    state = JSON.parse(h.s);
    currentEntry = h.e;
    const e = currentEntry && gallery.find((g) => g.id === currentEntry);
    if (e) e.state = JSON.parse(h.s);
    hideToolbar();
    afterChange();
  }
  const undo = () => { if (hist.idx > 0) { hist.idx--; restore(); } };
  const redo = () => { if (hist.idx < hist.stack.length - 1) { hist.idx++; restore(); } };
  function edit(fn) {
    const next = U.clone(state);
    if (fn(next) === false) return;
    commit(next, 'update');
  }
  let saveCurT;
  function afterChange() {
    clearTimeout(saveCurT);
    saveCurT = setTimeout(() => { try { localStorage.setItem('rangoli.current.v1', JSON.stringify({ s: state, e: currentEntry })); } catch (e) { /* storage unavailable */ } }, 250);
    G.setColors(state.palette.length);
    renderCanvas();
    renderScene();
    renderPalette();
    renderGallery();
    ST.saveGallerySoon(gallery);
    syncHashSoon();
  }

  function findEl(s, id) {
    if (s.center && s.center.id === id) return { kind: 'center', el: s.center };
    let i = s.rings.findIndex((r) => r.id === id);
    if (i >= 0) return { kind: 'ring', el: s.rings[i], i };
    i = s.accents.findIndex((a) => a.id === id);
    if (i >= 0) return { kind: 'accent', el: s.accents[i], i };
    i = (s.figures || []).findIndex((a) => a.id === id);
    if (i >= 0) return { kind: 'figure', el: s.figures[i], i };
    i = (s.strands || []).findIndex((a) => a.id === id);
    if (i >= 0) return { kind: 'strand', el: s.strands[i], i };
    return null;
  }
  const STRAND_NAME = { vine: 'Vine', swirl: 'Swirl', dots: 'Dot trail' };
  const label = (f) => {
    if (f.kind === 'figure') return R.motifs[f.el.m].name;
    if (f.kind === 'strand') return STRAND_NAME[f.el.kind];
    if (f.kind === 'ring' && f.el.type === 'motifs') return `Ring of ${R.motifs[f.el.m].name.toLowerCase()}`;
    return (f.kind === 'ring' ? RD.RT : f.kind === 'center' ? RD.CT : RD.AT)[f.el.type].name;
  };

  /* ============================================================== actions */
  // A full gallery drops its oldest design on the next new one: ask first (unless told not to).
  const fullDlg = $('#fullDlg');
  let skipFull = false;
  try { skipFull = localStorage.getItem('rangoli.skipFullConfirm') === '1'; } catch (e) { /* storage unavailable */ }
  function confirmFull() {
    return new Promise((resolve) => {
      $('#fullText').textContent = `Your gallery keeps your last ${ST.MAX} designs. A new one will remove the oldest.`;
      $('#fullSkip').checked = false;
      fullDlg.returnValue = '';
      fullDlg.showModal();
      fullDlg.focus(); // not a button: a stray space press must not confirm
      fullDlg.addEventListener('close', () => {
        const ok = fullDlg.returnValue === 'ok';
        if (ok && $('#fullSkip').checked) {
          skipFull = true;
          try { localStorage.setItem('rangoli.skipFullConfirm', '1'); } catch (e) { /* storage unavailable */ }
        }
        resolve(ok);
      }, { once: true });
    });
  }
  fullDlg.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.target.closest('button, input')) { e.preventDefault(); fullDlg.close('ok'); }
  });
  function generate() {
    if (fullDlg.open) return;
    if (mqMobile.matches && panX !== 0) setPan(0, true); // the view glides back so the new design is centred
    if (gallery.length >= ST.MAX && !skipFull) { confirmFull().then((ok) => ok && doGenerate()); return; }
    doGenerate();
  }
  function doGenerate() {
    hideToolbar();
    commit(G.generate(state), 'new');
    const root = stackEl;
    if (root.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.animate(
        [{ opacity: 0.15, transform: 'scale(.94) rotate(-5deg)' }, { opacity: 1, transform: 'none' }],
        { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }
      );
    }
  }
  function toggleLock(id) {
    edit((s) => { const f = findEl(s, id); if (!f) return false; f.el.locked = !f.el.locked; });
    refreshToolbar();
  }
  function reroll(id) {
    edit((s) => {
      const f = findEl(s, id);
      if (!f) return false;
      if (f.kind === 'ring') s.rings[f.i] = G.rerollRing(f.el, s.mood, s);
      else if (f.kind === 'center') s.center = G.rerollCenter(f.el, s.mood, s);
      else if (f.kind === 'figure') s.figures[f.i] = G.rerollFigure(f.el, s);
      else if (f.kind === 'strand') s.strands[f.i] = G.rerollStrand(f.el, s);
      else s.accents[f.i] = G.rerollAccent(f.el, s.mood, s);
    });
    refreshToolbar();
  }
  function recolor(id) {
    edit((s) => { const f = findEl(s, id); if (!f) return false; G.recolor(f.el); });
  }
  function removeEl(id) {
    const f = findEl(state, id);
    if (!f) return;
    hideToolbar();
    edit((s) => {
      if (f.kind === 'center') s.center = null;
      else if (f.kind === 'ring') s.rings = s.rings.filter((r) => r.id !== id);
      else if (f.kind === 'figure') s.figures = s.figures.filter((a) => a.id !== id);
      else if (f.kind === 'strand') s.strands = s.strands.filter((a) => a.id !== id);
      else s.accents = s.accents.filter((a) => a.id !== id);
    });
    toast(`${label(f)} removed`, { label: 'Undo', fn: undo });
  }
  function addEl(kind) {
    edit((s) => {
      const last = s.rings[s.rings.length - 1];
      if (kind === 'motif') s.rings.push(G.newRing(s.mood, last ? [last.type] : [], G.MOTIF_TYPES));
      else if (kind === 'band') s.rings.push(G.newRing(s.mood, last ? [last.type] : [], G.BAND_TYPES));
      else if (kind === 'center') s.center = s.center ? G.rerollCenter(s.center, s.mood) : G.newCenter(s.mood);
      else s.accents.push(G.newAccent(s.mood, s.form));
    });
  }

  /* =============================================================== canvas */
  // The textured art lives in one small <svg> per element, each on its own GPU layer, so the powder
  // filter is painted once per render. Hover dimming and drag moves are then pure compositing
  // (opacity / transform) and never repaint the filter. #canvas on top only holds the hit areas.
  function paint(st) {
    const P = RD.parts(st, { ui: true });
    stackEl.innerHTML = `<svg class="defs" aria-hidden="true">${P.defs}</svg>` +
      P.list.map((l) => `<svg class="ly" data-id="${l.id}" data-kind="${l.kind}" viewBox="-440 -440 880 880" aria-hidden="true"><g filter="url(#pw)">${l.art}</g></svg>`).join('');
    // hover areas: rings ordered thick → thin (thin on top), everything else keeps paint order above them
    const rings = P.list.filter((l) => l.kind === 'ring').sort((a, b) => a.hz - b.hz), rest = P.list.filter((l) => l.kind !== 'ring');
    svgEl.innerHTML = [...rings, ...rest].map((l) => `<g class="layer" data-id="${l.id}" data-kind="${l.kind}">${l.hit}</g>`).join('') +
      `<g class="badges">${P.list.map((l) => l.badge).join('')}</g>`;
  }
  const lyr = (id) => stackEl.querySelector(`.ly[data-id="${id}"]`);
  let paintedKey = '';
  function renderCanvas() {
    const key = JSON.stringify({ ...state, scene: 0 });
    if (key !== paintedKey) { paint(state); paintedKey = key; }
    applyFocus();
  }
  // Only touches the layers whose state changes — cheap enough to run on every hover switch.
  function applyFocus() {
    stackEl.classList.toggle('has-focus', !!focusId && !drag);
    stackEl.querySelectorAll('.ly.focus').forEach((g) => { if (g.dataset.id !== focusId) g.classList.remove('focus'); });
    if (focusId) {
      const g = lyr(focusId);
      if (g) g.classList.add('focus');
    }
  }

  // Floating toolbar
  let hideT = null, switchT = null;
  const cancelHide = () => { clearTimeout(hideT); hideT = null; };
  function scheduleHide() {
    clearTimeout(switchT);
    cancelHide();
    hideT = setTimeout(hideToolbar, 120);
  }
  // Off every element: un-dim at once. Only if the pointer is heading for the toolbar does it
  // get a short grace period to reach it.
  function leaveLayers(x, y) {
    clearTimeout(switchT); switchT = null;
    if (!focusId) return;
    if (nearToolbar(x, y)) { cancelHide(); hideT = setTimeout(hideToolbar, 300); return; }
    hideToolbar();
  }
  function hideToolbar() {
    cancelHide();
    clearTimeout(switchT);
    tbEl.hidden = true;
    tbEl.dataset.id = '';
    focusId = null; anchor = null;
    applyFocus();
  }
  function toolbarHTML(f) {
    return `<button class="mini ${f.el.locked ? 'on' : ''}" data-act="lock" title="${f.el.locked ? 'Unlock' : 'Lock'} (L)" aria-label="${f.el.locked ? 'Unlock' : 'Lock'}">${icon(f.el.locked ? 'lock' : 'unlock')}</button>` +
      `<button class="mini" data-act="reroll" title="New shape for this element" aria-label="Reroll element">${icon('dice')}</button>`;
  }
  function showToolbar(id, cx, cy) {
    const f = findEl(state, id);
    if (!f) return hideToolbar();
    cancelHide();
    focusId = id;
    applyFocus();
    tbEl.innerHTML = toolbarHTML(f);
    tbEl.dataset.id = id;
    // glide between elements; appear in place the first time
    tbEl.classList.toggle('glide', !tbEl.hidden);
    tbEl.hidden = false;
    const wr = wrap.getBoundingClientRect();
    const w = tbEl.offsetWidth, h = tbEl.offsetHeight;
    let x = cx - wr.left + 14, y = cy - wr.top - h - 14;
    if (y < 8) y = cy - wr.top + 18;
    x = U.clamp(x, 8, wr.width - w - 8);
    y = U.clamp(y, 8, wr.height - h - 8);
    tbEl.style.transform = `translate(${x}px, ${y}px)`;
  }
  function refreshToolbar() {
    const id = tbEl.dataset.id;
    if (tbEl.hidden || !id) return;
    const f = findEl(state, id);
    if (!f) return hideToolbar();
    tbEl.innerHTML = toolbarHTML(f);
  }
  tbEl.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const id = tbEl.dataset.id;
    ({ lock: toggleLock, reroll, recolor })[b.dataset.act](id);
  });
  tbEl.addEventListener('pointerenter', () => {
    cancelHide(); clearTimeout(switchT);
    if (tbEl.dataset.id && focusId !== tbEl.dataset.id) { focusId = tbEl.dataset.id; applyFocus(); }
  });
  tbEl.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') scheduleHide(); });

  // Hover (mouse) + drag (mouse & touch)
  const toSvg = (e) => {
    const p = svgEl.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svgEl.getScreenCTM().inverse());
  };
  // Where the bin sits while something is dragged. Read from its layout box, not its animated
  // rect, so the target never moves under the pointer while the bin slides in or grows.
  const binAt = () => ({ x: trashEl.offsetLeft + trashEl.offsetWidth / 2 + 22 + (mqMobile.matches ? panX : 0), y: trashEl.offsetTop });
  // Over the bin means over the bin itself: its resting, peeking shape activates it. Once it has
  // slid out (bigger), its new shape keeps it active, so it doesn't flicker as it moves.
  const overTrash = (e, wasHot) => {
    const w = trashEl.offsetWidth, h = trashEl.offsetHeight, top = trashEl.offsetTop - h / 2;
    if (!wasHot && !mqMobile.matches) { // on phones the bin has already slid in during a drag
      const right = trashEl.offsetLeft - 30 + w; // resting position: translate(-30px)
      return e.clientX <= right + 4 && e.clientY >= top - 4 && e.clientY <= top + h + 4;
    }
    const right = trashEl.offsetLeft + 22 + w * 1.12 + (mqMobile.matches ? panX : 0), grow = h * 0.06;
    return e.clientX <= right + 8 && e.clientY >= top - grow - 8 && e.clientY <= top + h + grow + 8;
  };
  // While over the bin a small copy of the held element hovers above its open mouth and the
  // original fades back, so it's obvious what is about to be thrown away.
  let ghostEl = null;
  function showGhost(id) {
    const g = lyr(id), f = findEl(state, id);
    if (!g || !f) return;
    let vb;
    if (f.kind === 'accent' && f.el.pos[0]) { const p = f.el.pos[0], h = f.el.size * 0.7; vb = [p.x - h, p.y - h, 2 * h, 2 * h]; }
    else if (f.kind === 'ring') {
      // a whole ring shrunk to a few px is just specks — show a close-up of its top section instead
      const b = RD.layout(state).bands[id], rm = (b.r0 + b.r1) / 2;
      const w = Math.max((b.r1 - b.r0) * 2.6, 70);
      vb = [-w / 2, -rm - w / 2, w, w];
    } else { const bb = g.firstElementChild.getBBox(), m = Math.max(bb.width, bb.height); vb = [bb.x + bb.width / 2 - m / 2, bb.y + bb.height / 2 - m / 2, m, m]; }
    placeGhost(`<svg viewBox="${vb.map((v) => v.toFixed(1)).join(' ')}" aria-hidden="true">${g.innerHTML}</svg>`);
  }
  // bare: stickers already have their own white die-cut edge, so no card behind them
  function placeGhost(html, bare) {
    ghostEl = document.createElement('div');
    ghostEl.className = bare ? 'ghost bare' : 'ghost';
    ghostEl.innerHTML = html;
    const b = binAt();
    ghostEl.style.left = `${b.x}px`; ghostEl.style.top = `${b.y - trashEl.offsetHeight / 2 - 44}px`;
    document.body.appendChild(ghostEl);
  }
  function dropGhost(fall) {
    const el = ghostEl;
    ghostEl = null;
    if (!el) return;
    el.classList.add(fall ? 'fall' : 'gone');
    setTimeout(() => el.remove(), 260);
  }
  function setHot(hot) {
    if (hot === !!drag.hot) return;
    drag.hot = hot;
    trashEl.classList.toggle('hot', hot);
    const g = lyr(drag.id);
    if (g) g.classList.toggle('doomed', hot);
    if (hot) showGhost(drag.id); else dropGhost(false);
  }
  // Drop on the bin: the copy falls in, the lid slams, the bin gulps, then slides away.
  function gulp(then) {
    trashEl.classList.add('eat', 'hot');
    dropGhost(true);
    setTimeout(() => {
      trashEl.classList.remove('hot');
      trashEl.classList.add('gulp');
      then();
    }, 200);
    setTimeout(() => trashEl.classList.remove('eat', 'gulp'), 800);
  }
  function throwAway(d) {
    const g = lyr(d.id);
    if (g) g.style.opacity = '0';
    gulp(() => removeEl(d.id));
  }

  // Is the pointer heading for the toolbar? Then don't snatch it away while crossing other layers.
  // Like menus do: a "safe triangle" from the last point on the focused layer to the toolbar's
  // corners (plus a margin around the toolbar). Inside it, other layers only take over once the
  // pointer rests on them.
  const triSign = (p, a, b) => (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
  const inTri = (p, a, b, c) => {
    const d1 = triSign(p, a, b), d2 = triSign(p, b, c), d3 = triSign(p, c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  const nearToolbar = (x, y) => {
    if (tbEl.hidden) return false;
    const r = tbEl.getBoundingClientRect();
    if (x > r.left - 8 && x < r.right + 8 && y > r.top - 8 && y < r.bottom + 8) return true;
    if (!anchor) return false;
    const m = 10, c = [[r.left - m, r.top - m], [r.right + m, r.top - m], [r.right + m, r.bottom + m], [r.left - m, r.bottom + m]];
    for (let i = 0; i < 4; i++) if (inTri([x, y], anchor, c[i], c[(i + 1) % 4])) return true;
    return false;
  };
  let hoverEv = null, hoverRaf = 0;
  function processHover() {
    hoverRaf = 0;
    const e = hoverEv;
    const g = e.target.closest && e.target.closest('.layer');
    if (!g) return leaveLayers(e.clientX, e.clientY);
    cancelHide();
    const id = g.dataset.id;
    const x = e.clientX, y = e.clientY;
    if (id === focusId) { clearTimeout(switchT); switchT = null; anchor = [x, y]; return; }
    if (!focusId || !nearToolbar(x, y)) { clearTimeout(switchT); switchT = null; showToolbar(id, x, y); anchor = [x, y]; return; }
    // heading for the toolbar: switch only if the pointer settles here (restarts on every move)
    clearTimeout(switchT);
    switchT = setTimeout(() => { switchT = null; showToolbar(id, x, y); anchor = [x, y]; }, 260);
  }
  svgEl.addEventListener('pointermove', (e) => {
    if (drag) return onDragMove(e);
    if (document.body.classList.contains('sheet-drag')) return;
    if (e.pointerType !== 'mouse') return;
    hoverEv = e;
    if (!hoverRaf) hoverRaf = requestAnimationFrame(processHover);
  });
  svgEl.addEventListener('pointerleave', (e) => { if (!drag && e.pointerType === 'mouse') leaveLayers(e.clientX, e.clientY); });


  /* ------------------------------------------------------------ phone pan */
  // On a phone the scene is wider than the screen: drag across the floor to pan it. The palette
  // waits just past the right edge, the bin peeks in from the left.
  let panX = 0, panning = null, swallowUntil = 0;
  const panLimits = () => {
    const pw = palEl.offsetWidth || 148;
    return { min: -(pw + 12 - 18), max: 64 };
  };
  function setPan(x, ease) {
    document.documentElement.classList.toggle('pan-ease', !!ease);
    panX = x;
    document.documentElement.style.setProperty('--pan', `${x.toFixed(1)}px`);
  }
  function beginPan(e, sx) {
    panning = { id: e.pointerId, sx: sx === undefined ? e.clientX : sx, x0: panX, moved: false };
  }
  const NO_PAN = '.topbar, .drawer, .gen-mobile, .stk, .add-pop, .toolbar, .ghost, input, select, textarea, #canvas .layer';
  document.addEventListener('pointerdown', (e) => {
    if (!mqMobile.matches || e.pointerType === 'mouse' || e.target.closest(NO_PAN)) return;
    beginPan(e);
  }, true);
  window.addEventListener('pointermove', (e) => {
    if (!panning || e.pointerId !== panning.id) return;
    const dx = e.clientX - panning.sx;
    if (!panning.moved) { if (Math.abs(dx) < 8) return; panning.moved = true; }
    const { min, max } = panLimits();
    let x = panning.x0 + dx;
    // rubber band past the ends
    if (x < min) x = min - (min - x) * 0.3; else if (x > max) x = max + (x - max) * 0.3;
    setPan(x, false);
  });
  const endPan = (e) => {
    if (!panning || e.pointerId !== panning.id) return;
    const p = panning;
    panning = null;
    if (!p.moved) return;
    swallowUntil = Date.now() + 350; // the click that ends a pan is not a tap
    const { min, max } = panLimits();
    setPan(U.clamp(panX, min, max), true);
  };
  window.addEventListener('pointerup', endPan);
  window.addEventListener('pointercancel', endPan);
  document.addEventListener('click', (e) => {
    if (Date.now() < swallowUntil) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  mqMobile.addEventListener('change', () => { setPan(0, false); renderToran(true); renderScene(); });

  svgEl.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const g = e.target.closest('.layer');
    if (!g) { if (e.pointerType !== 'mouse') hideToolbar(); return; }
    drag = { id: g.dataset.id, kind: g.dataset.kind, sx: e.clientX, sy: e.clientY, started: false, p0: toSvg(e), touch: e.pointerType !== 'mouse', armed: e.pointerType === 'mouse' };
    try { svgEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    // on touch a layer is only picked up after a long press, so a tap shows its toolbar and a swipe does nothing
    if (drag.touch) {
      const d = drag;
      d.pressT = setTimeout(() => {
        if (drag !== d) return;
        d.armed = true;
        hideToolbar();
        const l = lyr(d.id);
        if (l) l.classList.add('armed');
        if (navigator.vibrate) navigator.vibrate(12);
      }, 380);
    }
  });

  // Calm dragging: nothing is redrawn while you drag. The held element eases after the pointer
  // (a soft follow); dropped on the bin it is deleted, anywhere else it eases back.
  const EASE = 0.28; // follow softness per frame (lower = calmer)
  function tick() {
    if (!drag || !drag.started) return;
    const c = drag.cur, t = drag.tgt;
    c.x += (t.x - c.x) * EASE; c.y += (t.y - c.y) * EASE; c.s += (t.s - c.s) * EASE;
    const g = drag.g;
    if (g) {
      g.style.transform = `translate(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px)`;
    }
    drag.raf = requestAnimationFrame(tick);
  }
  function startDrag() {
    drag.started = true;
    hideToolbar();
    svgEl.classList.add('drag-on');
    stackEl.classList.add('drag-on');
    wrap.classList.add('dragging');
    document.body.classList.add('dragging');
    drag.k = wrap.clientWidth / 880; // svg units → css px
    drag.cur = { x: 0, y: 0, s: 1 };
    drag.tgt = { x: 0, y: 0, s: 1 };
    drag.g = lyr(drag.id);
    if (drag.g) { drag.g.classList.add('dragged', 'held'); }
    drag.raf = requestAnimationFrame(tick);
  }
  function onDragMove(e) {
    if (!drag.started) {
      const moved = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
      if (!drag.armed) {
        // moved before the long press completed: it was a swipe, not a pick-up
        if (moved > 10) {
          clearTimeout(drag.pressT);
          if (mqMobile.matches) { beginPan(e, drag.sx); panning.moved = true; }
          drag = null;
        }
        return;
      }
      if (moved < 6) return;
      startDrag();
    }
    drag.overTrash = overTrash(e, drag.hot);
    setHot(drag.overTrash);
    if (drag.overTrash) return;
    const p = toSvg(e);
    drag.tgt.x = (p.x - drag.p0.x) * drag.k;
    drag.tgt.y = (p.y - drag.p0.y) * drag.k;
  }
  // Ease everything back to where it's drawn (cancelled / no change).
  function settle(d) {
    stackEl.querySelectorAll('.ly').forEach((g) => { g.classList.remove('held'); g.style.transform = ''; });
    setTimeout(() => stackEl.querySelectorAll('.ly.dragged').forEach((g) => g.classList.remove('dragged')), 360);
  }
  function endPointer(e, cancelled) {
    if (!drag) return;
    const d = drag;
    drag = null;
    clearTimeout(d.pressT);
    stackEl.querySelectorAll('.ly.armed').forEach((l) => l.classList.remove('armed'));
    cancelAnimationFrame(d.raf);
    svgEl.classList.remove('drag-on');
    stackEl.classList.remove('drag-on');
    wrap.classList.remove('dragging');
    document.body.classList.remove('dragging');
    trashEl.classList.remove('hot');
    if (!(d.overTrash && !cancelled)) dropGhost(false);
    if (!d.started) {
      if (e.pointerType !== 'mouse' && !cancelled && !d.armed) {
        if (focusId === d.id) hideToolbar(); else showToolbar(d.id, e.clientX, e.clientY);
      }
      return;
    }
    if (!cancelled && d.overTrash) return throwAway(d);
    if (d.g) d.g.classList.remove('doomed');
    settle(d);
  }
  svgEl.addEventListener('pointerup', (e) => endPointer(e, false));
  svgEl.addEventListener('pointercancel', (e) => endPointer(e, true));

  /* ============================================================== palette */
  function renderPalette() {
    palEl.innerHTML = state.palette.map((c, i) => `
      <div class="swatch ${c.locked ? 'locked' : ''}" style="--c:${c.hex};--t:${U.textOn(c.hex)}">
        <label class="hex" title="Edit colour"><input type="color" value="${c.hex}" data-i="${i}"><span>${c.hex.slice(1).toUpperCase()}</span></label>
        <div class="sw-actions">
          <button data-act="lock" data-i="${i}" title="${c.locked ? 'Unlock' : 'Lock'} colour" aria-label="${c.locked ? 'Unlock' : 'Lock'} colour">${icon(c.locked ? 'lock' : 'unlock')}</button>
          <button data-act="reroll" data-i="${i}" title="New colour" aria-label="New colour">${icon('dice')}</button>
        </div>
      </div>`).join('') +
      (state.palette.length < PAL.MAX ? `<button class="sw-add" data-act="add" title="Add a colour" aria-label="Add a colour">${icon('plus')}</button>` : '');
  }
  palEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    if (b.dataset.act === 'add') return openAddPop(b);
    const i = +b.dataset.i;
    if (b.dataset.act === 'lock') edit((s) => { s.palette[i].locked = !s.palette[i].locked; });
    else edit((s) => { s.palette[i].hex = PAL.rerollOne(s.palette, i); });
  });
  // A new colour joins the harmony and is worked straight into a few unlocked elements, so you see it.
  function addColour(hex) {
    if (state.palette.length >= PAL.MAX) return;
    edit((s) => {
      const i = s.palette.length;
      s.palette.push({ hex: hex || PAL.rerollOne(s.palette, i), locked: !!hex });
      const free = s.rings.filter((r) => !r.locked);
      U.shuffle(free).slice(0, Math.max(1, Math.round(free.length * 0.4))).forEach((r) => {
        if (U.chance(0.5) && r.c1 !== i) r.c2 = i; else r.c1 = i;
        if (r.c1 === r.c2) r.c2 = U.randInt(0, i - 1);
        if (r.ground === r.c1 || r.ground === r.c2) r.ground = -1;
      });
      if (s.center && !s.center.locked && U.chance(0.5)) s.center.c2 = i;
    });
  }
  // "+" opens a small picker: colours that suit this palette, festive powder classics, or any colour.
  const FESTIVE = ['#c8102e', '#e34234', '#f28a14', '#f2b705', '#e5739a', '#8e2c88', '#2e3a87', '#0f6e7a', '#4f7a28', '#6b3a1f', '#f6efe0', '#1f1b16'];
  const addPop = document.createElement('div');
  addPop.className = 'add-pop';
  addPop.hidden = true;
  document.body.appendChild(addPop);
  function openAddPop(btn) {
    const have = new Set(state.palette.map((c) => c.hex.toLowerCase()));
    const suits = [];
    for (let k = 0; suits.length < 6 && k < 40; k++) {
      const h = PAL.rerollOne(state.palette, -1).toLowerCase();
      if (!have.has(h) && !suits.includes(h)) suits.push(h);
    }
    const sw = (h) => `<button class="ap-sw" data-hex="${h}" style="--c:${h}" title="${h.toUpperCase()}" aria-label="Add ${h.toUpperCase()}"></button>`;
    addPop.innerHTML = `<div class="ap-h">Suits this palette</div><div class="ap-grid">${suits.map(sw).join('')}</div>` +
      `<div class="ap-h">Festive colours</div><div class="ap-grid">${FESTIVE.filter((h) => !have.has(h)).map(sw).join('')}</div>` +
      `<label class="ap-custom">${icon('drop')}<span>Pick any colour</span><input type="color" value="${suits[0] || '#e34234'}"></label>`;
    addPop.hidden = false;
    const r = btn.getBoundingClientRect(), w = addPop.offsetWidth, h = addPop.offsetHeight;
    let x = r.left - w - 10, y = r.top + r.height / 2 - h / 2;
    if (x < 8) { x = U.clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8); y = r.top - h - 10; }
    addPop.style.left = `${Math.round(x)}px`;
    addPop.style.top = `${Math.round(U.clamp(y, 8, innerHeight - h - 8))}px`;
  }
  const closeAddPop = () => { addPop.hidden = true; };
  addPop.addEventListener('click', (e) => {
    const b = e.target.closest('.ap-sw');
    if (!b) return;
    closeAddPop();
    addColour(b.dataset.hex);
  });
  addPop.addEventListener('change', (e) => {
    if (e.target.type !== 'color') return;
    closeAddPop();
    addColour(e.target.value.toLowerCase());
  });
  document.addEventListener('pointerdown', (e) => {
    if (!addPop.hidden && !addPop.contains(e.target) && !e.target.closest('.sw-add')) closeAddPop();
  });
  palEl.addEventListener('input', (e) => {
    if (e.target.type !== 'color') return;
    const i = +e.target.dataset.i, v = e.target.value;
    state.palette[i].hex = v;
    const sw = e.target.closest('.swatch');
    sw.style.setProperty('--c', v);
    sw.style.setProperty('--t', U.textOn(v));
    sw.querySelector('.hex span').textContent = v.slice(1).toUpperCase();
    renderCanvas();
  });
  palEl.addEventListener('change', (e) => {
    if (e.target.type !== 'color') return;
    const i = +e.target.dataset.i;
    const next = U.clone(state);
    next.palette[i].hex = e.target.value.toLowerCase();
    next.palette[i].locked = true; // an edited colour is a chosen colour
    commit(next, 'update');
  });

  /* ============================================================== gallery */
  const thumbs = new Map(); // id → { ref: state object the thumbnail was drawn from, url }
  function thumbURL(entry) {
    const c = thumbs.get(entry.id);
    if (c && c.ref === entry.state) return c.url;
    if (c) URL.revokeObjectURL(c.url);
    const url = URL.createObjectURL(new Blob([RD.svg(entry.state, { bg: false, size: 240, texture: false })], { type: 'image/svg+xml' }));
    thumbs.set(entry.id, { ref: entry.state, url });
    return url;
  }
  // The gallery lives twice: a one-row strip (sheet closed) and a grid (sheet open). Both are
  // kept in step and simply cross-fade with how far the sheet is pulled up — nothing is ever
  // re-laid out mid-gesture, so there's no jump between "few" and "many" columns.
  const gridEl = $('#galleryGrid');
  const entryById = (id) => gallery.find((g) => g.id === id);
  // thumbnails are drawn lazily, the first time they come into view in either view
  const makeIO = (root) => new IntersectionObserver((list, io) => {
    for (const it of list) {
      if (!it.isIntersecting) continue;
      const f = it.target, en = entryById(f.dataset.id);
      io.unobserve(f);
      if (en) { f.firstElementChild.src = thumbURL(en); f.dataset.drawn = '1'; }
    }
  }, { root, rootMargin: '200px' });
  const views = [
    { el: galEl, figs: new Map(), io: makeIO(galEl) },
    { el: gridEl, figs: new Map(), io: makeIO(gridEl) },
  ];
  function syncView(v, live) {
    for (const [id, f] of v.figs) if (!live.has(id)) { v.io.unobserve(f); f.remove(); v.figs.delete(id); }
    const empty = v.el.querySelector('.gallery-empty');
    if (!gallery.length) { if (!empty) v.el.innerHTML = '<div class="gallery-empty">Every design you generate lands here.</div>'; return; }
    if (empty) empty.remove();
    gallery.forEach((e, i) => {
      let f = v.figs.get(e.id);
      if (!f) {
        f = document.createElement('figure');
        f.className = 'thumb';
        f.dataset.id = e.id;
        f.innerHTML = `<img alt="Rangoli from ${new Date(e.ts).toLocaleString()}" draggable="false">` +
          `<div class="thumb-actions"><button data-act="reuse" title="Reuse — edit on canvas">${icon('edit')}<span>Reuse</span></button>` +
          `<button data-act="download" title="Download PNG">${icon('download')}<span>PNG</span></button></div>`;
        v.figs.set(e.id, f);
        v.io.observe(f);
      } else if (f.dataset.drawn) {
        const url = thumbURL(e); // cheap when unchanged
        if (f.firstElementChild.getAttribute('src') !== url) f.firstElementChild.src = url;
      }
      f.classList.toggle('current', e.id === currentEntry);
      f.classList.toggle('source', e.id === sourceEntry);
      if (v.el.children[i] !== f) v.el.insertBefore(f, v.el.children[i] || null);
    });
  }
  function renderGallery() {
    const live = new Set(gallery.map((g) => g.id));
    for (const [id, c] of thumbs) if (!live.has(id)) { URL.revokeObjectURL(c.url); thumbs.delete(id); }
    views.forEach((v) => syncView(v, live));
  }
  function reuse(id) {
    const e = gallery.find((g) => g.id === id);
    if (!e) return;
    hideToolbar();
    currentEntry = null;
    sourceEntry = id;
    commit(U.clone(e.state), 'none');
    closeDrawer();
    toast('Loaded onto the canvas — edits save as a new design');
  }
  const onThumbClick = (e) => {
    const fig = e.target.closest('.thumb');
    if (!fig) return;
    const b = e.target.closest('button');
    if (b && b.dataset.act === 'download') {
      const en = gallery.find((g) => g.id === fig.dataset.id);
      if (en) exportPNG(en.state, false);
      return;
    }
    reuse(fig.dataset.id);
  };
  galEl.addEventListener('click', onThumbClick);
  gridEl.addEventListener('click', onThumbClick);
  galEl.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { galEl.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });

  // Bottom sheet. It always has its full open height and slides with a transform (GPU, no
  // layout per frame); GSAP Draggable handles the drag. While it moves, its frosted blur is
  // switched off (re-blurring a big moving area every frame is what made it stutter) and the
  // rangoli ignores hover. On mobile the same sheet holds two tabs: Decorate (default) and Gallery.
  const hasGsap = !!(window.gsap && window.Draggable);
  if (hasGsap) gsap.registerPlugin(Draggable);
  const collapsedH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--drawer')) || 118;
  const sheetH = () => Math.round(innerHeight * (mqMobile.matches ? 0.78 : 0.8));
  let sheetOpen = false, closedY = 0;
  // how far open the sheet is (0 closed … 1 open) drives the strip/grid cross-fade
  function setProgress() {
    const y = hasGsap ? gsap.getProperty(drawer, 'y') : (sheetOpen ? 0 : closedY);
    const p = closedY ? U.clamp(1 - y / closedY, 0, 1) : 0;
    drawer.style.setProperty('--p', p.toFixed(3));
    drawer.classList.toggle('open', p > 0.5);
  }
  const setY = (y, dur) => {
    if (!hasGsap) { drawer.style.transform = `translateY(${y}px)`; return setProgress(); }
    drawer.classList.add('moving');
    gsap.to(drawer, { y, duration: dur, ease: 'power3.out', overwrite: true, onUpdate: setProgress,
      onComplete() { setProgress(); drawer.classList.remove('moving'); } });
  };
  function layoutSheet() {
    drawer.style.height = sheetH() + 'px';
    closedY = sheetH() - collapsedH();
    if (hasGsap) gsap.set(drawer, { y: sheetOpen ? 0 : closedY }); else drawer.style.transform = `translateY(${sheetOpen ? 0 : closedY}px)`;
    setProgress();
    if (dragger) dragger.applyBounds({ minY: 0, maxY: closedY });
  }
  function setOpen(open) {
    sheetOpen = open;
    if (open) gridEl.scrollTop = 0;
    setY(open ? 0 : closedY, 0.45);
    scrim.classList.toggle('on', open);
  }
  const closeDrawer = () => setOpen(false);
  let dragger = null;
  if (hasGsap) {
    [dragger] = Draggable.create(drawer, {
      type: 'y', trigger: handle, bounds: { minY: 0, maxY: 1 }, dragClickables: false, minimumMovement: 4,
      onPress() { hideToolbar(); },
      onDragStart() { drawer.classList.add('moving'); document.body.classList.add('sheet-drag'); },
      onDrag() { setProgress(); scrim.classList.toggle('on', this.y < closedY * 0.6); },
      onRelease() {
        document.body.classList.remove('sheet-drag');
        if (!this.isDragging) return;
        const moved = this.y - this.startY;
        setOpen(Math.abs(moved) < 50 ? sheetOpen : moved < 0);
      },
      onClick(e) {
        // taps on the tab buttons are handled by the tabs themselves
        const t = (e && e.target) || (this.pointerEvent && this.pointerEvent.target);
        if (t && t.closest && t.closest('button')) return;
        setOpen(!sheetOpen);
      },
    });
  } else {
    handle.addEventListener('click', (e) => { if (!e.target.closest('button')) setOpen(!sheetOpen); });
  }
  scrim.addEventListener('click', closeDrawer);

  // Mobile: the decorate panel's contents live in the sheet, under a Decorate tab.
  const decorBody = $('.decor-body'), paneDecor = $('#paneDecor');
  function setTab(tab) {
    drawer.dataset.tab = tab;
    drawer.querySelectorAll('.sheet-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  }
  drawer.querySelector('.sheet-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    if (sheetOpen && drawer.dataset.tab === b.dataset.tab) return setOpen(false);
    setTab(b.dataset.tab);
    setOpen(true);
  });
  function placeDecor() {
    if (mqMobile.matches) { paneDecor.appendChild(decorBody); setDecor(false); }
    else $('#decorPanel').appendChild(decorBody);
    layoutSheet();
  }
  setTab('decor');
  mqMobile.addEventListener('change', placeDecor);
  window.addEventListener('resize', () => { hideToolbar(); hideStkbar(); setK(); renderToran(true); layoutSheet(); });

  /* ======================================================= share & export */
  let hashT;
  function syncHashSoon() {
    clearTimeout(hashT);
    hashT = setTimeout(async () => {
      try { history.replaceState(null, '', '#d=' + (await ST.encode(state))); } catch (e) { /* ignore */ }
    }, 450);
  }
  async function shareLink() {
    const url = location.href.split('#')[0] + '#d=' + (await ST.encode(state));
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
      ta.remove();
    }
    toast('Link copied — it opens this exact design');
  }
  const fileName = () => 'rangoli-' + new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  function downloadBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function exportSVG(s) {
    downloadBlob(new Blob([RD.svg(s, {})], { type: 'image/svg+xml' }), fileName() + '.svg');
  }
  async function exportPNG(s, transparent) {
    const size = 2400;
    const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(RD.svg(s, { size, bg: transparent ? false : undefined }));
    const img = new Image();
    img.src = src;
    try { await img.decode(); } catch (e) { return toast('Could not render PNG in this browser'); }
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    cv.getContext('2d').drawImage(img, 0, 0, size, size);
    cv.toBlob((b) => b && downloadBlob(b, fileName() + '.png'), 'image/png');
  }


  /* ================================================================ scene */
  // The setting around the rangoli: floor, toran over the door, and stickers placed on the floor.
  // Sticker positions are in rangoli units (the canvas is 880 units wide) so they stay put
  // relative to the rangoli at any screen size; --k converts units to px in CSS.
  const SC = R.scene;
  const stkEl = $('#stickers'), stkbar = $('#stkbar'), toranEl = $('#toran'), decorEl = $('#decor');
  const STK_SIZE = 110;
  let unitK = 1;
  function setK() {
    unitK = wrap.clientWidth / 880 || 1;
    wrap.style.setProperty('--k', unitK.toFixed(4));
  }
  let sceneKey = '';
  function renderScene() {
    const sc = state.scene;
    const key = sc.floor + '|' + sc.toran + '|' + mqMobile.matches;
    if (key !== sceneKey) {
      sceneKey = key;
      const t = SC.floorTile(sc.floor);
      document.body.classList.toggle('on-floor', !!t);
      document.body.style.backgroundImage = t
        ? `radial-gradient(120% 85% at 50% 30%, rgba(255,255,255,.14), rgba(255,255,255,0) 60%), radial-gradient(140% 110% at 50% 50%, rgba(20,8,4,0) 50%, rgba(20,8,4,.14)), url("${t.url}")`
        : '';
      // phones get smaller tiles, so the floor reads as tiles rather than a few giant squares
      const tk = mqMobile.matches ? 0.58 : 1;
      document.body.style.backgroundSize = t ? `auto, auto, ${(t.w * tk).toFixed(1)}px ${(t.h * tk).toFixed(1)}px` : '';
      document.documentElement.classList.toggle('toran-on', sc.toran);
      renderToran();
      setK();
      decorEl.querySelectorAll('[data-floor]').forEach((b) => b.classList.toggle('on', b.dataset.floor === sc.floor));
      $('#toranTgl').checked = sc.toran;
    }
    // the swept, washed patch the rangoli is drawn on: dark under a light palette, pale under a dark one
    const w = washColor();
    wrap.style.setProperty('--wash', w ? w.css : 'transparent');
    renderStickers();
  }
  function washColor() {
    return null; // the patch under the rangoli read as a drop shadow — the floors are calm enough without it
    if (state.scene.floor === 'plain') return null;
    if (SC.FLOORS[state.scene.floor].noWash) return null; // simple, small pattern: the rangoli reads on it directly
    const lum = state.palette.reduce((a, c) => a + U.luminance(c.hex), 0) / state.palette.length;
    return lum > 0.3 ? { hex: '#2b1810', op: 0.62, css: 'rgba(43,24,16,.62)' } : { hex: '#f3e8d6', op: 0.82, css: 'rgba(243,232,214,.82)' };
  }
  let toranW = 0;
  const TORAN_EXTRA = 240; // phone: extra toran width (it starts 72px off the left edge, see CSS)
  function renderToran(force) {
    const on = state && state.scene.toran;
    toranEl.hidden = !on;
    if (!on) return;
    // on a phone the scene pans, so the toran runs past both edges of the screen
    const W = window.innerWidth + (mqMobile.matches ? TORAN_EXTRA : 0);
    if (!force && W === toranW && toranEl.src) return;
    toranW = W;
    const T = SC.toran(W, window.innerWidth < 760);
    toranEl.style.width = W + 'px';
    toranEl.style.height = T.H + 'px';
    toranEl.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${T.H}" viewBox="0 0 ${W} ${T.H}">${T.inner}</svg>`);
  }
  function renderStickers() {
    const list = state.scene.stickers;
    const have = new Map([...stkEl.children].map((el) => [el.dataset.id, el]));
    list.forEach((k, i) => {
      let el = have.get(k.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'stk';
        el.dataset.id = k.id;
        el.innerHTML = `<img src="${SC.stickerURL(k.t)}" alt="${SC.ST[k.t].name}" draggable="false">` +
          `<div class="stk-box"><i class="h nw"></i><i class="h ne"></i><i class="h sw"></i><i class="h se"></i><b class="rot"><i class="rot-dot" title="Rotate (shift to snap)"></i></b></div>`;
      }
      have.delete(k.id);
      const B = SC.stickerBox(k.t);
      el.style.cssText = `--x:${k.x.toFixed(1)};--y:${k.y.toFixed(1)};--s:${k.s.toFixed(1)};--r:${k.r.toFixed(1)}deg;--f:${k.f ? -1 : 1};--aw:${B.aw.toFixed(3)};--ah:${B.ah.toFixed(3)};z-index:${i + 1}`;
      if (stkEl.children[i] !== el) stkEl.insertBefore(el, stkEl.children[i] || null);
    });
    have.forEach((el) => el.remove());
    if (stkHover && !list.some((k) => k.id === stkHover)) hideStkbar();
  }
  const stkById = (s, id) => s.scene.stickers.find((k) => k.id === id);
  function addSticker(t, x, y) {
    const id = U.uid();
    edit((s) => { s.scene.stickers.push({ id, t, x, y, s: STK_SIZE, r: Math.round(U.rand(-12, 12)), f: false }); });
    const el = stkEl.querySelector(`[data-id="${id}"]`);
    if (el && el.animate) el.animate([{ scale: '.4', opacity: 0 }, { scale: '1.08', opacity: 1, offset: 0.7 }, { scale: '1' }], { duration: 320, easing: 'ease-out' });
  }
  function removeSticker(id) {
    const k = stkById(state, id);
    if (!k) return;
    hideStkbar();
    edit((s) => { s.scene.stickers = s.scene.stickers.filter((q) => q.id !== id); });
    toast(`${SC.ST[k.t].name} removed`, { label: 'Undo', fn: undo });
  }
  // client px → rangoli units
  const toUnits = (cx, cy) => {
    const r = wrap.getBoundingClientRect();
    return { x: (cx - r.left - r.width / 2) / unitK, y: (cy - r.top - r.height / 2) / unitK };
  };
  // somewhere free around the rangoli, inside the visible floor
  function freeSpot() {
    const r = wrap.getBoundingClientRect(), stage = $('.stage').getBoundingClientRect();
    const m = 50, maxX = (decorEl.classList.contains('open') && !mqMobile.matches ? decorEl.getBoundingClientRect().left : innerWidth) - m;
    for (let i = 0; i < 40; i++) {
      const a = U.rand(Math.PI * 2), d = U.rand(400, 520) * unitK;
      const cx = U.clamp(r.left + r.width / 2 + Math.cos(a) * d, m, maxX), cy = U.clamp(r.top + r.height / 2 + Math.sin(a) * d, stage.top + m + 40, stage.bottom - m);
      const p = toUnits(cx, cy);
      if (state.scene.stickers.every((k) => Math.hypot(k.x - p.x, k.y - p.y) > 80)) return p;
    }
    return toUnits(r.left + r.width / 2 + U.rand(-1, 1) * r.width * 0.5, r.bottom - 40);
  }

  // Selecting a sticker, Figma/Canva style: click it to get a box with four corner handles
  // (resize, aspect ratio kept) and a green dot on a stem below it (rotate; hold shift to snap
  // to 15°). A small bar above offers flip and duplicate. Drag the sticker itself to move it, or
  // onto the bin to throw it away.
  let stkHover = null; // the selected sticker
  stkbar.innerHTML = [['flip', 'Flip'], ['copy', 'Duplicate']]
    .map(([k, t]) => `<button class="mini" data-act="${k}" title="${t}" aria-label="${t}">${icon(k)}</button>`).join('');
  function placeStkbar(el) {
    const wr = wrap.getBoundingClientRect(), er = el.getBoundingClientRect();
    const w = stkbar.offsetWidth, h = stkbar.offsetHeight;
    const x = er.left + er.width / 2 - wr.left - w / 2;
    let y = er.top - wr.top - h - 12;
    if (er.top - h - 12 < $('.stage').getBoundingClientRect().top) y = er.bottom - wr.top + 44;
    stkbar.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
  }
  function showStkbar(id) {
    const el = stkEl.querySelector(`[data-id="${id}"]`);
    if (!el) return;
    hideToolbar();
    stkEl.querySelectorAll('.stk.sel').forEach((q) => q !== el && q.classList.remove('sel'));
    el.classList.add('sel');
    stkHover = id;
    stkbar.hidden = false;
    placeStkbar(el);
  }
  function hideStkbar() {
    stkbar.hidden = true; stkHover = null;
    stkEl.querySelectorAll('.stk.sel').forEach((q) => q.classList.remove('sel'));
  }
  // clicking anywhere else deselects
  document.addEventListener('pointerdown', (e) => {
    if (stkHover && !e.target.closest('.stk') && !e.target.closest('.stkbar')) hideStkbar();
  });
  stkbar.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    const id = stkHover;
    if (!b || !id) return;
    if (b.dataset.act === 'copy') {
      const k = stkById(state, id), nid = U.uid();
      edit((s) => { s.scene.stickers.push({ ...k, id: nid, x: k.x + 46, y: k.y + 34 }); });
      return showStkbar(nid);
    }
    edit((s) => { const k = stkById(s, id); k.f = !k.f; });
    showStkbar(id);
  });

  // pointer gestures on stickers: move (the sticker), resize (a corner), rotate (the green dot)
  let sdrag = null, sxf = null;
  const centreOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  stkEl.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.stk');
    if (!el || e.button !== 0) return;
    e.preventDefault();
    const k = stkById(state, el.dataset.id);
    const mode = e.target.classList.contains('h') ? 'size' : e.target.classList.contains('rot-dot') ? 'rot' : null;
    if (mode && k) {
      const c = centreOf(el);
      sxf = { mode, id: k.id, el, c, d0: Math.max(8, Math.hypot(e.clientX - c.x, e.clientY - c.y)),
        a0: Math.atan2(e.clientY - c.y, e.clientX - c.x), s0: k.s, r0: k.r, s: k.s, r: k.r };
      el.classList.add('sizing');
      stkbar.hidden = true;
      try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      return;
    }
    sdrag = { id: el.dataset.id, el, sx: e.clientX, sy: e.clientY, started: false, cur: { x: 0, y: 0 }, tgt: { x: 0, y: 0 } };
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  function sTick() {
    if (!sdrag || !sdrag.started) return;
    const c = sdrag.cur, t = sdrag.tgt;
    c.x += (t.x - c.x) * EASE; c.y += (t.y - c.y) * EASE;
    sdrag.el.style.translate = `${c.x.toFixed(1)}px ${c.y.toFixed(1)}px`;
    sdrag.raf = requestAnimationFrame(sTick);
  }
  stkEl.addEventListener('pointermove', (e) => {
    if (sxf) {
      if (sxf.mode === 'size') {
        // the corner stays under the pointer: size scales with its distance from the centre
        sxf.s = U.clamp(sxf.s0 * (Math.hypot(e.clientX - sxf.c.x, e.clientY - sxf.c.y) / sxf.d0), 36, 460);
        sxf.el.style.setProperty('--s', sxf.s.toFixed(1));
      } else {
        let r = sxf.r0 + ((Math.atan2(e.clientY - sxf.c.y, e.clientX - sxf.c.x) - sxf.a0) * 180) / Math.PI;
        if (e.shiftKey) r = Math.round(r / 15) * 15;
        sxf.r = ((r % 360) + 540) % 360 - 180;
        sxf.el.style.setProperty('--r', sxf.r.toFixed(1) + 'deg');
      }
      return;
    }
    if (!sdrag) return;
    const dx = e.clientX - sdrag.sx, dy = e.clientY - sdrag.sy;
    if (!sdrag.started) {
      if (Math.hypot(dx, dy) < 5) return;
      sdrag.started = true;
      hideStkbar(); hideToolbar();
      sdrag.el.classList.add('held');
      document.body.classList.add('dragging');
      sdrag.raf = requestAnimationFrame(sTick);
    }
    sdrag.tgt.x = dx; sdrag.tgt.y = dy;
    const hot = overTrash(e, sdrag.hot);
    if (hot !== !!sdrag.hot) {
      sdrag.hot = hot;
      trashEl.classList.toggle('hot', hot);
      sdrag.el.classList.toggle('doomed', hot);
      if (hot) placeGhost(`<img src="${sdrag.el.querySelector('img').src}" alt="">`, true); else dropGhost(false);
    }
  });
  function endSticker(e, cancelled) {
    if (sxf) {
      const z = sxf;
      sxf = null;
      z.el.classList.remove('sizing');
      if (cancelled) { z.el.style.setProperty('--s', z.s0.toFixed(1)); z.el.style.setProperty('--r', z.r0 + 'deg'); return; }
      edit((s) => { const k = stkById(s, z.id); if (k) { k.s = z.s; k.r = z.r; } });
      return showStkbar(z.id);
    }
    if (!sdrag) return;
    const d = sdrag;
    sdrag = null;
    cancelAnimationFrame(d.raf);
    document.body.classList.remove('dragging');
    if (!d.started) { if (!cancelled) showStkbar(d.id); return; } // a click selects
    d.el.classList.remove('held');
    if (!cancelled && d.hot) {
      d.el.style.opacity = '0';
      const k = stkById(state, d.id);
      gulp(() => {
        edit((s) => { s.scene.stickers = s.scene.stickers.filter((q) => q.id !== d.id); });
        if (k) toast(`${SC.ST[k.t].name} removed`, { label: 'Undo', fn: undo });
      });
      return;
    }
    trashEl.classList.remove('hot');
    dropGhost(false);
    d.el.classList.remove('doomed');
    if (cancelled) { d.el.style.translate = ''; return; }
    const dx = (e.clientX - d.sx) / unitK, dy = (e.clientY - d.sy) / unitK;
    d.el.style.translate = '';
    edit((s) => { const k = stkById(s, d.id); k.x += dx; k.y += dy; });
    showStkbar(d.id);
  }
  stkEl.addEventListener('pointerup', (e) => endSticker(e, false));
  stkEl.addEventListener('pointercancel', (e) => endSticker(e, true));
  stkEl.addEventListener('lostpointercapture', (e) => { if (sdrag || sxf) endSticker(e, !sdrag || !sdrag.started); });

  /* ---------------------------------------------------- decorate panel */
  function setDecor(open) {
    decorEl.classList.remove('peek');
    decorEl.classList.toggle('open', open);
    $('#decorTab').setAttribute('aria-expanded', String(open));
  }
  $('#decorTab').addEventListener('click', () => setDecor(!decorEl.classList.contains('open')));
  $('#floors').innerHTML = Object.entries(SC.FLOORS).map(([k, F]) => {
    const t = SC.floorTile(k);
    return `<button class="floor-btn" data-floor="${k}"><span class="floor-sw" style="${t ? `background-image:url('${t.url}');background-size:${t.w * 0.55}px ${t.h * 0.55}px` : 'background:#fff'}"></span><span>${F.name}</span></button>`;
  }).join('');
  $('#floors').addEventListener('click', (e) => {
    const b = e.target.closest('[data-floor]');
    if (b && b.dataset.floor !== state.scene.floor) edit((s) => { s.scene.floor = b.dataset.floor; });
  });
  $('#toranTgl').addEventListener('change', (e) => edit((s) => { s.scene.toran = e.target.checked; }));
  $('#stkCats').innerHTML = SC.CATS.map((c) => `<div class="decor-sec"><h3>${c}</h3><div class="stk-grid">` +
    Object.entries(SC.ST).filter(([, v]) => v.cat === c).map(([k, v]) =>
      `<button class="stk-tile" data-t="${k}" title="${v.name}" aria-label="Add ${v.name}"><img src="${SC.stickerURL(k)}" alt="" draggable="false"><span>${v.name}</span></button>`).join('') +
    '</div></div>').join('');

  // Drag a sticker out of the panel onto the floor (or tap it to drop it somewhere free).
  let pdrag = null;
  $('#stkCats').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.stk-tile');
    if (!b || e.button !== 0) return;
    e.preventDefault();
    pdrag = { t: b.dataset.t, sx: e.clientX, sy: e.clientY, started: false };
    try { b.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  $('#stkCats').addEventListener('pointermove', (e) => {
    if (!pdrag) return;
    if (!pdrag.started) {
      if (Math.hypot(e.clientX - pdrag.sx, e.clientY - pdrag.sy) < 6) return;
      pdrag.started = true;
      const f = document.createElement('img');
      f.className = 'stk-float';
      f.src = SC.stickerURL(pdrag.t);
      const B = SC.stickerBox(pdrag.t);
      f.style.width = (STK_SIZE * unitK * B.aw).toFixed(0) + 'px';
      f.style.height = (STK_SIZE * unitK * B.ah).toFixed(0) + 'px';
      document.body.appendChild(f);
      pdrag.f = f;
      decorEl.classList.add('peek'); // slide the panel aside so the whole floor is free
      if (mqMobile.matches) setOpen(false);
    }
    pdrag.f.style.translate = `${e.clientX}px ${e.clientY}px`;
  });
  function endPanelDrag(e, cancelled) {
    if (!pdrag) return;
    const d = pdrag;
    pdrag = null;
    decorEl.classList.remove('peek');
    if (d.f) d.f.remove();
    if (cancelled) return;
    if (!d.started) {
      if (mqMobile.matches) setOpen(false);
      const p = freeSpot();
      return addSticker(d.t, p.x, p.y);
    }
    const st = $('.stage').getBoundingClientRect();
    if (e.clientY < st.top || e.clientY > st.bottom) return;
    const p = toUnits(e.clientX, e.clientY);
    addSticker(d.t, p.x, p.y);
  }
  $('#stkCats').addEventListener('pointerup', (e) => endPanelDrag(e, false));
  $('#stkCats').addEventListener('pointercancel', (e) => endPanelDrag(e, true));
  $('#stkCats').addEventListener('lostpointercapture', (e) => endPanelDrag(e, !pdrag || !pdrag.started));
  window.addEventListener('pointerup', (e) => { if (pdrag) endPanelDrag(e, false); });

  /* ------------------------------------------------- whole-picture export */
  // What you see: the floor, the rangoli, every sticker and the toran, at 2.5× screen size.
  function sceneSVG() {
    const hb = $('.topbar').getBoundingClientRect().bottom;
    const db = drawer.getBoundingClientRect().top;
    const W = Math.round(innerWidth), H = Math.round(db - hb);
    const wr = wrap.getBoundingClientRect();
    const cx = wr.left + wr.width / 2, cy = wr.top + wr.height / 2 - hb, k = unitK;
    const sc = state.scene, t = SC.floorTile(sc.floor);
    let defs = '', body = `<rect width="${W}" height="${H}" fill="#ffffff"/>`;
    if (t) {
      defs += `<pattern id="xfloor" patternUnits="userSpaceOnUse" x="0" y="${(-hb).toFixed(1)}" width="${t.w}" height="${t.h}"><svg width="${t.w}" height="${t.h}" viewBox="0 0 ${t.vw} ${t.vh}">${t.inner}</svg></pattern>` +
        `<radialGradient id="xsheen" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
        `<radialGradient id="xvig" cx="50%" cy="50%" r="80%"><stop offset=".5" stop-color="#140804" stop-opacity="0"/><stop offset="1" stop-color="#140804" stop-opacity=".14"/></radialGradient>`;
      body += `<rect width="${W}" height="${H}" fill="url(#xfloor)"/><rect width="${W}" height="${H}" fill="url(#xsheen)"/><rect width="${W}" height="${H}" fill="url(#xvig)"/>`;
    }
    const wc = washColor();
    if (wc) {
      defs += `<radialGradient id="xwash"><stop offset=".78" stop-color="${wc.hex}" stop-opacity="${wc.op}"/><stop offset="1" stop-color="${wc.hex}" stop-opacity="0"/></radialGradient>`;
      body += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(493 * k).toFixed(1)}" fill="url(#xwash)"/>`;
    }
    body += `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${k.toFixed(4)})">${RD.inner(state, {})}</g>`;
    for (const q of sc.stickers) {
      const B = SC.stickerBox(q.t), w = q.s * k * B.aw, h = q.s * k * B.ah;
      body += `<g transform="translate(${(cx + q.x * k).toFixed(1)} ${(cy + q.y * k).toFixed(1)}) rotate(${q.r}) scale(${q.f ? -1 : 1} 1)">` +
        `<svg x="${(-w / 2).toFixed(1)}" y="${(-h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="${B.vb}" overflow="visible">${SC.stickerInner(q.t)}</svg></g>`;
    }
    if (sc.toran) {
      const T = SC.toran(W, W < 760);
      body += `<svg x="0" y="0" width="${W}" height="${T.H}" viewBox="0 0 ${W} ${T.H}">${T.inner}</svg>`;
    }
    return { W, H, svg: (sw, sh) => `<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>` };
  }
  async function exportScene() {
    toast('Preparing your picture…');
    const S = sceneSVG(), sc = Math.min(2.5, 5000 / Math.max(S.W, S.H));
    const w = Math.round(S.W * sc), h = Math.round(S.H * sc);
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(S.svg(w, h));
    try { await img.decode(); } catch (e) { return toast('Could not render the picture in this browser'); }
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(img, 0, 0, w, h);
    cv.toBlob((b) => { if (b) { downloadBlob(b, fileName() + '-scene.png'); toast('Picture downloaded'); } }, 'image/png');
  }

  /* ============================================================ header UI */
  function closePops() { document.querySelectorAll('.pop.on').forEach((p) => p.classList.remove('on')); }
  function togglePop(id) {
    const p = $(id), was = p.classList.contains('on');
    closePops();
    if (!was) p.classList.add('on');
  }
  $('#btnExport').addEventListener('click', (e) => { e.stopPropagation(); togglePop('#popExport'); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.pop')) closePops(); });
  $('#popExport').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    closePops();
    if (b.dataset.export === 'svg') exportSVG(state);
    else if (b.dataset.export === 'scene') exportScene();
    else exportPNG(state, b.dataset.export === 'pngt');
  });
  $('#btnGenerateMobile').addEventListener('click', generate);

  document.addEventListener('keydown', (e) => {
    if (fullDlg.open) return; // the dialog handles its own keys
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    const mod = e.metaKey || e.ctrlKey;
    if (e.code === 'Space') {
      e.preventDefault();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      if (!e.repeat) generate();
    } else if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if (!mod && e.key.toLowerCase() === 'l' && focusId) toggleLock(focusId);
    else if (!mod && (e.key === 'Delete' || e.key === 'Backspace') && focusId) { e.preventDefault(); removeEl(focusId); }
    else if (!mod && (e.key === 'Delete' || e.key === 'Backspace') && stkHover) { e.preventDefault(); removeSticker(stkHover); }
    else if (e.key === 'Escape') { closeDrawer(); hideToolbar(); closePops(); setDecor(false); closeAddPop(); }
  });

  let toastT;
  function toast(msg, action, ms = 3200) {
    toastEl.textContent = '';
    const sp = document.createElement('span');
    sp.textContent = msg;
    toastEl.append(sp);
    if (action) {
      const b = document.createElement('button');
      b.textContent = action.label;
      b.onclick = () => { action.fn(); toastEl.classList.remove('on'); };
      toastEl.append(b);
    }
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('on'), ms);
  }

  /* ================================================================= boot */
  (async function init() {
    placeDecor();
    gallery = ST.loadGallery()
      .map((e) => (e && typeof e.id === 'string' && /^[a-z0-9]{1,16}$/i.test(e.id) ? { id: e.id, ts: Number(e.ts) || Date.now(), state: G.sanitize(e.state) } : null))
      .filter((e) => e && e.state);
    let s = null;
    const m = location.hash.match(/^#d=([zj][A-Za-z0-9_-]+)$/);
    if (m) { try { s = G.sanitize(await ST.decode(m[1])); } catch (e) { s = null; } }
    if (s) {
      const json = ST.canon(s);
      const ex = gallery.find((g) => ST.canon(g.state) === json);
      if (ex) { currentEntry = ex.id; commit(s, 'none'); } else commit(s, 'new');
    } else {
      // no link: reopen the design you had open last time, decorations and all
      let last = null;
      try { last = JSON.parse(localStorage.getItem('rangoli.current.v1') || 'null'); } catch (e) { last = null; }
      const ls = last && G.sanitize(last.s);
      if (ls) {
        const json = ST.canon(ls);
        const ex = gallery.find((g) => g.id === last.e) || gallery.find((g) => ST.canon(g.state) === json);
        if (ex) { currentEntry = ex.id; commit(ls, 'update'); } else commit(ls, 'new');
      } else commit(G.generate(null), 'new');
    }
  })();
})();
