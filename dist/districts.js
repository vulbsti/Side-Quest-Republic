import {SHOP_SOLIDS,FORECOURT_SOLIDS,URBAN_SOLIDS} from './destinations.js?v=17';
/** Fictionalised Delhi-inspired geography; not a surveyed reproduction. */
export const WORLD_BOUNDS=Object.freeze({minX:-90,maxX:90,minZ:-85,maxZ:100,x:[-90,90],z:[-85,100]});
export const DISTRICTS=Object.freeze([
 {id:'cp',name:'CP Colonnades',x:0,z:-38,radius:22,color:'#d5c89a',description:'Shaded arcades and conversations before the crowd gathers.'},
 {id:'jantar',name:'Jantar Mantar',x:24,z:-12,radius:18,color:'#c68968',description:'The observatory edge and the public gathering.'},
 {id:'metro',name:'Rajiv Chowk Exit',x:-14,z:49,radius:15,color:'#7ea69b',description:'Arrivals, departures and the way home.'},
 {id:'connector',name:'People’s Square',x:0,z:15,radius:32,color:'#d5c89a',description:'The stage, friends, chai and the original gathering.'},
 {id:'supply',name:'Seva Camp',x:-60,z:12,radius:19,color:'#91b9a2',description:'First aid, water, rest and a volunteer information desk.'},
 {id:'press',name:'Press Lane',x:58,z:-30,radius:20,color:'#b4bbd1',description:'Camera crews, interview corners and competing accounts.'},
 {id:'court',name:'Civic Court',x:58,z:45,radius:22,color:'#c7b396',description:'Negotiators, instructions and an open public waiting area.'},
 {id:'backstreet',name:'Service Gali',x:-55,z:65,radius:23,color:'#cfaa87',description:'Small shops, deliveries and neighbours with their own day to manage.'},
 {id:'assembly',name:'Assembly Garden',x:0,z:-65,radius:20,color:'#9ead79',description:'New arrivals gather beyond the colonnade.'}
]);
export const STORY_ANCHORS=Object.freeze({
 aidCamp:{x:-60,z:12,district:'supply'},pressLane:{x:58,z:-30,district:'press'},negotiationCourt:{x:58,z:45,district:'court'},backstreet:{x:-55,z:65,district:'backstreet'},assemblyGarden:{x:0,z:-65,district:'assembly'},
 aidDesk:{x:-68,z:8,district:'supply'},waterStore:{x:-66,z:22,district:'supply'},pressDesk:{x:66,z:-28,district:'press'},interviewCorner:{x:63,z:-40,district:'press'},civicDesk:{x:66,z:42,district:'court'},deliveryBay:{x:-65,z:71,district:'backstreet'},arrivalGate:{x:21,z:-69,district:'assembly'},assemblyEast:{x:58,z:-65,district:'assembly'},marketGate:{x:-14,z:72,district:'metro'},marketLane:{x:8,z:83,district:'metro'},danceCourt:{x:22,z:80,district:'metro'},photoCorner:{x:34,z:86.5,district:'court'},voiceBooth:{x:4,z:42.5,district:'metro'}
});
/** Broad navigable loops around existing colonnades, not shortcuts through them. */
export const CONNECTION_ROUTES=Object.freeze([
 {id:'market-west',points:[{x:-14,z:49},{x:-14,z:65},{x:-14,z:79},{x:8,z:83}]},
 {id:'market-east',points:[{x:8,z:83},{x:22,z:80},{x:34,z:78},{x:45,z:65},{x:58,z:45}]},
 {id:'west',points:[{x:-35,z:30},{x:-60,z:30},{x:-60,z:12}]},
 {id:'southwest',points:[{x:-60,z:30},{x:-60,z:47},{x:-55,z:65},{x:-20,z:65},{x:-14,z:49}]},
 {id:'east',points:[{x:39,z:20},{x:58,z:20},{x:58,z:45},{x:58,z:65},{x:15,z:65}]},
 {id:'press',points:[{x:58,z:20},{x:58,z:-30},{x:58,z:-65},{x:0,z:-65}]},
 {id:'northwest',points:[{x:-60,z:30},{x:-65,z:-40},{x:-65,z:-65},{x:0,z:-65}]}
]);
/** Every solid expansion object is registered here so tests and rendering agree. */
export const EXPANSION_SOLIDS=Object.freeze([
 // Existing core furniture rendered in world.js, previously missing collision.
 ...[-36,-12,12,36].flatMap(x=>[-40,39].map(z=>({id:`coreLamp:${x}:${z}`,x,z,w:.24,d:.24,h:5}))),
 ...[-5,5].map(x=>({id:`stageBannerPost:${x}`,x,z:-16,w:.12,d:.12,h:4})),
 {id:'fountainPedestal',x:0,z:24,w:1.8,d:1.8,h:1.45,base:.5},
 {id:'fountainUpperBowl',x:0,z:24,w:2.6,d:2.6,h:1.59,base:1.41},
 ...[3,19].flatMap((z,i)=>[
  {id:`aidTent${i}Back`,x:-74,z:z-4,w:10,d:.12,h:2.85,base:.15},
  {id:`aidTent${i}West`,x:-79,z,w:.12,d:8,h:2.85,base:.15},
  {id:`aidTent${i}East`,x:-69,z,w:.12,d:8,h:2.85,base:.15},
  {id:`aidTent${i}Roof`,x:-74,z,w:10,d:8,h:3.38,base:3.22},
  {id:`aidTent${i}FrontBeam`,x:-74,z:z+4,w:10,d:.16,h:3.3,base:2.8},
  ...[-79,-69].map((x,j)=>({id:`aidTent${i}Post${j}`,x,z:z+4,w:.15,d:.15,h:3.4}))
 ]),
 {id:'aidTable',x:-69,z:5,w:4,d:1.2,h:.9},
 {id:'waterCrates',x:-73,z:24,w:3,d:2,h:1.2},
 {id:'pressVan',x:73,z:-27,w:4,d:9,h:3.2},
 {id:'pressTable',x:67,z:-31,w:4,d:1.2,h:.9},
 {id:'civicOffice',x:76,z:43,w:12,d:20,h:7},
 {id:'civicTable',x:67,z:46,w:4,d:1.2,h:.9},
 ...SHOP_SOLIDS,
 ...URBAN_SOLIDS,
 ...FORECOURT_SOLIDS,
 {id:'deliveryCrates',x:-69,z:73,w:3,d:3,h:1.5},
 {id:'civicBenchA',x:64,z:37,w:3,d:.7,h:.72,walkable:true},
 {id:'civicBenchB',x:64,z:51,w:3,d:.7,h:.72,walkable:true},
 ...Array.from({length:4},(_,i)=>({id:`stagedBarrier${i}`,x:45+i*3.2,z:30,w:2.6,d:.65,h:1.35})),
 {id:'gardenPlanterL',x:-14,z:-74,w:7,d:3,h:.6},
 {id:'gardenPlanterR',x:14,z:-74,w:7,d:3,h:.6}
]);
export function districtAt(x,z){let closest=DISTRICTS[0],distance=Infinity;for(const district of DISTRICTS){const d=Math.hypot(x-district.x,z-district.z);if(d<distance){distance=d;closest=district;}}return closest;}
