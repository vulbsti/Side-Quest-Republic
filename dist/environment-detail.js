import { RGBELoader } from './assets/materials/RGBELoader.js?v=27';
/** Apply only to the static world, BEFORE characters are created. */
export async function enhanceEnvironment(THREE, world) {
  const {scene,renderer,sun}=world, loader=new THREE.TextureLoader();
  const base='./assets/materials/';
  const report={loaded:[],failed:[],surfaces:0,foliage:0};
  const sets={};
  await Promise.all(['asphalt_02','cobblestone_floor_08'].map(async name=>{
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
  scene.fog=new THREE.Fog('#c5cbd0',180,520);
  renderer.toneMappingExposure=1.02;
  if(sun){sun.color.set('#fff3dd');sun.intensity=2.45;sun.shadow.normalBias=.035;}
  scene.traverse(o=>{if(o.isHemisphereLight){o.color.set('#d8e3ef');o.groundColor.set('#898079');o.intensity=.65;}else if(o.isDirectionalLight&&o!==sun){o.color.set('#d4e4f1');o.intensity=.25;}});
  // The city's ground materials get photographic asphalt and stone (its UVs are already in metres).
  const swap={Asphalt:['asphalt_02','#9a9a96',.4],Paving:['cobblestone_floor_08','#d8d2c6',.45],Parking:['asphalt_02','#b8b4aa',.4]};
  scene.traverse(o=>{
    if(!o.isMesh||Array.isArray(o.material))return;
    const m=o.material,s=swap[m.name];
    if(!s||!sets[s[0]]||m.userData.photo)return;
    Object.assign(m,sets[s[0]]);m.color.set(s[1]);m.normalScale.set(s[2],s[2]);m.envMapIntensity=.6;m.userData.photo=true;m.needsUpdate=true;report.surfaces++;
  });
  world.setEnvironmentQuality=(mode='high')=>{report.quality=mode;};
  world.environmentReport=report;return report;
}
