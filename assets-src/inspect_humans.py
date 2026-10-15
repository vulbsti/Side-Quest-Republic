import bpy,math,os,json
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
models=[]
for i,(name,path) in enumerate([('michelle','michelle-source.glb'),('soldier','soldier-source.glb'),('civilian','civilian-source.fbx')]):
 before=set(bpy.data.objects)
 if path.endswith('.glb'):bpy.ops.import_scene.gltf(filepath='/tmp/sqr3d-humans/'+path)
 else:bpy.ops.import_scene.fbx(filepath='/tmp/sqr3d-humans/'+path)
 objs=list(set(bpy.data.objects)-before); roots=[o for o in objs if not o.parent];meshes=[o for o in objs if o.type=='MESH'];bpy.context.scene.frame_set(1);bpy.context.view_layer.update()
 pts=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box];lo=Vector(tuple(min(v[k] for v in pts) for k in range(3)));hi=Vector(tuple(max(v[k] for v in pts) for k in range(3)));scale=1.8/(hi.z-lo.z)
 print(name,'BOUNDS',lo,hi,'meshes',[(o.name,len(o.data.vertices),[m.name for m in o.data.materials]) for o in meshes]);print('BONES',[(o.name,[b.name for b in o.data.bones][:12]) for o in objs if o.type=='ARMATURE'])
 for o in roots:o.scale*=scale;o.location*=scale;o.location.x+=i*2.3;o.location.z-=lo.z*scale
 for o in meshes:
  for p in o.data.polygons:p.use_smooth=True
 models+=objs
bpy.ops.mesh.primitive_plane_add(size=200);bpy.context.object.location.z=-.01
w=bpy.context.scene.world;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(.35,.4,.5,1);w.node_tree.nodes['Background'].inputs[1].default_value=.5
bpy.ops.object.light_add(type='AREA',location=(1,-4,6));bpy.context.object.data.energy=700;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(2.3,-7,2.3));cam=bpy.context.object;cam.rotation_euler=(Vector((2.3,0,1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=42;s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=24;s.render.resolution_x=1600;s.render.resolution_y=700;s.render.resolution_percentage=100;s.render.filepath='/tmp/sqr3d-humans/review.jpg';s.render.image_settings.file_format='JPEG';bpy.ops.render.render(write_still=True)
