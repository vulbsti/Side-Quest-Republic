import assert from 'node:assert/strict';
import * as T from './dist/vendor/three.module.js';
import {spatialBatches} from './dist/spatial-batching.js';
const mat=new T.MeshStandardMaterial(),scene=new T.Scene();
for(const x of [-80,-40,0,40,80]){const m=new T.Mesh(new T.BoxGeometry(4,5,4),mat);m.position.set(x,0,0);scene.add(m);}scene.updateMatrixWorld(true);
const meshes=[...scene.children],batches=spatialBatches(T,meshes),sourceCount=meshes.reduce((n,m)=>n+m.geometry.index.count,0);assert.equal(batches.reduce((n,m)=>n+m.geometry.attributes.position.count,0),sourceCount);assert(batches.length>=5);assert(batches.every(m=>m.material===mat));
function triangles(meshes,bake){const rows=[];for(const m of meshes){const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();if(bake)g.applyMatrix4(m.matrixWorld);const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i+=3)rows.push([0,1,2].map(v=>[p.getX(i+v),p.getY(i+v),p.getZ(i+v),n.getX(i+v),n.getY(i+v),n.getZ(i+v),u.getX(i+v),u.getY(i+v)].join(',')).join('|'));g.dispose();}return rows.sort();}
assert.deepEqual(triangles(batches,false),triangles(meshes,true),'all triangles, normals and UVs unchanged');
const camera=new T.PerspectiveCamera(40,1,.1,20);camera.position.set(0,3,10);camera.lookAt(0,0,0);camera.updateMatrixWorld();const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));assert(batches.some(m=>frustum.intersectsObject(m)));assert(batches.some(m=>!frustum.intersectsObject(m)),'offscreen same-material geometry now culls separately');
assert.throws(()=>spatialBatches(T,meshes,{cellSize:0}));console.log('Spatial batching passed: identical triangle/normal/UV inventory and materials; offscreen cells cull independently.');
