"""Crea el atleta 3D de Volta (cuerpo base CC0 de MakeHuman con MPFB) y lo exporta a GLB con esqueleto y zonas musculares.
Uso: python crear_atleta.py <salida.glb>   (python con el módulo bpy y la extensión MPFB instalada; ver SKILL.md)"""
import bpy, bmesh, sys, os, importlib
from mathutils import Vector
OUT = sys.argv[-1] if sys.argv[-1].endswith('.glb') else 'atleta.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.preferences.addon_enable(module='bl_ext.user_default.mpfb')
def imp(path, key):
    for m in list(sys.modules):
        if m.endswith(path): return getattr(importlib.import_module(m), key)
HumanService = imp('mpfb.services.humanservice', 'HumanService')
TargetService = imp('mpfb.services.targetservice', 'TargetService')
LocationService = imp('mpfb.services.locationservice', 'LocationService')
md = TargetService.get_default_macro_info_dict()
md.update({'gender': 1.0, 'age': 0.5, 'muscle': 1.0, 'weight': 0.62, 'height': 0.6, 'proportions': 1.0})
h = HumanService.create_human(macro_detail_dict=md)
TR = LocationService.get_mpfb_data('targets')
for f, w in [('torso/torso-vshape-incr', .7), ('torso/torso-muscle-pectoral-incr', .6), ('torso/torso-muscle-dorsi-incr', .6),
             ('torso/measure-shoulder-dist-incr', .35), ('torso/measure-waist-circ-decr', .35),
             ('arms/l-upperarm-muscle-incr', .6), ('arms/r-upperarm-muscle-incr', .6), ('arms/l-upperarm-shoulder-muscle-incr', .6), ('arms/r-upperarm-shoulder-muscle-incr', .6),
             ('arms/l-lowerarm-muscle-incr', .5), ('arms/r-lowerarm-muscle-incr', .5), ('legs/l-lowerleg-muscle-incr', .5), ('legs/r-lowerleg-muscle-incr', .5),
             ('legs/l-upperleg-muscle-incr', .5), ('legs/r-upperleg-muscle-incr', .5)]:
    p = os.path.join(TR, f + '.target.gz')
    if os.path.exists(p): TargetService.load_target(h, p, weight=w)
    else: print('falta', f)
rig = HumanService.add_builtin_rig(h, 'game_engine')
bpy.context.view_layer.objects.active = h
if h.data.shape_keys: bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
for m in list(h.modifiers):
    if m.type == 'MASK': h.modifiers.remove(m)
G = {g.index: g.name for g in h.vertex_groups}
keep_groups = {'body', 'helper-l-eye', 'helper-r-eye'}
me = h.data
bm = bmesh.new(); bm.from_mesh(me)
dl = bm.verts.layers.deform.active
kill = []
for v in bm.verts:
    names = {G[i] for i in v[dl].keys()}
    if not (names & keep_groups): kill.append(v)
bmesh.ops.delete(bm, geom=kill, context='VERTS')
bm.to_mesh(me); bm.free()
print('verts after', len(me.vertices))
# zonas por hueso + posición + normal (reposo: mirando a -Y, Z arriba)
IDS = ['Pecho','Espalda','Hombros','Bíceps','Tríceps','Antebrazo','Cuádriceps','Isquiosurales','Glúteos','Gemelos','Core','Trapecio','Aductores','Abductores','Lumbar']
bones = rig.data.bones
def bw(v):
    d = {}
    for g in v.groups:
        n = G.get(g.group)
        if n and n in bones: d[n] = d.get(n, 0) + g.weight
    return d
def along(bn, p):
    b = bones[bn]; a = b.head_local; c = b.tail_local; ab = c - a
    return max(0, min(1, (p - a).dot(ab) / ab.length_squared))
zs = [v.co.z for v in me.vertices]; H = max(zs)
mus = me.attributes.new('_MUSCLE', 'FLOAT', 'POINT')
paint = me.attributes.new('_PAINT', 'FLOAT', 'POINT')
eyes = {i for i, n in G.items() if n in ('helper-l-eye', 'helper-r-eye')}
for v in me.vertices:
    p, n = v.co, v.normal
    w = bw(v); t = p.z / H
    side = 'l' if p.x > 0 else 'r'
    top = max(w, key=w.get) if w else ''
    fr = n.y < 0  # delante
    m = -1; pt = 0
    if any(g.group in eyes for g in v.groups): pt = 3
    base = top[:-2] if top.endswith(('_l','_r')) else top
    if base == 'upperarm':
        a = along(top, p)
        if a < .3: m = IDS.index('Hombros')
        else:
            arm = (bones[top].tail_local - bones[top].head_local).normalized()
            fwd = Vector((0, -1, 0)); fwd = (fwd - arm * fwd.dot(arm)).normalized()
            m = IDS.index('Bíceps') if n.dot(fwd) > 0.05 else IDS.index('Tríceps') if n.dot(fwd) < -0.05 else -1
    elif base == 'clavicle':
        m = IDS.index('Trapecio') if (not fr or n.z > .5) else IDS.index('Hombros') if abs(p.x) > .14 else IDS.index('Pecho')
    elif base == 'lowerarm':
        m = IDS.index('Antebrazo') if along(top, p) < .8 else -1
    elif base == 'thigh':
        a = along(top, p)
        medial = (n.x < -.45) if side == 'l' else (n.x > .45)
        lateral = (n.x > .55) if side == 'l' else (n.x < -.55)
        if a < .12 and not fr: m = IDS.index('Glúteos')
        elif medial and a < .75: m = IDS.index('Aductores')
        elif fr and a < .92: m = IDS.index('Cuádriceps')
        elif not fr and a < .9: m = IDS.index('Isquiosurales')
        if a < .3: pt = 1  # pantalón corto
        if lateral and a < .2: m = IDS.index('Abductores')
    elif base == 'calf':
        m = IDS.index('Gemelos') if (not fr and along(top, p) < .7) else -1
    elif base in ('foot', 'ball'):
        pt = 2
    elif base == 'pelvis':
        pt = 1
        if not fr and t < .52: m = IDS.index('Glúteos')
        elif not fr: m = IDS.index('Lumbar')
        elif abs(n.x) > .6 and t > .5: m = IDS.index('Abductores')
        elif fr and t > .55: m = IDS.index('Core')
    elif base in ('spine_01', 'spine_02'):
        if fr: m = IDS.index('Core')
        else: m = IDS.index('Lumbar') if base == 'spine_01' else IDS.index('Espalda')
    elif base == 'spine_03':
        if fr: m = IDS.index('Pecho') if t > .7 else IDS.index('Core')
        else: m = IDS.index('Trapecio') if (t > .8 and abs(p.x) < .12) else IDS.index('Espalda')
    elif base == 'neck_01':
        m = IDS.index('Trapecio') if not fr and t < .87 else -1
    mus.data[v.index].value = m
    paint.data[v.index].value = pt
# Suavizado y pose de reposo
for f in me.polygons: f.use_smooth = True
bpy.context.view_layer.objects.active = h
bpy.ops.object.select_all(action='DESELECT'); h.select_set(True); rig.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_skins=True, export_animations=False,
    export_attributes=True, export_materials='NONE', export_normals=True, export_texcoords=False, export_morph=False, export_yup=True)
print('glb', os.path.getsize(OUT))
print('bones rest', {b.name: [round(x,3) for x in b.head_local] for b in bones if b.name in ('upperarm_l','lowerarm_l','hand_l','thigh_l','calf_l','foot_l','spine_01','head')})
