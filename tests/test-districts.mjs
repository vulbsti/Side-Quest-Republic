import assert from 'node:assert/strict';
import {WORLD_BOUNDS as b,DISTRICTS,STORY_ANCHORS,CONNECTION_ROUTES,EXPANSION_SOLIDS,districtAt} from '../dist/districts.js';
const inside=p=>p.x>b.minX&&p.x<b.maxX&&p.z>b.minZ&&p.z<b.maxZ;
const blocked=(p,r=.7)=>EXPANSION_SOLIDS.some(o=>(o.base||0)<1.8&&Math.abs(p.x-o.x)<o.w/2+r&&Math.abs(p.z-o.z)<o.d/2+r);
assert.equal(new Set(DISTRICTS.map(d=>d.id)).size,9);
for(const [id,p] of Object.entries(STORY_ANCHORS)){assert.ok(inside(p),`${id}: in world`);assert.ok(!blocked(p),`${id}: clear interaction radius`);}
for(const route of CONNECTION_ROUTES){for(let i=1;i<route.points.length;i++){const a=route.points[i-1],c=route.points[i],n=Math.ceil(Math.hypot(c.x-a.x,c.z-a.z)*2);for(let j=0;j<=n;j++){const p={x:a.x+(c.x-a.x)*j/n,z:a.z+(c.z-a.z)*j/n};assert.ok(inside(p));assert.ok(!blocked(p,1.1),`${route.id}: clear pedestrian corridor at ${JSON.stringify(p)}`);}}}
for(const d of DISTRICTS)assert.equal(districtAt(d.x,d.z).id,d.id);
console.log(`Districts: ${Object.keys(STORY_ANCHORS).length} story anchors and ${CONNECTION_ROUTES.length} connected corridors clear; bounds and classification pass.`);
