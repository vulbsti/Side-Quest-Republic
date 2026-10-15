import {animationInterval} from './frame-clock.js?v=12';
import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js?v=12';
const GESTURE={phone:/phone|record/,offer:/offer|record/,shrug:/shrug/,point:/point/,laugh:/laugh/,count:/count|look-at-hand/,listen:/nod|listen/,wave:/wave/,mic:/mic-check/,rest:/rest/};
const models={}, loader=new GLTFLoader();let pending,serial=0;
/** Loads three textured, skinned MakeHuman characters. Call before makeCharacter. */
export function loadCharacters(onProgress=()=>{}){return pending??=Promise.all(['male','female','officer'].map(async(name)=>{models[name]=await loader.loadAsync(new URL(`./assets/humans/${name}.glb`,import.meta.url).href);onProgress(name);return name;}));}
function cloneRig(source){const clone=source.clone(true),src=[],dst=[];source.traverse(o=>src.push(o));clone.traverse(o=>dst.push(o));const map=new Map(src.map((o,i)=>[o,dst[i]]));for(let i=0;i<src.length;i++){if(!src[i].isSkinnedMesh)continue;const a=src[i],b=dst[i];b.skeleton=a.skeleton.clone();b.bindMatrix.copy(a.bindMatrix);b.skeleton.bones=a.skeleton.bones.map(bone=>map.get(bone));b.bind(b.skeleton,b.bindMatrix);}return clone;}
function roundedPack(){const w=.30,h=.39,r=.045,s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);const g=new THREE.ExtrudeGeometry(s,{depth:.10,bevelEnabled:true,bevelThickness:.02,bevelSize:.018,bevelSegments:3,steps:1});g.translate(0,0,-.05);return g;}
function garmentTint(m,color){m.color.set('#ffffff');m.onBeforeCompile=shader=>{shader.uniforms.garmentTint={value:new THREE.Color(color)};shader.vertexShader='varying float vGarmentHeight;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGarmentHeight=position.y;');shader.fragmentShader='uniform vec3 garmentTint;\nvarying float vGarmentHeight;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat clothMask=smoothstep(.94,.98,vGarmentHeight); float textureLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)); diffuseColor.rgb=mix(diffuseColor.rgb,garmentTint*clamp(textureLuma*2.7,.12,1.0),clothMask);');};m.customProgramCacheKey=()=> 'garment-tint-v1';}
function accessory(parent,bone,geometry,material,position,scale){const o=new THREE.Mesh(geometry,material);o.position.set(...position);if(scale)o.scale.set(...scale);o.castShadow=true;parent.add(o);parent.updateMatrixWorld(true);if(bone)bone.attach(o);return o;}
export function makeCharacter({color='#a58d72',pants,skin,police=false,backpack=false,hat=false,gender,variant}={}){
 const kind=police?'officer':(variant||gender||((serial++%4===1)?'female':'male'));const source=models[kind]||models.male;if(!source)throw new Error('Call and await loadCharacters() before makeCharacter().');
 const root=new THREE.Group(),body=cloneRig(source.scene);root.add(body);body.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(body),height=bounds.max.y-bounds.min.y;const scale=(kind==='female'?1.69:1.80)/height;body.scale.multiplyScalar(scale);body.position.y=-bounds.min.y*scale;const bones={};
 body.traverse(o=>{if(o.isBone)bones[o.name.replace(/mixamorig:?/,'')]=o;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;o.material=o.material.clone();const m=o.material,n=m.name.toLowerCase();m.roughness=Math.max(.65,m.roughness??.8);if(n.includes('eyebrow')||n.includes('short02')||n.includes('ponytail')){m.transparent=false;m.alphaTest=.45;m.side=THREE.DoubleSide;m.depthWrite=true;}else{m.transparent=false;m.alphaTest=0;m.depthWrite=true;}if(n.includes('body'))m.color.multiply(new THREE.Color(skin||'#d8b79b'));if(n.includes('civilianclothing'))garmentTint(m,color);if(n.includes('shoes')&&police)m.color.set('#35332c');}});
 const mixer=new THREE.AnimationMixer(body),actions={},animationPhase=Math.random();for(const clip of source.animations){const name=clip.name.split('.')[0];actions[name]=mixer.clipAction(clip).setEffectiveWeight(name==='Idle'?1:0).play();actions[name].time=animationPhase*clip.duration;}
 const phone=new THREE.Mesh(new THREE.BoxGeometry(.068,.13,.009),new THREE.MeshStandardMaterial({color:'#152024',roughness:.32}));phone.visible=false;phone.castShadow=true;if(bones.RightHand){bones.RightHand.add(phone);phone.position.set(0,.055,0);}else root.add(phone);
 const khaki=new THREE.MeshStandardMaterial({color:'#8f7954',roughness:.85});
 if(police||hat){const y=kind==='female'?1.69:1.80;accessory(root,bones.Head,new THREE.CylinderGeometry(.103,.115,.065,20),khaki,[0,y-.005,0],[1,1,1.12]);accessory(root,bones.Head,new THREE.SphereGeometry(.11,16,8),khaki,[0,y-.035,.09],[1,.13,.8]);}
 if(backpack){const pack=new THREE.MeshStandardMaterial({color:'#37494a',roughness:.92});accessory(root,bones.Spine2,roundedPack(),pack,[0,1.27,-.17]);}
 // Bind-pose skinned bounds are expanded to cover jumping, raised arms and
 // seated poses. Mesh-local skeleton coordinates must be retained: a root-world
 // sphere would be transformed twice. Refresh is unnecessary for in-place clips.
 body.updateMatrixWorld(true);
 body.traverse(o=>{if(!o.isMesh)return;if(o.isSkinnedMesh){o.computeBoundingSphere();if(o.boundingSphere){o.boundingSphere.radius=Math.max(o.boundingSphere.radius*1.65,o.boundingSphere.radius+1.4/scale);o.frustumCulled=true;}}else{o.geometry.computeBoundingSphere();o.frustumCulled=true;}});
 root.userData={phone,body,baseY:body.position.y,head:bones.Head,bones,mixer,actions,lastTime:null,phase:Math.random()*6,kind,animation:'Idle',gaitPhase:animationPhase,isSkinnedHuman:true};return root;
}
export function animateCharacter(root,speed,t,{carry=false,pose=false,airborne=false,vy=0,turn=0,talking=false,seated=false,distance=0,visible=true,important=false,gesture=''}={}){
 const d=root.userData;if(!d?.mixer)return;const elapsed=d.lastTime===null?1/60:Math.max(0,t-d.lastTime);if(d.lastTime!==null&&elapsed<animationInterval(distance,visible,important)&&d.wasSeated===seated&&d.lastGesture===gesture)return;const dt=Math.min(.25,elapsed);d.lastTime=t;d.wasSeated=seated;d.lastGesture=gesture;
 let target=airborne?'Jump':pose&&!gesture?'Wave':carry?'Carry':speed>2.8?'Run':speed>.12?'Walk':'Idle';if(!d.actions[target])target='Idle';
 d.gaitPhase=(d.gaitPhase+dt*(speed>.12?speed/(speed>2.8?2.6:1.25):0))%1;
 for(const [name,a] of (d.actionEntries??=Object.entries(d.actions))){const w=name===target?1:0;a.setEffectiveWeight(THREE.MathUtils.damp(a.getEffectiveWeight(),w,12,dt));if(['Walk','Run','Carry'].includes(name)){a.time=d.gaitPhase*a.getClip().duration;a.setEffectiveTimeScale(0);}else a.setEffectiveTimeScale(1);}

 d.mixer.update(dt);d.animation=target;if(seated){for(const k of ['LeftUpLeg','RightUpLeg'])if(d.bones[k])d.bones[k].rotation.x=-1.4;for(const k of ['LeftLeg','RightLeg'])if(d.bones[k])d.bones[k].rotation.x=1.3;d.body.position.y=d.baseY-.38;}else d.body.position.y=d.baseY;
 // Small conversational head motion is layered after the recorded skeletal pose.
 if(talking&&d.head)d.head.rotation.x+=Math.sin(t*3+d.phase)*.035;
 if(d.bones.Spine2)d.bones.Spine2.rotation.z+=THREE.MathUtils.clamp(turn,-1,1)*.07;
 // Additive, bounded street performances; mixers reset authored bone poses first.
 // Arms are in the MakeHuman/Mixamo local convention. Do not alter pelvis/legs.
 const b=d.bones,ra=b.RightArm,la=b.LeftArm,rf=b.RightForeArm,lf=b.LeftForeArm,head=b.Head,sp=b.Spine2;
 const g=gesture||'',phoneGesture=GESTURE.phone.test(g),beat=Math.sin(t*3+d.phase);
 d.phone.visible=phoneGesture;
 if(phoneGesture){if(ra){ra.rotation.z-=.35;ra.rotation.x-=.35;}if(rf)rf.rotation.x-=1.15;if(head)head.rotation.x+=GESTURE.offer.test(g)?-.04:.18;if(g.includes('offer')&&ra)ra.rotation.x-=.3;}
 else if(GESTURE.shrug.test(g)){if(ra)ra.rotation.z-=.35;if(la)la.rotation.z+=.35;if(rf)rf.rotation.x-=.7;if(lf)lf.rotation.x-=.7;if(head)head.rotation.z+=.07;}
 else if(GESTURE.point.test(g)){if(ra){ra.rotation.x-=1.05;ra.rotation.z-=.2;}if(rf)rf.rotation.x-=.15;if(head)head.rotation.y-=.12;}
 else if(GESTURE.laugh.test(g)){if(sp)sp.rotation.x+=.045+.025*beat;if(head)head.rotation.x-=.06+.025*beat;if(ra)ra.rotation.x-=.18;}
 else if(GESTURE.count.test(g)){if(la)la.rotation.x-=.45;if(lf)lf.rotation.x-=1.0;if(ra)ra.rotation.x-=.35;if(rf)rf.rotation.x-=.7;if(head)head.rotation.x+=.16;}
 else if(GESTURE.listen.test(g)){if(head){head.rotation.x+=.035*Math.sin(t*2.2);head.rotation.y+=.045*Math.sin(t*.8+d.phase);}}
 else if(GESTURE.wave.test(g)){if(ra){ra.rotation.z-=1.4;ra.rotation.x-=.25;}if(rf){rf.rotation.x-=.8;rf.rotation.z+=.12*beat;}}
 else if(GESTURE.mic.test(g)){if(ra)ra.rotation.x-=.45;if(rf)rf.rotation.x-=1.35;if(head)head.rotation.x-=.03;}
 else if(GESTURE.rest.test(g)){if(sp)sp.rotation.x+=.06;if(head)head.rotation.x+=.1;}

}
