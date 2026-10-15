import { RGBELoader } from './assets/materials/RGBELoader.js?v=21';
/** Apply only to the static world, BEFORE characters are created. */
export async function enhanceEnvironment(THREE, world) {
  const {scene,renderer,sun}=world, loader=new THREE.TextureLoader();
  const base='./assets/materials/';
  const report={loaded:[],failed:[],surfaces:0,foliage:0};
  const sets={};
  await Promise.all(['asphalt_02','plastered_wall','sandstone_blocks_05','cobblestone_floor_08'].map(async name=>{
    try {
      const [map,normalMap]=await Promise.all(['diff','nor_gl'].map(k=>loader.loadAsync(`${base}${name}_${k}_1k.jpg`)));
      for(const t of [map,normalMap]) {t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
      map.colorSpace=THREE.SRGBColorSpace;sets[name]={map,normalMap};report.loaded.push(name);
    }catch(e){report.failed.push(name);console.warn('Environment texture unavailable',name,e);}
  }));
  try {
    const hdr=await new RGBELoader().loadAsync(base+'kloofendal_48d_partly_cloudy_puresky_1k.hdr');
    hdr.mapping=THREE.EquirectangularReflectionMapping;
    const pmrem=new THREE.PMREMGenerator(renderer), env=pmrem.fromEquirectangular(hdr);
    scene.environment=env.texture;scene.environmentIntensity=.55;
    scene.background=hdr;scene.backgroundIntensity=.8;scene.backgroundRotation.y=1.7;scene.environmentRotation.y=1.7;
    world.environmentResources={hdr,env};pmrem.dispose();report.loaded.push('daylight-hdri');
  }catch(e){scene.background=new THREE.Color('#bfcdd5');report.failed.push('daylight-hdri');}
  scene.fog=new THREE.Fog('#c5cbd0',105,225);
  renderer.toneMappingExposure=1.02;
  if(sun){sun.color.set('#fff3dd');sun.intensity=2.45;sun.shadow.normalBias=.035;}
  scene.traverse(o=>{if(o.isHemisphereLight){o.color.set('#d8e3ef');o.groundColor.set('#898079');o.intensity=.65;}else if(o.isDirectionalLight&&o!==sun){o.color.set('#d4e4f1');o.intensity=.25;}});
  const canopies=new Set(['6c8651','7f9658','5f7f50','8d9d62']);
  const remove=[];
  scene.traverse(o=>{
    if(!o.isMesh||Array.isArray(o.material))return;
    const old=o.material,hex=old.color?.getHexString(),name=old.name||'';
    if(canopies.has(hex)){remove.push(o);return;}
    let asset,scale,color,normal=.55;
    if(old.map?.isCanvasTexture&&old.map.repeat.x===24){asset='cobblestone_floor_08';scale=2.6;color='#c9c5bd';normal=.45;}
    else if(old.map?.isCanvasTexture&&old.map.repeat.x===12){asset='asphalt_02';scale=3.4;color='#c0c0c0';normal=.4;}
    else if(name==='Warm lime plaster'||name==='Chalk edges'){asset='plastered_wall';scale=3;color=name==='Chalk edges'?'#f3f0e9':'#e8e4dc';normal=.25;}
    else if(name==='Sandstone'){asset='sandstone_blocks_05';scale=3;color='#b9a58e';normal=.5;}
    else if(name==='Delhi vermilion'||name==='Sunlit terracotta'){asset='plastered_wall';scale=2.7;color=name==='Delhi vermilion'?'#b45234':'#cc6d45';normal=.32;}
    if(asset&&sets[asset]){
      const m=old.clone();Object.assign(m,sets[asset]);m.color.set(color);m.roughness=.93;m.metalness=0;m.normalScale.set(normal,normal);m.envMapIntensity=.6;
      o.material=m;
      // Geometry was merged into world coordinates by world.js. Dominant-plane
      // projection gives a consistent metres-per-tile scale on all masonry.
      const g=o.geometry.clone(),p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
      for(let i=0;i<p.count;i++){
        const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));
        if(ay>=ax&&ay>=az){uv[i*2]=p.getX(i)/scale;uv[i*2+1]=p.getZ(i)/scale;}
        else if(ax>az){uv[i*2]=p.getZ(i)/scale;uv[i*2+1]=p.getY(i)/scale;}
        else {uv[i*2]=p.getX(i)/scale;uv[i*2+1]=p.getY(i)/scale;}
      }
      g.setAttribute('uv',new THREE.BufferAttribute(uv,2));o.geometry=g;report.surfaces++;
    }
    if(hex==='83945c'){o.material=old.clone();o.material.color.set('#70764b');o.material.roughness=1;}
    if(hex==='adb6a3'||hex==='93a397'){o.material=old.clone();o.material.color.set(hex==='adb6a3'?'#aaaeb0':'#828e94');}
  });
  remove.forEach(o=>o.removeFromParent());
  let leafMap=null;try{leafMap=await loader.loadAsync(base+'neem-leaf-v1.png');leafMap.colorSpace=THREE.SRGBColorSpace;leafMap.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());report.loaded.push('neem-leaf');}catch(e){report.failed.push('neem-leaf');}
  const foliage=addFoliage(THREE,scene,leafMap);
  report.foliage=foliage.count;
  world.setEnvironmentQuality=(mode='high')=>{
    foliage.count=mode==='balanced'?34*280:34*620;
    foliage.castShadow=mode!=='balanced';
    report.activeFoliage=foliage.count;
  };
  addFurnitureFinish(THREE,scene);
  addStreetDetail(THREE,scene);
  world.environmentReport=report;return report;
}
function addFoliage(T,scene,leafMap){
  let seed=5307;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  // Actual small leaf silhouettes, no opaque balloon canopy. Three crossed
  // leaflets per instance keep the foliage readable from street-level angles.
  const pos=[],norm=[],uv=[];
  for(let j=0;j<3;j++){
    const a=j*Math.PI/3,c=Math.cos(a),s=Math.sin(a);
    for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){const x=(u-.5)*.36,y=(v-.5)*.42;pos.push(x*c,y,x*s);norm.push(s,0,-c);uv.push(u,v);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(norm,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  const mat=new T.MeshStandardMaterial({color:'#ffffff',map:leafMap,alphaTest:leafMap?.45:0,roughness:.88,side:T.DoubleSide});
  const count=34*620,leaves=new T.InstancedMesh(geo,mat,count),d=new T.Object3D(),color=new T.Color();let idx=0;
  for(let i=0;i<34;i++){
    let x,z;if(i<16){x=-46+(i%8)*13;z=i<8?59:-63;}else{x=i%2?-43:49;z=-45+(i-16)*6;}
    const h=6+rnd()*1.8;
    for(let k=0;k<620;k++){
      const cluster=k%5,a=cluster*1.256,rad=Math.cbrt(rnd())*2.1,theta=rnd()*Math.PI*2,v=rnd()*2-1,rr=Math.sqrt(1-v*v);
      d.position.set(x+Math.cos(a)*1.3+rad*rr*Math.cos(theta),h+(cluster===4?1.3:0)+rad*v*.85,z+Math.sin(a)*1.3+rad*rr*Math.sin(theta));
      d.rotation.set(rnd()*Math.PI,rnd()*Math.PI,rnd()*Math.PI);d.scale.setScalar(.65+rnd()*.75);d.updateMatrix();leaves.setMatrixAt(k*34+i,d.matrix);
      leafMap?color.setHSL(.18+rnd()*.08,.06+rnd()*.13,.65+rnd()*.25):color.setHSL(.225+rnd()*.055,.25+rnd()*.18,.16+rnd()*.13);leaves.setColorAt(k*34+i,color);idx++;
    }
  }
  if(leafMap){leaves.customDepthMaterial=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:leafMap,alphaTest:.45,side:T.DoubleSide});}leaves.castShadow=true;leaves.receiveShadow=true;leaves.name='Instanced broadleaf foliage';leaves.computeBoundingSphere();scene.add(leaves);return leaves;
}
function addStreetDetail(T,scene){
  let seed=96;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  // Restrained ground-level dirt/scuffs and dry leaves give scale without
  // cluttering navigation; all decorative details have no collision.
  const grime=new T.MeshStandardMaterial({color:'#64594b',transparent:true,opacity:.16,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-1});
  const marks=new T.InstancedMesh(new T.CircleGeometry(1,9),grime,90),d=new T.Object3D();
  for(let i=0;i<90;i++){const side=i%2?1:-1;d.position.set(-49+rnd()*99,.037,side*(7.1+rnd()*.65));d.rotation.set(-Math.PI/2,0,rnd()*6.28);d.scale.set(.15+rnd()*.8,.03+rnd()*.15,1);d.updateMatrix();marks.setMatrixAt(i,d.matrix);}scene.add(marks);
  const litter=new T.InstancedMesh(new T.PlaneGeometry(.11,.20),new T.MeshStandardMaterial({color:'#a38b58',side:T.DoubleSide,roughness:1}),140);
  for(let i=0;i<140;i++){d.position.set(-48+rnd()*97,.045,(i%2?1:-1)*(8.7+rnd()*1.3));d.rotation.set(-Math.PI/2,rnd()*.2,rnd()*6.28);d.scale.setScalar(.6+rnd());d.updateMatrix();litter.setMatrixAt(i,d.matrix);}scene.add(litter);
  // Drain gratings beside the road, a little infrastructural realism.
  const iron=new T.MeshStandardMaterial({color:'#33383a',roughness:.83,metalness:.35});
  const drain=new T.InstancedMesh(new T.BoxGeometry(.045,.015,.62),iron,120);
  for(let i=0;i<120;i++){const group=Math.floor(i/10),j=i%10;d.position.set(-44+group*8+j*.075,.035,group%2?7.25:-7.25);d.rotation.set(0,0,0);d.scale.setScalar(1);d.updateMatrix();drain.setMatrixAt(i,d.matrix);}drain.receiveShadow=true;scene.add(drain);
}

