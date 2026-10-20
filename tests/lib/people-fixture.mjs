// Shared Node fixture for the people/props tests: the shipped Three build, GLTFLoader with
// the vendored meshopt decoder, and dist/characters.js rewired to file URLs. Textures are
// stripped from GLBs because Node has no browser image decoder; geometry, skins, node
// extras and animation clips are the real shipped data.
import {readFile, writeFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

globalThis.ProgressEvent ??= class ProgressEvent extends Event { constructor(type, values) { super(type); Object.assign(this, values); } };

export async function fixture() {
  const temp = await mkdtemp(join(tmpdir(), 'people-'));
  const url = name => pathToFileURL(join(temp, name)).href;
  await writeFile(join(temp, 'three.mjs'), await readFile('dist/vendor/three.module.js'));
  await writeFile(join(temp, 'meshopt.mjs'), await readFile('dist/vendor/meshopt_decoder.module.js'));
  for (const name of ['BufferGeometryUtils', 'GLTFLoader']) {
    let source = await readFile(`dist/vendor/${name}.js`, 'utf8');
    source = source.replaceAll("from 'three'", `from '${url('three.mjs')}'`).replace("'./BufferGeometryUtils.js'", "'./BufferGeometryUtils.mjs'");
    await writeFile(join(temp, `${name}.mjs`), source);
  }
  let source = await readFile('dist/characters.js', 'utf8');
  source = source.replace(/import \{animationInterval\}[^;]+;/, `import {animationInterval} from '${pathToFileURL(join(process.cwd(), 'dist/frame-clock.js')).href}';`)
    .replace("from 'three'", `from '${url('three.mjs')}'`)
    .replace(/'\.\/vendor\/GLTFLoader\.js(?:\?[^']*)?'/, "'./GLTFLoader.mjs'")
    .replace(/'\.\/vendor\/meshopt_decoder\.module\.js(?:\?[^']*)?'/, "'./meshopt.mjs'");
  // asset URLs resolve against the real dist/ folder, not the temp copy
  source = source.replaceAll('import.meta.url', JSON.stringify(pathToFileURL(join(process.cwd(), 'dist/characters.js')).href));
  await writeFile(join(temp, 'characters.mjs'), source);
  let models = await readFile('dist/loop/models.js', 'utf8');
  models = models.replace("from 'three'", `from '${url('three.mjs')}'`)
    .replace(/'\.\.\/vendor\/GLTFLoader\.js(?:\?[^']*)?'/, "'./GLTFLoader.mjs'")
    .replace(/'\.\.\/vendor\/meshopt_decoder\.module\.js(?:\?[^']*)?'/, "'./meshopt.mjs'");
  models = models.replaceAll('import.meta.url', JSON.stringify(pathToFileURL(join(process.cwd(), 'dist/loop/models.js')).href));
  await writeFile(join(temp, 'models.mjs'), models);
  const THREE = await import(url('three.mjs'));
  const {GLTFLoader} = await import(url('GLTFLoader.mjs'));
  const {MeshoptDecoder} = await import(url('meshopt.mjs'));
  await MeshoptDecoder.ready;
  const characters = await import(url('characters.mjs'));
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  /** GLB bytes with images removed (geometry/skins/animation untouched). */
  async function stripped(path) {
    const bytes = await readFile(path);
    const jsonLength = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
    for (const m of json.materials ?? []) {
      delete m.normalTexture; delete m.occlusionTexture; delete m.emissiveTexture;
      if (m.pbrMetallicRoughness) { delete m.pbrMetallicRoughness.baseColorTexture; delete m.pbrMetallicRoughness.metallicRoughnessTexture; }
    }
    delete json.images; delete json.textures; delete json.samplers;
    for (const key of ['extensionsUsed', 'extensionsRequired']) if (json[key]) json[key] = json[key].filter(e => e !== 'EXT_texture_webp');
    const bin = bytes.subarray(20 + jsonLength);
    let text = Buffer.from(JSON.stringify(json)); const pad = (4 - text.length % 4) % 4; text = Buffer.concat([text, Buffer.alloc(pad, 0x20)]);
    const head = Buffer.alloc(20); head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(20 + text.length + bin.length, 8); head.writeUInt32LE(text.length, 12); head.writeUInt32LE(0x4E4F534A, 16);
    return Buffer.concat([head, text, bin]);
  }
  /** Route fetch(file://...glb) to stripped local GLBs so loaders that take URLs (models.js) run in Node. */
  function installFetch() {
    const real = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const href = typeof input === 'string' ? input : input.url;
      if (!href.startsWith('file:')) return real(input, init);
      const path = new URL(href).pathname;
      return new Response(path.endsWith('.glb') ? await stripped(path) : await readFile(path), {status: 200});
    };
    return () => { globalThis.fetch = real; };
  }
  /** Parse a shipped GLB without its images. Returns {gltf, json, bytes}. */
  async function load(path) {
    const bytes = await readFile(path);
    const jsonLength = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
    const original = JSON.parse(JSON.stringify(json));
    for (const m of json.materials ?? []) {
      delete m.normalTexture; delete m.occlusionTexture; delete m.emissiveTexture;
      if (m.pbrMetallicRoughness) { delete m.pbrMetallicRoughness.baseColorTexture; delete m.pbrMetallicRoughness.metallicRoughnessTexture; }
    }
    delete json.images; delete json.textures; delete json.samplers;
    for (const key of ['extensionsUsed', 'extensionsRequired']) if (json[key]) json[key] = json[key].filter(e => e !== 'EXT_texture_webp');
    const binStart = 20 + jsonLength, binLength = bytes.readUInt32LE(binStart);
    json.buffers[0].uri = 'data:application/octet-stream;base64,' + bytes.subarray(binStart + 8, binStart + 8 + binLength).toString('base64');
    const gltf = await loader.parseAsync(JSON.stringify(json), '');
    return {gltf, json: original, bytes};
  }
  return {THREE, characters, loader, load, stripped, installFetch, models: () => import(url('models.mjs')), url, temp, close: () => rm(temp, {recursive: true, force: true})};
}
