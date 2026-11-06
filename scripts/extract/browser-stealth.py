#!/usr/bin/env python3
"""
browser-stealth.py — Extracción con Chrome real vía nodriver (opcional).

Último recurso de fetch-content para sitios que sí exigen un navegador
indetectable: challenge de Cloudflare/Turnstile, fingerprinting por CDP o
bloqueo de headless. Es opcional y se instala aparte:

    python -m pip install --user -r scripts/extract/requirements-browser.txt

nodriver es AGPL-3.0: se usa como herramienta local del agente, no se
distribuye con el sitio ni se empaqueta en el build.

Uso:
    python scripts/extract/browser-stealth.py --url <URL> --json
    python scripts/extract/browser-stealth.py --url <URL> --timeout 45
    python scripts/extract/browser-stealth.py --check

Flags:
    --url URL        URL objetivo (o argumento posicional).
    --wait-for SEL   Espera un selector CSS antes de extraer.
    --selector SEL   Extrae solo ese elemento (por defecto: heurística article/main).
    --timeout N      Segundos máximos de espera/render (default: 40).
    --wait-ms N      Milisegundos extra tras la carga (default: 1500).
    --min-chars N    Mínimo de texto para considerar que salió del challenge (default: 300).
    --html           Devuelve HTML del contenedor en vez de texto.
    --json           Devuelve JSON con metadatos + contenido.
    --headed         Chrome visible (debug).
    --check          Solo reporta disponibilidad y sale.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

CHALLENGE_MARKERS = [
    "just a moment",
    "checking your browser",
    "verificación de seguridad en curso",
    "verificacion de seguridad en curso",
    "verify you are human",
    "un momento…",
    "attention required",
    "sorry, you have been blocked",
    "you are unable to access",
]

# Mantener en sync con scripts/extract/browser-extract.mjs (misma lista y
# umbrales). Se puntúa por texto en <p> entre contenedores NO-body: el body
# siempre tiene más texto, pero arrastra header/nav.
ARTICLE_SELECTORS = [
    "article",
    '[role="main"] article',
    "main article",
    "main",
    '[role="main"]',
    ".article-body",
    ".article-content",
    ".article__body",
    ".article__content",
    ".entry-content",
    ".post-content",
    ".post-body",
    ".content-body",
    ".nota-content",
    ".nota__cuerpo",
    ".contenido",
    ".story-body",
    ".cuerpo-nota",
]

_DEFAULT_UNRAISABLEHOOK = sys.unraisablehook


def _silence_event_loop_closed(unraisable):
    """Ignora el RuntimeError benigno de nodriver al cerrar el loop en Windows."""
    error = unraisable.exc_value
    if isinstance(error, RuntimeError) and "Event loop is closed" in str(error):
        return
    _DEFAULT_UNRAISABLEHOOK(unraisable)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extracción con navegador stealth (nodriver).")
    parser.add_argument("url_pos", nargs="?", help="URL objetivo")
    parser.add_argument("--url", dest="url_opt", help="URL objetivo")
    parser.add_argument("--selector", help="Extrae solo este selector CSS")
    parser.add_argument("--wait-for", dest="wait_for", help="Espera este selector CSS")
    parser.add_argument("--timeout", type=float, default=40)
    parser.add_argument("--wait-ms", dest="wait_ms", type=int, default=1500)
    parser.add_argument("--min-chars", dest="min_chars", type=int, default=300)
    parser.add_argument("--html", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    args.url = args.url_opt or args.url_pos
    return args


def find_browser():
    explicit = (
        os.environ.get("GV_BROWSER_EXECUTABLE")
        or os.environ.get("BROWSER_EXECUTABLE")
        or os.environ.get("STEALTH_BROWSER_EXECUTABLE")
    )
    if explicit and Path(explicit).exists():
        return explicit

    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Google\Chrome\Application\chrome.exe"),
        os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Microsoft\Edge\Application\msedge.exe"),
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/microsoft-edge",
        "/snap/bin/chromium",
    ]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return candidate
    for command in (
        "google-chrome",
        "google-chrome-stable",
        "chromium",
        "chromium-browser",
        "microsoft-edge",
        "chrome",
        "msedge",
    ):
        found = shutil.which(command)
        if found:
            return found
    return None


def build_content_js(html_mode: bool) -> str:
    html_expr = "best ? best.outerHTML : ''" if html_mode else "''"
    return (
        "(() => {\n"
        f"  const selectors = {json.dumps(ARTICLE_SELECTORS)};\n"
        "  const visibleText = (el) => {\n"
        "    if (!el) return '';\n"
        "    const style = window.getComputedStyle(el);\n"
        "    if (style.display === 'none' || style.visibility === 'hidden') return '';\n"
        "    return (el.innerText || '').trim();\n"
        "  };\n"
        "  const stats = (el) => {\n"
        "    if (!el) return { text: '', count: 0, sum: 0, max: 0, ratio: 0 };\n"
        "    const paragraphs = Array.from(el.querySelectorAll('p'));\n"
        "    let sum = 0;\n"
        "    let max = 0;\n"
        "    for (const p of paragraphs) {\n"
        "      const len = (p.innerText || '').trim().length;\n"
        "      sum += len;\n"
        "      if (len > max) max = len;\n"
        "    }\n"
        "    const text = visibleText(el);\n"
        "    return { text, count: paragraphs.length, sum, max, ratio: sum / Math.max(1, text.length) };\n"
        "  };\n"
        "  let best = null;\n"
        "  let bestStats = null;\n"
        "  for (const selector of selectors) {\n"
        "    for (const el of document.querySelectorAll(selector)) {\n"
        "      const s = stats(el);\n"
        "      if (s.count < 2 || s.sum < 400) continue;\n"
        "      if (!bestStats || s.sum > bestStats.sum || (s.sum === bestStats.sum && s.ratio > bestStats.ratio)) {\n"
        "        best = el; bestStats = s;\n"
        "      }\n"
        "    }\n"
        "  }\n"
        "  if (!best) {\n"
        "    best = document.body;\n"
        "    bestStats = stats(best);\n"
        "  }\n"
        "  return {\n"
        "    title: document.title,\n"
        "    url: location.href,\n"
        "    text: visibleText(best),\n"
        "    pCount: bestStats ? bestStats.count : 0,\n"
        "    maxParagraph: bestStats ? bestStats.max : 0,\n"
        "    pSum: bestStats ? bestStats.sum : 0,\n"
        f"    html: {html_expr},\n"
        "    rootTag: best ? best.tagName : null,\n"
        "    rootId: best ? best.id || null : null,\n"
        "    rootClass: best && typeof best.className === 'string' ? best.className : null,\n"
        "    webdriver: navigator.webdriver\n"
        "  };\n"
        "})()"
    )


def _eval_value(result):
    """Normaliza la respuesta de tab.evaluate.

    nodriver devuelve el RemoteObject (no el valor) cuando el valor evaluado es
    vacío, p. ej. document.body.innerText === '' en about:blank. Sin esto, el
    fallback devuelve un objeto y len()/lower() fallan.
    """
    if result is None:
        return ""
    if isinstance(result, (str, int, float, bool, dict, list)):
        return result
    value = getattr(result, "value", None)
    if value is not None:
        return value
    deep = getattr(result, "deep_serialized_value", None)
    if deep is not None:
        deep_value = getattr(deep, "value", None)
        if deep_value is not None:
            return deep_value
    return ""


async def extract(tab, html_mode: bool, selector: str | None):
    if selector:
        html_expr = "root ? root.outerHTML : ''" if html_mode else "''"
        expression = (
            "JSON.stringify((() => {\n"
            f"  const root = document.querySelector({json.dumps(selector)});\n"
            "  const paragraphs = root ? Array.from(root.querySelectorAll('p')) : [];\n"
            "  let pSum = 0;\n"
            "  let maxParagraph = 0;\n"
            "  for (const p of paragraphs) {\n"
            "    const len = (p.innerText || '').trim().length;\n"
            "    pSum += len;\n"
            "    if (len > maxParagraph) maxParagraph = len;\n"
            "  }\n"
            "  return {\n"
            "    title: document.title,\n"
            "    url: location.href,\n"
            "    text: root ? (root.innerText || '').trim() : '',\n"
            "    pCount: paragraphs.length,\n"
            "    maxParagraph: maxParagraph,\n"
            "    pSum: pSum,\n"
            "    html: " + html_expr + ",\n"
            "    rootTag: root ? root.tagName : null,\n"
            "    rootId: root ? root.id || null : null,\n"
            "    rootClass: root && typeof root.className === 'string' ? root.className : null,\n"
            "    webdriver: navigator.webdriver\n"
            "  };\n"
            "})())"
        )
    else:
        expression = f"JSON.stringify({build_content_js(html_mode)})"

    raw = _eval_value(await tab.evaluate(expression, return_by_value=True))
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
    # Fallback sin heurística: texto visible del body.
    text = _eval_value(
        await tab.evaluate("document.body ? document.body.innerText : ''", return_by_value=True)
    )
    return {
        "title": "",
        "url": "",
        "text": text or "",
        "html": "",
        "pCount": 0,
        "maxParagraph": 0,
        "pSum": 0,
        "rootTag": None,
        "rootId": None,
        "rootClass": None,
        "webdriver": None,
    }


def is_challenge(text: str) -> bool:
    lower = (text or "").lower()
    return any(marker in lower for marker in CHALLENGE_MARKERS)


async def run(args) -> dict:
    import nodriver as uc  # import tardío: --check debe funcionar sin nodriver

    profile = tempfile.mkdtemp(prefix="gv-stealth-")
    browser = None
    real_stdout = sys.stdout
    try:
        sys.stdout = sys.stderr  # nodriver no debe contaminar el stdout con el contenido
        browser = await uc.start(
            headless=not args.headed,
            browser_executable_path=find_browser(),
            user_data_dir=profile,
            browser_args=[
                "--disable-blink-features=AutomationControlled",
                "--no-first-run",
                "--no-default-browser-check",
                "--lang=es-CL",
            ],
            lang="es-CL",
        )
        tab = await browser.get(args.url)
        started = time.monotonic()

        if args.wait_for:
            try:
                await tab.select(args.wait_for, timeout=min(args.timeout, 20))
            except Exception:
                pass
        else:
            await tab.sleep(1.0)

        data = await extract(tab, args.html, args.selector)
        previous_length = -1
        while time.monotonic() - started < args.timeout:
            text = data.get("text") or ""
            if not isinstance(text, str):
                text = str(text)
            challenge = is_challenge(text)
            has_container = data.get("rootTag") != "BODY" and len(text) >= args.min_chars
            has_paragraphs = (
                int(data.get("pCount") or 0) >= 2
                and int(data.get("maxParagraph") or 0) >= 250
                and int(data.get("pSum") or 0) >= 600
            )
            stable = len(text) == previous_length
            if not challenge and (has_container or has_paragraphs):
                break
            # Sin contenedor semántico: no esperar el timeout completo si la
            # página ya se estabilizó (portadas y paywalls solo-nav).
            if (
                not challenge
                and data.get("rootTag") == "BODY"
                and ((stable and time.monotonic() - started > 8) or time.monotonic() - started > 12)
            ):
                break
            previous_length = len(text)
            await tab.sleep(1.0)
            data = await extract(tab, args.html, args.selector)

        if args.wait_ms > 0:
            await tab.sleep(args.wait_ms / 1000)
        data = await extract(tab, args.html, args.selector)

        content = (data.get("html") if args.html else data.get("text")) or ""
        if not isinstance(content, str):
            content = str(content)
        p_count = int(data.get("pCount") or 0)
        max_paragraph = int(data.get("maxParagraph") or 0)
        p_sum = int(data.get("pSum") or 0)
        body_only_nav = data.get("rootTag") == "BODY" and (
            p_count < 2 or max_paragraph < 250 or p_sum < 600
        )
        return {
            "ok": len(content.strip()) >= args.min_chars and not body_only_nav,
            "finalUrl": data.get("url") or args.url,
            "title": data.get("title") or "",
            "chars": len(content),
            "pCount": p_count,
            "maxParagraph": max_paragraph,
            "pSum": p_sum,
            "rootTag": data.get("rootTag"),
            "rootId": data.get("rootId"),
            "rootClass": data.get("rootClass"),
            "webdriver": data.get("webdriver"),
            "content": content,
        }
    finally:
        sys.stdout = real_stdout
        if browser is not None:
            # Capturar el proceso antes de stop(): stop() pone _process = None.
            process = getattr(browser, "_process", None)
            try:
                browser.stop()
            except Exception:
                pass
            await asyncio.sleep(1.0)
            if process is not None:
                try:
                    if process.poll() is None:
                        if os.name == "nt":
                            subprocess.run(
                                ["taskkill", "/PID", str(process.pid), "/T", "/F"],
                                stdout=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL,
                                timeout=10,
                                check=False,
                            )
                        else:
                            os.kill(process.pid, signal.SIGKILL)
                except Exception:
                    pass
        for _ in range(6):
            shutil.rmtree(profile, ignore_errors=True)
            if not os.path.exists(profile):
                break
            await asyncio.sleep(0.3)


def run_check() -> int:
    try:
        import nodriver
        from importlib.metadata import version as pkg_version

        try:
            version = pkg_version("nodriver")
        except Exception:  # noqa: BLE001
            version = getattr(nodriver, "__version__", "?")
    except Exception as error:  # noqa: BLE001
        payload = {"ok": False, "error": f"nodriver no instalado: {error}"}
        sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
        return 2
    payload = {
        "ok": True,
        "python": sys.version.split()[0],
        "nodriver": version,
        "browser": find_browser(),
    }
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    return 0


def main() -> int:
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
    logging.getLogger("nodriver").setLevel(logging.WARNING)
    sys.unraisablehook = _silence_event_loop_closed

    args = parse_args()
    if args.check:
        return run_check()
    if not args.url:
        sys.stderr.write("Uso: python scripts/extract/browser-stealth.py --url <URL>\n")
        return 1

    result = asyncio.run(run(args))
    if args.json:
        sys.stdout.write(json.dumps(result, ensure_ascii=False) + "\n")
    else:
        sys.stdout.write((result.get("content") or "") + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
