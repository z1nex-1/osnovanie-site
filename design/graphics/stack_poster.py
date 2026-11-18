# Постер 3D-стопки для первого экрана: пять слоёв, узлы, нити. Повторяет композицию web/src/js/stack3d.js
# (камера, размеры плит, шаг, цвета). Запуск:
#   Blender -b --python stack_poster.py -- /путь/stack-poster.png
import math, random, sys
import bpy

out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "/tmp/stack-poster.png"
random.seed(7)

def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1,)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try:
        sc.render.engine = eng
        break
    except TypeError:
        pass
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1600, 1000, 100
sc.render.image_settings.file_format = "PNG"
sc.view_settings.view_transform = "Standard"
sc.view_settings.look = "None"
try:
    sc.eevee.taa_render_samples = 96
except Exception:
    pass

w = bpy.data.worlds.new("w")
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = lin("#07100C")
w.node_tree.nodes["Background"].inputs[1].default_value = 1.0
sc.world = w

def mat(name, color, emit=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    o = nt.nodes.new("ShaderNodeOutputMaterial")
    if emit > 0:
        e = nt.nodes.new("ShaderNodeEmission")
        e.inputs[0].default_value = lin(color)
        e.inputs[1].default_value = emit
        src = e
    else:
        e = nt.nodes.new("ShaderNodeBsdfPrincipled")
        e.inputs["Base Color"].default_value = lin(color)
        e.inputs["Roughness"].default_value = 0.8
        src = e
    if alpha < 1:
        t = nt.nodes.new("ShaderNodeBsdfTransparent")
        mx = nt.nodes.new("ShaderNodeMixShader")
        mx.inputs[0].default_value = alpha
        nt.links.new(t.outputs[0], mx.inputs[1])
        nt.links.new(src.outputs[0], mx.inputs[2])
        nt.links.new(mx.outputs[0], o.inputs[0])
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            m.blend_method = "BLEND"
        m.use_backface_culling = False
    else:
        nt.links.new(src.outputs[0], o.inputs[0])
    return m

def obj_from(name, verts, faces, m, loc=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    ob.location = loc
    ob.data.materials.append(m)
    sc.collection.objects.link(ob)
    return ob

def tube(name, pts, depth, m):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = depth
    cu.bevel_resolution = 1
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (c[0], c[1], c[2], 1)
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(m)
    sc.collection.objects.link(ob)
    return ob

def octa(r):
    v = [(r, 0, 0), (-r, 0, 0), (0, r, 0), (0, -r, 0), (0, 0, r), (0, 0, -r)]
    f = [(0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4), (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5)]
    return v, f

def box(x, y, z):
    a, b, c = x / 2, y / 2, z / 2
    v = [(-a, -b, -c), (a, -b, -c), (a, b, -c), (-a, b, -c), (-a, -b, c), (a, -b, c), (a, b, c), (-a, b, c)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return v, f

PW, PD, GAP = 4.6, 3.0, 0.95
LAYERS = [("sources", 7, "#9FB3A8"), ("facts", 15, "#0CDC78"), ("beliefs", 8, "#FFA717"), ("options", 4, "#EEF4F0"), ("decision", 1, "#0CDC78")]
M = {
    "plate": mat("plate", "#123022", 1.0, 0.38),
    "frame": mat("frame", "#34503F", 1.0),
    "grid": mat("grid", "#23362C", 1.0),
    "thread": mat("thread", "#0CDC78", 1.0, 0.45),
}
nodes = []
for li, (key, n, col) in enumerate(LAYERS):
    z = (li - 2) * GAP
    v, f = [(-PW / 2, -PD / 2, 0), (PW / 2, -PD / 2, 0), (PW / 2, PD / 2, 0), (-PW / 2, PD / 2, 0)], [(0, 1, 2, 3)]
    obj_from("plate" + key, v, f, M["plate"], (0, 0, z))
    h = 0.006
    tube("frame" + key, [(-PW / 2, -PD / 2, z), (PW / 2, -PD / 2, z), (PW / 2, PD / 2, z), (-PW / 2, PD / 2, z), (-PW / 2, -PD / 2, z)], 0.007, M["frame"])
    for i in range(1, 12):
        x = -PW / 2 + PW * i / 12
        tube("gx", [(x, -PD / 2, z + h), (x, PD / 2, z + h)], 0.0025, M["grid"])
    for j in range(1, 8):
        y = -PD / 2 + PD * j / 8
        tube("gy", [(-PW / 2, y, z + h), (PW / 2, y, z + h)], 0.0025, M["grid"])
    cols = math.ceil(math.sqrt(n * (PW / PD)))
    rows = math.ceil(n / cols)
    layer_nodes = []
    for i in range(n):
        c, r = i % cols, i // cols
        x = 0 if n == 1 else ((c + 0.5) / cols - 0.5) * (PW - 0.6)
        y = 0 if n == 1 else ((r + 0.5) / rows - 0.5) * (PD - 0.5)
        x += math.sin(i * 12.9) * 0.08
        y += math.cos(i * 7.3) * 0.06
        p = (x, y, z + 0.06)
        if key == "sources":
            v, f = box(0.16, 0.2, 0.02)
            m = mat("n", col, 0.8)
        elif key in ("options",):
            v, f = octa(0.17)
            v = [(x, y, z * 0.55) for x, y, z in v]
            m = mat("n", col, 1.0)
        elif key == "decision":
            v, f = box(0.34, 0.34, 0.12)
            m = mat("n", col, 1.3)
        else:
            v, f = octa(0.075 if key == "facts" else 0.085)
            m = mat("n", col, 1.1)
        ob = obj_from("n", v, f, m, p)
        # сдержанное свечение: большой прозрачный ореол
        halo = mat("h", col, 1.0, 0.0 if key == "options" else 0.04)
        if key not in ("sources", "options"):
            bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.15 if key in ("facts", "beliefs") else 0.26, location=p)
            hb = bpy.context.object
            hb.data.materials.append(halo)
        layer_nodes.append(p)
    nodes.append(layer_nodes)

# нити: каждый узел опирается на один-два узла слоём ниже
for li in range(1, 5):
    for i, p in enumerate(nodes[li]):
        below = nodes[li - 1]
        near = sorted(below, key=lambda q: (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2)
        for q in near[: (4 if li == 4 else 1 if li == 3 else 2 if i % 3 == 0 else 1)]:
            tube("t", [p, q], 0.0035, M["thread"])

# камера: как в stack3d.js при полностью раскрытой стопке
a, r, cy = 0.78, 12.6, 3.9
cam = bpy.data.cameras.new("cam")
cam.sensor_fit = "VERTICAL"
cam.angle_y = math.radians(32)
cam.shift_x = -0.17
cam.shift_y = 0.0
co = bpy.data.objects.new("cam", cam)
co.location = (math.sin(a) * r, -math.cos(a) * r, cy)
sc.collection.objects.link(co)
tgt = bpy.data.objects.new("t", None)
tgt.location = (0, 0, 0.2)
sc.collection.objects.link(tgt)
c = co.constraints.new("TRACK_TO")
c.target, c.track_axis, c.up_axis = tgt, "TRACK_NEGATIVE_Z", "UP_Y"
sc.camera = co

sc.render.filepath = out
bpy.ops.wm.save_as_mainfile(filepath=out.rsplit(".", 1)[0].replace("/stack-poster", "") + ".blend" if False else str(__import__("pathlib").Path(__file__).with_name("stack-poster.blend")))
bpy.ops.render.render(write_still=True)
