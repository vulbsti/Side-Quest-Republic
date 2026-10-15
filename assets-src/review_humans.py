import bpy,math,os
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for i,name in enumerate(['male','female','officer']):
 before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath='/tmp/sqr3d-humans/final/'+name+'.glb');objs=set(bpy.data.objects)-before;rig=next(o for o in objs if o.type=='ARMATURE')
 print('ACTIONS',[(a.name,a.frame_range[:]) for a in bpy.data.actions],flush=True)
 if rig.animation_data:
  for tr in rig.animation_data.nla_tracks:tr.mute=True
  action=next((a for a in bpy.data.actions if a.name.split('.')[0]=='Idle'),None)
  rig.animation_data.action=action
  if action:rig.animation_data.action_slot=action.slots[0]
 roots=[o for o in objs if not o.parent]
 for o in roots:o.location.x+=i*1.3
 bpy.context.scene.frame_set(8)
bpy.ops.mesh.primitive_plane_add(size=200);bpy.context.object.location.z=-.015
w=bpy.context.scene.world;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(.35,.4,.5,1);w.node_tree.nodes['Background'].inputs[1].default_value=.5
bpy.ops.object.light_add(type='AREA',location=(1,-4,6));bpy.context.object.data.energy=700;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=5
bpy.ops.object.camera_add(location=(1.3,-5.8,2.1));cam=bpy.context.object;cam.rotation_euler=(Vector((1.3,0,1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=55;s=bpy.context.scene;s.camera=cam;s.render.engine='CYCLES';s.cycles.samples=24;s.render.resolution_x=1400;s.render.resolution_y=900;s.render.resolution_percentage=100;s.render.filepath='/tmp/sqr3d-humans/final/humans-review.jpg';s.render.image_settings.file_format='JPEG';bpy.ops.render.render(write_still=True)
