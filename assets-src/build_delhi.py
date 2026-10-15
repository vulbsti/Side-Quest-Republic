import bpy, math, os, random
from mathutils import Vector
random.seed(17)
OUT=os.environ.get('ASSET_OUT','/tmp/sqr3d-delhi/out');os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(n,c,rough=.65,metal=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
ivory=mat('Warm lime plaster',(.86,.80,.65));white=mat('Chalk edges',(.98,.94,.82));red=mat('Delhi vermilion',(.57,.12,.065));red2=mat('Sunlit terracotta',(.72,.22,.12));dark=mat('Deep indigo glass',(.025,.085,.11),.2,.3);green=mat('DTC leaf green',(.18,.47,.055),.32);yellow=mat('Saffron',(.98,.58,.065));rubber=mat('Rubber',(.025,.028,.025));steel=mat('Brushed metal',(.35,.40,.40),.28,.65);wood=mat('Tea stall wood',(.28,.10,.045));blue=mat('Midnight teal',(.03,.20,.22));black=mat('Ink',(.04,.045,.04));cream=mat('Shop canvas',(.95,.78,.46));pink=mat('Bougainvillea',(.68,.07,.25));leaf=mat('Foliage',(.17,.32,.06));stone=mat('Sandstone',(.52,.43,.31))
assets={}
def add(o,n,m):
 o.name=n;o.data.materials.append(m);return o
def cube(n,loc,scale,m,bevel=.03):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);add(o,n,m)
 if bevel: mod=o.modifiers.new('Soft worked edges','BEVEL');mod.width=bevel;mod.segments=2;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 return o
def cyl(n,loc,r,depth,m,verts=24):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc);o=add(bpy.context.object,n,m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def text(n,loc,body,size,m):
 c=bpy.data.curves.new(n,'FONT');c.body=body;c.size=size;c.align_x='CENTER';c.extrude=.004;o=bpy.data.objects.new(n,c);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(math.pi/2,0,0);c.materials.append(m);return o
def mesh(n,verts,faces,m):
 me=bpy.data.meshes.new(n);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);add(o,n,m);return o
def begin():return set(bpy.data.objects)
def finish(name,before):
 objs=list(set(bpy.data.objects)-before)
 for o in objs:
  if o.type=='FONT':bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0]
 bpy.ops.object.convert(target='MESH')
 # Bake bevels and combine by material to keep runtime draw calls low.
 groups={}
 for o in list(bpy.context.selected_objects):groups.setdefault(o.data.materials[0].name,[]).append(o)
 joined=[]
 for material_name,parts in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=name+' / '+material_name;joined.append(o)
 objs=joined
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=OUT+'/'+name+'.glb',export_format='GLB',use_selection=True,export_apply=True)
 assets[name]=objs
 for o in objs:o.hide_render=True;o.hide_set(True)
# CP: deep accessible colonnade with upper windows and parapet
b=begin()
cube('Arcade podium',(0,0,.15),(24,8,.3),stone)
cube('Upper storey',(0,1.6,7.1),(24,4.8,4.4),ivory)
cube('Rear shop wall',(0,3.1,2.7),(24,.3,5),ivory)
for x in range(-11,12,2):
 cyl('Tuscan column',(x,-2.65,2.85),.30,5.1,white)
 for z,r,h in [(.37,.46,.18),(.52,.38,.14),(5.36,.39,.18),(5.52,.47,.16)]:cyl('Column molding',(x,-2.65,z),r,h,white)
 cube('Capital',(x,-2.65,5.68),(.92,.86,.2),white)
for z,d,h in [(5.9,7.7,.38),(6.2,7.85,.15),(9.15,5.8,.24),(9.55,5.7,.15)]:cube('Cornice',(0,.1,z),(24.3,d,h),white)
for i,x in enumerate([-10,-6,-2,2,6,10]):
 cube('Shop recess',(x,2.9,2.4),(3.6,.2,4.2),dark)
 for xx in [x-1.65,x,x+1.65]:cube('Door frame',(xx,2.73,2.35),(.09,.10,3.9),steel)
 cube('Shop header',(x,2.65,4.6),(3.7,.35,.65),blue if i%2 else wood)
 text('Shop lettering',(x,2.43,4.48),['CHAi & CO.','RECORD ROOM','DELHI BOOKS','COFFEE HOUSE','STUDIO 01','CP MARKET'][i],.24,white)
 for wx in [x-.85,x+.85]:
  cube('Window surround',(wx,-.88,7.65),(1.22,.25,1.9),white)
  cube('Window recess',(wx,-1.03,7.65),(.95,.09,1.65),dark)
  cube('Mullion',(wx,-1.10,7.65),(.045,.04,1.65),white)
  cube('Mullion',(wx,-1.10,7.65),(.95,.04,.045),white)
