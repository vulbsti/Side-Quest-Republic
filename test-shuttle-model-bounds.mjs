import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createTransit} from './dist/transit.js';
const temp=await mkdtemp(join(tmpdir(),'shuttle-bounds-'));
try{
 const url=name=>pathToFileURL(join(temp,name)).href;
 await writeFile(join(temp,'three.mjs'),await readFile('dist/vendor/three.module.js'));
 const three=await import(url('three.mjs'));
 const utils=(await readFile('dist/vendor/BufferGeometryUtils.js','utf8')).replace("from 'three'",`from '${url('three.mjs')}'`);
 await writeFile(join(temp,'BufferGeometryUtils.mjs'),utils);
 // Use production geometry helpers verbatim, omitting unrelated world builders.
 let helpers=(await readFile('dist/world.js','utf8')).split('function texture(kind)')[0];
 helpers=helpers.replace(/^import .*;\n/gm,'');
 helpers=`import * as THREE from '${url('three.mjs')}';\n`+helpers;
 await writeFile(join(temp,'world.mjs'),helpers);
 const source=(await readFile('dist/shuttle-model.js','utf8')).replace(/'\.\/world\.js(?:\?[^']*)?'/,"'./world.mjs'").replace(/'\.\/vendor\/BufferGeometryUtils\.js(?:\?[^']*)?'/,"'./BufferGeometryUtils.mjs'");
 await writeFile(join(temp,'shuttle-model.mjs'),source);
 globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 const {buildShuttleModel}=await import(url('shuttle-model.mjs'));
 for(const bus of createTransit().buses){
  const model=buildShuttleModel(bus);model.g.updateMatrixWorld(true);
  const bounds=new three.Box3().setFromObject(model.g),size=bounds.getSize(new three.Vector3());
  console.log(bus.id,'measured metres',JSON.stringify({width:size.x,height:size.y,length:size.z,min:bounds.min,max:bounds.max}));
  assert(bounds.min.x>=-1.25-1e-5&&bounds.max.x<=1.25+1e-5,'mesh width fits centred physical bus envelope');
  assert(bounds.min.z>=-4.25-1e-5&&bounds.max.z<=4.25+1e-5,'mesh length fits centred physical bus envelope');
  assert(bounds.min.y>=-1e-5,'tyres rest above road');
  assert(size.y>2.8&&size.y<3.3,'shuttle height plausible');
  assert.equal(model.wheels.length,4);
  model.door.visible=false;
  assert(new three.Box3().setFromObject(model.door).max.x<=1.25+1e-5,'open door has no protruding geometry');
 }
 console.log('PASS: production shuttle geometry fits collision envelope');
}finally{await rm(temp,{recursive:true,force:true});}
