import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('dist/main.js','utf8');
const start=source.indexOf('function interactNPC(n)'),end=source.indexOf('if(n.livingActor)',start);
const lines=[];const ctx={say:(_n,line)=>lines.push(line)};vm.createContext(ctx);vm.runInContext(source.slice(start,end)+'}',ctx);
for(const objective of ['scatter-from-line','escort-companion','hold-police-line','film-police-line']){const npc={id:'test',recruited:false,incidentOrder:{objective}};ctx.interactNPC(npc);assert.equal(npc.recruited,false);}
assert(lines.every(l=>!l.includes('Ek gaana')));assert(lines[0].includes('chal'));assert(lines[1].includes('Saath'));
console.log('PASS occupied crisis actors do not enter ordinary recruitment or song dialogue');
