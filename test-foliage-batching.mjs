import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from './dist/vendor/three.module.js';
const made=[];class InstancedMesh extends THREE.InstancedMesh{constructor(...args){super(...args);made.push(this);}}
const T={...THREE,InstancedMesh},source=fs.readFileSync('dist/environment-detail.js','utf8'),ctx={};vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function addFoliage('),source.indexOf('function addStreetDetail('))+'\nthis.build=addFoliage;',ctx);
const scene=new THREE.Scene(),foliage=ctx.build(T,scene,null),original=made[0],a=new THREE.Matrix4(),b=new THREE.Matrix4(),ca=new THREE.Color(),cb=new THREE.Color();
assert.equal(foliage.count,21080);assert.equal(scene.children.length,34);
for(let i=0;i<34;i++)for(let k=0;k<620;k++){original.getMatrixAt(k*34+i,a);scene.children[i].getMatrixAt(k,b);assert.deepEqual(a.elements,b.elements);original.getColorAt(k*34+i,ca);scene.children[i].getColorAt(k,cb);assert(ca.equals(cb));}
assert(scene.children.every(t=>t.boundingSphere.radius<7));foliage.count=34*280;assert.equal(foliage.count,9520);assert(scene.children.every(t=>t.count===280));foliage.castShadow=false;assert(scene.children.every(t=>!t.castShadow));foliage.count=34*620;assert.equal(foliage.count,21080);
console.log('Foliage batching passed: 21,080 exact matrices/colors preserved,34 bounded tree batches, balanced/high capacity and shadow toggle retained.');
