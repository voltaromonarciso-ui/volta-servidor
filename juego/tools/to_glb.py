# Convierte un modelo (.blend / .obj / .fbx / .dae) a .glb con Blender (bpy), sin ejecutar
# scripts incrustados en el archivo de origen.
import sys, os, bpy
src, out = sys.argv[1], sys.argv[2]
bpy.context.preferences.filepaths.use_scripts_auto_execute = False
ext = os.path.splitext(src)[1].lower()
if ext == '.blend':
    bpy.ops.wm.open_mainfile(filepath=src, load_ui=False, use_scripts=False)
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if ext == '.obj': bpy.ops.wm.obj_import(filepath=src)
    elif ext == '.fbx': bpy.ops.import_scene.fbx(filepath=src)
    elif ext == '.dae': bpy.ops.wm.collada_import(filepath=src)
sel = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != '-' else None
tex = sys.argv[4] if len(sys.argv) > 4 else None     # textura de color a conectar
uvname = sys.argv[5] if len(sys.argv) > 5 else None  # mapa UV que usa esa textura
if tex:
    # material nuevo y estándar (Principled + imagen) para cada malla: el exportador glTF
    # no entiende los materiales antiguos ni los grupos de nodos propios del archivo
    img = bpy.data.images.load(tex); img.pack()
    m = bpy.data.materials.new('base'); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = 0.8
    ti = nt.nodes.new('ShaderNodeTexImage'); ti.image = img; ti.interpolation = 'Closest' if img.size[0] <= 64 else 'Linear'
    if uvname:
        uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = uvname; nt.links.new(uvn.outputs['UV'], ti.inputs['Vector'])
    nt.links.new(ti.outputs['Color'], bsdf.inputs['Base Color'])
    glass = None
    for o in bpy.data.objects:
        if o.type != 'MESH': continue
        keep = [s.material for s in o.material_slots if s.material and 'glass' in s.material.name.lower()]
        for slot in o.material_slots:
            if slot.material and 'glass' in slot.material.name.lower(): continue
            slot.material = m
        if not o.material_slots: o.data.materials.append(m)
        if uvname and uvname in o.data.uv_layers:
            # el UV de la textura pasa a ser el primero (TEXCOORD_0); los demás se quitan
            for l in list(o.data.uv_layers):
                if l.name != uvname: o.data.uv_layers.remove(l)
kw = dict(filepath=out, export_format='GLB', export_image_format=os.environ.get('IMGFMT', 'AUTO'), export_apply=True, export_yup=True, export_texcoords=True, export_normals=True, export_materials='EXPORT')
if sel:
    bpy.ops.object.select_all(action='DESELECT')
    root = bpy.data.objects.get(sel)
    if not root: print('NO OBJ', sel); sys.exit(2)
    def walk(o):
        o.select_set(True)
        for c in o.children: walk(c)
    walk(root); kw['use_selection'] = True
bpy.ops.export_scene.gltf(**kw)
print('OK', out, os.path.getsize(out))
