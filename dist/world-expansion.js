import {SHOP_LAYOUT,SHOP_SOLIDS,FORECOURTS,FORECOURT_SOLIDS,DESTINATIONS,URBAN_SOLIDS} from './destinations.js?v=12';
import {THREE as T,cube,cylinder,sign,mat} from './world.js?v=12';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js?v=12';
import {DISTRICTS,STORY_ANCHORS,CONNECTION_ROUTES,EXPANSION_SOLIDS} from './districts.js?v=12';
/** Visual projection only: the living-world simulation owns every event. */
export function expandWorld(world){
 const {scene,obstacles}=world,staticGroup=new T.Group();staticGroup.name='Delhi neighbourhood expansion';scene.add(staticGroup);
 const dynamicGroups={barricades:new T.Group(),arrivalFlags:new T.Group(),lamps:new T.Group(),clockHands:new T.Group()};
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
 // Open shop doorways and detailed interiors use the exact same solid data as navigation.
 for(const solid of SHOP_SOLIDS){const bottom=solid.base||0;cube(solid.w,solid.h-bottom,solid.d,solid.id.endsWith('Counter')?'#917053':solid.id.endsWith('Shelf')?'#6a6a50':stone,solid.x,(solid.h+bottom)/2,solid.z,staticGroup);}
 for(const shop of SHOP_LAYOUT){const x=shop.x;ground(7.7,7.7,x,84,'#c5bdab');cube(7.3,.22,2.2,shop.color,x,3.6,79.1,staticGroup);label(shop.name,x,78.9,6.8,'#37554c',3.1);cube(1.6,1.3,.15,'#3f5555',x,5.2,79.88,staticGroup);
  label('AAO / OPEN',x,80.12,2.2,'#547463',2.65);
  const glow=new T.MeshStandardMaterial({color:'#f4e7bd',emissive:'#e7cd92',emissiveIntensity:.5});cube(2,.05,.7,glow,x,3.72,84,staticGroup);
  for(let i=0;i<7;i++){cube(.45,.35,.35,['#ac7955','#829278','#b5a66d'][i%3],x-2.1+i*.7,2.08,87.25,staticGroup);}
  if(shop.id==='print'){cube(.65,.35,.65,'#d1d3c6',x+2.4,1.18,84.4,staticGroup);for(let j=0;j<3;j++)cube(.5,.025,.7,'#f5eedb',x+2.4,1.02+j*.03,85.2,staticGroup);}
  if(shop.id==='chai'){cylinder(.22,.3,.5,'#b1b7b1',x+2.4,1.25,84.4,staticGroup,14);for(let j=0;j<3;j++)cylinder(.08,.06,.16,'#c59b72',x+2.4,1.1,83.7+j*.2,staticGroup,10);}
  if(shop.id==='charge'){for(let j=0;j<4;j++)cube(.18,.025,.32,'#314e50',x+2.4,1.03,83.8+j*.4,staticGroup);}
 }
 // A second market loop gives the southern square its own silhouette and activities.
 ground(64,21,8,84,'#c1ad8e');ground(14,8,22,80,'#b98d72');
 for(const solid of URBAN_SOLIDS){const bottom=solid.base||0;cube(solid.w,solid.h-bottom,solid.d,solid.color,solid.x,(solid.h+bottom)/2,solid.z,staticGroup);}
 for(const [text,x,z,w,bg,y]of[['GALI BAZAAR / ANDAR AAO',8,85,22,'#815f49',4.5],['SECOND-HAND / FIRST IMPRESSIONS',-8,87,7,'#56684d',2.8],['CHAAT: CONFIDENCE EXTRA',-23,75,5,'#927449',2.5],['EIGHT COUNTS. NO GUARANTEES.',22,83.5,10,'#9b695b',3.2],['MAIN CHARACTER',35,88.88,5.5,'#659c99',2.0],['VOICE NOTES / ONE MORE TAKE',4,41.85,4,'#76638b',2.6]])label(text,x,z,w,bg,y);
 // Clock face, books, spice jars and floor marks are batched static details.
 const face=new T.Mesh(new T.CircleGeometry(.85,24),new T.MeshStandardMaterial({color:'#f1dfb3',side:T.DoubleSide}));face.position.set(8,8,90.35);staticGroup.add(face);dynamicGroups.clockHands.position.set(8,8,90.3);const hourHand=new T.Group(),minuteHand=new T.Group();cube(.07,.45,.04,'#35483c',0,.2,0,hourHand);cube(.04,.7,.04,'#35483c',0,.3,-.03,minuteHand);dynamicGroups.clockHands.add(hourHand,minuteHand);
 for(const x of [-16,-8,0,16,24,32])for(let i=0;i<9;i++)cube(.45,.18+(i%3)*.15,.6,['#6d7e6a','#a46b53','#c2a15e'][i%3],x-2.1+i*.5,1.2+(i%3)*.075,91,staticGroup);
 for(let i=0;i<4;i++)cylinder(.15,.15,.4,['#b07b45','#a59151','#637753','#8e513e'][i],-23,1.4,74+i*.55,staticGroup,8);
 for(let i=0;i<4;i++)cube(1.2,.015,.12,'#e8c99f',18+i*2.5,.03,79,staticGroup);
 label('BAZAAR →',-14,67,5,'#705d43',2.6);label('← METRO / → CIVIC COURT',31,73,11,'#536f59',2.6);
 // Bus bays are road-level; shelters sit outside the moving 3 x 8 metre vehicle corridor.
 for(const stop of FORECOURTS){ground(4.2,12,stop.bus.x,stop.bus.z,'#797e74');ground(4.4,8,stop.x,stop.z,'#c8c2af');for(let i=-2;i<=2;i++)cube(.12,.015,1.1,'#e0c582',stop.bus.x+(stop.bus.x>0?-2:2),.04,stop.bus.z+i*2,staticGroup);
  label('BUS / '+stop.name,stop.x,stop.z+2.5,4.5,'#356455',2.5);
  for(const solid of FORECOURT_SOLIDS.filter(o=>o.id.startsWith(stop.id))){const bottom=solid.base||0;cube(solid.w,solid.h-bottom,solid.d,solid.id.endsWith('Bench')?'#8c7858':'#617c6b',solid.x,(solid.h+bottom)/2,solid.z,staticGroup);}
 }
 label('SERVICE COURTYARD / SABKA RAASTA',-47,76,10,'#7d6f50',3.1);
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
 function update(state={},dt=0){elapsed+=dt;const minutes=9*60+Math.max(0,Math.min(1200,Number(state.time)||0))/1200*540;hourHand.rotation.z=-minutes/720*Math.PI*2;minuteHand.rotation.z=-minutes/60*Math.PI*2;const raw=state.phase?.id??state.phase??state.timeline?.phase??'morning';const phase=String(raw);const progress=phase.includes('evening')||phase.includes('climax')||phase.includes('aftermath')?1:phase.includes('afternoon')||phase.includes('rupture')?.65:phase.includes('midday')?.35:0;
  if(world.sun){world.sun.intensity=T.MathUtils.lerp(initialSun,1.3,progress);world.sun.color.set(progress>.6?'#ffc999':'#fff3dd');world.sun.position.y=55-progress*32;}
  bulbs.forEach(b=>b.material.emissiveIntensity=.1+progress*1.8);dynamicGroups.barricades.userData.posture=progress>=.65?'reinforced':'parked';
  dynamicGroups.arrivalFlags.children.forEach((f,i)=>{f.rotation.y=Math.sin(elapsed*1.6+i)*.1;});
 }
 return {destinations:DESTINATIONS,districts:DISTRICTS,anchors:STORY_ANCHORS,connections:CONNECTION_ROUTES,dynamicGroups,update};
}
function consolidate(group){group.updateMatrixWorld(true);const batches=new Map();group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);const arr=batches.get(o.material)||[];arr.push(g.index?g.toNonIndexed():g);batches.set(o.material,arr);});group.clear();for(const [material,geos]of batches){const geometry=mergeGeometries(geos,false);if(geometry){const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}geos.forEach(g=>g.dispose());}}
