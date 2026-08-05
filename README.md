# Gobierno Vault

Gobierno Vault es una base de conocimiento estática sobre eventos relacionados a gobiernos en Chile, construida con Astro 7 y Tailwind CSS. El proyecto organiza eventos políticos y gubernamentales mediante archivos Markdown con metadatos YAML, fuentes verificables y wikilinks para personas, organizaciones, cifras y referencias.

## Notas

- Sitio aún esta en desarrollo. Lo que implica constantes cambios, evolución y correcciones.
- Sitio esta de momento con una carga fuerte en cuando a lo que tacharia de 'recency bias'. Idea es con el tiempo nivelar esto con resto de años/meses/dias para que no sea asi.
- Se hace uso de LLM's para asistencia en investigacion tanto como redaccion de eventos, pero proyecto esta pensado para ser facilmente editable sin ayuda de estas herramientas (formato Markdown).
- De momento no existen plantillas/reglas para contribuir a proyecto, favor referirse a archivo `AGENTS.md` para mayor entendimiento de estructuras esperadas en caso de querer aportar.
- ¿Encontraste una falla? ¿Evento no usa lenguaje objetivo/neutro? ¿Falta contexto? Crea un pull request con aquel corrección o un issue con todos los detalles.
- https://xkcd.com/927/

## Características

- Sitio estático con salida `static` (SSG) usando Astro.
- Contenido estructurado en `src/content/events/YYYY/MM/YYYYMMDD-N.md`.
- Datos maestros en YAML en `src/data/` para personas, organizaciones, cifras, temas, fuentes, colectivos y sectores.
- Procesamiento de wikilinks para referencias internas y anexos de fuentes.
- Página de administrador simple y secciones para eventos, personas, organizaciones, fuentes y temas.

## Estructura principal

- `src/content/events/` - eventos organizados por año/mes.
- `src/data/` - registros YAML de entidades, fuentes, temas, colectivos y sectores.
- `src/lib/` - lógica de consulta, plugins de remark y extracción de entidades.
- `src/components/` - componentes UI reutilizables.
- `src/pages/` - rutas del sitio.
- `scripts/` - utilidades de validación, generación de índice y administración de fuentes.

## Comandos útiles

- `npm install` - instala dependencias.
- `npm run dev` - ejecuta el servidor de desarrollo.
- `npm run build` - valida y construye el sitio estático.
- `npm run preview` - previsualiza el sitio construido (servidor local).
- `npm run deploy` - despliega a Cloudflare Pages (`https://gobierno-vault.pages.dev`).
- `npm run validate` - valida contenido y estructura.
- `npm run generate-index` - regenera índices y estadísticas del repositorio.
- `npm run add-source -- <URL>` - extrae metadatos de una fuente y sugiere un bloque para `sources.yaml`.
- `npm run backup` - genera los respaldos públicos `.gvault` (light y full) en la raíz.
- `npm run verify -- <archivo.gvault>` - verifica la integridad de un respaldo.
- `npm run restore -- <archivo.gvault> --dest <ruta>` - restaura un respaldo a disco.

## Ayudar con los respaldos (sin ser técnico)

Este proyecto registra temas de política y casos de corrupción, por lo que
el repositorio podría desaparecer de GitHub en algún momento. Para que el
proyecto **sobreviva aunque eso ocurra**, se generan respaldos públicos en
archivos `.gvault` que quedan en la raíz del repositorio y cualquiera puede
descargarlos y guardarlos. **Tu ayuda es simplemente guardar una copia.**

### ¿Qué son esos archivos `.gvault`?

Son *fotografías completas* del proyecto comprimidas en un solo archivo:

- `gob-vault-backup-...light.gvault` → el contenido actual (más pequeño).
- `gob-vault-backup-...full.gvault` → el contenido **más todo el historial** de git.

No tienen contraseña. Son públicos, igual que el resto del repositorio. **Ojo:**
al igual que el repositorio, su contenido es sensible (política/corrupción), así
que guárdalos con el mismo cuidado que le darías al propio repo.

### Cómo puedes ayudar (3 pasos, sin saber de código)

1. **Descarga** los archivos `.gvault` desde la sección de archivos del repositorio
   (o haz clic derecho en el enlace → "Guardar enlace como…").
2. **Guárdalos en un lugar seguro** que no se borre solo: un USB, tu Google Drive,
   un correo a ti mismo, o pásaselos a otra persona. Lo importante es que exista
   una copia **fuera** de GitHub.
3. (Opcional) **Comprueba que estén sanos** con solo Node.js instalado:

   ```
   node -e "const{readFileSync}=require('fs'),{createHash}=require('crypto'),{brotliDecompressSync}=require('zlib');const t=readFileSync(process.argv[1],'utf8'),a=t.lastIndexOf('===METADATA==='),n1=t.indexOf('\n',a),n2=t.indexOf('\n',n1+1),m=JSON.parse(t.slice(n1+1,n2)),c=Buffer.from(t.slice(n2+1),'base64');if(createHash('sha256').update(c).digest('hex')!==m.sha256){console.error('CORRUPTO, descarta este archivo');process.exit(1)}console.log('OK, integro:',m.kind,m.fileCount,'archivos')" nombre-del-archivo.gvault
   ```

   Si imprime `OK, integro: ...` el respaldo está bien. Si imprime `CORRUPTO`,
   descártalo y descarga una copia nueva.

Cada archivo `.gvault` además **trae estas instrucciones dentro**, al inicio, en
texto plano: así, aunque se suba a un sitio tipo pastebin y se pierda el nombre,
cualquiera sabrá cómo se llama, cómo verificar su integridad y cómo restaurarlo.

## Convenciones de contenido

- Cada evento debe tener frontmatter YAML con campos como `titulo`, `fecha`, `tipo`, `tema`, `creado` y `actualizado`.
- El campo `tema` usa IDs desde `src/data/topics.yaml`.
- Las fuentes se referencian inline con `[[source/id]]` dentro del texto.
- Las menciones de personas, organizaciones y cifras usan wikilinks: `[[person/id]]`, `[[org/id]]`, `[[cifra/concepto/valor/unidad]]`.
- Evita secciones de referencias al final; las fuentes se citan directamente en el cuerpo del texto.

## Datos y entidades

- `src/data/entities.yaml` contiene personas, organizaciones y cifras.
- `src/data/sources.yaml` contiene las fuentes periodísticas y URLs originales.
- `src/data/topics.yaml` define los temas disponibles.
- `src/data/colectivos.yaml` y `src/data/sectores.yaml` listan los grupos y sectores.

## Contribuir

1. Revisa `AGENTS.md` para entender las convenciones del repositorio.
2. Agrega nuevos eventos en `src/content/events/YYYY/MM/YYYYMMDD-N.md`.
3. Añade nuevas entidades o fuentes en los archivos YAML correspondientes.
4. Ejecuta `npm run validate` y `npm run build` antes de enviar cambios.

## Recursos adicionales

- `TEMPLATE.md` contiene la plantilla de evento para nuevos registros.
- `AGENTS.md` describe el flujo interno y las reglas del proyecto.
- `EVENTS_INDEX.md` ofrece un índice de eventos generado automáticamente.

## Requisitos

- Node.js compatible con Astro 7.
- Dependencias del proyecto declaradas en `package.json`.

---

Proyecto diseñado para capturar y navegar eventos de gobierno en Chile con datos estructurados y trazabilidad de fuentes.