function addFurnitureFinish(T,scene){
  // Restrained original procedural wood: long fibres and varying varnish,
  // not a painted-on photograph. Small relief lets daylight reveal the grain.
  const size=256,colorCanvas=document.createElement('canvas'),roughCanvas=document.createElement('canvas');
  colorCanvas.width=colorCanvas.height=roughCanvas.width=roughCanvas.height=size;
  const ctx=colorCanvas.getContext('2d'),rc=roughCanvas.getContext('2d'),rgb=ctx.createImageData(size,size),rdata=rc.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const wave=Math.sin(y*.38+Math.sin(x*.025)*.9)+.4*Math.sin(y*1.7+Math.sin(x*.045)*.7);
    const fine=Math.sin(x*12.9898+y*78.233)*43758.5453,noise=(fine-Math.floor(fine)-.5)*4;
    const i=(y*size+x)*4,v=wave*7+noise;
    rgb.data[i]=141+v;rgb.data[i+1]=105+v*.8;rgb.data[i+2]=70+v*.55;rgb.data[i+3]=255;
    rdata.data[i]=rdata.data[i+1]=rdata.data[i+2]=180+wave*17;rdata.data[i+3]=255;
  }
  ctx.putImageData(rgb,0,0);rc.putImageData(rdata,0,0);
  const map=new T.CanvasTexture(colorCanvas),rough=new T.CanvasTexture(roughCanvas);
  map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=rough.wrapS=rough.wrapT=T.RepeatWrapping;
  scene.traverse(o=>{
    if(!o.isMesh||Array.isArray(o.material))return;
    const m=o.material,hex=m.color?.getHexString();
    if(['896849','b58a52','73674e'].includes(hex)){
      o.material=m.clone();o.material.map=map;o.material.color.set(hex==='b58a52'?'#e6d3b5':'#d8c5aa');
      o.material.roughnessMap=rough;o.material.roughness=.95;o.material.bumpMap=rough;o.material.bumpScale=.008;o.material.metalness=0;
    }else if(hex==='3c5141'){
      o.material=m.clone();o.material.color.set('#38413d');o.material.metalness=.65;o.material.roughness=.56;o.material.roughnessMap=rough;
    }
  });
  const benches=[[-12,20],[12,24],[-28,-12],[9,-30],[-23,43]];
  const seamMat=new T.MeshStandardMaterial({color:'#39291e',roughness:1});
  const seams=new T.InstancedMesh(new T.BoxGeometry(1,1,1),seamMat,24),d=new T.Object3D();let n=0;
  const place=(x,y,z,w,h,depth)=>{d.position.set(x,y,z);d.rotation.set(0,0,0);d.scale.set(w,h,depth);d.updateMatrix();seams.setMatrixAt(n++,d.matrix);};
  for(const [x,z] of benches){
    // Thin join shadows suggest three seat boards and three back slats.
    for(const offset of [-.115,.115])place(x,.726,z+offset,2.98,.001,.009);
    for(const y of [.9,1.1])place(x,y,z-.258,2.98,.008,.002);
  }
  for(const offset of [-.33,0,.33])place(-25,1.131,12+offset,2.98,.001,.007);
  seams.count=n;seams.receiveShadow=true;seams.name='Furniture board joints';scene.add(seams);
  const bolts=new T.InstancedMesh(new T.SphereGeometry(.017,6,4),new T.MeshStandardMaterial({color:'#8e8b80',metalness:.8,roughness:.48}),60);
  let b=0;
  for(const [x,z] of benches)for(const side of [-1.1,1.1]){
    for(const depth of [-.23,0,.23]){d.position.set(x+side,.729,z+depth);d.scale.set(1,.25,1);d.updateMatrix();bolts.setMatrixAt(b++,d.matrix);}
    for(const y of [.8,1,1.2]){d.position.set(x+side,y,z-.255);d.scale.set(1,1,.25);d.updateMatrix();bolts.setMatrixAt(b++,d.matrix);}
  }
  bolts.receiveShadow=true;bolts.name='Bench flush fasteners';scene.add(bolts);
}
