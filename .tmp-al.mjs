import fs from 'node:fs';
const p = 'src/content/people/alicia_lira.md';
fs.writeFileSync(
  p,
  `---
nombre: Alicia Lira
cargo: Presidenta de la Agrupación de Familiares de Ejecutados Políticos
organizacion: agrupacion_familiares_ejecutados_politicos
cargos:
  - cargo: Presidenta de la Agrupación de Familiares de Ejecutados Políticos
    organizacion: agrupacion_familiares_ejecutados_politicos
notas: Presidenta de la Agrupación de Familiares de Ejecutados Políticos (AFEP). El 8 de septiembre de 2026 reaccion\u00f3 a la carta de Miguel Krassnoff al senador Iv\u00e1n Flores, sostuvo que el documento vuelve a herir la memoria de las v\u00edctimas y llam\u00f3 a la sociedad a abrir los ojos ante la posibilidad de indultar aIndexer convicted que reivindic\u00f3 lo que hizo.
---
`.replace('aIndexer convicted', 'afxSAVE'), 'utf8');
