/** Presentation only. Markers never grant completion, move actors, or infer success. */
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const ended=new Set(['completed','abandoned','failed','expired','cancelled']);
export function createStoryTaskVisuals(THREE,scene){
 const ringGeometry=new THREE.RingGeometry(.72,.88,40);
 const ringMaterial=new THREE.MeshBasicMaterial({color:0xffbd59,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false});
 const propGeometry=new THREE.BoxGeometry(.7,.32,.42);
 const propMaterial=new THREE.MeshStandardMaterial({color:0xc78231,roughness:.85,metalness:.15});
 const root=new THREE.Group();root.name='story-task-markers';scene.add(root);
 const rings=Array.from({length:3},(_,i)=>{const mesh=new THREE.Mesh(ringGeometry,ringMaterial);mesh.name=i?'story-task-companion':'story-task-destination';mesh.rotation.x=-Math.PI/2;mesh.renderOrder=2;mesh.visible=false;root.add(mesh);return mesh;});
 const toolbox=new THREE.Mesh(propGeometry,propMaterial);toolbox.name='story-task-mic-toolbox';toolbox.visible=false;root.add(toolbox);
 let disposed=false;
 function update(projection,bodies=[],{micPoint}={}){
  if(disposed)return;
  for(const mesh of root.children)mesh.visible=false;
  const objective=projection?.objective,task=projection?.state?.task||projection?.task;
  if(!objective||ended.has(objective.status)||ended.has(task?.status))return;
  if(finite(objective.target)){
   rings[0].visible=true;rings[0].position.set(objective.target.x,.075,objective.target.z);rings[0].scale.set(1.7,1.7,1.7);
  }
  const ids=Array.from(new Set(projection.reservedActorIds||[]));
  const actors=Array.isArray(bodies)?bodies:Object.values(bodies||{});
  let slot=1;
  for(const id of ids){
   if(slot>=rings.length)break;
   const actor=actors.find(body=>body.id===id),position=finite(actor)?actor:actor?.position;
   if(!finite(position))continue;
   rings[slot].visible=true;rings[slot].position.set(position.x,.07,position.z);rings[slot].scale.set(1,1,1);slot++;
  }
  const kind=objective.kind||task?.kind;
  if(kind==='mic'||kind==='mic-repair'){
   const point=finite(micPoint)?micPoint:objective.target;
   if(finite(point)){toolbox.visible=true;toolbox.position.set(point.x+.65,.16,point.z+.4);}
  }
 }
 function dispose(){if(disposed)return;disposed=true;scene.remove(root);ringGeometry.dispose();ringMaterial.dispose();propGeometry.dispose();propMaterial.dispose();}
 return {update,dispose};
}
