/* motion.js — animazioni fluide condivise (nessuna modifica ai contenuti) */
(() => {
  const d = document, r = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  r.classList.add('js');

  // Barra di progresso di lettura
  const bar = d.createElement('div'); bar.id = 'bar'; d.body.appendChild(bar);
  const upd = () => { const h = r.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; };
  addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();

  // Preparazione SVG: le linee si "disegnano", il resto appare in sequenza
  d.querySelectorAll('.figure-container svg').forEach(svg => {
    [...svg.children].filter(e => e.tagName !== 'defs').forEach((e, i) => {
      e.style.setProperty('--d', (i * 55) + 'ms');
      if (e.tagName === 'path' && e.getAttribute('stroke') && e.getAttribute('fill') !== 'none' ? false : e.tagName === 'path' && e.getAttribute('stroke')) {
        e.setAttribute('pathLength', 1); e.dataset.draw = 1;
      }
    });
  });

  // Reveal allo scroll con stagger
  const sel = 'section,.figure-container,.code-block,.table-container,.highlight-box,.stack-level,.card,.idx header,.idx nav,.keyword-grid';
  const els = [...d.querySelectorAll(sel)];
  els.forEach(e => { e.classList.add('rv'); });
  d.querySelectorAll('.lessons-grid,.subjects-grid,.grid,.stack-container').forEach(g =>
    [...g.children].forEach((c, i) => { c.style.transitionDelay = (i * 90) + 'ms'; }));

  const show = e => {
    e.classList.add('in');
    setTimeout(() => { e.classList.remove('rv'); e.style.transitionDelay = ''; }, 1600 + (parseInt(e.style.transitionDelay) || 0));
  };

  if (reduce || !('IntersectionObserver' in window)) { els.forEach(show); }
  else {
    const io = new IntersectionObserver(es => es.forEach(x => {
      if (x.isIntersecting) { show(x.target); io.unobserve(x.target); }
    }), { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
  }

  // Spotlight che segue il mouse sulle card
  d.querySelectorAll('.card').forEach(c => c.addEventListener('mousemove', ev => {
    const b = c.getBoundingClientRect();
    c.style.setProperty('--mx', ((ev.clientX - b.left) / b.width * 100) + '%');
    c.style.setProperty('--my', ((ev.clientY - b.top) / b.height * 100) + '%');
  }));

  // Transizione morbida tra pagine
  d.addEventListener('click', ev => {
    const a = ev.target.closest('a[href]');
    if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || a.target || !/\.html?$/.test(a.getAttribute('href'))) return;
    ev.preventDefault(); r.classList.add('leave');
    setTimeout(() => { location.href = a.href; }, 260);
  });
  addEventListener('pageshow', () => r.classList.remove('leave'));
})();

/* Evidenzia la parola cercata dalla home della materia (?q=parola&c=inizio-blocco) */
(() => {
  const d = document, p = new URLSearchParams(location.search), q = p.get('q');
  if (!q) return;
  const fold = s => s.split('').map(c => { const n = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); return n.length === 1 ? n : c.toLowerCase().charAt(0); }).join('');
  const terms = fold(q).split(/\s+/).filter(Boolean); if (!terms.length) return;
  const root = d.querySelector('main') || d.body;
  const w = d.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && n.parentElement.closest('script,style,svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  const marks = [];
  nodes.forEach(n => {
    const t = n.nodeValue, f = fold(t), rs = [];
    terms.forEach(x => { let i = f.indexOf(x); while (i > -1) { rs.push([i, i + x.length]); i = f.indexOf(x, i + x.length); } });
    if (!rs.length) return;
    rs.sort((a, b) => a[0] - b[0]);
    const mg = []; rs.forEach(r => { const l = mg[mg.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else mg.push(r.slice()); });
    const fr = d.createDocumentFragment(); let pos = 0;
    mg.forEach(([a, b]) => { fr.append(t.slice(pos, a)); const m = d.createElement('mark'); m.className = 'hit'; m.textContent = t.slice(a, b); fr.append(m); marks.push(m); pos = b; });
    fr.append(t.slice(pos)); n.replaceWith(fr);
  });
  if (!marks.length) return;
  const BL = 'p,li,td,th,h1,h2,h3,.figure-caption,.highlight-box,.code-block', c = (p.get('c') || '').trim();
  let cur = Math.max(0, marks.findIndex(m => { const b = m.closest(BL); return b && fold(b.textContent).replace(/\s+/g, ' ').includes(c); }));
  const bar = d.createElement('div'); bar.className = 'hitbar';
  bar.innerHTML = '<span>«' + q.replace(/[<>&]/g, '') + '» · <b></b></span><button title="Precedente">‹</button><button title="Successiva">›</button><button title="Chiudi">✕</button>';
  d.body.appendChild(bar);
  const cnt = bar.querySelector('b'), [bp, bn, bx] = bar.querySelectorAll('button');
  const go = i => { marks[cur].classList.remove('on'); cur = (i + marks.length) % marks.length; const m = marks[cur]; m.classList.add('on'); m.scrollIntoView({ behavior: 'smooth', block: 'center' }); cnt.textContent = (cur + 1) + '/' + marks.length; };
  bp.onclick = () => go(cur - 1); bn.onclick = () => go(cur + 1);
  bx.onclick = () => { marks.forEach(m => m.replaceWith(d.createTextNode(m.textContent))); bar.remove(); history.replaceState(null, '', location.pathname); };
  d.addEventListener('keydown', e => { if (e.key === 'Escape') bx.click(); });
  setTimeout(() => go(cur), 650);
})();