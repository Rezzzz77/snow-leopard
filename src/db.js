/**
 * لایه داده — Offline-first
 */

import { DEFAULT_DATA } from './defaults.js';

const STORAGE_KEY = 'snow_leopard_v1';

function store() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch (_) {
    return null;
  }
}

function clone(v) {
  if (v === null || typeof v !== 'object') return v;
  try {
    return structuredClone(v);
  } catch (_) {
    return JSON.parse(JSON.stringify(v));
  }
}

export function mergeWithDefaults(stored) {
  const incoming = stored && typeof stored === 'object' ? stored : {};
  const out = { ...clone(DEFAULT_DATA), ...incoming };

  for (const key of Object.keys(DEFAULT_DATA)) {
    const def = DEFAULT_DATA[key];
    const cur = out[key];

    if (cur === undefined || cur === null) {
      out[key] = clone(def);
      continue;
    }

    if (Array.isArray(def)) {
      if (!Array.isArray(cur)) out[key] = [];
      if (key === 's1Steps' && cur.length === 0 && def.length > 0) {
        out[key] = clone(def);
      }
      continue;
    }

    if (def && typeof def === 'object' && !Array.isArray(def) && cur && typeof cur === 'object') {
      out[key] = { ...clone(def), ...cur };
    }
  }

  return out;
}

export function loadFromStorage() {
  try {
    const s = store();
    if (!s) return mergeWithDefaults(null);
    const raw = s.getItem(STORAGE_KEY);
    if (!raw) return mergeWithDefaults(null);
    return mergeWithDefaults(JSON.parse(raw));
  } catch (e) {
    console.error('خطا در بارگذاری:', e);
    return mergeWithDefaults(null);
  }
}

export function saveToStorage(state) {
  try {
    const s = store();
    if (!s) return false;
    s.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('خطا در ذخیره:', e);
    return false;
  }
}

export function wipeStorage() {
  const s = store();
  if (!s) return false;
  s.removeItem(STORAGE_KEY);
  return true;
}

export function exportData(state) {
  const payload = {
    app: 'snow-leopard',
    version: state?.version || 1,
    exportedAt: new Date().toISOString(),
    data: state
  };
  return JSON.stringify(payload, null, 2);
}

export function importData(json) {
  try {
    const parsed = JSON.parse(json);
    const data = parsed?.data ?? parsed;
    if (!data || typeof data !== 'object') {
      return { ok: false, error: 'ساختار فایل معتبر نیست.' };
    }
    return { ok: true, state: mergeWithDefaults(data) };
  } catch (e) {
    return { ok: false, error: 'فایل JSON قابل خواندن نیست.' };
  }
}

export function getDefaultData() {
  return mergeWithDefaults(null);
}
