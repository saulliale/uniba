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