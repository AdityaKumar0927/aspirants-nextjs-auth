# Stage 2: batch download + Image→SVG (the user's robust engine, parallelized).
# Reads scripts/img/out/manifest.json, downloads each image (cached, resumable),
# traces it to public/q-img/<hash>.svg. Skips images already converted.
#
#   python scripts/img/convert.py                       # full run
#   python scripts/img/convert.py --limit 24            # sample
#   python scripts/img/convert.py --quality fast --workers 8
#
# No paid services: vtracer + potrace run locally.
import subprocess, sys
def _ensure(mod, pkg):
    try: __import__(mod)
    except ImportError: subprocess.run([sys.executable, "-m", "pip", "install", "-q", pkg], check=True)
for mod, pkg in [("numpy","numpy"), ("cv2","opencv-python-headless"), ("PIL","Pillow"),
                 ("vtracer","vtracer"), ("potrace","potracer")]:
    _ensure(mod, pkg)

import os, re, json, time, base64, argparse, tempfile, urllib.request
from pathlib import Path
from multiprocessing import Pool
import numpy as np, cv2, potrace, vtracer
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "scripts" / "img" / "out" / "manifest.json"
OUT = ROOT / "public" / "q-img"
CACHE = ROOT / "scripts" / "img" / "out" / "cache"

# preset: (target_long_edge, upscale_cap, blur_sigma, ink_bias, bridge, prec, turd)
PRESET = {
    "fast":     (1400, 2.0, 0.6,  8, 0, 1, 3),
    "balanced": (2200, 3.0, 0.8, 12, 2, 2, 2),
    "max":      (3400, 4.0, 1.0, 16, 2, 3, 2),
}
QUALITY = "balanced"  # overridden by --quality

def cfg():
    return PRESET[QUALITY]

def load_rgba(path):
    a = np.asarray(Image.open(path).convert("RGBA"))
    if a[..., 3].min() < 255:
        rgb = a[..., :3].astype(np.float32); al = a[..., 3:4] / 255.0
        a = np.dstack([(rgb * al + 255 * (1 - al)).astype(np.uint8),
                       np.full(a.shape[:2], 255, np.uint8)])
    return a

def wrap(body, w, h, xlink=False):
    ns = 'xmlns="http://www.w3.org/2000/svg" ' + ('xmlns:xlink="http://www.w3.org/1999/xlink" ' if xlink else '')
    return (f'<?xml version="1.0" encoding="UTF-8"?>\n<svg {ns}viewBox="0 0 {w:g} {h:g}" '
            f'width="{w:g}" height="{h:g}" shape-rendering="geometricPrecision">\n{body}\n</svg>\n')

