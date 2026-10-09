// Servidor estatico minimo para revisar dist/ con puppeteer.
//
//   pnpm run build
//   node .agents/skills/frontend/scripts/serve-dist.mjs   # en background, puerto 4319
//   node .agents/skills/frontend/scripts/e2e-presupuesto.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

// `dist/` se resuelve desde la raiz del proyecto, no desde el script.
const ROOT = join(process.cwd(), 'dist');
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = join(ROOT, p);
    try {
      const s = await stat(file);
      if (s.isDirectory()) file = join(file, 'index.html');
    } catch {
      file = join(ROOT, p, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TIPOS[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch (e) {
    res.writeHead(404).end(String(e));
  }
}).listen(4319, () => console.log('listo en http://localhost:4319'));