for x in range(-11,12):cube('Parapet baluster',(x,-2.25,9.62),(.18,.25,.7),white)
cube('Parapet rail',(0,-2.25,9.98),(24,.4,.15),white)
finish('cp-colonnade',b)
# Misra Yantra: sculptural nested curved walls ascending towards central stair
b=begin();cube('Instrument plinth',(0,0,.13),(20,14,.26),stone)
for rx,ry in [(9,5.9),(6.9,4.4),(4.7,2.8)]:
 verts=[];N=64
 for j in range(N+1):
  t=2*math.pi*j/N;x=rx*math.cos(t);y=ry*math.sin(t);h=2.5+6.4*((y/ry+1)/2)**1.55
  verts.extend([(x,y,.25),(x,y,h),((rx-.26)*math.cos(t),(ry-.26)*math.sin(t),h),((rx-.26)*math.cos(t),(ry-.26)*math.sin(t),.25)])
 faces=[]
 for j in range(N):
  for a,c in [(0,1),(1,2),(2,3)]:faces.append((j*4+a,(j+1)*4+a,(j+1)*4+c,j*4+c))
 o=mesh('Curved calibrated instrument',verts,faces,red)
 # ivory top strip
 vs=[]
 for j in range(N+1):
  t=2*math.pi*j/N;y=ry*math.sin(t);h=2.5+6.4*((y/ry+1)/2)**1.55+.025
  vs.extend([((rx+.04)*math.cos(t),(ry+.04)*math.sin(t),h),((rx-.30)*math.cos(t),(ry-.30)*math.sin(t),h)])
 mesh('Ivory curved calibration edge',vs,[(2*j,2*j+1,2*j+3,2*j+2) for j in range(N)],white)
# central steep steps across full form
for j in range(36):
 y=-6+j*.34;h=.3+j*.245;cube('Central stone stair',(0,y,h/2),(1.25,.36,h),stone,.01)
