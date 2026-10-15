/** Bake static geometry into local material/cell batches. Triangle-centroid
 * assignment preserves every triangle and attribute; no simplification or LOD.
 * Long triangles remain intact, so cells may extend beyond their nominal edge.
 */
export function spatialBatches(T,meshes,{cellSize=24}={}){
 if(!Number.isFinite(cellSize)||cellSize<=0)throw new RangeError('Positive cellSize required');
 const groups=new Map();
 for(const mesh of meshes){if(!mesh.isMesh||mesh.isSkinnedMesh||Array.isArray(mesh.material))continue;
  const indexed=mesh.geometry.clone();let g=indexed.index?indexed.toNonIndexed():indexed;if(g!==indexed)indexed.dispose();g.applyMatrix4(mesh.matrixWorld);
  if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  const names=Object.keys(g.attributes).sort(),signature=names.map(n=>`${n}:${g.attributes[n].itemSize}:${g.attributes[n].normalized}`).join('|'),p=g.attributes.position;
  const scale=mesh.material.userData?.worldScale;
  if(scale){const n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));uv.setXY(i,(ay>=ax&&ay>=az?p.getX(i):ax>az?p.getZ(i):p.getX(i))/scale,(ay>=ax&&ay>=az?p.getZ(i):p.getY(i))/scale);}}
  for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3,key=mesh.material.uuid+':'+Math.floor(x/cellSize)+','+Math.floor(z/cellSize)+':'+signature;
   let b=groups.get(key);if(!b){b={material:mesh.material,attrs:Object.fromEntries(names.map(n=>[n,{size:g.attributes[n].itemSize,normalized:false,type:Float32Array,values:[]}]))};groups.set(key,b);}
   for(const name of names){const a=g.attributes[name],out=b.attrs[name].values;for(let v=i;v<i+3;v++)for(let c=0;c<a.itemSize;c++)out.push(a.getComponent(v,c));}
  }g.dispose();
 }
 return [...groups.values()].map(b=>{const g=new T.BufferGeometry();for(const [name,a]of Object.entries(b.attrs))g.setAttribute(name,new T.BufferAttribute(new a.type(a.values),a.size,a.normalized));g.computeBoundingSphere();g.computeBoundingBox();const m=new T.Mesh(g,b.material);m.castShadow=m.receiveShadow=true;m.name='Spatial static batch';return m;});
}
