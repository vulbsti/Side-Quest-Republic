import assert from 'node:assert/strict';
import {createStoryTaskVisuals} from './dist/story-task-visuals.js';
class Disposable{dispose(){this.disposed=(this.disposed||0)+1;}}
class Group{constructor(){this.children=[];}add(o){this.children.push(o);}remove(o){this.children=this.children.filter(c=>c!==o);}}
class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.rotation={};this.position={set(x,y,z){Object.assign(this,{x,y,z});}};this.scale={set(x,y,z){Object.assign(this,{x,y,z});}};}}
const THREE={Group,Mesh,RingGeometry:Disposable,BoxGeometry:Disposable,MeshBasicMaterial:Disposable,MeshStandardMaterial:Disposable,DoubleSide:2};
const scene=new Group(),visuals=createStoryTaskVisuals(THREE,scene),root=scene.children[0];
assert.equal(root.children.length,4,'Hard bounded mesh population');
const projection={objective:{kind:'mic',target:{x:10,z:5}},reservedActorIds:['a','b','c','a']},bodies=[{id:'a',x:1,z:2},{id:'b',position:{x:3,z:4}},{id:'c',x:5,z:6}];
const before=JSON.stringify({projection,bodies});
visuals.update(projection,bodies,{micPoint:{x:7,z:8}});
assert.equal(root.children.filter(c=>c.visible).length,4);
assert.equal(root.children[1].position.x,1);assert.equal(root.children[2].position.x,3);
assert.equal(root.children[3].position.x,7.65);
assert.equal(JSON.stringify({projection,bodies}),before,'No state mutation');
visuals.update({objective:{target:{x:10,z:5},status:'completed'},reservedActorIds:['a']},bodies);
assert.equal(root.children.some(c=>c.visible),false,'No stale completion marker');
visuals.update({objective:{target:{x:NaN,z:5}},reservedActorIds:['missing']},bodies);
assert.equal(root.children.some(c=>c.visible),false);
visuals.update(projection,bodies);visuals.update(null,bodies);
assert.equal(root.children.some(c=>c.visible),false,'Absent task clears markers');
visuals.dispose();visuals.dispose();assert.equal(scene.children.length,0);
for(const mesh of root.children){assert.equal(mesh.geometry.disposed,1);assert.equal(mesh.material.disposed,1);}
visuals.update(projection,bodies);assert.equal(scene.children.length,0);
console.log('Story task visuals: bounded markers, companion position, mic-only prop, stale cleanup and idempotent disposal passed');
