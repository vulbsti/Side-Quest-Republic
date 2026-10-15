import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
// Use the shipped Three build and real GLB skeletons/clips. Textures are omitted
// from this CPU-only test because Node has no browser image decoder.
globalThis.ProgressEvent??=class ProgressEvent extends Event{constructor(type,values){super(type);Object.assign(this,values);}};
const temp=await mkdtemp(join(tmpdir(),'character-pose-'));
try{
 const url=name=>pathToFileURL(join(temp,name)).href;
 await writeFile(join(temp,'three.mjs'),await readFile('dist/vendor/three.module.js'));
 for(const name of ['BufferGeometryUtils','GLTFLoader']){
  let source=await readFile(`dist/vendor/${name}.js`,'utf8');
  source=source.replaceAll("from 'three'",`from '${url('three.mjs')}'`).replace("'./BufferGeometryUtils.js'","'./BufferGeometryUtils.mjs'");
  await writeFile(join(temp,`${name}.mjs`),source);
 }
 let source=await readFile('dist/characters.js','utf8');
 source=source.replace(/import \{animationInterval\}[^;]+;/,`import {animationInterval} from '${pathToFileURL(join(process.cwd(),'dist/frame-clock.js')).href}';`).replace("from 'three'",`from '${url('three.mjs')}'`).replace(/'\.\/vendor\/GLTFLoader\.js(?:\?[^']*)?'/,"'./GLTFLoader.mjs'");
 source+='\nexport function setFixture(name,model){models[name]=model;}';
 await writeFile(join(temp,'characters.mjs'),source);
 const THREE=await import(url('three.mjs'));
 const {GLTFLoader}=await import(url('GLTFLoader.mjs'));
 const {makeCharacter,animateCharacter,setFixture}=await import(url('characters.mjs'));
 const trackReport={};
 for(const kind of ['female','male','officer']){
  const bytes=await readFile(`dist/assets/humans/${kind}.glb`);
  const jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
  for(const material of json.materials??[]){delete material.normalTexture;delete material.occlusionTexture;delete material.emissiveTexture;if(material.pbrMetallicRoughness){delete material.pbrMetallicRoughness.baseColorTexture;delete material.pbrMetallicRoughness.metallicRoughnessTexture;}}
  delete json.images;delete json.textures;delete json.samplers;
  const binStart=20+jsonLength,binLength=bytes.readUInt32LE(binStart);
  json.buffers[0].uri='data:application/octet-stream;base64,'+bytes.subarray(binStart+8,binStart+8+binLength).toString('base64');
  const rig=await new GLTFLoader().parseAsync(JSON.stringify(json),'');setFixture(kind,rig);
  trackReport[kind]=Object.fromEntries(rig.animations.map(clip=>[clip.name,clip.tracks.length]));
  for(const gesture of ['phone','shrug','point','wave']){
   const actor=makeCharacter({variant:kind}),control=makeCharacter({variant:kind});actor.userData.phase=0;
   for(const character of [actor,control])for(const action of Object.values(character.userData.actions))action.time=0;
   const samples=[],wrists=[];
   for(let frame=0;frame<1000;frame++){
    animateCharacter(actor,0,frame/60,{gesture,important:true});
    animateCharacter(control,0,frame/60,{important:true});
    const relative=control.userData.bones.RightArm.quaternion.clone().invert().multiply(actor.userData.bones.RightArm.quaternion).normalize();
    assert(relative.angleTo(relative.clone().identity())<2.8,`${kind} ${gesture} arm stays bounded`);
    if(frame>=200){samples.push(relative);actor.updateMatrixWorld(true);wrists.push(actor.userData.bones.RightHand.getWorldPosition(new THREE.Vector3()));}
   }
   for(const q of samples)assert(q.angleTo(samples[0])<(gesture==='wave'?.3:.15),`${kind} ${gesture} arm never accumulates rotation`);
   const target={phone:[-.16,1.40,.34],shrug:[-.43,1.39,.28],point:[-.20,1.38,.46],wave:[-.40,1.69,.13]}[gesture];
   for(const wrist of wrists)assert(wrist.distanceTo(new THREE.Vector3(...target))<(gesture==='wave'?.055:.025),`${kind} ${gesture} reaches anatomical hand target`);
   if(['phone','shrug'].includes(gesture)){const b=actor.userData.bones,s=b.RightArm.getWorldPosition(new THREE.Vector3()),e=b.RightForeArm.getWorldPosition(new THREE.Vector3()),w=b.RightHand.getWorldPosition(new THREE.Vector3());assert(e.clone().sub(s).angleTo(w.clone().sub(e))>.7,`${kind} ${gesture} visibly bends elbow`);}
   for(let frame=1000;frame<1180;frame++){animateCharacter(actor,0,frame/60,{important:true});animateCharacter(control,0,frame/60,{important:true});}
   for(const [name,bone] of Object.entries(actor.userData.bones))assert(bone.quaternion.angleTo(control.userData.bones[name].quaternion)<1e-5,`${kind} ${gesture} recovers authored idle`);
   assert.equal(actor.userData.phone.visible,false);
  }
 }
 console.log('PASS: real female/male/officer rigs, 1000-frame phone/shrug/point/wave stability and idle recovery');
 console.log('Actual GLB animation track counts:',JSON.stringify(trackReport));
}finally{await rm(temp,{recursive:true,force:true});}
