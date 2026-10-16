import {THREE as T,cube,cylinder,sign} from './world.js?v=25';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js?v=25';

/** Original short-wheelbase city shuttle. Metres; +Z is the front.
 * Body and open door stay inside the 2.5 x 8.5 m physical envelope.
 * Static opaque fittings are batched; glass, wheels and doors stay separate. */
export function buildShuttleModel(bus){
 const g=new T.Group(),fixed=new T.Group(),shell=new T.Group(),canopy=new T.Group(),door=new T.Group();
 g.name=bus.name;g.add(fixed,shell,canopy,door);
 const paint=new T.MeshStandardMaterial({color:bus.id.endsWith('1')?'#397660':'#a66d39',roughness:.37,metalness:.32});
 const ivory=new T.MeshStandardMaterial({color:'#d7d7c9',roughness:.48,metalness:.25});
 const black=new T.MeshStandardMaterial({color:'#202627',roughness:.68});
 const steel=new T.MeshStandardMaterial({color:'#a5a9a7',roughness:.3,metalness:.8});
 const glass=new T.MeshStandardMaterial({color:'#486872',roughness:.16,metalness:.35,transparent:true,opacity:.42,depthWrite:false,side:T.DoubleSide});
 const rubber=new T.MeshStandardMaterial({color:'#232323',roughness:.96});
 const seatMat=new T.MeshStandardMaterial({color:'#516c72',roughness:.94});
 function box(w,h,d,m,x,y,z,parent=fixed,r=.035){
  const s=new T.Shape(),a=w/2-r,b=h/2-r;
  s.moveTo(-a-r,-b);s.lineTo(-a-r,b);s.quadraticCurveTo(-a-r,b+r,-a,b+r);s.lineTo(a,b+r);s.quadraticCurveTo(a+r,b+r,a+r,b);s.lineTo(a+r,-b);s.quadraticCurveTo(a+r,-b-r,a,-b-r);s.lineTo(-a,-b-r);s.quadraticCurveTo(-a-r,-b-r,-a-r,-b);
  const geo=new T.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*r),bevelEnabled:true,bevelSize:r*.45,bevelThickness:Math.min(r,d*.2),bevelSegments:2,curveSegments:4,steps:1});geo.translate(0,0,-(d-2*r)/2);
  const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
 }
 // Chassis, ribbed non-slip floor and internal wheel housings.
 cube(2.3,.19,8.35,black,0,.59,0,fixed);cube(2.12,.08,8.05,'#777971',0,.75,0,fixed);
 for(let z=-3.9;z<4;z+=.18)cube(1.92,.006,.014,'#60645f',0,.794,z,fixed);
 for(const x of [-.88,.88])for(const z of [-2.75,1.3])box(.4,.35,1.15,black,x,.89,z);
 // Side skins have genuine wheel cut-outs rather than tyres intersecting solid boxes.
 function sideSkin(x,z0,z1){const s=new T.Shape();s.moveTo(z0,.59);for(const axle of [-2.75,1.3]){if(axle-.56>z0&&axle+.56<z1){s.lineTo(axle-.56,.59);s.quadraticCurveTo(axle-.56,1.16,axle,1.16);s.quadraticCurveTo(axle+.56,1.16,axle+.56,.59);}}s.lineTo(z1,.59);s.lineTo(z1,1.59);s.lineTo(z0,1.59);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:.08,bevelEnabled:false,curveSegments:12});geo.translate(0,0,-.04);const o=new T.Mesh(geo,paint);o.rotation.y=-Math.PI/2;o.position.x=x;o.castShadow=o.receiveShadow=true;shell.add(o);}
 sideSkin(-1.19,-4.1,4.1);sideSkin(1.19,-4.1,2.0);sideSkin(1.19,3.42,4.1);
 for(const x of [-1.2,1.2]){
  cube(.085,.1,8.25,ivory,x,1.65,0,shell);cube(.09,.13,8.25,paint,x,2.66,0,shell);
  for(const z of [-3.6,-2.4,-1.2,0,1.2,3.76]){if(x>0&&z>1.3&&z<3.42)continue;const span=z===3.76?.52:1.08;cube(.025,.86,span,glass,x,2.16,z,shell);for(const dz of [-span/2-.04,span/2+.04])cube(.07,.98,.065,black,x,2.16,z+dz,shell);cube(.035,.028,span,steel,x,2.29,z,shell);}
  for(const z of [-3.3,-1.8,-.3,1.1])cube(.014,.018,.75,'#b2b29c',x+(x>0?.025:-.025),1.23,z,shell);
 }
 const roof=box(2.42,.18,8.39,ivory,0,2.84,0,canopy,.07);
 box(1.55,.2,1.8,ivory,0,3.00,-1.9,canopy,.055);
 for(let z=-2.55;z<-1.1;z+=.12)cube(1.25,.025,.025,black,0,3.11,z,canopy);
 // Front fascia, split windscreen, wipers, mirrors, lamps and registration plate.
 box(2.4,.85,.18,paint,0,1.18,4.1,shell,.07);box(2.35,.34,.15,ivory,0,2.61,4.1,shell,.05);
 box(2.15,.9,.045,glass,0,2.02,4.19,shell,.06);cube(.045,.94,.055,black,0,2.02,4.21,shell);
 for(const x of [-.5,.5]){const w=cube(.025,.46,.025,black,x,1.91,4.22,shell);w.rotation.z=x>0?-.3:.3;}
 for(const x of [-.89,.89]){box(.4,.19,.065,black,x,1.13,4.22,shell,.035);box(.3,.12,.073,new T.MeshStandardMaterial({color:'#e1e7dc',emissive:'#fff1bd',emissiveIntensity:.25,roughness:.22}),x,1.14,4.21,shell,.025);cube(.11,.06,.045,'#c8973b',x,1.39,4.22,shell);}
 for(let y=.85;y<1.16;y+=.065)cube(.9,.025,.03,black,0,y,4.21,shell);
 box(2.43,.16,.21,black,0,.68,4.12,shell,.04);
 const plate=sign('DL 1P 2048',.55,.13,'#d6bb4f','#252c29');plate.position.set(0,.72,4.25);shell.add(plate);
 const route=sign(bus.id.endsWith('1')?'CP · PRESS LANE':'SEVA · GALI BAZAAR',2.04,.23,'#172322','#e9ce76');route.position.set(0,2.62,4.2);shell.add(route);
 for(const x of [-1.18,1.18]){cube(.045,.35,.045,black,x,2.28,3.84,shell);box(.1,.27,.16,black,x,2.33,4.08,shell,.025);}
 // Rear engine hatch and separate tail lamps, visible when following the shuttle.
 box(2.4,1.03,.16,paint,0,1.13,-4.1,shell,.06);box(2.2,.93,.06,glass,0,2.14,-4.18,shell,.05);
 for(let y=.83;y<1.34;y+=.07)cube(1.3,.025,.02,black,0,y,-4.2,shell);
 for(const x of [-1.02,1.02]){box(.12,.27,.04,black,x,1.29,-4.21,shell,.02);cube(.07,.13,.045,'#a5352b',x,1.35,-4.20,shell);cube(.07,.07,.045,'#cb8f33',x,1.22,-4.20,shell);}
 // Closing glazed door; doorway at the same physical cabin coordinates as boarding.
 for(const z of [2.35,3.05]){cube(.075,1.98,.66,black,1.2,1.78,z,door);cube(.085,1.08,.54,glass,1.205,2.02,z,door);cube(.09,.48,.54,paint,1.205,1.15,z,door);}
 cube(.42,.12,1.3,black,1.02,.53,2.7,fixed);cube(.3,.05,1.2,'#c2b45f',1.1,.61,2.7,fixed);
 const wheels=[];for(const x of [-1.08,1.08])for(const z of [-2.75,1.3]){const w=new T.Group();w.position.set(x,.49,z);g.add(w);const tire=cylinder(.49,.49,.23,rubber,0,0,0,w,32);tire.rotation.z=Math.PI/2;for(const side of [-1,1]){const hub=cylinder(.25,.25,.025,steel,side*.125,0,0,w,24);hub.rotation.z=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;const bolt=cylinder(.025,.025,.028,black,side*.145,Math.cos(a)*.17,Math.sin(a)*.17,w,8);bolt.rotation.z=Math.PI/2;}}wheels.push(w);}
 for(const seat of bus.seats){box(.53,.14,.61,seatMat,seat.x,1.14,seat.z);box(.53,.65,.14,seatMat,seat.x,1.48,seat.z-.25);for(const x of [-.2,.2])cylinder(.025,.025,.32,steel,seat.x+x,.93,seat.z,fixed,8);}
 for(const z of [-2,0,2])cylinder(.023,.023,1.9,'#cbb361',-.43,1.76,z,fixed,10);
 const rail=cylinder(.023,.023,6.2,'#cbb361',-.43,2.68,0,fixed,10);rail.rotation.x=Math.PI/2;
 for(const z of [-2.7,-1.6,-.5,.6,1.6]){const strap=new T.Mesh(new T.TorusGeometry(.075,.015,6,12),black);strap.position.set(-.43,2.45,z);fixed.add(strap);}
 box(.55,.16,.58,seatMat,-.65,1.13,3.35);box(.55,.7,.12,seatMat,-.65,1.49,3.1);
 box(1.5,.32,.5,black,-.18,1.45,3.83);const steering=new T.Mesh(new T.TorusGeometry(.2,.024,8,24),black);steering.rotation.x=-.65;steering.position.set(-.65,1.72,3.68);fixed.add(steering);
 for(const z of [-2.3,1.1])cube(.9,.035,.14,new T.MeshStandardMaterial({color:'#ebead9',emissive:'#ebe0a3',emissiveIntensity:.25}),0,2.7,z,fixed);
 batch(fixed);batch(shell);batch(canopy);batch(door);
 return {g,door,wheels,shells:[canopy],occupants:[],roof};
}
function batch(group){group.updateMatrixWorld(true);const sets=new Map();group.traverse(o=>{if(!o.isMesh||o.material.transparent)return;const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);const list=sets.get(o.material)||[];list.push(geo.index?geo.toNonIndexed():geo);sets.set(o.material,list);});for(const o of [...group.children])if(o.isMesh&&!o.material.transparent)group.remove(o);for(const [material,geos]of sets){const geometry=mergeGeometries(geos,false);if(geometry){const m=new T.Mesh(geometry,material);m.castShadow=m.receiveShadow=true;group.add(m);}geos.forEach(g=>g.dispose());}}
