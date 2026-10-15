/** Shared camera-oriented map projection. No DOM access at module import.
 * Camera forward is (-sin(yaw), -cos(yaw)); player facing is
 * (sin(player.yaw), cos(player.yaw)). All coordinates are CSS-independent
 * canvas pixel coordinates: convert pointer CSS coordinates before inverse.
 */
export function createMapTransform({player={x:0,z:0},yaw=0,size=190,range=34}={}) {
  const px=player.x,pz=player.z,c=Math.cos(yaw),s=Math.sin(yaw);
  const center=size/2,scale=(size*.44)/range;
  function worldToMap(point,z) {
    const x=typeof point==='number'?point:point.x;
    const wz=typeof point==='number'?z:point.z;
    const dx=x-px,dz=wz-pz;
    return {x:center+(c*dx-s*dz)*scale,y:center+(s*dx+c*dz)*scale};
  }
  function mapToWorld(point,y) {
    const mx=typeof point==='number'?point:point.x,my=typeof point==='number'?y:point.y;
    const u=(mx-center)/scale,v=(my-center)/scale;
    return {x:px+c*u+s*v,z:pz-s*u+c*v};
  }
  return {worldToMap,mapToWorld,size,range,center,scale,yaw,player:{x:px,z:pz}};
}
/** Returns the exact transform used for this rendered frame. Store that return
 * value for clicks, rather than rebuilding it from a newer camera position. */
export function drawMinimap(canvas,{player,yaw=0,obstacles=[],items=[],npcs=[],police=[],landmarks=[],target=null,route=[],range=34}={}) {
  const a=canvas.getContext('2d'),size=canvas.width;
  const t=createMapTransform({player,yaw,size,range}),mid=size/2,pad=7,rad=mid-pad;
  const project=p=>t.worldToMap(p);
  a.clearRect(0,0,canvas.width,canvas.height);
  a.save();a.beginPath();a.arc(mid,mid,rad,0,Math.PI*2);a.clip();
  a.fillStyle='#172a2d';a.fillRect(0,0,size,size);
  // Physical streets use world geometry and the same projection as objects.
  function polygon(points,fill,stroke){a.beginPath();points.forEach((p,i)=>{const q=project(p);i?a.lineTo(q.x,q.y):a.moveTo(q.x,q.y)});a.closePath();if(fill){a.fillStyle=fill;a.fill();}if(stroke){a.strokeStyle=stroke;a.stroke();}}
  polygon([{x:-55,z:-7.5},{x:55,z:-7.5},{x:55,z:7.5},{x:-55,z:7.5}],'#415054');
  polygon([{x:32.5,z:-65},{x:45.5,z:-65},{x:45.5,z:65},{x:32.5,z:65}],'#415054');
  for(const o of obstacles){
    if(o.w<.5&&o.d<.5)continue;
    polygon([{x:o.x-o.w/2,z:o.z-o.d/2},{x:o.x+o.w/2,z:o.z-o.d/2},{x:o.x+o.w/2,z:o.z+o.d/2},{x:o.x-o.w/2,z:o.z+o.d/2}],o.h>4?'#a5aaa4':'#6b7771');
  }
  if(route.length){a.beginPath();const start=project(player);a.moveTo(start.x,start.y);for(const p of route){const q=project(p);a.lineTo(q.x,q.y);}a.strokeStyle='#f0d284';a.lineWidth=2;a.setLineDash([4,3]);a.stroke();a.setLineDash([]);}
  function dot(p,color,r=3,shape='circle'){
    const q=project(p);if(Math.hypot(q.x-mid,q.y-mid)>rad-4)return;
    a.fillStyle=color;a.strokeStyle='#112126';a.lineWidth=1.2;a.beginPath();
    if(shape==='square')a.rect(q.x-r,q.y-r,r*2,r*2);else a.arc(q.x,q.y,r,0,Math.PI*2);a.fill();a.stroke();
  }
  for(const it of items)if(!it.held&&!it.delivered&&it.model?.visible!==false)dot(it,it.type==='phone'?'#7dd9fa':it.type==='key'?'#ffc75c':'#f1e1b4',2.5,'square');
  for(const n of npcs)if(!n.hidden&&!n.ambient)dot(n,n.police?'#e0a76f':n.id==='info'?'#7dd9fa':'#b5ed8d',3);
  for(const p of police)dot(p,p.state==='chase'?'#ff655c':p.state==='notice'?'#ffc75c':'#ce9c7b',2.5);
  const labels=[{x:0,z:-43,name:'CP'},{x:24,z:-29,name:'JM'},{x:-14,z:49,name:'M'}];
  for(const l of labels){const q=project(l);if(Math.hypot(q.x-mid,q.y-mid)<rad-12){a.font=`bold ${size*.052}px sans-serif`;a.textAlign='center';a.textBaseline='middle';a.strokeStyle='#122127';a.lineWidth=3;a.strokeText(l.name,q.x,q.y);a.fillStyle=l.name==='M'?'#a1e6b0':'#f2ede1';a.fillText(l.name,q.x,q.y);}}
  for(const l of landmarks){if(l.visited)continue;const q=project(l);if(Math.hypot(q.x-mid,q.y-mid)<rad-10){a.strokeStyle='#92b9c8';a.lineWidth=1;a.beginPath();a.arc(q.x,q.y,4,0,Math.PI*2);a.stroke();}}
  // Destination pin remains visible at the rim if it is beyond map range.
  const goal=target||route[route.length-1];
  if(goal){const q=project(goal),dx=q.x-mid,dy=q.y-mid,d=Math.hypot(dx,dy),limit=rad-13,k=d>limit?limit/d:1;
    a.save();a.translate(mid+dx*k,mid+dy*k);a.rotate(Math.atan2(dy,dx)+Math.PI/2);a.fillStyle='#ffe08a';a.strokeStyle='#332a16';a.lineWidth=1.5;a.beginPath();a.moveTo(0,-6);a.lineTo(4,4);a.lineTo(0,2);a.lineTo(-4,4);a.closePath();a.fill();a.stroke();a.restore();
  }
  // Actual character orientation, independent of the camera's current yaw.
  const facing=player.yaw??Math.PI;
  const tip=project({x:player.x+Math.sin(facing),z:player.z+Math.cos(facing)});
  a.save();a.translate(mid,mid);a.rotate(Math.atan2(tip.y-mid,tip.x-mid)+Math.PI/2);
  a.fillStyle='#ffffff';a.strokeStyle='#15262c';a.lineWidth=2;a.beginPath();a.moveTo(0,-7);a.lineTo(5,5);a.lineTo(0,2);a.lineTo(-5,5);a.closePath();a.fill();a.stroke();a.restore();
  a.restore();
  // North is fixed world -Z, rotated onto the border by the same transform.
  a.strokeStyle='#a5bcb1';a.lineWidth=1.5;a.beginPath();a.arc(mid,mid,rad,0,Math.PI*2);a.stroke();
  const north=project({x:player.x,z:player.z-1}),nx=north.x-mid,ny=north.y-mid,nd=Math.hypot(nx,ny);
  const ax=mid+nx/nd*(rad-2),ay=mid+ny/nd*(rad-2);
  a.fillStyle='#172a2d';a.beginPath();a.arc(ax,ay,8,0,Math.PI*2);a.fill();a.font=`bold ${size*.055}px sans-serif`;a.textAlign='center';a.textBaseline='middle';a.fillStyle='#ffffff';a.fillText('N',ax,ay);
  canvas.title='Camera-up map · N north · green people · amber police · squares objects · gold arrow destination. Click to walk.';
  return t;
}
