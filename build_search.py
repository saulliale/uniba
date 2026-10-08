#!/usr/bin/env python3
"""Rigenera search-data.js. Esegui dalla cartella del sito:  python3 build_search.py
Cerca tutti i file lezione (matematicadiscreta<N>, programmazione<N>, adeso<N>, adesolab<N>)
anche dentro le sottocartelle, ed estrae il testo di paragrafi, liste, tabelle e titoli."""
import re, json
from pathlib import Path
from html.parser import HTMLParser
ROOT = Path(__file__).resolve().parent
SUBJ = {'matematicadiscreta': 'matematica', 'programmazione': 'programmazione', 'adesolab': 'adeso', 'adeso': 'adeso'}
BLOCK = {'p', 'li', 'td', 'th', 'h1', 'h2', 'h3'}
BCLS = {'figure-caption', 'highlight-box', 'code-block', 'subtitle'}
SKIP = {'script', 'style', 'svg', 'head'}

class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True)
        s.stack, s.skip, s.blocks, s.h2, s.title, s.label = [], 0, [], '', '', ''
    def handle_starttag(s, tag, attrs):
        if tag in SKIP: s.skip += 1; return
        cls = set((dict(attrs).get('class') or '').split())
        if tag in BLOCK or (tag == 'div' and cls & BCLS): s.stack.append([tag, cls, []])
    def handle_endtag(s, tag):
        if tag in SKIP: s.skip = max(0, s.skip - 1); return
        if s.stack and s.stack[-1][0] == tag:
            t, cls, buf = s.stack.pop(); x = ' '.join(''.join(buf).split())
            if not x: return
            if 'subtitle' in cls: s.label = x; return
            if t == 'h1': s.title = x
            if t == 'h2': s.h2 = x
            if len(x) >= 3: s.blocks.append({'h': s.h2 or s.title, 'x': x})
    def handle_data(s, data):
        if not s.skip and s.stack: s.stack[-1][2].append(data)

out = []
def key(p):
    n = p.stem.lower().replace('_', ''); m = re.fullmatch(r'([a-z]+?)(\d+)', n)
    return (str(p.parent), 'lab' in n, int(m.group(2)) if m else 0)
for path in sorted(ROOT.rglob('*.html'), key=key):
    n = path.stem.lower().replace('_', ''); m = re.fullmatch(r'(matematicadiscreta|programmazione|adesolab|adeso)\d+', n)
    if not m: continue
    p = P(); p.feed(path.read_text(encoding='utf-8'))
    rel = path.relative_to(ROOT).as_posix()
    for b in p.blocks: out.append({'s': SUBJ[m.group(1)], 'p': rel, 'l': p.label, 't': p.title, 'h': b['h'], 'x': b['x']})
    print(f'{rel}: {len(p.blocks)} blocchi')
(ROOT / 'search-data.js').write_text('window.SEARCH_DATA=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';', encoding='utf-8')
print('search-data.js aggiornato:', len(out), 'voci')