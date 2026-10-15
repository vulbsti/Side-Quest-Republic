import {THREE as T,cube,cylinder,sign,mat} from './world.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {DISTRICTS,STORY_ANCHORS,CONNECTION_ROUTES,EXPANSION_SOLIDS} from './districts.js';
/** Visual projection only: the living-world simulation owns every event. */
export function expandWorld(world){
 const {scene,obstacles}=world,staticGroup=new T.Group();staticGroup.name='Delhi neighbourhood expansion';scene.add(staticGroup);
 const dynamicGroups={barricades:new T.Group(),arrivalFlags:new T.Group(),lamps:new T.Group()};
 for(const [id,g]of Object.entries(dynamicGroups)){g.name=`Expansion ${id}`;scene.add(g);}
 let pavement,plaster;scene.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const path=o.material.map?.image?.src||'';if(path.includes('cobblestone'))pavement??=o.material;if(path.includes('plastered'))plaster??=o.material;});
 const stone=plaster||mat('#ddd6c5'),pave=mat('#bdb8aa');
 function ground(w,d,x,z,color){const m=color?mat(color):pave;const o=cube(w,.12,d,m,x,-.09,z,staticGroup);if(!color&&pavement){o.material=pavement.clone();const map=pavement.map.clone();map.repeat.set(w/2.6,d/2.6);map.needsUpdate=true;o.material.map=map;o.material.normalMap=null;}return o;}
 // Four adjoining ground strips avoid z-fighting with the original 125 x 150 plaza.
 ground(27.5,185,-76.25,7.5);ground(27.5,185,76.25,7.5);ground(125,10,0,-80);ground(125,25,0,87.5);
 ground(28,40,-64,12,'#b5b1a0');ground(27,37,64,-30,'#b3b5ad');ground(29,38,64,45,'#c6bdab');ground(51,29,-55,68,'#b9aa92');ground(45,17,0,-67,'#8b936c');
 function label(text,x,z,w=8,bg='#284e45',y=3.2){const s=sign(text,w,.8,bg,'#fff2ce');s.position.set(x,y,z);staticGroup.add(s);return s;}
 function pole(x,z,h=3.2){cylinder(.055,.075,h,'#475b50',x,h/2,z,staticGroup,8);}
 for(const d of DISTRICTS.filter(d=>['supply','press','court','backstreet','assembly'].includes(d.id))){label(d.name.toUpperCase(),d.x,d.z-5,9);pole(d.x-4.5,d.z-5);pole(d.x+4.5,d.z-5);}
 for(const o of EXPANSION_SOLIDS)obstacles.push({...o,expansion:true});
 function tent(x,z){cube(10,.16,8,'#ddd6bd',x,3.3,z,staticGroup);cube(10,2.7,.12,'#e7ddc0',x,1.5,z-4,staticGroup);for(const side of [-1,1]){cube(.12,2.7,8,'#e7ddc0',x+side*5,1.5,z,staticGroup);pole(x+side*5,z+4,3.4);}cube(10,.5,.16,'#447b64',x,3.05,z+4,staticGroup);label('SEVA / FIRST AID',x,z+4.1,7,'#447b64',2.9);}
 tent(-74,3);tent(-74,19);
 function table(x,z,w=4){cube(w,.12,1.2,'#967753',x,.88,z,staticGroup);for(const dx of [-w/2+.2,w/2-.2])cube(.12,.82,1,'#47564a',x+dx,.41,z,staticGroup);}
 table(-69,5);table(67,-31);table(67,46);
 for(let i=0;i<8;i++){cylinder(.13,.12,.38,'#a0c5c0',-70.5+i*.42,1.1,5,staticGroup,8);}
 label('PAANI • REST • FIND A FRIEND',-64,25,10,'#427864',2.4);
 for(let i=0;i<6;i++)cube(.9,.6,.8,['#69947b','#bba76d'][i%2],-73+(i%3-1),.3+Math.floor(i/3)*.6,24,staticGroup);
 // News van, tripod stations and a genuinely open interview area.
 cube(4,2.6,9,'#e3e4de',73,1.6,-27,staticGroup);cube(3.7,.8,.15,'#495f69',73,2.2,-22.45,staticGroup);for(const z of [-30,-24])for(const x of [70.9,75.1]){const wheel=cylinder(.55,.55,.25,'#303b3b',x,.6,z,staticGroup,12);wheel.rotation.z=Math.PI/2;}
 label('PRESS / LIVE DESK',73,-22.3,3.5,'#334b68',1.2);
 const dish=cylinder(1.2,.1,.3,'#b1b9b8',73,3.4,-29,staticGroup,20);dish.rotation.x=.4;
 for(const [x,z]of[[68,-38],[67,-20]]){pole(x,z,1.7);cube(.55,.4,.85,'#273a3e',x,1.8,z,staticGroup);for(const angle of [0,2.1,4.2]){const leg=cylinder(.025,.04,1.4,'#657774',x+Math.cos(angle)*.3,.65,z+Math.sin(angle)*.3,staticGroup,6);leg.rotation.z=Math.cos(angle)*.35;}}
 label('WHO SAW WHAT?',62,-42,7,'#4b5e75',2.5);
 // Municipal frontage: deep windows, veranda and an open waiting court.
 cube(12,7,20,stone,76,3.5,43,staticGroup);cube(12.7,.3,20.7,'#afa58f',76,7,43,staticGroup);
 for(let z=36;z<=50;z+=3.5){cube(.12,2,1.8,'#344f52',69.95,4.5,z,staticGroup);cube(.2,.12,2,'#f1e7cd',69.85,3.5,z,staticGroup);}
 label('CIVIC LIAISON / PUBLIC WAITING',64,56,12,'#736046',3.2);
 for(const z of [37,51]){cube(3,.12,.7,'#8b7354',64,.65,z,staticGroup);for(const x of [63,65])cube(.12,.6,.6,'#4b584d',x,.3,z,staticGroup);}
 // Shopfronts all face the shared street, with delivery/loading space.
 cube(40,6.8,8,stone,-55,3.4,84,staticGroup);
 const shopNames=['PHOTO / PRINT','GALI KIRANA','CYCLE REPAIR','CHAI & NASHTA','PHONE CHARGE'];
 for(let i=0;i<5;i++){const x=-71+i*8;cube(6.8,3,.15,'#556d66',x,1.5,79.92,staticGroup);cube(7.3,.22,2.2,['#ad654a','#71877b','#bc9e64'][i%3],x,3.6,79.1,staticGroup);label(shopNames[i],x,78.9,6.8,'#37554c',3.1);for(let y=.4;y<3;y+=.3)cube(6.7,.03,.05,'#82958a',x,y,79.81,staticGroup);cube(1.6,1.3,.15,'#3f5555',x,5.2,79.88,staticGroup);}
 for(let i=0;i<4;i++){cube(1.25,.75,1.25,'#b39764',-69+(i%2)*1.3,.375+Math.floor(i/2)*.75,73,staticGroup);}
 label('DELIVERIES / KEEP THE LANE CLEAR',-63,75,9,'#8c684a',2.5);
 for(const x of [-14,14]){cube(7,.6,3,'#b1a991',x,.3,-74,staticGroup);cube(6.6,.05,2.6,'#687b53',x,.62,-74,staticGroup);}
 label('ASSEMBLY GARDEN / SABKA SWAGAT',0,-76,15,'#627c4c',3.4);
 // Wayfinding is placed at intersections; route geometry stays completely open.
 for(const [text,x,z]of[['← SEVA CAMP',-42,31],['PRESS LANE ↑',53,8],['CIVIC COURT ↓',48,28],['SERVICE GALI ←',-30,63],['ASSEMBLY GARDEN ←',59,-58]]){label(text,x,z,6,'#3d5d52',2.7);pole(x-3,z,2.7);}
 // Perimeter lamps and low-detail distant greenery establish the larger streets.
 const bulbs=[];for(const [x,z]of[[-83,-55],[-83,-15],[-83,38],[-80,71],[83,-55],[83,0],[83,65],[28,87],[-20,92]]){pole(x,z,5);cube(1.1,.12,.5,'#54675c',x,5,z,staticGroup);const bulb=cube(.8,.08,.3,new T.MeshStandardMaterial({color:'#e2d9b5',emissive:'#ffc47a',emissiveIntensity:.1}),x,4.9,z,dynamicGroups.lamps);bulbs.push(bulb);}
 // Parked barriers retain matching collision throughout the day; the eastern passage stays open.
 for(let i=0;i<4;i++){const b=new T.Group();cube(2.6,.65,.12,'#dbba5a',0,1,0,b);for(const x of [-1.1,1.1])cube(.12,1.2,.65,'#5b6254',x,.6,0,b);b.position.set(45+i*3.2,0,30);dynamicGroups.barricades.add(b);}dynamicGroups.barricades.visible=true;
 for(let i=0;i<9;i++){const f=sign(['SUNO','PAANI?','SAATH'][i%3],1.5,.8,['#cf936a','#9cac79','#c5b58a'][i%3],'#314c3e');f.position.set(-20+i*5,2.9,-69);dynamicGroups.arrivalFlags.add(f);}
 consolidate(staticGroup);
 world.camera.far=Math.max(world.camera.far,330);world.camera.updateProjectionMatrix();if(scene.fog){scene.fog.near=120;scene.fog.far=285;}
 const initialSun=world.sun?.intensity??2.45;let elapsed=0;
 function update(state={},dt=0){elapsed+=dt;const raw=state.phase?.id??state.phase??state.timeline?.phase??'morning';const phase=String(raw);const progress=phase.includes('evening')||phase.includes('climax')||phase.includes('aftermath')?1:phase.includes('afternoon')||phase.includes('rupture')?.65:phase.includes('midday')?.35:0;
  if(world.sun){world.sun.intensity=T.MathUtils.lerp(initialSun,1.3,progress);world.sun.color.set(progress>.6?'#ffc999':'#fff3dd');world.sun.position.y=55-progress*32;}
  bulbs.forEach(b=>b.material.emissiveIntensity=.1+progress*1.8);dynamicGroups.barricades.userData.posture=progress>=.65?'reinforced':'parked';
  dynamicGroups.arrivalFlags.children.forEach((f,i)=>{f.rotation.y=Math.sin(elapsed*1.6+i)*.1;});
 }
 return {districts:DISTRICTS,anchors:STORY_ANCHORS,connections:CONNECTION_ROUTES,dynamicGroups,update};
}
function consolidate(group){group.updateMatrixWorld(true);const batches=new Map();group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);const arr=batches.get(o.material)||[];arr.push(g.index?g.toNonIndexed():g);batches.set(o.material,arr);});group.clear();for(const [material,geos]of batches){const geometry=mergeGeometries(geos,false);if(geometry){const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}geos.forEach(g=>g.dispose());}}
