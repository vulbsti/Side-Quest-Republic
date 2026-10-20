// Merge retargeted mocap clips (clips.py JSON) into a Blender-exported people GLB,
// then compress: meshopt geometry + animation, WebP textures, pruned/deduped data.
// usage: node add_animations.mjs in.glb clips.json out.glb [maxTexture=1024]
// Needs @gltf-transform/{core,extensions,functions}, meshoptimizer, sharp
// (installed outside the repo; set NODE_PATH or run from that folder).
import {readFileSync} from 'node:fs';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup, prune, meshopt, textureCompress, resample, weld} from '@gltf-transform/functions';
import {MeshoptEncoder, MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';

const [input, clipsPath, output, maxTex = '1024'] = process.argv.slice(2);
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder});
const doc = await io.read(input);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];
const data = JSON.parse(readFileSync(clipsPath, 'utf8'));
const nodes = new Map(root.listNodes().map((n) => [n.getName(), n]));
for (const a of root.listAnimations()) a.dispose();

const meta = {};
for (const [name, clip] of Object.entries(data.clips)) {
  const anim = doc.createAnimation(name);
  const times = doc.createAccessor(name + '_t').setType('SCALAR').setArray(new Float32Array(clip.times)).setBuffer(buffer);
  data.skeleton.forEach((joint, j) => {
    const node = nodes.get(joint);
    if (!node) throw new Error('missing joint ' + joint);
    const rest = node.getRotation();
    const values = new Float32Array(clip.times.length * 4);
    let moving = false;
    clip.rot.forEach((frame, f) => {
      const q = frame[j];
      values.set(q, f * 4);
      const dot = Math.abs(q[0] * rest[0] + q[1] * rest[1] + q[2] * rest[2] + q[3] * rest[3]);
      if (dot < 0.99995) moving = true;
    });
    if (!moving) return; // identical to rest for the whole clip (most fingers): mixer keeps rest
    const out = doc.createAccessor(`${name}_${joint}_r`).setType('VEC4').setArray(values).setBuffer(buffer);
    const sampler = doc.createAnimationSampler().setInput(times).setOutput(out).setInterpolation('LINEAR');
    anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath('rotation').setSampler(sampler));
  });
  const hips = nodes.get(data.skeleton[0]);
  const pos = doc.createAccessor(name + '_hips_t').setType('VEC3').setArray(new Float32Array(clip.hips.flat())).setBuffer(buffer);
  const sampler = doc.createAnimationSampler().setInput(times).setOutput(pos).setInterpolation('LINEAR');
  anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(hips).setTargetPath('translation').setSampler(sampler));
  meta[name] = {speed: clip.speed, loop: clip.loop, duration: +clip.times.at(-1).toFixed(4), source: 'CMU mocap ' + clip.take, window: clip.window};
}
const scene = root.listScenes()[0];
scene.setExtras({...scene.getExtras(), clips: meta, ...(data.extras || {})});

// PREVIEW=1: keep PNG textures and plain geometry so Blender can import the result for pose renders
const preview = !!process.env.PREVIEW;
await doc.transform(
  resample({tolerance: 1e-4}),
  dedup(),
  prune({keepAttributes: false}),
  weld(),
  ...(preview ? [] : [
    textureCompress({encoder: sharp, targetFormat: 'webp', resize: [+maxTex, +maxTex], quality: 82}),
    meshopt({encoder: MeshoptEncoder, level: 'medium'}),
  ]),
);
await io.write(output, doc);
console.log('wrote', output, Object.entries(meta).map(([k, v]) => `${k}:${v.speed}`).join(' '));
