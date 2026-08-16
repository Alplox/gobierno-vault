# -*- coding: utf-8 -*-
"""Descarga todas las páginas públicas de https://t.me/s/ArchivandoChile"""
import re
import time
import sys
import json
import urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "https://t.me/s/ArchivandoChile"
OUT_DIR = "pages"
MAX_PAGES = 5000  # tope de seguridad

def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        "Accept-Language": "es-CL,es;q=0.9",
    })
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", errors="replace")
        except Exception as e:
            wait = 15 * (attempt + 1)
            print(f"  reintento {attempt+1} tras error: {e}; esperando {wait}s")
            time.sleep(wait)
    raise RuntimeError("fallo tras 5 intentos")

def main():
    import os
    import glob as _glob
    os.makedirs(OUT_DIR, exist_ok=True)
    seen_posts = set()
    # retomar desde lo ya descargado
    existing = sorted(_glob.glob(f"{OUT_DIR}/page_*.html"))
    page = len(existing) - 1 if existing else 0
    before = None
    if existing and page >= 0:
        html0 = open(existing[-1], encoding="utf-8").read()
        bs = [int(b) for b in re.findall(r'href="/s/ArchivandoChile\?before=(\d+)"', html0)]
        if bs:
            before = str(min(bs))
    last_earliest = None
    while page < MAX_PAGES:
        url = BASE if before is None else f"{BASE}?before={before}"
        try:
            html = fetch(url)
        except Exception as e:
            print(f"error página {page}: {e}")
            break
        fname = f"{OUT_DIR}/page_{page:04d}.html"
        with open(fname, "w", encoding="utf-8") as f:
            f.write(html)
        # ids de posts en esta página
        ids = re.findall(r"data-post=\"ArchivandoChile/(\d+)\"", html)
        new_ids = [i for i in ids if i not in seen_posts]
        seen_posts.update(ids)
        print(f"página {page}: {len(ids)} posts (nuevos {len(new_ids)}), guardada {fname}")
        # fecha más antigua para seguimiento
        times = re.findall(r'<time[^>]*datetime="([^"]+)"', html)
        if times:
            print("  rango fechas:", times[-1], "a", times[0])
        # siguiente página
        befores = re.findall(rf'href="/s/ArchivandoChile\?before=(\d+)"', html)
        befores = [b for b in befores if b not in (str(before) if before else "")]
        if not befores:
            print("  sin más paginación, fin.")
            break
        # tomar el before más pequeño (el más antiguo)
        before = min(befores, key=lambda x: int(x))
        # si el id más antiguo ya lo vimos, podríamos estar en loop
        if last_earliest is not None and min(int(b) for b in befores) >= last_earliest:
            print("  paginación estancada, fin.")
            break
        last_earliest = min(int(b) for b in befores)
        page += 1
        time.sleep(2.0)
    print(f"total: {len(seen_posts)} posts únicos en {page+1} páginas")

if __name__ == "__main__":
    main()
