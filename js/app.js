/* IT Store Inventory – static site. No build step, no dependencies.
   Inventory content lives in data/inventory.js. The room layout is the CABINETS list below. */
(function () {
  'use strict';

  const DATA = window.INVENTORY || { summary: {}, notes: {}, cabinets: {} };
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------------
     ROOM LAYOUT  (SVG units; map is 980 x 540)
     All cabinets are the same size (150 x 80). The two on the left wall
     are the same cabinet turned 90 degrees (80 x 150).
     To move a cabinet, change its x / y.
  ------------------------------------------------------------------ */
  const LONG = 150, SHORT = 80;
  const CABINETS = [
    { id: 'HC-10', x: 40,  y: 40,  w: SHORT, h: LONG },
    { id: 'HC-09', x: 40,  y: 210, w: SHORT, h: LONG },
    { id: 'HC-06', x: 160, y: 40,  w: LONG,  h: SHORT },
    { id: 'HC-07', x: 330, y: 40,  w: LONG,  h: SHORT },
    { id: 'HC-08', x: 500, y: 40,  w: LONG,  h: SHORT },
    { id: 'LC-01', x: 40,  y: 430, w: LONG,  h: SHORT },
    { id: 'LC-02', x: 210, y: 430, w: LONG,  h: SHORT },
    { id: 'LC-03', x: 380, y: 430, w: LONG,  h: SHORT },
    { id: 'LC-04', x: 550, y: 430, w: LONG,  h: SHORT },
    { id: 'LC-05', x: 720, y: 430, w: LONG,  h: SHORT },
  ];
  const TABLE = { x: 178, y: 170, w: 466, h: 112 };
  const PROJECTS = [
    { id: 'PRJ-FINGER', name: 'Finger Prick Simulator', lines: ['Finger Prick', 'Sim.'], x: 198, y: 189, w: 130, h: 74 },
    { id: 'PRJ-HEEL',   name: 'Heel Prick Simulator',   lines: ['Heel Prick', 'Sim.'],    x: 346, y: 189, w: 130, h: 74 },
    { id: 'PRJ-SCALP',  name: 'Scalp Block',            lines: ['Scalp', 'Block'],        x: 494, y: 189, w: 130, h: 74 },
  ];

  /* ------------------------------------------------------------------ helpers */
  const $ = (s) => document.querySelector(s);
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === 'class') e.className = props[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), props[k]);
      else if (props[k] !== false && props[k] != null) e.setAttribute(k, props[k]);
    }
    kids.flat().forEach((c) => { if (c != null && c !== false) e.append(c); });
    return e;
  }
  function s(tag, attrs, ...kids) {
    const e = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    kids.flat().forEach((c) => { if (c != null) e.append(c); });
    return e;
  }
  /* tiny inline icon set (stroke icons, 24x24) */
  const ICONS = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    cabinet: '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M4 12h16M10 7.5h4M10 16h4"/>',
    box: '<path d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/>',
    tag: '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7a1 1 0 0 1 .7.3l7.6 7.6a1 1 0 0 1 0 1.4l-7.7 7.7a1 1 0 0 1-1.4 0l-7.6-7.6a1 1 0 0 1-.3-.7z"/><circle cx="8" cy="8" r="1.4"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/><path d="M9 4.5h6v2.5H9zM8.5 12h7M8.5 16h5"/>'
  };
  function ico(name, cls) {
    const sv = document.createElementNS(SVGNS, 'svg');
    sv.setAttribute('viewBox', '0 0 24 24');
    sv.setAttribute('aria-hidden', 'true');
    sv.setAttribute('class', 'ico' + (cls ? ' ' + cls : ''));
    sv.innerHTML = ICONS[name];            // fixed, trusted markup
    return sv;
  }
  function hl(text, tokens) {            // highlight query words inside text (safe: no innerHTML)
    const frag = document.createDocumentFragment();
    const toks = (tokens || []).filter(Boolean).map(escRe);
    if (!text) return frag;
    if (!toks.length) { frag.append(text); return frag; }
    String(text).split(new RegExp('(' + toks.join('|') + ')', 'gi')).forEach((part, i) => {
      if (i % 2 === 1) frag.append(h('mark', null, part)); else if (part) frag.append(part);
    });
    return frag;
  }
  const tagHit = (tag, tokens) => tokens.some((t) => {
    const n = norm(t);
    return tag.toLowerCase().includes(t) || (n.length >= 3 && norm(tag).includes(n));
  });
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const cabinetCfg = (id) => CABINETS.find((c) => c.id === id);
  const projectCfg = (id) => PROJECTS.find((p) => p.id === id);
  const itemsOf = (id) => DATA.cabinets[id] || [];
  const tagCount = (id) => itemsOf(id).reduce((n, i) => n + i.tags.length, 0);
  const locLabel = (id) => (projectCfg(id) ? 'Centre table' : id);

  /* ------------------------------------------------------------------ search index */
  const ENTRIES = [];
  CABINETS.forEach((c) => {
    itemsOf(c.id).forEach((it) => ENTRIES.push({
      loc: c.id, kind: 'item', item: it,
      hay: [it.name, it.qty, it.condition, it.remarks, it.tags.join(' '), c.id].join(' ').toLowerCase(),
      norm: it.tags.map(norm).concat(norm(c.id)).join(' '),
    }));
    ((DATA.notes || {})[c.id] || []).forEach((t) => {
      const text = t.charAt(0).toUpperCase() + t.slice(1);
      ENTRIES.push({ loc: c.id, kind: 'note', text, hay: (t + ' ' + c.id).toLowerCase(), norm: norm(c.id) });
    });
  });
  PROJECTS.forEach((p) => ENTRIES.push({
    loc: p.id, kind: 'project', name: p.name,
    hay: (p.name + ' in-house innovation project table centre center').toLowerCase(), norm: '',
  }));

  function runSearch(q) {
    const tokens = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return { tokens, hits: [], byLoc: new Map() };
    const hits = ENTRIES.filter((e) => tokens.every((t) => {
      if (e.hay.includes(t)) return true;
      const n = norm(t);
      return n.length >= 3 && e.norm.includes(n);
    }));
    // typing just a cabinet name (e.g. "LC-01") should show that cabinet even if it has no list
    const qn = norm(q);
    CABINETS.forEach((c) => {
      if (norm(c.id) === qn && !hits.some((e) => e.loc === c.id)) hits.push({ loc: c.id, kind: 'empty' });
    });
    const order = CABINETS.map((c) => c.id).concat(PROJECTS.map((p) => p.id));
    hits.sort((a, b) => order.indexOf(a.loc) - order.indexOf(b.loc));
    const byLoc = new Map();
    hits.forEach((e) => { if (!byLoc.has(e.loc)) byLoc.set(e.loc, []); byLoc.get(e.loc).push(e); });
    return { tokens, hits, byLoc };
  }

  /* ------------------------------------------------------------------ state */
  const state = { tab: 'map', q: '', cab: null, flash: null };
  let current = { tokens: [], hits: [], byLoc: new Map() };

  function writeHash() {
    const p = new URLSearchParams();
    p.set('tab', state.tab);
    if (state.q) p.set('q', state.q);
    if (state.cab) p.set('cab', state.cab);
    try { history.replaceState(null, '', '#' + p.toString()); } catch (e) { /* file:// quirks */ }
  }
  function readHash() {
    const p = new URLSearchParams(location.hash.replace(/^#/, ''));
    return { tab: p.get('tab'), q: p.get('q') || '', cab: p.get('cab') };
  }

  /* ------------------------------------------------------------------ map */
  const map = $('#map');
  const nodes = new Map();   // loc id -> <g>

  function pinFor(cx, cy) {
    return s('g', { class: 'pin', transform: `translate(${cx} ${cy})` },
      s('circle', { class: 'ring', r: 13 }),
      s('circle', { class: 'dot', r: 14 }),
      s('text', { class: 'pinNum' }, '1'));
  }

  function buildMap() {
    map.append(
      s('defs', null, s('pattern', { id: 'dots', width: 24, height: 24, patternUnits: 'userSpaceOnUse' }, s('circle', { class: 'dotp', cx: 2, cy: 2, r: 1.2 }))),
      s('rect', { class: 'room', x: 10, y: 10, width: 890, height: 520, rx: 22 }),
      s('rect', { class: 'roomDots', x: 10, y: 10, width: 890, height: 520, rx: 22 }),
      Object.assign(s('text', { class: 'floorLabel', x: 970 - 14, y: 524 - 8, 'text-anchor': 'end' }), { textContent: '' })
    );

    // centre table
    map.append(
      s('rect', { class: 'tableTop', x: TABLE.x, y: TABLE.y, width: TABLE.w, height: TABLE.h, rx: 18 })
    );

    let order = 0;
    PROJECTS.forEach((p) => {
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      const g = s('g', { class: 'proj', tabindex: 0, role: 'button', 'data-loc': p.id, 'aria-label': p.name + ' (in-house innovation project)' },
        s('title', null, p.name + ' – in-house innovation project'),
        s('rect', { class: 'hitbox', x: p.x, y: p.y, width: p.w, height: p.h }),
        s('g', { class: 'lift', style: '--d:' + (order++) },
          s('rect', { class: 'shape', x: p.x, y: p.y, width: p.w, height: p.h, rx: 22 }),
          s('rect', { class: 'glow', x: p.x - 4, y: p.y - 4, width: p.w + 8, height: p.h + 8, rx: 26 }),
          ...p.lines.map((ln, i) => Object.assign(
            s('text', { x: cx, y: cy + (i - (p.lines.length - 1) / 2) * 20 + 6 }), { textContent: ln })),
          pinFor(p.x + p.w - 8, p.y + 8)));
      activate(g, () => openProject(p.id));
      map.append(g);
      nodes.set(p.id, g);
    });

    CABINETS.forEach((c) => {
      const n = itemsOf(c.id).length;
      const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      const g = s('g', { class: 'cab' + (n ? '' : ' empty'), tabindex: 0, role: 'button', 'data-loc': c.id,
          'aria-label': `Cabinet ${c.id}, ${n ? plural(n, 'item') : 'no list yet'}` },
        s('title', null, `${c.id} – ${n ? plural(n, 'item') : 'no list added yet'}`),
        s('rect', { class: 'hitbox', x: c.x, y: c.y, width: c.w, height: c.h }),
        s('g', { class: 'lift', style: '--d:' + (order++) },
          s('rect', { class: 'shape', x: c.x, y: c.y, width: c.w, height: c.h, rx: 14 }),
          s('rect', { class: 'glow', x: c.x - 4, y: c.y - 4, width: c.w + 8, height: c.h + 8, rx: 18 }),
          s('g', { class: 'cabIcon', transform: `translate(${c.x + 10} ${c.y + 10}) scale(.7)` },
            s('rect', { x: 2, y: 2, width: 20, height: 20, rx: 3.5 }), s('path', { d: 'M2 12h20M9.5 7h5M9.5 17h5' })),
          Object.assign(s('text', { class: 'name', x: cx, y: cy - 2 }), { textContent: c.id }),
          Object.assign(s('text', { class: 'count', x: cx, y: cy + 20 }), { textContent: n ? plural(n, 'item') : 'no list yet' }),
          pinFor(c.x + c.w - 6, c.y + 6)));
      activate(g, () => openCabinet(c.id));
      map.append(g);
      nodes.set(c.id, g);
    });
  }

  function activate(node, fn) {
    node.addEventListener('click', fn);
    node.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  }

  function paintMap() {
    const searching = state.tab === 'search' && current.hits.length > 0;
    map.classList.toggle('searching', searching);
    nodes.forEach((g, id) => {
      const hits = searching ? current.byLoc.get(id) : null;
      g.classList.toggle('match', !!hits);
      const num = g.querySelector('.pinNum');
      if (num) num.textContent = hits ? (hits[0].kind === 'empty' ? '0' : hits.length) : '';
    });
    const foot = $('#mapFoot');
    if (state.tab === 'search' && state.q) {
      const locs = current.byLoc.size;
      foot.textContent = current.hits.length
        ? `Highlighted: ${plural(locs, 'location')} containing “${state.q}”. The numbered badge shows how many matches are in each.`
        : '';
    } else foot.textContent = '';
  }

  function pulse(loc) {
    const g = nodes.get(loc);
    if (!g) return;
    g.classList.remove('focus'); void g.getBoundingClientRect(); g.classList.add('focus');
    setTimeout(() => g.classList.remove('focus'), 1000);
    const wrap = g.closest('.mapScroll');
    if (wrap && wrap.scrollWidth > wrap.clientWidth) {
      const r = g.getBoundingClientRect(), w = wrap.getBoundingClientRect();
      wrap.scrollBy({ left: r.left - w.left - (w.width - r.width) / 2, behavior: 'smooth' });
    }
  }

  /* ------------------------------------------------------------------ search panel */
  const input = $('#q'), clearBtn = $('#clear'), resultsEl = $('#results');
  const EXAMPLES = ['HDMI', 'monitor', 'camera', 'F-72695', 'markers', 'projector', 'amplifier'];

  function renderResults() {
    resultsEl.replaceChildren();
    const q = state.q.trim();
    clearBtn.hidden = !q;
    if (!q) {
      resultsEl.append(
        h('p', { class: 'helper' }, 'Type any part of an asset name, an asset tag, or a keyword. The map will light up the cabinet(s) that have it.'),
        h('p', { class: 'helper' }, 'Try:'),
        h('div', { class: 'chips' }, EXAMPLES.map((x) => h('button', { class: 'chip', type: 'button', onclick: () => setQuery(x) }, x))));
      return;
    }
    const { hits, byLoc, tokens } = current;
    if (!hits.length) {
      resultsEl.append(h('div', { class: 'banner bad' }, h('span', { class: 'ic' }, ico('x')),
        h('div', null, h('b', null, 'Not found in the inventory'),
          `Nothing matches “${q}”. Check the spelling, try a shorter word, or search by the asset tag. Some things are listed under a general name such as “Cable Box”.`)));
      return;
    }
    const real = hits.filter((e) => e.kind !== 'empty').length;
    resultsEl.append(h('div', { class: 'banner ok' }, h('span', { class: 'ic' }, ico('check')),
      h('div', null, h('b', null, real ? 'Yes, we have it' : 'Cabinet found'),
        real ? `${plural(real, 'match')} in ${plural(byLoc.size, 'location')}. See the highlighted spots on the map.`
             : 'That cabinet has no list yet.')));

    byLoc.forEach((entries, loc) => {
      const group = h('div', { class: 'group', 'data-loc': loc, style: '--i:' + resultsEl.children.length });
      const isProj = !!projectCfg(loc);
      group.append(h('button', {
        class: 'groupHead', type: 'button',
        onclick: () => { pulse(loc); (isProj ? openProject : (id) => openCabinet(id, tokens))(loc); },
        onmouseenter: () => pulse(loc),
      }, h('span', null, h('span', { class: 'badge' }, locLabel(loc)),
            ' ', h('span', { class: 'helper' }, isProj ? 'in-house project' : plural(itemsOf(loc).length, 'item') + ' in cabinet')),
         h('span', { class: 'go' }, isProj ? 'Details' : 'Open list', ico('arrow'))));

      entries.forEach((e) => {
        if (e.kind === 'item') {
          const it = e.item;
          group.append(h('div', { class: 'hit' },
            h('div', { class: 'nm' }, hl(it.name, tokens)),
            h('div', { class: 'meta' },
              it.qty ? h('span', null, 'Qty: ', hl(it.qty, tokens)) : null,
              it.condition ? h('span', { class: 'cond ' + it.condition.toLowerCase().split(' ')[0] }, it.condition) : null,
              it.remarks ? h('span', null, hl(it.remarks, tokens)) : null),
            it.tags.length ? h('div', { class: 'tagrow' }, it.tags.map((t) => h('span', { class: 'tag' + (tagHit(t, tokens) ? ' hit-tag' : '') }, t))) : null));
        } else if (e.kind === 'note') {
          group.append(h('div', { class: 'hit' }, h('div', { class: 'nm noteLine' }, ico('pin'), h('span', null, hl(e.text, tokens)))));
        } else if (e.kind === 'project') {
          group.append(h('div', { class: 'hit' }, h('div', { class: 'nm' }, hl(e.name, tokens)),
            h('div', { class: 'meta' }, 'In-house innovation project on the centre table')));
        } else {
          group.append(h('div', { class: 'hit' }, h('span', { class: 'helper' }, 'No inventory list has been added for this cabinet yet.')));
        }
      });
      resultsEl.append(group);
    });
  }

  function setQuery(q, focus) {
    state.q = q;
    input.value = q;
    current = runSearch(q);
    renderResults(); paintMap(); writeHash();
    if (focus) input.focus();
  }

  /* ------------------------------------------------------------------ modal */
  const modal = $('#modal'), modalBody = $('#modalBody');
  const X_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function closeBtn() {
    const b = h('button', { class: 'mClose', type: 'button', 'aria-label': 'Close', onclick: closeModal });
    b.innerHTML = X_ICON;           // fixed, trusted markup
    return b;
  }
  function closeModal() {
    if (!modal.open || modal.classList.contains('closing')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { modal.close(); return; }
    modal.classList.add('closing');
    setTimeout(() => { modal.classList.remove('closing'); modal.close(); }, 220);
  }

  function openCabinet(id, tokens) {
    tokens = tokens || (state.tab === 'search' ? current.tokens : []);
    state.cab = id; writeHash();
    const items = itemsOf(id);
    const notes = (DATA.notes || {})[id] || [];
    const head = h('div', { class: 'mHead' },
      h('h2', { id: 'modalTitle' }, id),
      h('p', null, items.length ? `${plural(items.length, 'item')} · ${plural(tagCount(id), 'tag')}` : 'No list added yet'),
      closeBtn());
    const scroll = h('div', { class: 'mScroll' });
    notes.forEach((n) => scroll.append(h('div', { class: 'note' }, ico('pin'), h('span', null, n.charAt(0).toUpperCase() + n.slice(1)))));
    if (!items.length) {
      scroll.append(h('div', { class: 'emptyState' }, 'No inventory list has been added for this cabinet yet.'));
    } else {
      const tbody = h('tbody');
      items.forEach((it, idx) => {
        const flash = tokens.length && ENTRIES.some((e) => e.item === it && tokens.every((t) => e.hay.includes(t) || (norm(t).length >= 3 && e.norm.includes(norm(t)))));
        tbody.append(h('tr', { class: flash ? 'flash' : '', style: '--r:' + Math.min(idx, 16) },
          h('td', { class: 'num' }, it.n),
          h('td', { class: 'nm' }, hl(it.name, tokens)),
          h('td', { class: 'qty' }, it.qty ? hl(it.qty, tokens) : h('span', { class: 'dash' }, '—')),
          h('td', { class: 'tg' }, it.tags.length ? it.tags.map((t) => h('span', { class: 'tag' + (tagHit(t, tokens) ? ' hit-tag' : '') }, t)) : h('span', { class: 'dash' }, '—')),
          h('td', null, it.condition ? h('span', { class: 'cond ' + it.condition.toLowerCase().split(' ')[0] }, it.condition) : h('span', { class: 'dash' }, '—')),
          h('td', null, it.remarks ? hl(it.remarks, tokens) : h('span', { class: 'dash' }, '—'))));
      });
      scroll.append(h('div', { class: 'tbl' }, h('table', { class: 'inv' },
        h('thead', null, h('tr', null, ['S.no', 'Name', 'Qty', 'Tags', 'Condition', 'Remarks'].map((c) => h('th', null, c)))),
        tbody)));
    }
    modalBody.replaceChildren(head, scroll);
    if (!modal.open) modal.showModal();
    const f = scroll.querySelector('tr.flash');
    if (f) setTimeout(() => f.scrollIntoView({ block: 'center', behavior: 'smooth' }), 80);
  }

  function openProject(id) {
    const p = projectCfg(id);
    state.cab = null; writeHash();
    modalBody.replaceChildren(
      h('div', { class: 'mHead' }, h('h2', { id: 'modalTitle' }, p.name), h('p', null, 'In-house innovation project'), closeBtn()),
      h('div', { class: 'mScroll' }, h('p', null, 'This project is displayed on the centre table of the room. It is not stored in a cabinet.')));
    if (!modal.open) modal.showModal();
  }

  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  modal.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); });   // Esc key
  modal.addEventListener('close', () => { state.cab = null; writeHash(); });

  /* ------------------------------------------------------------------ info tab */
  function buildInfo() {
    const sum = DATA.summary || {};
    const info = $('#info');
    const rows = CABINETS.map((c) => c.id).sort((a, b) => (a.slice(0, 2) === b.slice(0, 2) ? a.localeCompare(b) : (a.startsWith('LC') ? -1 : 1)));
    const totalItems = rows.reduce((n, id) => n + itemsOf(id).length, 0);
    const totalTags = rows.reduce((n, id) => n + tagCount(id), 0);

    const maxN = Math.max(1, ...rows.map((id) => itemsOf(id).length));
    const tbody = h('tbody');
    rows.forEach((id) => {
      const n = itemsOf(id).length;
      tbody.append(h('tr', { tabindex: 0, onclick: () => { setTab('map'); openCabinet(id, []); },
          onkeydown: (e) => { if (e.key === 'Enter') { setTab('map'); openCabinet(id, []); } } },
        h('td', null, h('b', null, id)),
        n ? h('td', { class: 'barCell' }, String(n), h('span', { class: 'bar' }, h('i', { style: '--w:' + Math.round(n / maxN * 100) + '%' }))) : h('td', { class: 'pend' }, 'no list yet'),
        n ? h('td', null, tagCount(id)) : h('td', { class: 'pend' }, '—')));
    });
    tbody.append(h('tr', { class: 'total' }, h('td', null, 'TOTAL'), h('td', null, totalItems), h('td', null, totalTags)));

    info.replaceChildren(
      h('div', { class: 'infoHead' }, h('span', { class: 'hIc' }, ico('clipboard')), h('div', null, h('h2', null, 'Inventory Summary'), h('p', null, 'IT Store · cabinets, rules and totals'))),
      h('section', null, h('dl', { class: 'kv' },
        h('dt', null, 'Date of Inventory Management'), h('dd', null, sum.date || '—'),
        h('dt', null, 'Inventory Managed By'), h('dd', null, sum.managedBy || '—'))),
      h('section', null, h('h3', null, 'Rules'),
        h('ol', { class: 'rules' }, (sum.rules || []).map((r) => h('li', null, r)))),
      h('section', null, h('h3', null, 'Shelf Overview'),
        h('table', { class: 'sum' },
          h('thead', null, h('tr', null, ['Shelf', 'Items', 'Total Tags'].map((x) => h('th', null, x)))), tbody),
        h('p', { class: 'small' }, 'Click a shelf to open its list.')));
  }

  /* ------------------------------------------------------------------ key figures */
  function countUp(el, to) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || to < 2) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1000;
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  function buildKpis() {
    const ids = CABINETS.map((c) => c.id);
    const stats = [
      { icon: 'cabinet',  label: 'Cabinets',        value: ids.length },
      { icon: 'box',      label: 'Items listed',    value: ids.reduce((n, id) => n + itemsOf(id).length, 0) },
      { icon: 'tag',      label: 'Tagged assets',   value: ids.reduce((n, id) => n + tagCount(id), 0) },
      { icon: 'calendar', label: 'Last updated',    text: (DATA.summary && DATA.summary.date) || '—' },
    ];
    const wrap = $('#kpis');
    wrap.replaceChildren();
    stats.forEach((st, i) => {
      const val = h('div', { class: 'kVal' + (st.text ? ' small' : '') }, st.text || '0');
      wrap.append(h('div', { class: 'kpi', style: '--i:' + i }, h('span', { class: 'kIc' }, ico(st.icon)),
        h('div', null, h('div', { class: 'kLabel' }, st.label), val)));
      if (!st.text) countUp(val, st.value);
    });
  }

  /* ------------------------------------------------------------------ tabs */
  function setTab(tab, opts) {
    opts = opts || {};
    state.tab = tab;
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    const stage = $('#stage');
    stage.hidden = tab === 'info';
    $('#info').hidden = tab !== 'info';
    $('#kpis').hidden = tab === 'info';
    if (!opts.noAnim) {
      const vis = tab === 'info' ? $('#info') : stage;
      vis.classList.remove('viewIn'); void vis.offsetWidth; vis.classList.add('viewIn');
    }
    $('#side').hidden = tab !== 'search';
    stage.classList.toggle('withSide', tab === 'search');
    $('#mapHint').textContent = tab === 'search'
      ? 'Matching cabinets light up on the map. Click one to open its full list.'
      : 'Tap or click any cabinet to see what is inside it.';
    if (tab === 'search') { renderResults(); if (!opts.noFocus) input.focus({ preventScroll: true }); }
    paintMap(); writeHash(); moveIndicator();
    if (!opts.noScroll) window.scrollTo({ top: 0 });
  }

  function moveIndicator() {
    const ind = $('.tabs .ind'), on = $('.tabs button[aria-selected="true"]');
    if (!ind || !on) return;
    ind.style.width = on.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    buildMap();
    buildInfo();
    buildKpis();
    $('#foot').textContent = DATA.summary && DATA.summary.date
      ? `Inventory managed on ${DATA.summary.date} by ${DATA.summary.managedBy}` : '';

    document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
    window.addEventListener('resize', moveIndicator);
    window.addEventListener('load', moveIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

    $('#theme').addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    });

    const card = $('.mapCard');                       // soft light that follows the pointer
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--mx', '-999px'); card.style.setProperty('--my', '-999px'); });
    input.addEventListener('input', () => setQuery(input.value));
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') setQuery('', true); });
    clearBtn.addEventListener('click', () => setQuery('', true));

    const hs = readHash();
    if (hs.q) { state.q = hs.q; input.value = hs.q; current = runSearch(hs.q); }
    setTab(['map', 'search', 'info'].includes(hs.tab) ? hs.tab : 'map', { noFocus: true, noScroll: true, noAnim: true });
    if (hs.cab && cabinetCfg(hs.cab)) openCabinet(hs.cab);
  }
  init();
})();
