import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function fixFile(path) {
  try {
    let c = readFileSync(path, 'utf8');
    const orig = c;
    // Skip frontmatter and code blocks: split by ``` and --- delimiters and only process outside
    const parts = c.split(/(```[\s\S]*?```)/g);
    let result = '';
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      // Even parts are outside code blocks, odd parts are inside ```...```
      if (i % 2 === 1) {
        result += part; // inside code block, don't touch
        continue;
      }
      // Also skip YAML frontmatter at start of file (between --- at top)
      if (i === 0 && part.startsWith('---')) {
        const end = part.indexOf('\n---', 3);
        if (end !== -1) {
          // frontmatter found, leave it untouched
          const frontmatter = part.slice(0, end + 4);
          const rest = part.slice(end + 4);
          // Process only rest
          let processed = rest.replace(/Origen:\s*(https:\/\/[^\s\)\]>`]+)/g, (m, url) => {
            if (m.includes('<https://')) return m;
            const clean = url.replace(/[,\.;:]+$/, '');
            const trail = url.slice(clean.length);
            return `Origen: <${clean}>${trail}`;
          });
          processed = processed.replace(/(?<!<)(https:\/\/[^\s\)\]>`]+)(?!>)/g, (url) => {
            const clean = url.replace(/[,\.;:]+$/, '');
            const trail = url.slice(clean.length);
            return `<${clean}>${trail}`;
          });
          result += frontmatter + processed;
          continue;
        }
      }
      // Normal outside-code-block processing
      part = part.replace(/Origen:\s*(https:\/\/[^\s\)\]>`]+)/g, (m, url) => {
        if (m.includes('<https://')) return m;
        const clean = url.replace(/[,\.;:]+$/, '');
        const trail = url.slice(clean.length);
        return `Origen: <${clean}>${trail}`;
      });
      part = part.replace(/(?<!<)(https:\/\/[^\s\)\]>`]+)(?!>)/g, (url) => {
        const clean = url.replace(/[,\.;:]+$/, '');
        const trail = url.slice(clean.length);
        return `<${clean}>${trail}`;
      });
      result += part;
    }
    c = result;
    // Normalizar URLs ya envueltas con puntuación dentro: <https://...,.> → <https://...>,
    c = c.replace(/<(https:\/\/[^>,]+),>/g, '<$1>,');
    c = c.replace(/<(https:\/\/[^>.]+)\.>/g, '<$1>.');
    if (c !== orig) {
      writeFileSync(path, c, 'utf8');
      return true;
    }
  } catch (e) {
    console.error(`skip ${path}: ${e.message}`);
  }
  return false;
}

function walk(dir) {
  let fixed = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', '.git', 'dist', '.astro', 'sitemaps/.cache', '.agents/skills-workspace'].some(p => full.includes(p))) continue;
      fixed += walk(full);
    } else if (entry.endsWith('.md')) {
      if (fixFile(full)) {
        console.log('fixed', full);
        fixed++;
      }
    }
  }
  return fixed;
}

let total = 0;
total += walk('.');
total += walk('.agents');
console.log(`done, fixed ${total} files`);

