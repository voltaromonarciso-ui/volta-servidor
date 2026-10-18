import sys, bpy
bpy.context.preferences.filepaths.use_scripts_auto_execute = False
bpy.ops.wm.open_mainfile(filepath=sys.argv[1], load_ui=False, use_scripts=False)
for o in bpy.data.objects:
    if o.parent is None:
        d = o.dimensions
        print('ROOT', o.name, o.type, 'kids', len(o.children_recursive), 'dim %.1f %.1f %.1f' % (d.x, d.y, d.z), 'loc %.1f %.1f %.1f' % tuple(o.location))
