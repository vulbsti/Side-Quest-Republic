// Compress prop GLBs exported by build_props.py: WebP textures, meshopt geometry.
// usage: node compress.mjs <in_dir> <out_dir> [maxTex=1024]
// Needs @gltf-transform/{core,extensions,functions}, meshoptimizer, sharp (run from a dir
// where they are installed; ESM ignores NODE_PATH).
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup, prune, meshopt, textureCompress, weld} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
import {readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

const [inDir, outDir, maxTex = '1024'] = process.argv.slice(2);
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});
for (const f of readdirSync(inDir).filter(f => f.endsWith('.glb'))) {
  const doc = await io.read(join(inDir, f));
  await doc.transform(
    dedup(), prune({keepLeaves: true, keepAttributes: false}), weld(),
    textureCompress({encoder: sharp, targetFormat: 'webp', resize: [+maxTex, +maxTex], quality: 85}),
    // keep node names/transforms (turret, nozzle, grip, flagMount...) for runtime hookup
    meshopt({encoder: MeshoptEncoder, level: 'medium'}),
  );
  const out = join(outDir, f);
  await io.write(out, doc);
  console.log(f, statSync(join(inDir, f)).size, '->', statSync(out).size);
}
