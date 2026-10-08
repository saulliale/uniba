/* search.js — ricerca nelle lezioni della materia (usa search-data.js) */
(() => {
  const d = document, subj = d.body.dataset.subject; if (!subj) return;
  const fold = s => s.split('').map(c => { const n = c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); return n.length === 1 ? n : c.toLowerCase().charAt(0); }).join('');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const data = (window.SEARCH_DATA || []).filter(e => e.s === subj); data.forEach(e => e.f = fold(e.x));
  const hd = d.querySelector('header'), main = d.querySelector('main'); if (!hd) return;
  const box = d.createElement('div'); box.className = 'search';
  box.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg><input type="search" autocomplete="off" placeholder="Cerca una parola negli appunti…" aria-label="Cerca negli appunti"><kbd>/</kbd>';
  const res = d.createElement('div'); res.className = 'results'; hd.after(box); box.after(res);
  const input = box.querySelector('input');
  const snip = (e, terms) => {
    const { x, f } = e; const i = Math.min(...terms.map(t => f.indexOf(t))); const a = Math.max(0, i - 60), b = Math.min(x.length, i + 120), rs = [];
    terms.forEach(t => { let j = f.indexOf(t, a); while (j > -1 && j < b) { rs.push([j, Math.min(j + t.length, b)]); j = f.indexOf(t, j + t.length); } });
    rs.sort((m, n) => m[0] - n[0]); let out = '', pos = a;
    rs.forEach(([s, t]) => { if (s < pos) s = pos; if (t <= s) return; out += esc(x.slice(pos, s)) + '<mark>' + esc(x.slice(s, t)) + '</mark>'; pos = t; });
    return (a > 0 ? '…' : '') + out + esc(x.slice(pos, b)) + (b < x.length ? '…' : '');
  };
  const run = () => {
    const q = input.value.trim(), fq = fold(q), terms = fq.split(/\s+/).filter(Boolean), on = terms.length && fq.length >= 2;
    if (main) main.style.display = on ? 'none' : '';
    if (!on) { res.innerHTML = ''; return; }
    const hits = data.filter(e => terms.every(t => e.f.includes(t)));
    if (!hits.length) { res.innerHTML = '<p class="none">Nessun risultato per «' + esc(q) + '»</p>'; return; }
    const g = new Map(); hits.forEach(e => { if (!g.has(e.p)) g.set(e.p, []); g.get(e.p).push(e); });
    let h = '<p class="count">' + hits.length + ' risultat' + (hits.length === 1 ? 'o' : 'i') + ' in ' + g.size + ' lezion' + (g.size === 1 ? 'e' : 'i') + '</p>';
    g.forEach((arr, p) => {
      h += '<div class="rg"><div class="rh"><span class="badge">' + esc(arr[0].l) + '</span><span class="rt">' + esc(arr[0].t) + '</span></div>';
      arr.slice(0, 8).forEach(e => { h += '<a class="ri" href="' + p + '?q=' + encodeURIComponent(q) + '&c=' + encodeURIComponent(e.f.replace(/\s+/g, ' ').slice(0, 40).trim()) + '"><span class="rs">' + esc(e.h) + '</span><span class="rx">' + snip(e, terms) + '</span></a>'; });
      if (arr.length > 8) h += '<a class="more" href="' + p + '?q=' + encodeURIComponent(q) + '">+ altri ' + (arr.length - 8) + ' risultati: apri la lezione per vederli tutti →</a>';
      h += '</div>';
    });
    res.innerHTML = h;
  };
  let tm; input.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(run, 120); });
  d.addEventListener('keydown', e => {
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(d.activeElement.tagName)) { e.preventDefault(); input.focus(); }
    else if (e.key === 'Escape' && d.activeElement === input) { input.value = ''; run(); input.blur(); }
  });
})();