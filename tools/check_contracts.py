#!/usr/bin/env python3
"""تست قرارداد HTML ↔ JS"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors, warnings = [], []

html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
app = open(os.path.join(ROOT, "app.js"), encoding="utf-8").read()

JS_KEYWORDS = {
    'if','else','for','while','switch','return','function','var','let','const',
    'try','catch','finally','throw','typeof','instanceof','new','delete','void',
    'do','break','continue','case','default','class','extends','super','this',
    'event','window','document','navigator','console','Math','JSON','Object',
    'Array','String','Number','Boolean','Promise','Set','Map','Date','Blob',
    'URL','FileReader','Intl','alert','confirm','prompt','parseInt','parseFloat',
}

handlers = set(re.findall(r'on(?:click|change|input|error)="([A-Za-z_$][\w$]*)\s*\(', html))
handlers |= set(re.findall(r'on(?:click|change|input|error)="([A-Za-z_$][\w$]*)\s*\(', app))
handlers = {h for h in handlers if h not in JS_KEYWORDS}

block = re.search(r"Object\.assign\(window,\s*\{(.*?)\}\s*\)", app, re.S)
exposed = set()
if block:
    exposed = set(re.findall(r"[A-Za-z_$][\w$]*", block.group(1)))
else:
    errors.append("بلوک Object.assign(window, {...}) پیدا نشد")

defined = set(re.findall(r"^(?:export\s+)?function\s+([A-Za-z_$][\w$]*)", app, re.M))
defined |= set(re.findall(r"^const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\(|function)", app, re.M))

for fn in sorted(h for h in handlers if h not in exposed):
    hint = "" if fn in defined else " (تعریف هم نشده)"
    errors.append(f"تابع «{fn}» در HTML صدا زده می‌شود ولی به window متصل نیست{hint}")

used_ids = set(re.findall(r"""getElementById\(['"]([^'"]+)['"]\)""", app))
used_ids |= set(re.findall(r"""el\(['"]([^'"]+)['"]\)""", app))
html_ids = set(re.findall(r'id="([^"]+)"', html))
dynamic_ids = set(re.findall(r'id="([^"$]+)"', app))
dynamic_ids |= set(re.findall(r"\.id\s*=\s*['\"]([^'\"]+)['\"]", app))

for i in sorted(i for i in used_ids if i not in html_ids and i not in dynamic_ids):
    errors.append(f"id «{i}» در app.js استفاده شده ولی در index.html نیست")

for mod in set(re.findall(r"""from\s+['"](\./[^'"]+)['"]""", app)):
    if not os.path.exists(os.path.normpath(os.path.join(ROOT, mod))):
        errors.append(f"ماژول «{mod}» import شده ولی نیست")

ALIASES = {'startAdventure2'}
for fn in sorted(exposed - handlers - ALIASES):
    warnings.append(f"تابع «{fn}» متصل است ولی در HTML استفاده نشده")

print(f"هندلرها: {len(handlers)}  |  متصل: {len(exposed)}  |  idها: {len(used_ids)}")
for w in warnings: print("⚠ ", w)
for e in errors: print("✖ ", e)

if errors:
    print(f"\n❌ {len(errors)} خطا")
    sys.exit(1)
print("\n✅ قرارداد HTML ↔ JS سالم است")