def ink_mask(rgba):
    target, up_cap, blur_sigma, ink_bias, bridge, prec, turd = cfg()
    g = cv2.cvtColor(rgba[..., :3], cv2.COLOR_RGB2GRAY)
    H, W = g.shape
    scale = min(up_cap, max(1.0, target / max(H, W)))
    if scale != 1.0:
        g = cv2.resize(g, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    m = max(1, min(g.shape) // 20)
    bg_light = np.median(np.concatenate([g[:m].ravel(), g[-m:].ravel(),
                                         g[:, :m].ravel(), g[:, -m:].ravel()])) > 127
    if not bg_light: g = 255 - g
    if blur_sigma > 0: g = cv2.GaussianBlur(g, (0, 0), blur_sigma)
    T, _ = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    b = ((g < (T + ink_bias)) * 255).astype(np.uint8)
    if bridge > 0:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (bridge, bridge))
        b = cv2.morphologyEx(b, cv2.MORPH_CLOSE, k)
    return b > 0, scale

def trace_lineart(rgba, fill="#1e2749"):
    target, up_cap, blur_sigma, ink_bias, bridge, prec, turd = cfg()
    mask, scale = ink_mask(rgba)
    path = potrace.Bitmap(~mask).trace(turdsize=turd,
        turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0,
        opticurve=True, opttolerance=0.2)
    inv = 1.0 / scale
    ff = lambda v: f"{v*inv:.{prec}f}".rstrip("0").rstrip(".")
    parts = []
    for c in path:
        sp = c.start_point; d = [f"M{ff(sp.x)} {ff(sp.y)}"]
        for s in c:
            ep = s.end_point
            if s.is_corner:
                cc = s.c; d.append(f"L{ff(cc.x)} {ff(cc.y)}L{ff(ep.x)} {ff(ep.y)}")
            else:
                d.append(f"C{ff(s.c1.x)} {ff(s.c1.y)} {ff(s.c2.x)} {ff(s.c2.y)} {ff(ep.x)} {ff(ep.y)}")
        d.append("Z"); parts.append("".join(d))
    h, w = mask.shape; w, h = w * inv, h * inv
    return wrap(f'<path d="{"".join(parts)}" fill="{fill}" fill-rule="evenodd"/>', w, h)

def trace_color(rgba):
    target, up_cap, blur_sigma, ink_bias, bridge, prec, turd = cfg()
    with tempfile.TemporaryDirectory() as td:
        s = os.path.join(td, "i.png"); o = os.path.join(td, "o.svg")
        Image.fromarray(rgba, "RGBA").save(s)
        vtracer.convert_image_to_svg_py(s, o, colormode="color", hierarchical="stacked",
            mode="spline", filter_speckle=2, color_precision=8, layer_difference=16,
            corner_threshold=60, length_threshold=4.0, max_iterations=10,
            splice_threshold=45, path_precision=prec)
        return open(o).read()

def is_lineart(rgba):
    rgb = rgba[..., :3]; g = rgb.mean(2)
    frac_sat = (cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)[..., 1] > 40).mean()
    m = max(1, min(g.shape) // 20)
    bg_light = np.median(np.concatenate([g[:m].ravel(), g[-m:].ravel(),
                                         g[:, :m].ravel(), g[:, -m:].ravel()])) > 127
    ink = (g < 100) if bg_light else (g > 155)
    return frac_sat < 0.06 and ink.mean() < 0.5 and ((g > 60) & (g < 200)).mean() < 0.25

def svg_passthrough(data):
    # Some "images" in the DB are ALREADY vector SVG (e.g. Visio exports). There's
    # nothing to trace — store the source verbatim, lightly sanitized (scripts /
    # inline handlers / external DOCTYPE stripped; it's also served sandboxed).
    head = data[:400].lstrip(b"\xef\xbb\xbf \t\r\n").lower()
    if not (head.startswith(b"<?xml") or head.startswith(b"<svg") or head.startswith(b"<!doctype svg")):
        return None
    txt = data.decode("utf-8", "replace")
    if "<svg" not in txt.lower():
        return None
    txt = re.sub(r"<!DOCTYPE[^>]*>", "", txt, flags=re.I)
    txt = re.sub(r"<script\b.*?</script>", "", txt, flags=re.I | re.S)
    txt = re.sub(r"\son\w+\s*=\s*(\"[^\"]*\"|'[^']*')", "", txt, flags=re.I)
    return txt.strip() + "\n"

def download(url, dest, tries=3):
    # Retry transient network failures (IncompleteRead / timeout / flaky CDN under
    # load) with backoff. Never leave a partial file behind to poison the cache.
    last = None
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            if not data:
                raise ValueError("empty response body")
            dest.write_bytes(data)
            return
        except Exception as e:
            last = e
            if dest.exists():
                try: dest.unlink()
                except OSError: pass
            time.sleep(1.5 * (attempt + 1))
    raise last

def process(item):
    h, url = item["hash"], item["url"]
    svg_path = OUT / f"{h}.svg"
    if svg_path.exists() and svg_path.stat().st_size > 0:
        return ("skip", h, 0, "", 0.0)
    cache = CACHE / f"{h}.img"
    t0 = time.time()
    try:
        if not (cache.exists() and cache.stat().st_size > 0):
            download(url, cache)
        passthrough = svg_passthrough(cache.read_bytes())
        if passthrough is not None:
            svg_path.write_text(passthrough, encoding="utf-8")
            return ("ok", h, len(passthrough.encode("utf-8")), "svg", time.time() - t0)
        rgba = load_rgba(str(cache))
        mode = "lineart" if is_lineart(rgba) else "color"
        svg = trace_lineart(rgba) if mode == "lineart" else trace_color(rgba)
        svg_path.write_text(svg, encoding="utf-8")
        return ("ok", h, len(svg), mode, time.time() - t0)
    except Exception as e:
        # Drop the cache entry so a future retry re-downloads instead of re-reading
        # a poisoned/partial file.
        if cache.exists():
            try: cache.unlink()
            except OSError: pass
        return ("fail", h, 0, f"{type(e).__name__}: {e}"[:120], time.time() - t0)

def main():
    global QUALITY
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--quality", choices=list(PRESET), default="balanced")
    ap.add_argument("--workers", type=int, default=max(2, (os.cpu_count() or 4) - 1))
    ap.add_argument("--retry-failures", action="store_true",
                    help="Only reprocess hashes in failures.json, purging their (poisoned) cache first.")
    args = ap.parse_args()
    QUALITY = args.quality

    OUT.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    items = json.loads(MANIFEST.read_text())
    if args.retry_failures:
        fpath = CACHE.parent / "failures.json"
        failed = {f["hash"] for f in json.loads(fpath.read_text())} if fpath.exists() else set()
        items = [it for it in items if it["hash"] in failed]
        purged = 0
        for it in items:
            c = CACHE / f'{it["hash"]}.img'
            if c.exists():
                try: c.unlink(); purged += 1
                except OSError: pass
        print(f"Retry mode: {len(items)} previously-failed images  ·  purged {purged} cached files")
    if args.limit:
        items = items[: args.limit]

    print(f"Converting {len(items)} images  ·  quality={QUALITY}  ·  workers={args.workers}")
    ok = skip = fail = 0; total_bytes = 0; secs = 0.0; modes = {}
    failures = []
    with Pool(args.workers) as pool:
        for i, (status, h, size, mode, dt) in enumerate(pool.imap_unordered(process, items, chunksize=4), 1):
            if status == "ok":
                ok += 1; total_bytes += size; secs += dt; modes[mode] = modes.get(mode, 0) + 1
            elif status == "skip":
                skip += 1
            else:
                fail += 1; failures.append({"hash": h, "error": mode})
            if i % 25 == 0 or i == len(items):
                print(f"  {i}/{len(items)}  ok={ok} skip={skip} fail={fail}", flush=True)

    if failures:
        (CACHE.parent / "failures.json").write_text(json.dumps(failures, indent=2))
    avg_kb = (total_bytes / ok / 1024) if ok else 0
    avg_s = (secs / ok) if ok else 0
    print(f"\nDone. ok={ok} skip={skip} fail={fail}  ·  modes={modes}")
    print(f"avg SVG {avg_kb:.1f} KB  ·  avg {avg_s:.2f}s/img  ·  est full ({len(json.loads(MANIFEST.read_text()))} imgs): "
          f"~{(avg_s*len(json.loads(MANIFEST.read_text()))/max(1,args.workers))/60:.0f} min, "
          f"~{(avg_kb*len(json.loads(MANIFEST.read_text()))/1024):.0f} MB")

if __name__ == "__main__":
    main()
