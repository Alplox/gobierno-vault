---
name: cobertura
description: Auditoría de puntos ciegos y sesgo de agenda — cruza prensa del catálogo (sitemaps) contra los eventos del vault y las fuentes oficiales, y detecta temas con eco de prensa sin evento documentado. Usa esta skill SIEMPRE al preguntar "qué pasó desapercibido", al auditar cobertura de un período, al detectar sesgo de agenda (la prensa se concentra en un tema y deja otros), o al correr `pnpm run coverage-audit`, incluso si solo dice 'puntos ciegos' o 'qué nos faltó'.
---

# Cobertura — auditoría de puntos ciegos

> Cuándo cargar: quieres saber qué pasó "bajo el radar" en un período, auditar si el vault heredó la agenda de la prensa, o cerrar brechas de cobertura.
> **Handoff:** si cambias `scripts/coverage/audit.mjs` (filtros, stopwords, medios nacionales, dominios oficiales), actualiza esta skill en la misma sesión.

## El problema que resuelve

La cola de eventos la llena la prensa (`sitemaps` + `news-search`). Cuando la atención se concentra en una historia, lo que ocurre en paralelo no entra a la cola y **no queda registro de la omisión**. Este script genera ese registro cruzando tres fuentes para un rango de fechas:

| Flujo | Origen | Qué aporta |
| --- | --- | --- |
| Prensa | `sitemaps/websites/*/<año>.jsonl` | concentración de atención (qué copó el período) |
| Vault | `src/content/events/YYYY/MM/` + `src/content/sources/` | qué quedó documentado y con cuántas fuentes |
| Oficial | entradas del catálogo en dominios del Estado | actos que se publican sin depender de la prensa |

## Uso

```bash
pnpm run coverage-audit -- --from 2026-10-01 --to 2026-10-03
pnpm run coverage-audit -- --from 2026-10-01 --to 2026-10-03 --focus "yo elijo|becas tic|junaeb"
pnpm run coverage-audit -- --from 2026-10-01 --to 2026-10-03 --json > tmp/audit.json
pnpm run coverage-audit -- --from 2026-10-01 --to 2026-10-03 --strict   # exit 1 si hay brechas / eventos sin oficial
```

Flags: `--min-medios` (default 3), `--top` (default 20), `--focus <regex>` (mide cuánta atención concentró la historia dominante), `--nacional-only` (agrega términos solo de medios nacionales), `--json`, `--strict`.

## Cómo leer la salida

- **PRENSA** — artículos y medios del rango; con `--focus` la fracción de atención de la historia dominante. Es la medida de "de qué habló todo el mundo".
- **VAULT** — eventos del rango con fuentes citadas y cuántas son oficiales. Marca con `⚠` los que citan menos de 3 fuentes (mínimo recomendado). Es tu cobertura real.
- **BRECHAS** — términos con eco de prensa que **no** aparecen en el título/tema/etiquetas de ningún evento del rango. Es una **lista de exploración, no un ranking de importancia**: está ordenada por eco nacional y tiene ruido. Cada candidato trae URLs de muestra y el `news-search` sugerido; hay que verificarlo antes de crear un evento.
- **AGENDA OFICIAL** — actos oficiales catalogados y aviso si el catálogo oficial está desactualizado para el rango; eventos del vault sin ninguna fuente oficial.

## Límites conocidos (verificar, no confiar ciego)

- El catálogo local tiene la fecha del último `sitemaps-sync`; si el rango es muy reciente, la prensa y sobre todo lo oficial están **sub-muestreados**. El script avisa en AGENDA OFICIAL.
- Los términos salen de slugs/títulos de URL (ruidosos). Dos historias distintas pueden compartir un término y una historia puede aparecer en varios términos (el script colapsa los que comparten URL de muestra).
- La sindicación (una nota republicada por una cadena regional) se deduplica por `pathname` repetido entre dominios; aun así quedan noticias locales y de farándula/deportes que se filtran por sección y host.
- **BRECHAS no mide daño.** Para priorizar, aplica el criterio de impacto de `event-rules` (magnitud fiscal, población afectada, irreversibilidad, derechos). El script no decide eso: solo muestra que el tema existió y el vault no lo registró.

## Flujo de cierre de una brecha

1. Confirmar el candidato con `pnpm run news-search -- "<término>" --since <desde>` y, si toca al Estado, con fuente directa (`fuentes-gubernamentales`).
2. Si es evento real: crearlo con `content-model` + `event-rules` (5 fuentes de medios distintos, min. 1 oficial si aplica) y su entidad/fuente en `src/content/**`.
3. Si no es evento (farándula, internacional, ruido): descartarlo en el resumen al usuario; no se registra en el vault.
4. Si es real pero no alcanza para evento todavía: registrar `⬜` en `TAREAS/PENDIENTES/YYYY.md` con `Origen: <url>` (ver `seguimiento`), nunca como nota de editor en el body.

## Mantenimiento

- `NATIONAL_MEDIA` (slugs de alcance nacional), `OFFICIAL_HOST_RE` (dominios del Estado) y `STOPWORDS` viven en `scripts/coverage/audit.mjs`; edítalos cuando cambie el catálogo o aparezca ruido nuevo.
- Al agregar un medio nacional al catálogo, súmalo a `NATIONAL_MEDIA` para que pese en el ranking de brechas.
