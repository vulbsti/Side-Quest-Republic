// The real game in headless Chrome, for verify:playback and verify:smoke: one static server for the repo root
// (so /dist/index.html can fetch /verify/witnesses/*.json) and one launcher.
//
// The GPU is used by default (about 60 fps headless with one, against about 1 fps in software).
// PLAYBACK_GL=swiftshader forces software GL on a machine without a GPU. CHROME picks the browser binary;
// otherwise the installed Chrome or Chromium, then Playwright's own.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.svg': 'image/svg+xml' };

/** Serves the repo root on a free port. Returns { url, close }. */
export async function serve() {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = join(ROOT, path.endsWith('/') ? path + 'index.html' : path);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, r));
  return { url: `http://localhost:${server.address().port}`, close: () => server.close() };
}

async function loadPlaywright() {
  try { const m = await import('playwright-core'); return m.default ?? m; } catch {}
  try { return await import('playwright'); } catch {}
  for (const dir of ['/opt/node-tools/node_modules', '/usr/lib/node_modules', '/usr/local/lib/node_modules']) {
    if (existsSync(join(dir, 'playwright'))) return createRequire(join(dir, 'x.js'))('playwright');
  }
  throw new Error('Playwright is not installed (npm install)');
}

export async function launch() {
  const { chromium } = await loadPlaywright();
  const gl = process.env.PLAYBACK_GL === 'swiftshader' ? ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-gl=angle', '--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist'];
  const executablePath = process.env.CHROME ?? ['/usr/bin/google-chrome', '/usr/bin/chromium', '/opt/pw-browsers/chromium'].find(existsSync);
  return chromium.launch({ executablePath, args: [...gl, '--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
}

/** Resolves after n animation frames: lets drawn people walk into place while a replay is paused. */
export const frames = (page, n) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
