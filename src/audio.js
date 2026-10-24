/**
 * پخش‌کننده صداهای محیطی (soundscape)
 * کاملاً لوکال — فایل‌های OGG در assets/audio/
 * بدون API، بدون streaming خارجی.
 */

import { SOUNDSCAPES } from './defaults.js';

let audioEl = null;
let currentKey = null;
let playing = false;

/** یک المان audio مخفی می‌سازد */
function ensureEl() {
  if (audioEl) return audioEl;
  if (typeof document === 'undefined') return null;

  audioEl = document.createElement('audio');
  audioEl.loop = true;
  audioEl.preload = 'none';
  audioEl.volume = 0;
  audioEl.style.display = 'none';
  document.body.appendChild(audioEl);
  return audioEl;
}

/** حجم را نرم تغییر می‌دهد (fade) */
function fadeTo(target, ms = 900) {
  const el = ensureEl();
  if (!el) return;

  const start = el.volume;
  const steps = 24;
  const delta = (target - start) / steps;
  let i = 0;

  clearInterval(fadeTo._timer);
  fadeTo._timer = setInterval(() => {
    i += 1;
    const v = Math.max(0, Math.min(1, start + delta * i));
    el.volume = v;
    if (i >= steps) clearInterval(fadeTo._timer);
  }, ms / steps);
}

/**
 * پخش یک soundscape
 * @param {string} key - snow|wind|water|silence|shore
 * @returns {Promise<{ok:boolean, reason?:string}>}
 */
export async function playSoundscape(key) {
  const el = ensureEl();
  if (!el) return { ok: false, reason: 'no-dom' };

  const sc = SOUNDSCAPES.find((s) => s.key === key);
  if (!sc) return { ok: false, reason: 'unknown' };

  const src = `./assets/audio/${key}.ogg`;

  if (currentKey !== key) {
    el.src = src;
    currentKey = key;
  }

  try {
    el.volume = 0;
    await el.play();
    fadeTo(0.45);
    playing = true;
    return { ok: true };
  } catch (e) {
    // autoplay policy یا فایل نبود
    playing = false;
    return { ok: false, reason: String(e?.name || 'play-failed') };
  }
}

/** توقف با fade-out */
export function stopSoundscape() {
  const el = ensureEl();
  if (!el) return;

  fadeTo(0, 600);
  setTimeout(() => {
    try {
      el.pause();
    } catch (_) {}
  }, 620);
  playing = false;
}

/** تغییر وضعیت */
export function toggleSoundscape(key) {
  if (playing && currentKey === key) {
    stopSoundscape();
    return { playing: false, key };
  }
  playSoundscape(key);
  return { playing: true, key };
}

export function isPlaying() {
  return playing;
}

export function getCurrentKey() {
  return currentKey;
}

/** آزادسازی (وقتی کاربر اپ را ترک می‌کند) */
export function release() {
  const el = ensureEl();
  if (el) {
    try {
      el.pause();
      el.src = '';
    } catch (_) {}
  }
  playing = false;
  currentKey = null;
}
