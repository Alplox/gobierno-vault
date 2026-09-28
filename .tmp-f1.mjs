import fs from 'node:fs';
const p = 'src/content/sources/radio-uchile-2026-09-11-kaiser-disposicion-indultos.md';
const t = fs.readFileSync(p, 'utf8');
const a = 'y el trato a los conscriptos';
const i = t.indexOf(a);
if (i < 0) {
  console.log('NO ENCONTRADO');
  process.exit(1);
}
const fixed = t.slice(0, i) + 'y el tratamiento de los soldados conscriptosSpecifier';
console.log('revisar manualmente');
