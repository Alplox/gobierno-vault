## Extraccion de contenido web

**IMPORTANTE: Cuando una URL no se pueda leer, agotar TODOS los fallbacks antes de pedir al
usuario que provea el contenido.** Cada método tiene fortalezas distintas:

| Método | Fortaleza | Casos documentados |
|---|---|---|
| `read_url` | Extracción HTML estándar | Sitios estáticos, blogs |
| `r.jina.ai` | JS rendering ligero | La Tercera, Emol |
| `defuddle.md` | Limpieza agresiva de boilerplate | **BioBioChile** (mejor que r.jina) |
| `markdown.new` | Conversión a markdown puro | Documentos simples |
| `paywallskip.com` | Bypass de paywall | The Clinic (paywall suave) |
| `archive.ph` | Snapshot archivado en caché | Artículos eliminados |
| `fetch-impersonate` | TLS fingerprinting real | Cloudflare challenge, rate-limit |
| `html-raw` | HTML crudo + extracción de article/JSON-LD | Fallback cuando mirrors fallan |
| `add-source` | Solo metadata (título/autor/fecha) | Fallback último recurso |
| `ocr-extract` | OCR de imágenes/screenshots | Tablas en imagen, screenshots de redes |

**Script automatizado `pnpm run fetch-content`:**

```bash
# Cadena completa de fallbacks (r.jina → defuddle → markdown.new → paywallskip → archive → impersonate → add-source)
pnpm run fetch-content -- https://sitio.cl/articulo

# Con verbose para ver cada intento
pnpm run fetch-content -- https://sitio.cl/articulo --verbose

# Solo un método específico
pnpm run fetch-content -- https://sitio.cl/articulo --method defuddle.md
```

El script intenta cada método en orden y retorna el primer resultado con ≥500 caracteres.
Si TODOS fallan, imprime un resumen de por qué falló cada uno y sugiere pedir al usuario.

