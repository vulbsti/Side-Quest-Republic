import bpy,sys,os,json,glob,math
sys.path.insert(0,'/tmp/sqr3d-humans/mpfb2-2.0.18/src')
bpy.utils.extension_path_user=lambda *a,**kw:'/tmp/sqr3d-humans/mpfb-user'
import mpfb
bpy.context.preferences.addons.new().module="mpfb"
mpfb.register()
from mpfb.services.humanservice import HumanService
from mpfb.services.targetservice import TargetService
from mpfb.services.exportservice import ExportService
from mpfb.services.objectservice import ObjectService
from mpfb.entities.objectproperties import HumanObjectProperties
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
b=HumanService.create_human();print('CREATED',b.name)
print(TargetService.get_default_macro_info_dict())
print('DONE_BASIC')
from mathutils import Vector,Quaternion
ASSETS='/tmp/sqr3d-humans/mh-assets';OUT='/tmp/sqr3d-humans/final';os.makedirs(OUT,exist_ok=True)
def find(name):return glob.glob(ASSETS+'/**/'+name,recursive=True)[0]
# initial diagnostic mesh is removed
bpy.data.objects.remove(b,do_unlink=True)
for variant,gender,clothing,hair in [('male',1.0,'male_casualsuit02','short02'),('female',0.0,'female_casualsuit01','ponytail01'),('officer',1.0,'male_casualsuit03','short02')]:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 macro=TargetService.get_default_macro_info_dict();macro.update(gender=gender,age=.5,muscle=.5,weight=.45,height=.52);macro['race']={'asian':.45,'african':.25,'caucasian':.3}
 b=HumanService.create_human(macro_detail_dict=macro)
 HumanService.set_character_skin(find('young_asian_'+('male' if gender else 'female')+'.mhmat'),b,skin_type='GAMEENGINE')
 rig=HumanService.add_builtin_rig(b,'mixamo');print('RIG',variant,[p.name for p in rig.pose.bones],flush=True)
 for typ,name in [('Eyes','low-poly'),('Eyebrows','eyebrow001'),('Hair',hair),('Clothes',clothing),('Clothes','shoes01')]:
  HumanService.add_mhclo_asset(find(name+'.mhclo'),b,asset_type=typ,subdiv_levels=0,material_type='GAMEENGINE')
 root=ExportService.create_character_copy(b,name_suffix='_game');base=ObjectService.find_object_of_type_amongst_nearest_relatives(root,'Basemesh');ExportService.bake_modifiers_remove_helpers(base,bake_masks=True,bake_subdiv=True,remove_helpers=True,also_proxy=True)
 keep=[root]+ObjectService.get_list_of_children(root)
 for ob in list(bpy.data.objects):
  if ob not in keep:bpy.data.objects.remove(ob,do_unlink=True)
 rig=next(o for o in keep if o.type=='ARMATURE')
 for o in keep:
  if o.type=='MESH':
   for poly in o.data.polygons:poly.use_smooth=True
   for m in o.data.materials:
    if not m or not m.use_nodes:continue
    for n in m.node_tree.nodes:
     if n.type=='TEX_IMAGE' and n.image:
      if max(n.image.size)>1024:n.image.scale(1024,1024)
    p=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if p:
     p.inputs['Roughness'].default_value=.85
     if not any(v in m.name.lower() for v in ['short02','ponytail','eyebrow']):
      for link in list(p.inputs['Alpha'].links):m.node_tree.links.remove(link)
      p.inputs['Alpha'].default_value=1

    if clothing in m.name:
     m.name='UniformFabric' if variant=='officer' else 'CivilianClothing'
     if variant=='officer' and p:
      for link in list(p.inputs['Base Color'].links):m.node_tree.links.remove(link)
      p.inputs['Base Color'].default_value=(.48,.38,.24,1)
 # canonical skeleton names with no namespace, convenient runtime lookup
 for bone in rig.data.bones:bone.name=bone.name.replace('mixamorig:','').replace('mixamorig','')
 def bone(n):return rig.pose.bones.get(n)
 def rotate(n,axes):
  p=bone(n)
  if not p:return
  rest=p.bone.matrix_local.to_quaternion();q=Quaternion()
  for axis,angle in axes:q=Quaternion(axis,angle)@q
  p.rotation_mode='QUATERNION';p.rotation_quaternion=rest.inverted()@q@rest
 # Author complete body skeletal loops (no extracted third party animation data).
 for clip,duration,steps in [('Idle',2.4,48),('Walk',1.0,30),('Run',.65,24),('Wave',2.0,48),('Carry',1.0,30),('Jump',1.0,24)]:
  rig.animation_data_create();action=bpy.data.actions.new(clip);rig.animation_data.action=action
  for f in range(steps+1):
   phase=f/steps*2*math.pi;moving=clip in ['Walk','Run','Carry'];running=clip=='Run';amp=.72 if running else .40;sw=math.sin(phase)*(amp if moving else .015)
   for p in rig.pose.bones:p.location=(0,0,0);p.rotation_mode='QUATERNION';p.rotation_quaternion=Quaternion()
   rotate('LeftArm',[((0,1,0),.48),((1,0,0),sw*.8)])
   rotate('RightArm',[((0,1,0),-.48),((1,0,0),-sw*.8)])
   rotate('LeftForeArm',[((1,0,0),.68-(.75 if running else 0))]);rotate('RightForeArm',[((1,0,0),.68-(.75 if running else 0))])
   rotate('LeftUpLeg',[((1,0,0),-sw)]);rotate('RightUpLeg',[((1,0,0),sw)])
   rotate('LeftLeg',[((1,0,0),max(0,-math.sin(phase))*(1.05 if running else .65))]);rotate('RightLeg',[((1,0,0),max(0,math.sin(phase))*(1.05 if running else .65))])
   rotate('Spine2',[((0,0,1),math.sin(phase)*(.055 if moving else .012)),((1,0,0),.08 if running else .01)])
   rotate('Head',[((0,0,1),math.sin(phase)*.025)])
   if clip=='Wave':rotate('RightArm',[((0,1,0),-.2),((0,0,1),-.4)]);rotate('RightForeArm',[((0,0,1),1.5),((1,0,0),math.sin(phase*2)*.3)])
   if clip=='Carry':
    for side,sg in [('Left',1),('Right',-1)]:rotate(side+'Arm',[((0,1,0),sg*.45),((1,0,0),-1.0)]);rotate(side+'ForeArm',[((0,0,1),-sg*.15)])
   if clip=='Jump':
    rotate('LeftUpLeg',[((1,0,0),-.4)]);rotate('RightUpLeg',[((1,0,0),-.2)]);rotate('LeftLeg',[((1,0,0),.7)]);rotate('RightLeg',[((1,0,0),.6)])
   for p in rig.pose.bones:p.keyframe_insert('rotation_quaternion',frame=f/steps*duration*30+1)
  rig.animation_data.action=None;tr=rig.animation_data.nla_tracks.new();tr.name=clip;tr.strips.new(clip,1,action)
  tr.mute=True
 # Export NLA clips with rest transforms
 for p in rig.pose.bones:p.rotation_quaternion=Quaternion();p.location=(0,0,0)
 for tr in rig.animation_data.nla_tracks:tr.mute=False
 bpy.ops.object.select_all(action='DESELECT')
 for o in keep:o.select_set(True)
 bpy.context.view_layer.objects.active=rig
 bpy.ops.export_scene.gltf(filepath=OUT+'/'+variant+'.glb',export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_apply=False,export_image_format='JPEG',export_jpeg_quality=85)
 bpy.ops.wm.save_as_mainfile(filepath=OUT+'/'+variant+'.blend')
 print('EXPORTED',variant,flush=True)
