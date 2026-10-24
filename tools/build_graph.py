#!/usr/bin/env python3
"""سازنده گراف دانش — قطعی"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "graph.json")
NODES, EDGES, _seen = {}, [], set()

def node(nid, label, ntype, **meta):
    NODES[nid] = {"id": nid, "label": label, "type": ntype, **meta}

def edge(src, dst, etype="uses"):
    k = (src, dst, etype)
    if k in _seen or src not in NODES or dst not in NODES: return
    _seen.add(k); EDGES.append({"source": src, "target": dst, "type": etype})

FILES = [
    ("index.html","entry","رابط کاربری RTL + پنج بخش مرحله"),
    ("app.js","module","منطق اصلی، رندرها، مودال‌ها"),
    ("sw.js","module","Service Worker — کش آفلاین"),
    ("manifest.json","config","تنظیمات PWA"),
    ("src/theme.js","module","تم بصری پنج مرحله"),
    ("src/defaults.js","module","داده پیش‌فرض"),
    ("src/db.js","module","localStorage + export/import"),
    ("src/leopard.js","module","موتور رشد، انرژی، زنجیره"),
    ("src/coach.js","module","اقدام بعدی + انگیزه + پیشرفت"),
    ("src/prompts.js","module","۶۲ پرامپت تأمل"),
    ("src/stories.js","module","۳۲ داستان + کشف‌ها"),
    ("src/insights.js","module","تحلیل الگوها، روند، خلاصه"),
    ("src/quests.js","module","۱۳ مأموریت با جایزه برف"),
    ("src/audio.js","module","پخش صداهای محیطی لوکال"),
    ("src/i18n.js","module","فارسی + انگلیسی"),
    ("assets/audio/snow.ogg","asset","صدای برف (پروسدورال)"),
    ("assets/audio/wind.ogg","asset","صدای باد"),
    ("assets/audio/water.ogg","asset","صدای آب"),
    ("assets/audio/shore.ogg","asset","صدای موج"),
    ("assets/audio/silence.ogg","asset","سکوت تمرکز"),
    ("assets/css/app.css","style","استایل و انیمیشن"),
    ("assets/fonts/fonts.css","style","Vazirmatn self-hosted"),
    ("tools/build_graph.py","module","تولید گراف"),
    ("tools/check_contracts.py","module","تست قرارداد"),
    ("tools/extract_leopard.py","module","استخراج کاراکتر از تصویر"),
    ("tools/make_icons.py","module","تولید آیکون PWA"),
    ("package.json","config","اسکریپت‌ها"),
    ("README.md","doc","مستندات"),
    ("docs/MEMORY.md","doc","حافظه پروژه"),
]
for p,t,d in FILES: node(f"file:{p}", p, t, desc=d)

STAGES = [
    ("s1","مرحله ۱ — جوجه","۷۲ ساعت","#6ba3d6"),
    ("s2","مرحله ۲ — نوجوان","۷ روز","#52b788"),
    ("s3","مرحله ۳ — جوان","۳۰ روز","#d99a4e"),
    ("s4","مرحله ۴ — بالغ","۹۰ روز","#9b7ede"),
    ("s5","مرحله ۵ — رهبر قله","مستمر","#e0b94a"),
]
for sid,l,per,hexv in STAGES:
    node(f"stage:{sid}", l, "stage", period=per, color=hexv)
    node(f"dom:stage-{sid[1]}", f"#stage-{sid[1]}", "dom")

FEATURES = [
    ("f:welcome","خوش‌آمد و شروع سفر","نام + چرا"),
    ("f:leopard","کاراکتر پلنگ برفی","۵ مرحله رشد"),
    ("f:xp","سیستم XP","از اهداف، تأمل، تنفس"),
    ("f:energy","انرژی","سقف ۱۵۰ روزانه"),
    ("f:snowflakes","برف","ارز درون‌برنامه‌ای"),
    ("f:goals","اهداف روزانه","۵ نوع + ریست شبانه"),
    ("f:reflections","تأمل","پرامپت + تگ + صدا"),
    ("f:streak","زنجیره","۷ روزه + تعمیر"),
    ("f:breathing","تنفس","۳ الگو"),
    ("f:mood","ردیاب حال","۵ سطح + نمودار"),
    ("f:adventure","ماجراجویی","داستان + کشف"),
    ("f:coach","کوچ","اقدام بعدی"),
    ("f:export","خروجی/ورود داده","مالکیت کاربر"),
    ("f:wipe","حق حذف","پاک‌سازی کامل"),
    ("f:offline","آفلاین","Service Worker"),
    ("f:pwa","نصب‌پذیر","manifest + آیکون"),
    ("f:insights","بینش","آمار، روند حال، خلاصه"),
    ("f:quests","مأموریت‌ها","۱۳ کویست + جایزه"),
    ("f:journal","ژورنال عمیق","۲۰ پرامپت"),
    ("f:habits","عادت‌های بلندمدت","۲۱ روز"),
    ("f:pack","پک نزدیکان","حداکثر ۵ نفر"),
    ("f:vibes","وایب","۴ نوع"),
    ("f:ritual","آیین شخصی","مرحله ۴"),
    ("f:mentor","منتورینگ","یادداشت مرحله ۵"),
    ("f:sound","صداهای محیطی","۵ soundscape لوکال"),
    ("f:i18n","چندزبانه","فارسی + English"),
]
for fid,l,d in FEATURES: node(fid, l, "feature", desc=d)

node("data:localstorage","localStorage","store",desc="تنها منبع حقیقت")
node("data:no-cloud","بدون ابر","store",desc="صفر درخواست شبکه")

edge("file:index.html","file:app.js","loads")
edge("file:index.html","file:manifest.json","declares")
edge("file:index.html","file:sw.js","registers")
edge("file:index.html","file:assets/css/app.css","styles")
edge("file:index.html","file:assets/fonts/fonts.css","styles")
for m in ["theme","defaults","db","leopard","coach","prompts","stories","insights","quests","audio","i18n"]:
    edge("file:app.js", f"file:src/{m}.js","imports")
edge("file:src/coach.js","file:src/leopard.js","imports")
edge("file:src/leopard.js","file:src/stories.js","imports")
edge("file:src/db.js","file:src/defaults.js","imports")
edge("file:src/db.js","data:localstorage","reads-writes")
edge("file:app.js","data:localstorage","uses")
edge("file:tools/extract_leopard.py","file:index.html","provides-assets")
edge("file:tools/make_icons.py","file:manifest.json","informs")
edge("file:tools/check_contracts.py","file:app.js","validates")
edge("file:README.md","file:docs/MEMORY.md","references")

for sid,_,_,_ in STAGES:
    edge("file:index.html", f"dom:stage-{sid[1]}","contains")
    edge(f"dom:stage-{sid[1]}", f"stage:{sid}","represents")
    edge(f"stage:{sid}","file:app.js","rendered_by")
    edge(f"stage:{sid}","file:src/theme.js","themed_by")

FE = {
 "f:welcome":"file:app.js","f:leopard":"file:src/leopard.js","f:xp":"file:src/leopard.js",
 "f:energy":"file:src/leopard.js","f:snowflakes":"file:src/leopard.js",
 "f:goals":"file:src/defaults.js","f:reflections":"file:src/prompts.js",
 "f:streak":"file:src/leopard.js","f:breathing":"file:src/defaults.js",
 "f:mood":"file:src/defaults.js","f:adventure":"file:src/stories.js",
 "f:coach":"file:src/coach.js","f:export":"file:src/db.js","f:wipe":"file:src/db.js",
 "f:offline":"file:sw.js","f:pwa":"file:manifest.json",
 "f:insights":"file:src/insights.js","f:quests":"file:src/quests.js",
 "f:journal":"file:src/defaults.js","f:habits":"file:src/defaults.js",
 "f:pack":"file:app.js","f:vibes":"file:app.js","f:ritual":"file:app.js",
 "f:mentor":"file:app.js",
 "f:sound":"file:src/audio.js","f:i18n":"file:src/i18n.js",
}
for fid,t in FE.items(): edge(fid, t, "implemented_in")

graph = {"meta":{"project":"snow-leopard","title":"پلنگ برفی — خودمراقبتی","schema":1,
 "generator":"tools/build_graph.py","counts":{"nodes":len(NODES),"edges":len(EDGES)}},
 "nodes":sorted(NODES.values(), key=lambda n:(n["type"],n["id"])),
 "edges":sorted(EDGES, key=lambda e:(e["source"],e["target"],e["type"]))}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT,"w",encoding="utf-8") as fh: json.dump(graph, fh, ensure_ascii=False, indent=2)
print(f"✔ docs/graph.json — گره: {len(NODES)} | یال: {len(EDGES)}")
