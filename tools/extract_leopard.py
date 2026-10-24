#!/usr/bin/env python3
"""
استخراج کاراکتر پلنگ برفی از تصویر مرجع
==========================================
source.jpg -> stage-1..5.png + .webp  (512×512، دایره‌ای)

رویکرد: تیره‌سازی نرم پس‌زمینه (بدون حذف سخت → بدون حفره)
"""

import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "leopard", "source.jpg")
OUT = os.path.join(ROOT, "assets", "leopard")

BOXES = [
    (82, 240, 256, 456),
    (300, 224, 506, 450),
    (592, 192, 752, 452),
    (760, 166, 956, 434),
    (1016, 150, 1232, 462),
]

STAGE_HEX = ["#6ba3d6", "#52b788", "#d99a4e", "#9b7ede", "#e0b94a"]
BASE_BG = (11, 18, 32)
SIZE = 512
APERTURE = 0.495
PAD = 0.075
BLUE_LO, BLUE_HI = 3.0, 13.0


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def darken(crop: Image.Image, color) -> Image.Image:
    a = np.asarray(crop).astype(np.float32)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    blue = b - r

    t = np.clip((blue - BLUE_LO) / (BLUE_HI - BLUE_LO), 0, 1)
    lum_arr = (r + g + b) / 3.0
    halo = np.clip((lum_arr - 150) / 70, 0, 1) * np.clip((blue - 1.0) / 8.0, 0, 1)
    t = np.maximum(t, halo)

    hh, ww = t.shape
    yy, xx = np.mgrid[0:hh, 0:ww]
    rr = np.sqrt(((xx - ww / 2) / (ww / 2)) ** 2 + ((yy - hh / 2) / (hh / 2)) ** 2)
    outer = np.clip((rr - 0.34) / 0.16, 0, 1)
    bright = np.clip((lum_arr - 168) / 45, 0, 1)
    t = np.maximum(t, outer * bright)

    ti = Image.fromarray((t * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(1.6))
    t = (np.asarray(ti).astype(np.float32) / 255.0)[:, :, None]

    yy2, xx2 = np.mgrid[0:hh, 0:ww]
    dist = np.sqrt((xx2 - ww / 2) ** 2 + (yy2 - hh / 2) ** 2) / (max(ww, hh) * 0.5)
    inten = np.clip(1.0 - dist, 0, 1) ** 1.6
    target = np.zeros((hh, ww, 3), dtype=np.float32)
    for i in range(3):
        target[:, :, i] = BASE_BG[i] + (color[i] - BASE_BG[i]) * inten * 0.40

    mixed = a * (1 - t) + target * t

    # روشن‌تر کردن خز (فقط پیکسل‌های خنثی = کاراکتر)
    fur_mask = ((1 - t) > 0.5).reshape(mixed.shape[0], mixed.shape[1])
    lum2 = mixed.mean(axis=2, keepdims=True)
    # gamma < 1 → روشن‌تر
    boosted = 255.0 * np.power(np.clip(lum2 / 255.0, 0, 1), 0.86)
    ratio = np.where(lum2 > 1, boosted / np.maximum(lum2, 1), 1.0)
    scale = 1.0 + (ratio - 1.0) * 0.55          # اعمال نیمه‌شدت
    lifted = mixed * scale
    mixed = np.where(fur_mask[:, :, None], lifted, mixed)

    return Image.fromarray(np.clip(mixed, 0, 255).astype(np.uint8), "RGB")


def circle_alpha(size: int, aperture: float) -> Image.Image:
    ss = 4
    big = Image.new("L", (size * ss, size * ss), 0)
    d = ImageDraw.Draw(big)
    r = size * ss * aperture
    d.ellipse([size * ss / 2 - r, size * ss / 2 - r, size * ss / 2 + r, size * ss / 2 + r], fill=255)
    return big.resize((size, size), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))


def content_bbox(crop: Image.Image):
    a = np.asarray(crop).astype(np.int16)
    blue = a[:, :, 2] - a[:, :, 0]
    ys, xs = np.where(blue < 10)
    if len(xs) == 0:
        return (0, 0, crop.width, crop.height)
    return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)


def extract(idx: int, box):
    src = Image.open(SRC).convert("RGB")
    crop = src.crop(box)

    x0, y0, x1, y1 = content_bbox(crop)
    cw, ch = x1 - x0, y1 - y0
    side = max(cw, ch)
    pad = int(side * PAD)
    cxc, cyc = (x0 + x1) / 2, (y0 + y1) / 2
    half = side / 2 + pad
    crop = crop.crop((
        int(max(0, cxc - half)), int(max(0, cyc - half)),
        int(min(crop.width, cxc + half)), int(min(crop.height, cyc + half))
    ))

    crop = darken(crop, hex_rgb(STAGE_HEX[idx - 1]))

    w, h = crop.size
    sd = max(w, h)
    canvas = Image.new("RGB", (sd, sd), BASE_BG)
    canvas.paste(crop, ((sd - w) // 2, (sd - h) // 2))

    out = canvas.resize((SIZE, SIZE), Image.LANCZOS)
    rgba = out.convert("RGBA")
    rgba.putalpha(circle_alpha(SIZE, APERTURE))

    png = os.path.join(OUT, f"stage-{idx}.png")
    rgba.save(png, "PNG", optimize=True)
    webp = os.path.join(OUT, f"stage-{idx}.webp")
    rgba.save(webp, "WEBP", quality=90, method=6)

    print(f"✔ stage-{idx}.png ({os.path.getsize(png)/1024:.0f}KB)  webp ({os.path.getsize(webp)/1024:.0f}KB)")


def main():
    if not os.path.exists(SRC):
        print(f"✖ تصویر مرجع نیست: {SRC}")
        sys.exit(1)
    for i, box in enumerate(BOXES, 1):
        extract(i, box)


if __name__ == "__main__":
    main()