for x in [-.81,.81]:
 vs=[(x-.10,-6,.25),(x+.10,-6,.25),(x+.10,6.3,.25),(x-.10,6.3,.25),(x-.10,-6,.75),(x+.10,-6,.75),(x+.10,6.3,9.6),(x-.10,6.3,9.6)]
 mesh('Gnomon stair flank',vs,[(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],red2)
for x in [-7.3,7.3]:
 for j in range(24):
  h=.2+j*.30;cube('Side observation stair',(x,-4.4+j*.40,h/2),(.95,.41,h),stone,.01)
finish('misra-yantra',b)
# Delhi green city bus, longitudinal Y / glTF Z
b=begin();cube('Green rounded chassis',(0,0,1.38),(2.75,9.8,1.85),green,.16);cube('Ivory curved roof',(0,0,3.06),(2.8,9.8,.48),cream,.18)
cube('Window belt',(0,0,2.43),(2.8,9.25,1.05),dark,.10)
for side in [-1,1]:
 for y in [-4.1,-2.9,-1.7,-.5,.7,1.9,3.1,4.3]:cube('Window post',(side*1.42,y,2.46),(.06,.09,1.15),green,.015)
 cube('Lower accent',(side*1.40,0,1.55),(.025,9.6,.16),yellow,.005)
 for y in [-3.25,3.15]:
  o=cyl('Bus tire',(side*1.35,y,.61),.61,.24,rubber,32);o.rotation_euler[1]=math.pi/2
  o=cyl('Wheel hub',(side*1.49,y,.61),.34,.04,steel,24);o.rotation_euler[1]=math.pi/2
  o=cyl('Hub center',(side*1.52,y,.61),.12,.04,black,16);o.rotation_euler[1]=math.pi/2
 # side lettering rotate font face outward
 o=text('Transit side title',(side*1.425,0,1.03),'DELHI TRANSIT',.32,white);o.rotation_euler=(math.pi/2,0,side*math.pi/2)
cube('Windshield',(0,-4.93,2.42),(2.35,.06,.96),dark,.12)
cube('Route board',(0,-4.96,3.03),(2.2,.06,.28),black,.02);text('Route text',(0,-5.005,2.96),'CP  •  CENTRAL DELHI',.14,yellow)
for x in [-.99,.99]:
 cube('Headlamp',(x,-4.95,1.1),(.43,.09,.27),white,.07)
 cube('Mirror stalk',(x*1.55,-4.25,2.4),(.1,.55,.09),black)
 cube('Mirror',(x*1.62,-4.5,2.4),(.19,.13,.42),black,.04)
cube('Front bumper',(0,-4.98,.68),(2.65,.12,.20),steel)
for z in [.85,1.01,1.17]:cube('Vent grille',(0,-4.95,z),(1.15,.05,.04),black,.005)
cube('License plate',(0,-5.04,.70),(.58,.025,.18),yellow,.01)
finish('delhi-bus',b)
# Chai cart with kettle cups and striped canvas
b=begin();cube('Cart body',(0,0,.95),(2.3,1.2,1.1),blue,.06);cube('Wood counter',(0,0,1.56),(2.7,1.5,.14),wood,.03)
for x in [-1,1]:
 for y in [-.48,.48]:
  o=cyl('Cart wheel',(x,y,.26),.26,.10,rubber);o.rotation_euler[0]=math.pi/2
  cyl('Awning post',(x,y,2.22),.04,1.55,steel,12)
for i in range(10):cube('Striped canvas',(-1.35+i*.3,0,3),( .30,1.9,.12),yellow if i%2 else cream,.02)
cube('Front sign',(0,-.64,1.1),(1.9,.06,.5),cream);text('Chai lettering',(0,-.69,.98),'CHAI  /  10',.30,wood)
cyl('Kettle base',(-.65,0,1.85),.26,.45,steel);cyl('Kettle lid',(-.65,0,2.1),.29,.055,steel)
bpy.ops.mesh.primitive_torus_add(major_radius=.22,minor_radius=.035,major_segments=20,minor_segments=8,location=(-.65,.17,1.96),rotation=(math.pi/2,0,0));add(bpy.context.object,'Kettle handle',steel)
for x in [.15,.45,.75]:
 for y in [-.3,.1]:cyl('Terracotta cup',(x,y,1.72),.095,.19,red2,16)
cube('Biscuit jar',(.8,.40,1.91),(.3,.25,.53),cream,.05)
finish('chai-cart',b)
b=begin()
for x in [-1.3,1.3]:cube('Barricade foot',(x,0,.08),(.18,.85,.16),yellow);cube('Upright',(x,0,.75),(.10,.10,1.5),yellow)
for z in [.35,1.4]:cube('Rail',(0,0,z),(2.8,.10,.10),yellow)
for x in [-1,-.75,-.5,-.25,0,.25,.5,.75,1]:cube('Grille',(x,0,.87),(.035,.06,1.02),yellow,.005)
cube('Sign plate',(0,-.07,.91),(1.65,.05,.48),red);text('Police sign',(0,-.105,.85),'DELHI POLICE',.18,white)
finish('barricade',b)
# Hero composition, independent original art; camera uses actual game assets
for name,loc,rot in [('cp-colonnade',(0,10,0),0),('misra-yantra',(-19,1,0),0),('delhi-bus',(12,-4,0),-.28),('chai-cart',(-4,-7,0),0),('barricade',(4,-8,0),.12)]:
 for o in assets[name]:
  o.hide_set(False);o.hide_render=False
  # rotate around shared asset origin
  x,y,z=o.location; o.location=(x*math.cos(rot)-y*math.sin(rot)+loc[0],x*math.sin(rot)+y*math.cos(rot)+loc[1],z+loc[2]);o.rotation_euler[2]+=rot
cube('Plaza',(0,0,-.15),(95,80,.25),stone,.01)
for x in range(-40,41,4):cube('Paving seams',(x,0,-.012),(.025,80,.015),ivory,0)
for y in range(-35,36,4):cube('Paving seams',(0,y,-.01),(90,.025,.015),ivory,0)
for x,y in [(-30,9),(22,8),(28,-2),(-8,17)]:
 cyl('Tree trunk',(x,y,3),.4,6,wood,12)
 for i in range(7):
  bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=2.5,location=(x+random.uniform(-2,2),y+random.uniform(-2,2),6+random.uniform(0,2)));add(bpy.context.object,'Canopy',leaf)
world=bpy.context.scene.world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.38,.54,.68,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
bpy.ops.object.light_add(type='SUN',location=(0,0,20));sun=bpy.context.object;sun.rotation_euler=(.5,-.55,-.55);sun.data.energy=3;sun.data.angle=.12
bpy.ops.object.light_add(type='AREA',location=(0,-10,20));bpy.context.object.data.energy=1800;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=20
bpy.ops.object.camera_add(location=(31,-39,23));cam=bpy.context.object;cam.rotation_euler=(Vector((0,2,3))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='PERSP';cam.data.lens=40
sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=48
try:
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='CUDA';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='CUDA'
 sc.cycles.device='GPU'
except:pass
sc.render.resolution_x=1600;sc.render.resolution_y=900;sc.render.resolution_percentage=100;sc.render.image_settings.file_format='JPEG';sc.render.image_settings.quality=93;sc.render.filepath=OUT+'/delhi-title.jpg';sc.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/delhi-assets.blend');bpy.ops.render.render(write_still=True)
print('ASSETS_READY',OUT)
