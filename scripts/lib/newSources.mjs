import { execFileSync } from 'node:child_process';
import { basename } from 'node:path';

/**
 * IDs de fuentes nuevas en el working tree, según git:
 *  - sin commitear (untracked o modificadas en el índice) — siempre, y
 *  - agregadas al repo en los últimos `days` días — solo si days > 0.
 *
 * Default 0 porque en este repo el usuario commitea varias tandas por día: una
 * ventana de 7 días arrastra cientos de fuentes y convierte una tanda pequeña
 * en un trabajo de red enorme. La señal precisa de "recién creada por un agente"
 * es que todavía esté sin commitear; `--new-days N` habilita el fallback.
 *
 * Best-effort: si git no está disponible (CI sin historial, repo no inicializado)
 * devuelve lo que haya y el llamador decide cómo avisar. Solo lectura.
 */
export function getNewSourceIds(days = 0) {
  const ids = new Set();
  const run = (args) => execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  try {
    const out = run(['status', '--porcelain', '--', 'src/content/sources/']);
    for (const line of out.split('\n')) {
      const m = line.match(/^..?\s+(.+)$/);
      if (!m) continue;
      const p = m[1].replace(/^"|"$/g, '');
      if (p.startsWith('src/content/sources/') && p.endsWith('.md')) {
        ids.add(basename(p, '.md'));
      }
    }
  } catch { /* git no disponible */ }

  if (days > 0) {
    try {
      const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
      const out = run(['log', '--diff-filter=A', `--since=${since}`, '--format=', '--name-only', '--', 'src/content/sources/']);
      for (const line of out.split('\n')) {
        const p = line.trim();
        if (p.startsWith('src/content/sources/') && p.endsWith('.md')) {
          ids.add(basename(p, '.md'));
        }
      }
    } catch { /* git no disponible */ }
  }

  return ids;
}
