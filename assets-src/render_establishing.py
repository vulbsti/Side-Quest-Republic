import bpy, math, os
from mathutils import Vector
out='/tmp/sqr3d-delhi/frames';os.makedirs(out,exist_ok=True)
s=bpy.context.scene;s.cycles.samples=12;s.render.resolution_x=960;s.render.resolution_y=540;s.render.image_settings.file_format='JPEG';s.render.image_settings.quality=86
for i in range(72):
 a=i/71*.12; s.camera.location=(31*math.cos(a)+39*math.sin(a),31*math.sin(a)-39*math.cos(a),23-i/71*1.7)
 s.camera.rotation_euler=(Vector((0,2,3))-s.camera.location).to_track_quat('-Z','Y').to_euler();s.render.filepath=out+'/frame%03d.jpg'%i;bpy.ops.render.render(write_still=True)
