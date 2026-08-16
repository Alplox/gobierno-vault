# -*- coding: utf-8 -*-
"""Extrae todos los posts del HTML descargado a un JSON y un markdown legible."""
import re
import sys
import glob
import json
import html as htmlmod

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT_JSON = "posts.json"
OUT_MD = "posts.md"

def clean(t):
    t = re.sub(r"<br\s*/?>", "\n", t)
    t = re.sub(r"</p>", "\n\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    return htmlmod.unescape(t).strip()

def extract_post(block):
    """Dado un bloque HTML de un post, extrae id, fecha, texto, media y links."""
    m = re.search(r'data-post="ArchivandoChile/(\d+)"', block)
    post_id = m.group(1) if m else None
    m = re.search(r'<time[^>]*datetime="([^"]+)"', block)
    date = m.group(1) if m else None
    m = re.search(r'class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', block, re.S)
    text = clean(m.group(1)) if m else ""
    # foto principal
    photos = re.findall(r'background-image:url\(([^)]+)\)', block)
    photos = [p.strip().strip("'").strip('"') for p in photos]
    # video (si hay)
    video = re.search(r'<video[^>]*src="([^"]+)"', block)
    # enlaces externos
    links = re.findall(r'<a[^>]*href="(https?://[^"]+)"[^>]*>', block)
    seen = set()
    out = []
    for l in links:
        if "t.me/ArchivandoChile" in l or "telesco.pe" in l or l in seen:
            continue
        seen.add(l)
        out.append(l)
    return {
        "id": int(post_id) if post_id else None,
        "fecha": date,
        "texto": text,
        "fotos": photos,
        "video": video.group(1) if video else None,
        "links": out,
    }

def main():
    posts = {}
    files = sorted(glob.glob("pages/*.html"))
    for f in files:
        html_text = open(f, encoding="utf-8").read()
        # dividir en segmentos por data-post (cada post es contiguo en la pagina)
        parts = re.split(r'(?=data-post="ArchivandoChile/)', html_text)
        for part in parts:
            m = re.match(r'data-post="ArchivandoChile/(\d+)"', part)
            if not m:
                continue
            pid = m.group(1)
            if pid in posts:
                continue
            post = extract_post(part)
            posts[pid] = post
    items = [posts[k] for k in sorted(posts, key=lambda x: int(x))]
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=1)
    # markdown legible
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("# ArchivandoChile - descarga completa\n\n")
        f.write(f"Total: {len(items)} posts (ids {items[0]['id']} a {items[-1]['id']})\n\n")
        for p in reversed(items):  # cronológico
            f.write(f"## [{p['id']}] {p['fecha'] or ''}\n\n")
            if p["texto"]:
                f.write(p["texto"] + "\n\n")
            if p["links"]:
                f.write("Links: " + ", ".join(p["links"]) + "\n")
            if p["fotos"]:
                f.write(f"Fotos ({len(p['fotos'])}): " + ", ".join(p["fotos"]) + "\n")
            if p["video"]:
                f.write("Video: " + p["video"] + "\n")
            f.write("\n---\n\n")
    print(f"{len(items)} posts -> {OUT_JSON} y {OUT_MD}")

if __name__ == "__main__":
    main()
