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
 const {makeCharacter,animateCharacter,setFixture,CARRY_POSES}=await import(url('characters.mjs'));
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
  {const actor=makeCharacter({variant:kind});for(let frame=0;frame<600;frame++)animateCharacter(actor,0,frame/60,{seated:true,important:true});actor.updateMatrixWorld(true);const b=actor.userData.bones;for(const [side,sign]of [['Left',1],['Right',-1]]){const hip=b[side+'UpLeg'].getWorldPosition(new THREE.Vector3()),knee=b[side+'Leg'].getWorldPosition(new THREE.Vector3()),foot=b[side+'Foot'].getWorldPosition(new THREE.Vector3()),toe=b[side+'ToeBase'].getWorldPosition(new THREE.Vector3());assert(Math.abs(hip.y-.52)<.01,kind+' seated hip matches cushion');assert(foot.distanceTo(new THREE.Vector3(sign*.16,.11,.43))<.025,kind+' feet on cabin floor');assert(knee.z>hip.z+.2&&knee.y>.35&&knee.y<.7,kind+' knee bends forward without raised legs');assert(toe.z>foot.z&&toe.y>0&&toe.y<.14,kind+' shoes point forward above floor');}}
  for(const carry of ['water','speaker','phone','key']){const actor=makeCharacter({variant:kind});for(let frame=0;frame<300;frame++)animateCharacter(actor,0,frame/60,{carry,important:true});actor.updateMatrixWorld(true);for(const [i,side]of [[0,'Left'],[1,'Right']]){const hand=CARRY_POSES[carry].hands[i];if(hand)assert(actor.userData.bones[side+'Hand'].getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(...hand))<.03,kind+' '+carry+' reaches prop grip');}}
  {const actor=makeCharacter({variant:kind});for(let frame=0;frame<300;frame++){animateCharacter(actor,1.6,frame/60,{carry:'water',important:true});if(frame>150){actor.updateMatrixWorld(true);for(const [i,side]of [[0,'Left'],[1,'Right']])assert(actor.userData.bones[side+'Hand'].getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(...CARRY_POSES.water.hands[i]))<.06,kind+' walking grip stays near crate');}}}
  for(const gesture of ['phone','shrug','point','wave','push']){
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
   const target={push:[-.22,1.38,.46],phone:[-.16,1.40,.34],shrug:[-.43,1.39,.28],point:[-.20,1.38,.46],wave:[-.40,1.69,.13]}[gesture];
   for(const wrist of wrists)assert(wrist.distanceTo(new THREE.Vector3(...target))<(gesture==='wave'?.055:.025),`${kind} ${gesture} reaches anatomical hand target`);
   if(['phone','shrug'].includes(gesture)){const b=actor.userData.bones,s=b.RightArm.getWorldPosition(new THREE.Vector3()),e=b.RightForeArm.getWorldPosition(new THREE.Vector3()),w=b.RightHand.getWorldPosition(new THREE.Vector3());assert(e.clone().sub(s).angleTo(w.clone().sub(e))>.7,`${kind} ${gesture} visibly bends elbow`);}
   for(let frame=1000;frame<1180;frame++){animateCharacter(actor,0,frame/60,{important:true});animateCharacter(control,0,frame/60,{important:true});}
   for(const [name,bone] of Object.entries(actor.userData.bones))assert(bone.quaternion.angleTo(control.userData.bones[name].quaternion)<1e-5,`${kind} ${gesture} recovers authored idle`);
   assert.equal(actor.userData.phone.visible,false);
  }
 }
 console.log('PASS: real female/male/officer rigs, seated knee/foot placement, four item grips, walking crate grip, 1000-frame gestures and idle recovery');
 console.log('Actual GLB animation track counts:',JSON.stringify(trackReport));
}finally{await rm(temp,{recursive:true,force:true});}
