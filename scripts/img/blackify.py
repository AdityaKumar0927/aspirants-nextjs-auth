# Keep ONLY the black elements of the already-vector SVGs (strip every colour),
# batched over scripts/img/out/svg-hashes.json, in place in public/q-img.
# Originals are backed up to scripts/img/out/svg-color-backup/ first.
#
#   scripts/img/.venv/Scripts/python.exe scripts/img/blackify.py
#   ... --restore       # put the colour originals back
#
# (Adapted from the user's single-file Colab script: same classify/own_paint/
#  set_paint/prune algorithm; harness swapped for batch + safe parser.)
import subprocess, sys
def _ensure(mod, pkg):
    try: __import__(mod)
    except ImportError: subprocess.run([sys.executable, "-m", "pip", "install", "-q", pkg], check=True)
_ensure("lxml", "lxml"); _ensure("PIL", "Pillow")

import os, re, json, shutil
from pathlib import Path
from multiprocessing import Pool
from lxml import etree
from PIL import ImageColor

ROOT   = Path(__file__).resolve().parents[2]
QIMG   = ROOT / "public" / "q-img"
HASHES = ROOT / "scripts" / "img" / "out" / "svg-hashes.json"
BACKUP = ROOT / "scripts" / "img" / "out" / "svg-color-backup"

# ─── filter config (from the user's script) ───
BLACK_MAX_LUM = 64    # max brightness to count as "black"
MAX_CHROMA    = 32    # max colourfulness allowed
PRUNE         = True  # delete elements left with no visible paint

_lum    = lambda c: 0.299*c[0] + 0.587*c[1] + 0.114*c[2]
_chroma = lambda c: max(c) - min(c)

def classify(value):
    if value is None: return 'none'
    v = value.strip().lower()
    if v in ('none', 'transparent', ''): return 'none'
    if v.startswith('url('): return 'other'
    if v == 'currentcolor': return 'black'
    if v.startswith('rgb'):
        try:
            nums = v[v.find('(')+1:v.rfind(')')].split(',')
            rgb = tuple(round(float(p[:-1])*2.55) if p.strip().endswith('%')
                        else int(round(float(p))) for p in nums[:3])
        except Exception: return 'other'
    else:
        try: rgb = ImageColor.getrgb(v)[:3]
        except Exception: return 'other'
    return 'black' if (_lum(rgb) <= BLACK_MAX_LUM and _chroma(rgb) <= MAX_CHROMA) else 'colour'

def parse_style(s):
    d = {}
    for decl in (s or '').split(';'):
        if ':' in decl:
            k, val = decl.split(':', 1); d[k.strip().lower()] = val.strip()
    return d

def parse_css(text):
    rules = {}; text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    for m in re.finditer(r'([^{}]+)\{([^{}]*)\}', text):
        decls = parse_style(m.group(2))
        for sel in m.group(1).split(','): rules.setdefault(sel.strip(), {}).update(decls)
    return rules

def local(el):
    return etree.QName(el).localname if isinstance(el.tag, str) else None

DRAW = {'path','rect','circle','ellipse','line','polyline','polygon','text','tspan','use'}

def own_paint(el, prop, css):
    st = parse_style(el.get('style'))
    if prop in st: return st[prop]
    eid = el.get('id')
    if eid and '#'+eid in css and prop in css['#'+eid]: return css['#'+eid][prop]
    for c in (el.get('class') or '').split():
        if '.'+c in css and prop in css['.'+c]: return css['.'+c][prop]
    tag = local(el)
    if tag in css and prop in css[tag]: return css[tag][prop]
    if el.get(prop) is not None: return el.get(prop)
    return None

def set_paint(el, prop, value):
    st = parse_style(el.get('style'))
    if prop in st:
        st.pop(prop, None)
        if st: el.set('style', '; '.join(f'{k}:{v}' for k, v in st.items()))
        elif 'style' in el.attrib: del el.attrib['style']
    el.set(prop, value)

# No-network, recovering parser (passthrough SVGs have no DOCTYPE; this is belt-and-suspenders).
_PARSER = etree.XMLParser(no_network=True, resolve_entities=False, recover=True, huge_tree=True)

def extract_black_svg(src, out):
    tree = etree.parse(str(src), _PARSER); root = tree.getroot()
    if root is None: raise ValueError("unparseable")
    css = {}
    for st in root.iter():
        if local(st) == 'style' and st.text: css.update(parse_css(st.text))

    def walk(el, inh_fill, inh_stroke):
        of  = own_paint(el, 'fill', css);   os_ = own_paint(el, 'stroke', css)
        eff_fill   = of  if of  is not None else inh_fill
        eff_stroke = os_ if os_ is not None else inh_stroke
        if local(el) in DRAW:
            set_paint(el, 'fill',   eff_fill   if classify(eff_fill)   == 'black' else 'none')
            set_paint(el, 'stroke', eff_stroke if classify(eff_stroke) == 'black' else 'none')
        for ch in list(el): walk(ch, eff_fill, eff_stroke)
    walk(root, 'black', 'none')

    removed = 0
    if PRUNE:
        for el in list(root.iter()):
            if local(el) in DRAW and el.get('fill', 'none') == 'none' \
               and el.get('stroke', 'none') in ('none', None):
                p = el.getparent()
                if p is not None: p.remove(el); removed += 1
    tree.write(str(out), xml_declaration=True, encoding="UTF-8")
    return removed

def process(h):
    src = QIMG / f"{h}.svg"
    bak = BACKUP / f"{h}.svg"
    if not src.exists(): return ("missing", h, 0)
    try:
        if not bak.exists():
            shutil.copy2(src, bak)          # preserve the colour original once
        tmp = src.with_suffix(".svg.tmp")
        removed = extract_black_svg(bak, tmp)   # always process from the pristine colour backup
        os.replace(tmp, src)
        return ("ok", h, removed)
    except Exception as e:
        return ("fail", h, f"{type(e).__name__}: {e}"[:100])

def restore():
    n = 0
    for f in BACKUP.glob("*.svg"):
        shutil.copy2(f, QIMG / f.name); n += 1
    print(f"Restored {n} colour originals.")

def main():
    if "--restore" in sys.argv:
        return restore()
    BACKUP.mkdir(parents=True, exist_ok=True)
    hashes = json.loads(HASHES.read_text())
    print(f"Blackifying {len(hashes)} SVGs  ·  BLACK_MAX_LUM={BLACK_MAX_LUM} MAX_CHROMA={MAX_CHROMA} PRUNE={PRUNE}")
    ok = fail = 0; total_removed = 0; fails = []
    with Pool(max(2, (os.cpu_count() or 4) - 1)) as pool:
        for i, (status, h, info) in enumerate(pool.imap_unordered(process, hashes, chunksize=8), 1):
            if status == "ok": ok += 1; total_removed += info
            elif status == "fail": fail += 1; fails.append({"hash": h, "error": info})
            if i % 50 == 0 or i == len(hashes):
                print(f"  {i}/{len(hashes)}  ok={ok} fail={fail}", flush=True)
    if fails:
        (BACKUP.parent / "blackify-failures.json").write_text(json.dumps(fails, indent=2))
    print(f"\nDone. ok={ok} fail={fail}  ·  pruned {total_removed} non-black elements total")
    print(f"Colour originals backed up in {BACKUP.relative_to(ROOT)} (--restore to revert)")

if __name__ == "__main__":
    main()
