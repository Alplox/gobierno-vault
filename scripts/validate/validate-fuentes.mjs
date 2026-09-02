#!/usr/bin/env node
// validate-fuentes.mjs — valida URLs de .agents/skills/fuentes-gubernamentales/SKILL.md
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const skillPath = join(process.cwd(), '.agents/skills/fuentes-gubernamentales/SKILL.md');
const content = readFileSync(skillPath, 'utf8');
const urlRegex = /https:\/\/[^\s\)\]\|"`]+/g;
const raw = content.match(urlRegex) || [];
const urls = [...new Set(raw.map(u => u.replace(/[,\.\)`]+$/, '').replace(/\|$/, '').trim()))];

console.log(`Encontradas ${urls.length} URLs únicas en skill:\n`);
for (const u of urls) console.log(` - ${u}`);
console.log(`\nValidando con fetch (timeout 12s, UA Mozilla)...\n`);

const results = [];
for (const url of urls) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (GobiernoVault/1.0)' },
      redirect: 'follow',
    });
    clearTimeout(t);
    const ms = Date.now() - start;
    const tag = res.ok ? 'OK' : (res.status === 403 ? 'WAF/403' : `HTTP ${res.status}`);
    console.log(`${tag.padEnd(10)} ${res.status} ${url} (${ms}ms)${res.url !== url ? ` -> ${res.url}` : ''}`);
    results.push({ url, status: res.status, ok: res.ok, ms });
  } catch (e) {
    clearTimeout(t);
    const ms = Date.now() - start;
    const msg = e.name === 'AbortError' ? 'TIMEOUT 12s' : e.message.slice(0, 140);
    console.log(`ERROR      ${msg} ${url} (${ms}ms)`);
    results.push({ url, error: msg, ms });
  }
  await new Promise(r => setTimeout(r, 350));
}
const ok = results.filter(r => r.ok).length;
const waf = results.filter(r => r.status === 403).length;
const fail = results.filter(r => r.status && r.status !== 200 && r.status !== 403).length;
const err = results.filter(r => r.error).length;
console.log(`\nResumen: OK ${ok} | WAF 403 ${waf} | HTTP fail ${fail} | Error/timeout ${err} | Total ${results.length}`);
