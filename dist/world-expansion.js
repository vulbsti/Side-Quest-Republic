import {SHOP_LAYOUT,SHOP_SOLIDS,FORECOURTS,FORECOURT_SOLIDS,DESTINATIONS,URBAN_SOLIDS} from './destinations.js?v=18';
import {THREE as T,cube,cylinder,sign,mat} from './world.js?v=18';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js?v=18';
import {DISTRICTS,STORY_ANCHORS,CONNECTION_ROUTES,EXPANSION_SOLIDS} from './districts.js?v=18';
/** Visual projection only: the living-world simulation owns every event. */
export function expandWorld(world){
 const {scene,obstacles}=world,staticGroup=new T.Group();staticGroup.name='Delhi neighbourhood expansion';scene.add(staticGroup);
 const dynamicGroups={barricades:new T.Group(),arrivalFlags:new T.Group(),lamps:new T.Group(),clockHands:new T.Group()};
 for(const [id,g]of Object.entries(dynamicGroups)){g.name=`Expansion ${id}`;scene.add(g);}
 let pavement,plaster,asphalt,sandstone;scene.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const path=o.material.map?.image?.src||'';if(path.includes('cobblestone'))pavement??=o.material;if(path.includes('plastered'))plaster??=o.material;if(path.includes('asphalt'))asphalt??=o.material;if(path.includes('sandstone'))sandstone??=o.material;});
 const stone=plaster?plaster.clone():mat('#ddd6c5'),pave=mat('#bdb8aa');stone.userData={...stone.userData,worldScale:2.7};const masonry=sandstone?sandstone.clone():mat('#b9aa8e');masonry.userData={...masonry.userData,worldScale:1.8};
 function ground(w,d,x,z,color){const m=color?mat(color):pave;const o=cube(w,.12,d,m,x,-.09,z,staticGroup);if(pavement&&!['#797e74','#8b936c'].includes(color)){o.material=pavement.clone();if(color)o.material.color.set(color);const map=pavement.map.clone();map.repeat.set(w/2.6,d/2.6);map.needsUpdate=true;o.material.map=map;o.material.normalMap=null;}return o;}
 function road(w,d,x,z){const o=cube(w,.025,d,asphalt||mat('#686b62'),x,.01,z,staticGroup);if(asphalt){o.material=asphalt.clone();o.material.map=asphalt.map.clone();o.material.map.repeat.set(w/3.4,d/3.4);o.material.normalMap=null;}return o;}
 // Four adjoining ground strips avoid z-fighting with the original 125 x 150 plaza.
 ground(27.5,185,-76.25,7.5);ground(27.5,185,76.25,7.5);ground(125,10,0,-80);ground(125,25,0,87.5);
 ground(28,40,-64,12,'#b5b1a0');ground(27,37,64,-30,'#b3b5ad');ground(29,38,64,45,'#c6bdab');ground(51,29,-55,68,'#b9aa92');ground(45,17,0,-67,'#8b936c');
 road(7.5,133.5,-60,-10.25);road(13,19,-56,66);road(7.5,133.5,60,-10.25);road(13,19,64,66);
 function label(text,x,z,w=8,bg='#284e45',y=3.2){const s=sign(text,w,.8,bg,'#fff2ce');s.material.side=T.FrontSide;s.position.set(x,y,z+.012);const back=s.clone();back.rotation.y=Math.PI;back.position.set(x,y,z-.012);staticGroup.add(s,back);obstacles.push({id:`expansion-sign:${text}`,x,z,w,d:.16,base:y-.4,h:y+.4,expansion:true});return s;}
 function pole(x,z,h=3.2){cylinder(.055,.075,h,'#475b50',x,h/2,z,staticGroup,8);obstacles.push({id:`expansion-pole:${x}:${z}`,x,z,w:.15,d:.15,h,expansion:true});}
 for(const d of DISTRICTS.filter(d=>['supply','press','court','backstreet','assembly'].includes(d.id))){const [x,z]=({supply:[-76,30],press:[74,-42],court:[76,58],backstreet:[-42,60],assembly:[0,-70]})[d.id];label(d.name.toUpperCase(),x,z,9);pole(x-4.5,z);pole(x+4.5,z);}
 for(const o of EXPANSION_SOLIDS)obstacles.push({...o,expansion:true});
 function tent(x,z){cube(10,.16,8,'#ddd6bd',x,3.3,z,staticGroup);cube(10,2.7,.12,'#e7ddc0',x,1.5,z-4,staticGroup);for(const side of [-1,1]){cube(.12,2.7,8,'#e7ddc0',x+side*5,1.5,z,staticGroup);pole(x+side*5,z+4,3.4);}cube(10,.5,.16,'#447b64',x,3.05,z+4,staticGroup);label('SEVA / FIRST AID',x,z+4.1,7,'#447b64',2.9);}
 tent(-74,3);tent(-74,19);
 function table(x,z,w=4){cube(w,.12,1.2,'#967753',x,.88,z,staticGroup);for(const dx of [-w/2+.2,w/2-.2])cube(.12,.82,1,'#47564a',x+dx,.41,z,staticGroup);}
 table(-69,5);table(67,-31);table(67,46);
 for(let i=0;i<8;i++){cylinder(.13,.12,.38,'#a0c5c0',-70.5+i*.42,1.1,5,staticGroup,8);}
 label('PAANI • REST • FIND A FRIEND',-76,28,10,'#427864',2.4);
 for(let i=0;i<6;i++)cube(.9,.6,.8,['#69947b','#bba76d'][i%2],-73+(i%3-1),.3+Math.floor(i/3)*.6,24,staticGroup);
 // News van, tripod stations and a genuinely open interview area.
 cube(4,2.6,9,'#e3e4de',73,1.6,-27,staticGroup);cube(3.7,.8,.15,'#495f69',73,2.2,-22.45,staticGroup);for(const z of [-30,-24])for(const x of [70.9,75.1]){const wheel=cylinder(.55,.55,.25,'#303b3b',x,.6,z,staticGroup,12);wheel.rotation.z=Math.PI/2;}
 label('PRESS / LIVE DESK',73,-22.3,3.5,'#334b68',1.2);
 const dish=cylinder(1.2,.1,.3,'#b1b9b8',73,3.4,-29,staticGroup,20);dish.rotation.x=.4;
 for(const [x,z]of[[68,-38],[67,-20]]){obstacles.push({id:`press-tripod:${x}:${z}`,x,z,w:.8,d:.8,h:2,expansion:true});pole(x,z,1.7);cube(.55,.4,.85,'#273a3e',x,1.8,z,staticGroup);for(const angle of [0,2.1,4.2]){const leg=cylinder(.025,.04,1.4,'#657774',x+Math.cos(angle)*.3,.65,z+Math.sin(angle)*.3,staticGroup,6);leg.rotation.z=Math.cos(angle)*.35;}}
 label('WHO SAW WHAT?',74,-46,7,'#4b5e75',2.5);
 // Municipal frontage: deep windows, veranda and an open waiting court.
 cube(12,7,20,stone,76,3.5,43,staticGroup);cube(12.7,.3,20.7,'#afa58f',76,7,43,staticGroup);
 for(let z=36;z<=50;z+=3.5){cube(.12,2,1.8,'#344f52',69.95,4.5,z,staticGroup);cube(.2,.12,2,'#f1e7cd',69.85,3.5,z,staticGroup);}
 label('CIVIC LIAISON / PUBLIC WAITING',76,56,12,'#736046',4.2);
 for(const z of [37,51]){cube(3,.12,.7,'#8b7354',64,.65,z,staticGroup);for(const x of [63,65])cube(.12,.6,.6,'#4b584d',x,.3,z,staticGroup);}
 // Open shop doorways and detailed interiors use the exact same solid data as navigation.
 for(const solid of SHOP_SOLIDS){const bottom=solid.base||0;
  if(solid.id.endsWith('Shelf')){for(const dx of [-solid.w/2,solid.w/2])cube(.06,solid.h,solid.d,'#78766a',solid.x+dx,solid.h/2,solid.z,staticGroup);cube(solid.w,solid.h,.05,'#817e6d',solid.x,solid.h/2,solid.z+.3,staticGroup);for(const y of [.12,.72,1.32,1.9])cube(solid.w,.055,solid.d,'#a7a18c',solid.x,y,solid.z,staticGroup);}
  else if(solid.id.endsWith('Counter')){cube(solid.w,.075,solid.d,'#b7ae94',solid.x,solid.h-.037,solid.z,staticGroup);for(const dz of [-.85,.85]){cube(.95,.86,.055,'#806e55',solid.x,.45,solid.z+dz,staticGroup);cube(.9,.055,1.65,'#655c4a',solid.x,.08,solid.z,staticGroup);}for(const z of [solid.z-.55,solid.z+.55]){cube(.035,.7,.95,'#9c8766',solid.x-.49,.49,z,staticGroup);cube(.055,.08,.17,'#b4b3a4',solid.x-.52,.7,z,staticGroup);}}
  else cube(solid.w,solid.h-bottom,solid.d,stone,solid.x,(solid.h+bottom)/2,solid.z,staticGroup);
 }
 for(const shop of SHOP_LAYOUT){const x=shop.x;const floor=ground(7.7,7.7,x,84,'#c5bdab');floor.material=masonry;floor.position.y=-.025;cube(7.3,.22,2.2,shop.color,x,3.6,79.1,staticGroup);label(shop.name,x,78.9,6.8,'#37554c',3.1);cube(1.6,1.3,.15,'#3f5555',x,5.2,79.88,staticGroup);
  // Recessed frontage, painted skirting and lintels break the slab into actual units.
  for(const dx of [-2.8,2.8]){cube(1.65,2.3,.08,shop.color,x+dx,1.3,80.15,staticGroup);for(let sl=0;sl<9;sl++)cube(1.55,.035,.1,'#555c52',x+dx,.35+sl*.23,80.2,staticGroup);}
  cube(7.55,.22,.12,'#817866',x,.14,87.8,staticGroup);
  cube(7.5,.14,.18,'#a1967d',x,6.2,79.95,staticGroup);
  for(const dx of [-2.2,2.2]){cube(1.35,1.45,.08,'#455d5b',x+dx,5.15,79.98,staticGroup);cube(.055,1.45,.12,'#bbb29d',x+dx,5.15,79.94,staticGroup);cube(1.35,.055,.12,'#bbb29d',x+dx,5.15,79.94,staticGroup);}
  cube(.8,.48,.25,'#a3a292',x+2.6,4.12,80.1,staticGroup);
  label('AAO / OPEN',x,80.12,2.2,'#547463',2.65);
  const glow=new T.MeshStandardMaterial({color:'#f4e7bd',emissive:'#e7cd92',emissiveIntensity:.5});cube(2,.05,.7,glow,x,3.72,84,staticGroup);
  for(let i=0;i<7;i++){cube(.45,.35,.35,['#ac7955','#829278','#b5a66d'][i%3],x-2.1+i*.7,2.08,87.25,staticGroup);}
  if(shop.id==='print'){cube(.65,.35,.65,'#d1d3c6',x+2.4,1.18,84.4,staticGroup);for(let j=0;j<3;j++)cube(.5,.025,.7,'#f5eedb',x+2.4,1.02+j*.03,85.2,staticGroup);}
  if(shop.id==='chai'){cylinder(.22,.3,.5,'#b1b7b1',x+2.4,1.25,84.4,staticGroup,14);for(let j=0;j<3;j++)cylinder(.08,.06,.16,'#c59b72',x+2.4,1.1,83.7+j*.2,staticGroup,10);}
  if(shop.id==='charge'){for(let j=0;j<4;j++)cube(.18,.025,.32,'#314e50',x+2.4,1.03,83.8+j*.4,staticGroup);}
 }
 // A continuous arcade and furnished rooms turn the lane into places to enter.
 // Every new freestanding furnishing registers its visible envelope; wall-mounted
 // micro-details stay inside an existing shelf/counter/wall collision envelope.
 function furnished(id,w,h,d,color,x,y,z,walkable=false){const m=cube(w,h,d,color,x,y,z,staticGroup);obstacles.push({id:'market-detail:'+id,x,z,w,d,base:Math.max(0,y-h/2),h:y+h/2,walkable,expansion:true});return m;}
 furnished('arcade-roof',40,.14,2.7,'#a08d6d',-55,3.55,78.65);
 for(let x=-75;x<=-35;x+=8){furnished('arcade-column:'+x,.18,3.55,.18,'#687969',x,1.775,79.35);furnished('arcade-foot:'+x,.38,.12,.38,'#8f8b79',x,.06,79.35);}
 // Drain gratings and joints follow the shop edge rather than cutting the bus lane.
 for(let x=-74;x<-35;x+=1){cube(.8,.018,.23,'#555d54',x,.012,78.9,staticGroup);for(let j=0;j<4;j++)cube(.035,.02,.24,'#a5a293',x-.3+j*.2,.025,78.9,staticGroup);}
 for(const shop of SHOP_LAYOUT){const x=shop.x;
  for(let i=0;i<12;i++)cube(.3,.035,1.9,shop.color,x-3.3+i*.6,3.42,78.6,staticGroup);
  // A side display leaves the central aisle and the counter approach clear.
  obstacles.push({id:'market-detail:'+shop.id+'-sidecase',x:x-3.45,z:84.8,w:.48,d:3.6,h:2.45,expansion:true});cube(.045,2.45,3.6,'#6b6d60',x-3.67,1.225,84.8,staticGroup);for(const z of [83,86.6])cube(.48,2.45,.045,'#898474',x-3.45,1.225,z,staticGroup);for(const y of [.1,.8,1.5,2.4])cube(.48,.045,3.6,'#ada58e',x-3.45,y,84.8,staticGroup);obstacles.push({id:'market-detail:'+shop.id+'-stock',x:x-3.07,z:84.8,w:.3,d:3.6,h:2.6,expansion:true});
  for(let row=0;row<3;row++)for(let n=0;n<7;n++){
   const z=83.4+n*.43,y=.45+row*.7;
   if(shop.id==='kirana'||shop.id==='chai'){cylinder(.12,.12,.28,['#b6a16a','#a96342','#80937a'][n%3],x-3.13,y,z,staticGroup,8);cube(.035,.1,.15,'#e6d7b7',x-2.99,y,z,staticGroup);}
   else cube(.18,.27,.3,['#637d7a','#ac7355','#cab384'][n%3],x-3.12,y,z,staticGroup);
  }
  // Shelved packets and bottles give each shop a recognizable stock silhouette.
  for(let row=0;row<2;row++)for(let n=0;n<10;n++){const y=.55+row*.65;cube(.35,.38,.26,['#c38a4d','#6c8d7d','#b5543e','#e0c596'][n%4],x-2.25+n*.5,y,86.9,staticGroup);cube(.18,.07,.02,'#eee0c2',x-2.25+n*.5,y,86.76,staticGroup);}
  cube(2.8,.035,.03,'#c6bba2',x+2.2,3.1,80.18,staticGroup);
  cube(.45,.7,.12,'#797c70',x+3.4,2.25,80.18,staticGroup);
  // Interior signs face the arriving player; exterior side also reads normally.
  const tag={print:'XEROX • PRINT • LAMINATE',kirana:'COLD DRINKS / MRP ONLY',repair:'PUNCTURE / AIR / REPAIRS',chai:'ADRAK • ELAICHI • BISCUIT',charge:'CHARGING / REPAIR / CABLES'}[shop.id];
  label(tag,x,87.75,5.2,shop.color,2.8);
  if(shop.id==='print'){cube(.8,.52,.75,'#d3cfc0',x+2.4,1.27,85.3,staticGroup);cube(.65,.08,.42,'#535e58',x+2.4,1.57,85.3,staticGroup);for(let j=0;j<5;j++)cube(.8,.035,.55,'#ece3ce',x+2.4,1.05+j*.04,83.8,staticGroup);}
  if(shop.id==='kirana'){const cx=x+2.95,cz=86.65;obstacles.push({id:'market-detail:kirana-cooler',x:cx,z:cz,w:1.05,d:1.1,h:1.9,expansion:true});for(const dx of [-.49,.49])cube(.065,1.9,1.1,'#b7c0b5',cx+dx,.95,cz,staticGroup);cube(.95,1.9,.07,'#bbc4b6',cx,.95,cz+.5,staticGroup);cube(1.05,.19,1.1,'#55776b',cx,1.805,cz,staticGroup);cube(1.05,.16,1.1,'#6e7e73',cx,.08,cz,staticGroup);for(const y of [.35,.82,1.29]){cube(.95,.035,.9,'#c3c9b6',cx,y,cz,staticGroup);for(let j=0;j<5;j++){cylinder(.065,.065,.26,['#b08245','#8da07a','#b7784c'][j%3],cx-.35+j*.17,y+.16,cz-.3,staticGroup,10);cylinder(.025,.025,.06,'#d5c898',cx-.35+j*.17,y+.32,cz-.3,staticGroup,8);}}cube(.045,.55,.06,'#b6b9a6',cx+.38,1.02,cz-.57,staticGroup);for(let k=0;k<6;k++)cube(.7,.012,.025,'#3f5549',cx,.035+k*.017,cz-.56,staticGroup);}
  if(shop.id==='chai'){furnished('chai-washing-basin',1.0,.95,1.1,'#999f94',x+2.9,.475,86.7);cube(.7,.045,.7,'#465f59',x+2.9,.96,86.7,staticGroup);cube(.05,.4,.05,'#aab6ae',x+3.2,1.14,86.9,staticGroup);}
  if(shop.id==='repair'){
   // A full, correctly scaled repair cycle: spoke wheels, triangular tube
   // frame, fork, saddle, crank and handlebars. It stays beside the entry aisle.
   const bx=x-2.15,bz=81.55;
   obstacles.push({id:'market-detail:repair-cycle',x:bx+.05,z:bz,w:2.1,d:.65,h:1.3,expansion:true});
   function tube(a,b,r,color){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),m=cylinder(r,r,Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),color,0,0,0,staticGroup,8);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
   const rear=[bx-.55,.37,bz],front=[bx+.65,.37,bz],crank=[bx-.05,.37,bz],saddle=[bx-.18,.94,bz],head=[bx+.48,.94,bz];
   for(const wheel of [rear,front]){const tyre=new T.Mesh(new T.TorusGeometry(.34,.037,8,28),mat('#303b34'));tyre.position.set(...wheel);staticGroup.add(tyre);const rim=new T.Mesh(new T.TorusGeometry(.3,.012,6,28),mat('#b4b5a2'));rim.position.set(...wheel);staticGroup.add(rim);for(let n=0;n<12;n++){const a=n*Math.PI/6;tube(wheel,[wheel[0]+Math.cos(a)*.3,wheel[1]+Math.sin(a)*.3,bz],.004,'#adaf9d');}}
   for(const [a,b]of[[rear,saddle],[rear,crank],[crank,saddle],[saddle,head],[head,crank],[head,front]])tube(a,b,.023,'#547b6c');tube(saddle,[saddle[0],1.05,bz],.018,'#a5ad9b');cube(.25,.055,.15,'#3c463b',saddle[0],1.08,bz,staticGroup);tube(head,[bx+.48,1.16,bz],.017,'#a5ad9b');tube([bx+.48,1.16,bz-.24],[bx+.48,1.16,bz+.24],.019,'#a5ad9b');tube([crank[0]-.1,.3,bz-.16],[crank[0]+.1,.44,bz+.16],.015,'#a5ad9b');cube(.14,.035,.1,'#4d584c',crank[0]-.1,.3,bz-.2,staticGroup);
   // Wheels hang on the sidecase, not as invisible obstacles in the walking aisle.
   for(const z of [83.4,85.1]){const tyre=new T.Mesh(new T.TorusGeometry(.48,.065,6,20),mat('#373d38'));tyre.rotation.y=Math.PI/2;tyre.position.set(x-3.12,2.05,z);staticGroup.add(tyre);for(let n=0;n<8;n++){const spoke=cube(.025,.88,.025,'#9b9d8d',x-3.12,2.05,z,staticGroup);spoke.rotation.x=n*Math.PI/8;}}
  }
 }
 // An open-air neighbour court beside the arcade: walk in from north or west,
 // choose a seat, or continue to the shop doors. The scene anchor stays free.
 ground(13,8,-43,72.5,'#a9a08a').position.y=-.055;
 furnished('court-seat-east',.65,.46,2.5,'#8e7660',-38.8,.23,72,true);
 furnished('court-seat-south',2.6,.46,.65,'#8e7660',-43,.23,75.4,true);
 for(const x of [-48.7,-37.5]){furnished('court-planter:'+x,1.0,.6,1.0,'#a47857',x,.3,75.7);for(let n=0;n<5;n++){const leaf=cube(.1,.8,.36,'#607653',x+(n-2)*.12,1,75.7,staticGroup);leaf.rotation.z=(n-2)*.25;}}
 furnished('court-table',1.0,.66,.8,'#968064',-41.6,.33,72.7);
 cylinder(.1,.07,.18,'#c19968',-41.6,.75,72.7,staticGroup,10);
 // High-level service details connect the facades into one occupied street.
 for(let x=-74;x<-36;x+=2){cube(2.05,.035,.035,'#414b43',x,6.35,79.68,staticGroup);cube(.035,.45,.035,'#414b43',x,6.12,79.68,staticGroup);}
 for(let x=-70;x<=-38;x+=8){cube(1.4,.6,.35,'#999d8e',x,5.9,79.7,staticGroup);for(let k=0;k<5;k++)cube(1.15,.035,.03,'#596b62',x,5.7+k*.09,79.5,staticGroup);}
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
  label('BUS / '+stop.name,stop.x,stop.z+2.5,4.5,'#356455',4.2);
  for(const solid of FORECOURT_SOLIDS.filter(o=>o.id.startsWith(stop.id))){const bottom=solid.base||0;cube(solid.w,solid.h-bottom,solid.d,solid.id.endsWith('Bench')?'#8c7858':'#617c6b',solid.x,(solid.h+bottom)/2,solid.z,staticGroup);}
 }
 label('SERVICE COURTYARD / SABKA RAASTA',-47,76,10,'#7d6f50',3.1);
 for(let i=0;i<4;i++){cube(1.25,.75,1.25,'#b39764',-69+(i%2)*1.3,.375+Math.floor(i/2)*.75,73,staticGroup);}
 label('DELIVERIES / KEEP THE LANE CLEAR',-75,75,9,'#8c684a',2.5);
 for(const x of [-14,14]){cube(7,.6,3,'#b1a991',x,.3,-74,staticGroup);cube(6.6,.05,2.6,'#687b53',x,.62,-74,staticGroup);}
 label('ASSEMBLY GARDEN / SABKA SWAGAT',0,-76,15,'#627c4c',3.4);
 // Wayfinding is placed at intersections; route geometry stays completely open.
 for(const [text,x,z]of[['← SEVA CAMP',-42,31],['PRESS LANE ↑',53,8],['CIVIC COURT ↓',48,28],['SERVICE GALI ←',-30,63],['ASSEMBLY GARDEN ←',74,-58]]){label(text,x,z,6,'#3d5d52',2.7);pole(x-3,z,2.7);}
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
function consolidate(group){group.updateMatrixWorld(true);const batches=new Map();group.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);const scale=o.material.userData?.worldScale;if(scale){const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));uv[i*2]=(ay>=ax&&ay>=az?p.getX(i):ax>az?p.getZ(i):p.getX(i))/scale;uv[i*2+1]=(ay>=ax&&ay>=az?p.getZ(i):p.getY(i))/scale;}g.setAttribute('uv',new T.BufferAttribute(uv,2));}const arr=batches.get(o.material)||[];arr.push(g.index?g.toNonIndexed():g);batches.set(o.material,arr);});group.clear();for(const [material,geos]of batches){const geometry=mergeGeometries(geos,false);if(geometry){const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}geos.forEach(g=>g.dispose());}}
