// Draws dist/map/delhi-map.js from above as an SVG (and a PNG with --png), with the game's places on top, so the
// layout can be checked against a real map. Run: node tools/map-preview.mjs [--png] [--box minX,minZ,maxX,maxZ]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAP } from '../dist/map/delhi-map.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const box = arg('--box')?.split(',').map(Number) || [MAP.extent.minX, MAP.extent.minZ, MAP.extent.maxX, MAP.extent.maxZ];
const [x0, z0, x1, z1] = box, W = x1 - x0, H = z1 - z0;
const R = await import('../dist/loop/rules.js');
const pt = (p) => `${p[0]},${p[1]}`;
const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${z0} ${W} ${H}" width="${Math.round(W * (1600 / Math.max(W, H)))}" height="${Math.round(H * (1600 / Math.max(W, H)))}" font-family="sans-serif">`,
  `<rect x="${x0}" y="${z0}" width="${W}" height="${H}" fill="#e9e4d8"/>`];
const fills = { grass: '#b9d39a', water: '#9cc6e0', parking: '#d9d4c9', trees: '#9fc183', plaza: '#efe8d6' };
for (const a of MAP.areas) out.push(`<polygon points="${a.poly.map(pt).join(' ')}" fill="${fills[a.kind]}"/>`);
for (const r of MAP.roads) out.push(`<polyline points="${r.pts.map(pt).join(' ')}" fill="none" stroke="${r.car ? '#ffffff' : '#f6efe0'}" stroke-width="${r.w}" stroke-linecap="round" stroke-linejoin="round"/>`);
for (const b of MAP.buildings) out.push(`<polygon points="${b.poly.map(pt).join(' ')}" fill="${b.roof ? '#d8cfbd' : '#c6b8a2'}" stroke="#9a8c76" stroke-width="0.3"/>`);
for (const s of MAP.signs) out.push(`<circle cx="${s.x}" cy="${s.z}" r="0.9" fill="#b0522c"/>`);
const big = Math.max(W, H) / 160;
const named = new Map();
for (const r of MAP.roads) if (r.name && r.car && !named.has(r.name)) named.set(r.name, r.pts[Math.floor(r.pts.length / 2)]);
for (const [n, p] of named) out.push(`<text x="${p[0]}" y="${p[1]}" font-size="${big}" fill="#555">${n}</text>`);
for (const p of MAP.pois) if (p.kind === 'metro-gate') out.push(`<text x="${p.x}" y="${p.z}" font-size="${big}" fill="#1c7ed6">M${p.ref}</text>`);
const moved = process.argv.includes('--relocate') ? (await import('./relocate.mjs')).relocate : (p) => p;
for (const [id, p0] of Object.entries(R.SPOTS)) { const p = moved(p0); out.push(`<circle cx="${p.x}" cy="${p.z}" r="${big / 5}" fill="#1c7ed6"/><text x="${p.x + 0.6}" y="${p.z}" font-size="${big / 2}" fill="#1c3d8a">${id}</text>`); }
for (const [id, p0] of Object.entries(R.PLACES)) { const p = { ...p0, ...moved(p0) }; out.push(`<circle cx="${p.x}" cy="${p.z}" r="${p.r}" fill="none" stroke="#d9480f" stroke-width="${big / 4}"/><text x="${p.x}" y="${p.z}" font-size="${big * 1.4}" fill="#d9480f" font-weight="bold">${id}</text>`); }
out.push('</svg>');
mkdirSync(join(root, 'tools/out'), { recursive: true });
const svg = join(root, 'tools/out/map.svg');
writeFileSync(svg, out.join('\n'));
console.log('wrote', svg);
if (process.argv.includes('--png')) {
  const { launch } = await import('../verify/lib/browser.mjs');
  const b = await launch(), page = await b.newPage({ viewport: { width: 1600, height: 1600 } });
  await page.goto('file://' + svg);
  await page.screenshot({ path: join(root, 'tools/out/map.png') });
  await b.close();
  console.log('wrote tools/out/map.png');
}