**Regla para agentes:** Si `read_url` falla o retorna navigation/layout (JS rendering), ejecutar
`pnpm run fetch-content -- <URL> --verbose` ANTES de informar al usuario. Solo informar al
usuario como último recurso, explicando QUÉ falló y POR QUÉ (ej: "BioBioChile usa JS pesado;
r.jina y defuddle no extrajeron contenido legible; el sitio requiere navegador real").

**Escalera manual (cuando el script no es adecuado):**

1. `read_url` (fetch estándar)
2. `r.jina.ai` + URL
3. `defuddle.md` + URL
4. `markdown.new` + URL
5. `paywallskip.com/article?url=` + URL
6. `archive.ph` + URL
7. `pnpm run fetch-impersonate -- <URL>` — curl_cffi (Python) con impersonación TLS
8. `pnpm run add-source -- <URL>` — solo metadata

**Notas de plataforma:**
- BioBioChile: usa JS pesado; `defuddle.md` es el mejor método (no r.jina)
- The Clinic: paywall suave; `paywallskip.com` o `r.jina.ai` funcionan
- El Ciudadano: rate-limit; `fetch-impersonate` o `archive.ph`
- CIPER: paywall; `paywallskip.com` o `r.jina.ai` a veces funcionan
- Archive.ph: puede dar rate-limit 429; intentar con `fetch-impersonate` como fallback

## Defuddle CLI local (alternativa al espejo web)

`defuddle parse <URL> --md` ejecuta el mismo limpiador de boilerplate que el espejo
`defuddle.md`, pero **en local** (paquete npm global `defuddle`; verificar con
`defuddle --version`). Ventajas sobre el espejo: sin rate-limit ni dependencia de un
tercero disponible, salida directa a stdout para piping, y menos tokens que leer HTML crudo.

```bash
# Markdown limpio a stdout — primera opción para artículos estándar
defuddle parse https://sitio.cl/articulo --md

# Guardar a archivo / extraer solo una propiedad de metadatos
defuddle parse https://sitio.cl/articulo --md -o articulo.md
defuddle parse https://sitio.cl/articulo -p title   # también: author, description, domain, published

# Formatos: --md markdown · --json HTML+markdown · sin flag = HTML
```

- **Cuándo usarlo vs los espejos**: primera opción para páginas estándar antes de recurrir a
  mirrors. Los espejos (`defuddle.md`, `r.jina.ai`) quedan para sitios con JS pesado o
  bloqueos donde el fetch local no llega (BioBio sigue mejor con su espejo documentado).
- **Instalación** (si falta): `npm install -g defuddle`.
- Verificado 24-ago-2026 (v0.19.2) extrayendo limpio un artículo de El Ciudadano.

## Búsqueda local con ripgrep (`rg`) — catálogo y repo

[ripgrep](https://github.com/BurntSushi/ripgrep) es la herramienta estándar de búsqueda de
texto en este repo: órdenes de magnitud más rápido que `Select-String`/`Get-ChildItem` y con
respeto a `.gitignore` configurable. Verificar con `rg --version`; instalar en Windows con
`winget install BurntSushi.ripgrep.MSVC`.

```bash
# Catálogo completo de sitemaps (ver advertencias -uu/-g en sitemaps.md)
rg -i --no-heading -uu -g '*.jsonl' 'término' sitemaps

# Un medio/año específico
rg -i --no-heading -uu 'quiroz' sitemaps/elmostrador/2026.jsonl

# En el resto del repo (eventos, fuentes, TAREAS): sin -uu, respeta .gitignore
rg -i 'palabra' src/content/events/
```

Flags usados habitualmente: `-i` (insensible a mayúsculas), `-uu` (incluye gitignoreados +
ocultos — obligatorio en `sitemaps/` porque los JSONL no se commitean), `-g '*.jsonl'`
(filtra por glob y evita escanear `sitemaps/.cache/`), `--no-heading` (salida compacta),
`-l` (solo lista de archivos), `-c` (solo conteo). Benchmarks medidos en la sección
"Catálogo de sitemaps → Uso del catálogo por agentes" (~320× más rápido que Select-String).

## Procesamiento de PDFs (lectura de documentos)

`pnpm run pdf-extract -- <URL-del-PDF>` descarga el PDF y lo convierte a **Markdown estructurado**
con la libreria `@firecrawl/pdf-inspector` (devDependency, nucleo Rust nativo via NAPI, sin OCR,
sin modelos ML, offline; conserva titulos H1-H4, listas, tablas, negritas, subrayados y el orden
de lectura multicolumna) para leer documentos primarios durante investigaciones/correcciones
(planes filtrados, informes oficiales, fallos).

- **Uso:** `pnpm run pdf-extract -- https://sitio.cl/doc.pdf` imprime el markdown a stdout
  (o `--out <ruta>` para guardarlo). `--json` imprime clasificacion + markdown. Acepta tambien
  un `.md` ya extraido como argumento posicional para re-imprimir sin red. Avisa si el PDF es
  escaneado (pdfType distinto de TextBased/Mixed: requiere OCR) y tiene timeout de descarga +
  chequeo del magic `%PDF`. Si la descarga falla (bloqueo TLS), relega automáticamente a
  `fetch-impersonate.mjs` (curl_cffi).

## Procesamiento de documentos de Office (Word/Excel/PowerPoint)

`pnpm run doc-extract -- <URL-del-documento>` descarga un documento **.docx/.xlsx/.pptx** (u otros
formatos: pdf, html, csv, json, xml, txt, md) y lo convierte a **Markdown estructurado** con
**MarkItDown** de Microsoft (`https://github.com/microsoft/markitdown`, instalado vía
`python -m pip install --user "markitdown[docx,xlsx,pptx,pdf]"`). Complementa a `pdf-extract`:
muchas fuentes primarias de gobierno (informes, minutas, tablas de presupuesto, presentaciones)
llegan en formatos de Office que no se pueden leer con la prensa ni los mirrors.

- **Uso:** `pnpm run doc-extract -- https://sitio.cl/doc.docx` imprime el markdown a stdout
  (o `--out <ruta>` para guardarlo). `--json` imprime metadatos + markdown. Acepta también un
  archivo local como argumento posicional. Avisa si la extracción sale casi vacía (posible
  escaneo/formato no soportado). Si la descarga falla (bloqueo TLS), relega automáticamente a
  `fetch-impersonate.mjs` (curl_cffi).
- **Requisito:** Python 3 + MarkItDown (ver arriba). El script invoca `python -m markitdown`
  (más robusto que depender del `.exe` en PATH, que en Windows a veces falla por permisos).

## OCR de imágenes y screenshots

`pnpm run ocr-extract -- <imagen>` extrae texto de imágenes usando Tesseract OCR via Python.
Útil para leer screenshots de artículos, documentos escaneados, o imágenes con texto que no se
puede obtener por otros medios.

- **Uso:** `pnpm run ocr-extract -- imagen.png` imprime el texto a stdout
  (o `--out <ruta>` para guardarlo). `--lang spa+eng` para idioma (default: español + inglés).
- **Verificar disponibilidad:** `pnpm run ocr-extract --check`
- **Requisito:** Python 3 + pytesseract + Tesseract OCR instalado:
  ```bash
  pip install --user pytesseract Pillow
  # Windows: descargar de https://github.com/UB-Mannheim/tesseract/wiki
  # Linux: sudo apt install tesseract-ocr tesseract-ocr-spa
  # macOS: brew install tesseract tesseract-lang
  ```- **Uso típico:** Cuando un artículo contiene información en imagen (tabla, gráfico, screenshot
  de red social) que no se puede obtener por los mirrors de texto.

## Transcripción de videos

`pnpm run video-transcript -- <URL>` extrae transcripciones de videos. Para YouTube usa
subtítulos (manuales o auto-generados) vía yt-dlp; para TikTok/Instagram/Twitter/Facebook
descarga el audio y lo transcribe con Whisper.

- **Uso:** `pnpm run video-transcript -- https://youtube.com/watch?v=XXXXX` imprime la transcripción
  (o `--out <ruta>` para guardarlo). `--lang es` para idioma (default: español).
- **Listar subtítulos:** `pnpm run video-transcript -- <URL> --list`
- **Solo auto-subtítulos:** `pnpm run video-transcript -- <URL> --auto`
- **Verificar disponibilidad:** `pnpm run video-transcript --check`

**Soporte por plataforma:**

| Plataforma | Estado | Método |
|---|---|---|
| YouTube | ✅ | Subtítulos manuales/auto-generados (yt-dlp) |
| TikTok | ✅ | Download audio + Whisper transcription |
| Instagram | ✅ | Download audio + Whisper transcription |
| Twitter/X | ✅ | Download audio + Whisper transcription |
| Facebook | ✅ | Download audio + Whisper transcription |

**Cadena de backends de Whisper** (el script prueba en orden hasta encontrar uno disponible):

1. **whisper.cpp** (`whisper-cli`) — binario C++, CPU-friendly, sin dependencias Python
   - Instalar: `https://github.com/ggerganov/whisper.cpp`
   - Modelo: `models/ggml-large-v3.bin` (descargar con `./models/download-ggml-model.sh large-v3`)
2. **openai-whisper** (Python) — implementación oficial, más pesado pero fácil
   - `pip install --user openai-whisper`
3. **faster-whisper** (Python) — CTranslate2, más rápido y eficiente en memoria
   - `pip install --user faster-whisper`
   - Soporta GPU NVIDIA con cuantización INT8

Si ninguno está disponible, el script descarga el audio y muestra instrucciones de instalación.

**Alternativa CLI independiente:** `transcript` (wrapper para YouTube + TikTok + Instagram)
- GitHub: `https://github.com/anthropics/transcript` (o buscar `pip install transcript`)
- Detecta plataforma automáticamente, para TikTok/Instagram usa yt-dlp + Whisper internamente.
- Útil si se prefiere un solo comando sin configurar backends.

**Uso típico en el vault:** Cuando una fuente es un video (conferencia de prensa,
declaración de autoridad, análisis de experto, hilo de redes sociales) y se necesita citar
contenido específico que no está en cobertura de prensa escrita. Para extractos cortos de
redes sociales, considerar también la sección de métodos de búsqueda de Reddit/Facebook.

## Generador de fuentes (script)

`pnpm run add-source -- <URL>` (o `pnpm run add-source` sin URL para modo interactivo) extrae
automaticamente `titulo`, `autor` y `fecha` de la URL y genera el bloque YAML listo para pegar
en `sources.yaml`, junto con el ID `medio-YYYY-MM-DD-slug` y el wikilink `[[source/id]]`.

- Fetch del HTML directo; si falla o no hay titulo, relega a `r.jina.ai`.
- El mapeo dominio → medio se precarga desde `sources.yaml` + un diccionario base en el script.
- Consulta el catálogo de sitemaps antes del fetch (ver "Catálogo de sitemaps → Integración
  con add-source.mjs").
- Flags: `--append` (agrega el bloque directo al final de `sources.yaml`), `--mirror` (fuerza
  espejo), `--catalog-only` (sin fetch, solo datos del catálogo), `--search <texto>` (busca en
  el catálogo y deja elegir; con `--medio <slug>` y `--fecha YYYY-MM-DD` filtra).
- Siempre imprime la URL del articulo original (nunca el mirror), y avisa si el ID ya existe.
