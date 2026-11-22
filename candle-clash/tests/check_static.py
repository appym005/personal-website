"""Check site structure, local asset references and zero-stakes design guarantees."""
from pathlib import Path
from html.parser import HTMLParser
root = Path(__file__).resolve().parents[1]
class Reader(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=set(); self.links=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:
            assert a['id'] not in self.ids, f'duplicate id: {a["id"]}'
            self.ids.add(a['id'])
        for k in ('src','href'):
            v=a.get(k, '')
            if v.startswith('./'):
                self.links.append(v.split('#')[0].split('?')[0])
for page in ('index.html','partners.html'):
    p=Reader(); p.feed((root/page).read_text())
    for link in p.links:
        assert (root/link).exists() or link=='./', f'{page}: broken local link {link}'
    print(f'{page}: valid structure; {len(p.ids)} IDs, {len(p.links)} local references')
js=(root/'game.js').read_text()
for phrase in ('ROUND_MS = 60_000','FRESH_MS = 10_000','voidRound','localStorage','new WebSocket','state.stats.score = Math.max(0'):
    assert phrase in js, phrase
assert 'privateKey' not in js and 'placeOrder' not in js
print('game.js: time-bound score, fail-closed settlement and no trading functions checked')
