---
name: backup
description: Respaldo offline público .gvault con Brotli y SHA-256, verificación y restauración. Usa esta skill SIEMPRE al generar, verificar o restaurar backups, tocar scripts/backup.mjs, public/backup/ o el footer de backup, incluso si solo dice 'hacer backup'.
---

## Respaldo / Restauracion (backup offline publico)

> **Handoff:** si cambias `scripts/gvault-util.mjs`, `backup.mjs`, el formato `.gvault` o el footer de backup, actualiza este skill en la misma sesión.

El repo puede morir por el contenido sensible (politica/corrupcion), por eso se genera un
respaldo offline publico (SIN contraseña) que cualquiera pueda custodiar. Son archivos
`.gvault`: Brotli (integrado en Node, mejor ratio que gzip para texto) + checksums
SHA-256 (integridad verificable sin secretos) + manifest por archivo. No requiere
dependencias nuevas.

Scripts (ver `scripts/gvault-util.mjs` para el formato compartido):
- `pnpm run backup` — genera UN archivo `.light.gvault` (solo contenido actual: `src/**` +
  docs raiz + config, sin `dist/`, `node_modules/`, `.astro/`, `.git/`, `public/`) DIRECTO en
  `public/backup/` (ubicacion canonica, SE COMMITEA) junto con `manifest.json` (`archivo`,
  `url`, `tamano`, `sha256` del archivo completo).
- `pnpm run verify -- <archivo.gvault>` — comprueba integridad (uso publico).
- `pnpm run restore -- <archivo.gvault> [--dest <ruta>]` — extrae los archivos.
- Flags de backup: `--shallow` (solo `src/content`+`src/data`), `--out <prefijo>`.

Convenciones:
- `public/backup/` se COMMITEA al repo (no esta en `.gitignore`): el respaldo queda descargable
  por cualquiera desde GitHub con un solo clic Y el footer del sitio lo sirve en `/backup/` sin
  CPU extra en build. Al generar respaldo nuevo, commitea `public/backup/`. NO hay `.gvault` en
  la raiz: la unica copia vive en `public/backup/` (evita duplicacion; `public` está en
  `EXCLUDE_DIRS` de `backup.mjs` para que el respaldo no se incluya a sí mismo).
- Ademas, se recomienda que quien descargue una copia la guarde FUERA del repo (USB, Drive, otras
  personas), para que sobreviva aunque el repo/plataforma desaparezca.
- No incluyen password/cifrado a proposito (custodia publica); la integridad la dan los hashes
  SHA-256, no el secreto. Al ser contenido sin cifrar, es tan sensible como el propio repo:
  protegelo igual (mismo contenido que el vault).
- **Respaldo en el footer del sitio:** el footer de todas las páginas lee `manifest.json` por
  fetch y ofrece: botón **"Descargar respaldo (.gvault)"** (descarga con el nombre versionado
  real), botón **"Descargar repositorio (.zip)"** (ZIP estilo GitHub de `Alplox/gobierno-vault`,
  `archive/refs/heads/main.zip`) y un panel desplegable (`<details id="gvault-copy">`) con
  `<textarea>` que carga el contenido del archivo (lazy, al abrir) para **copiarlo directamente**; muestra el nombre,
  tamaño y SHA-256 esperados del respaldo actual y la guía de verificación correcta (one-liner
  de Node incluido en el propio archivo, o `sha256sum`/`Get-FileHash` contra el SHA mostrado).
  Ojo: el `toggle` de `<details>` NO burbujea — el listener se registra en **fase de captura**
  (`addEventListener('toggle', fn, true)`), si no el textarea nunca se llenaba. Si no existe
  backup, el footer muestra un aviso y deshabilita la descarga.
- **Corrección de integridad (BOM):** `scripts/backup.mjs` usa `TextDecoder` con `ignoreBOM: true`
  en `encodeFile`; sin esto los archivos con BOM UTF-8 (ej. `src/scripts/eventListClient.js`)
  perdían 3 bytes en el round-trip y `verify` reportaba hash incorrecto.
- **Instrucciones para no técnicos embebidas en cada `.gvault`**: la cabecera INFORMACION explica
  paso a paso cómo comprobar la integridad (instalar Node → abrir terminal → pegar el one-liner
  `VERIFY_ONELINER`) y cómo recuperar los archivos sin el proyecto con un solo comando
  (`RESTORE_ONELINER`, extrae todo a una carpeta). Ambos viven como consts en `scripts/backup.mjs`
  y se interpolan en `buildInfo`. Usan
  `lastIndexOf('===METADATA===')` a propósito: la cabecera contiene ese texto DENTRO del propio
  one-liner de verificación, así que `indexOf` (primera aparición) apuntaría al lugar equivocado.
  Cada regeneración debería validarse con una restauración de prueba (extraer a una carpeta
  temporal y comparar con los originales; los one-liners se prueban también contra un archivo
  corrupto: debe salir `CORRUPTO` con exit 1).