#!/usr/bin/env python3
"""
تولید صداهای محیطی (soundscape) — کاملاً پروسدورال
====================================================
بدون دانلود از اینترنت، بدون فایل نمونه. همه با ریاضی ساخته می‌شوند.

خروجی: assets/audio/*.wav  (استریو 22.05kHz، ۳۰ ثانیه، لوپ‌پذیر)
سپس با ffmpeg به ogg/mp3 تبدیل می‌شوند.

اصول:
  - لوپ بی‌درز: ابتدا و انتها با crossfade به هم متصل
  - حجم کم: مونو 22kHz، بیت‌ریت پایین
  - بدون کلمه/آهنگ: فقط نویز شکل‌یافته و هارمونیک ساده

اجرا: python3 tools/make_audio.py
"""

import math
import os
import random
import struct
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "audio")
os.makedirs(OUT, exist_ok=True)

SR = 22050          # نمونه‌برداری
DUR = 30            # ثانیه
N = SR * DUR
FADE = SR * 2       # دو ثانیه crossfade برای لوپ بی‌درز

random.seed(42)     # قطعی


def normalize(samples, peak=0.72):
    m = max(abs(s) for s in samples) or 1.0
    k = peak / m
    return [s * k for s in samples]


def loop_fix(samples, fade=FADE):
    """انتهای نمونه را با ابتدای آن crossfade می‌کند تا لوپ بی‌درز شود."""
    n = len(samples)
    out = samples[:]
    for i in range(fade):
        t = i / fade
        a = out[n - fade + i]
        b = out[i]
        out[n - fade + i] = a * (1 - t) + b * t
    return out


def write_wav(name, mono):
    path = os.path.join(OUT, name)
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in mono)
        w.writeframes(frames)
    print(f"  ✔ {name} ({os.path.getsize(path)/1024:.0f}KB)")
    return path


# ---------------------------------------------------------------- برف
def gen_snow():
    """نویز صورتی آرام + زنگ‌های بسیار خفیف."""
    out = [0.0] * N
    # نویز صورتی با فیلتر ساده
    b0 = b1 = b2 = 0.0
    for i in range(N):
        w = random.uniform(-1, 1)
        b0 = 0.99765 * b0 + w * 0.0990460
        b1 = 0.96300 * b1 + w * 0.2965164
        b2 = 0.57000 * b2 + w * 1.0526913
        pink = (b0 + b1 + b2 + w * 0.1848) * 0.18
        # مدولاسیون آرام (نسیم)
        env = 0.55 + 0.25 * math.sin(2 * math.pi * i / (SR * 11))
        out[i] = pink * env
    # زنگ‌های بسیار خفیف پراکنده
    for _ in range(24):
        pos = random.randrange(0, N - SR)
        f = random.uniform(1200, 3200)
        amp = random.uniform(0.01, 0.035)
        length = int(SR * random.uniform(0.4, 1.2))
        for j in range(min(length, N - pos)):
            t = j / SR
            out[pos + j] += amp * math.sin(2 * math.pi * f * t) * math.exp(-3.5 * t)
    return loop_fix(normalize(out))


# ---------------------------------------------------------------- باد
def gen_wind():
    """نویز قهوه‌ای با مدولاسیون موجی."""
    out = [0.0] * N
    last = 0.0
    for i in range(N):
        w = random.uniform(-1, 1)
        last = (last + 0.02 * w) / 1.02
        brown = last * 3.5
        # سه موج باد با فرکانس‌های نامرتبط
        m = (0.45
             + 0.28 * math.sin(2 * math.pi * i / (SR * 7.3))
             + 0.16 * math.sin(2 * math.pi * i / (SR * 3.1))
             + 0.08 * math.sin(2 * math.pi * i / (SR * 1.7)))
        out[i] = brown * max(0.1, m)
    return loop_fix(normalize(out))


# ---------------------------------------------------------------- آب
def gen_water():
    """قطره‌های نامنظم + نویز فیلترشده پایین."""
    out = [0.0] * N
    # بستر نویز
    low = 0.0
    for i in range(N):
        w = random.uniform(-1, 1)
        low = low * 0.98 + w * 0.02
        out[i] = low * 0.35

    # قطره‌ها
    drops = 0
    t = 0
    while t < N - SR:
        gap = int(SR * random.uniform(0.15, 0.9))
        t += gap
        if t >= N - SR:
            break
        f = random.uniform(600, 1800)
        amp = random.uniform(0.08, 0.22)
        length = int(SR * random.uniform(0.08, 0.22))
        for j in range(min(length, N - t)):
            tt = j / SR
            # قطره: پرش فرکانس + افت نمایی
            ff = f * (1 + 1.6 * math.exp(-14 * tt))
            out[t + j] += amp * math.sin(2 * math.pi * ff * tt) * math.exp(-22 * tt)
        drops += 1
    print(f"     {drops} قطره")
    return loop_fix(normalize(out))


# ---------------------------------------------------------------- سکوت (تنفس)
def gen_silence():
    """تقریباً سکوت با یک تونال بسیار آرام ۸۰Hz — برای تمرکز."""
    out = [0.0] * N
    for i in range(N):
        t = i / SR
        # درون ۸۰Hz خیلی خفیف (زیر آستانه توجه)
        out[i] = 0.06 * math.sin(2 * math.pi * 80 * t)
        # نفس بسیار آرام
        out[i] += 0.03 * math.sin(2 * math.pi * 0.11 * t)
    return loop_fix(normalize(out, peak=0.35))


# ---------------------------------------------------------------- ساحل
def gen_shore():
    """موج: نویز بالا با مدولاسیون موجی کُند."""
    out = [0.0] * N
    for i in range(N):
        t = i / SR
        w = random.uniform(-1, 1)
        # موج هر ~۹ ثانیه
        wave = (math.sin(2 * math.pi * t / 9.0) + 1) / 2
        wave = wave ** 2.2
        out[i] = w * (0.05 + 0.55 * wave)
    # فیلتر بالاگذر ساده (حذف زیرین)
    prev = 0.0
    for i in range(N):
        hp = out[i] - prev
        prev = out[i]
        out[i] = hp * 0.9
    return loop_fix(normalize(out))


def main():
    print("تولید صداهای محیطی…")
    gens = {
        "snow.wav": gen_snow,
        "wind.wav": gen_wind,
        "water.wav": gen_water,
        "silence.wav": gen_silence,
        "shore.wav": gen_shore,
    }
    for name, fn in gens.items():
        print(f"  ▸ {name}")
        write_wav(name, fn())
    print("تمام.")


if __name__ == "__main__":
    main()
