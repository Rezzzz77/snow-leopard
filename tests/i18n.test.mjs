import test from 'node:test';
import assert from 'node:assert/strict';

import { t, getLocale, setLocale, getDir, LOCALES, allKeys, hasLocale } from '../src/i18n.js';

test('i18n: پیش‌فرض فارسی', () => {
  assert.equal(getLocale(), 'fa');
});

test('i18n: دو زبان تعریف شده', () => {
  assert.equal(LOCALES.length, 2);
  assert.deepEqual(LOCALES.map((l) => l.code), ['fa', 'en']);
});

test('i18n: ترجمه فارسی', () => {
  assert.equal(t('app.name', 'fa'), 'پلنگ برفی');
});

test('i18n: ترجمه انگلیسی', () => {
  assert.equal(t('app.name', 'en'), 'Snow Leopard');
});

test('i18n: کلید ناموجود → خود کلید', () => {
  assert.equal(t('nonexistent.key', 'fa'), 'nonexistent.key');
});

test('i18n: جهت درست', () => {
  assert.equal(getDir('fa'), 'rtl');
  assert.equal(getDir('en'), 'ltr');
});

test('i18n: هر دو زبان همه کلیدها را دارند', () => {
  const keys = allKeys();
  assert.ok(keys.length > 40);
  for (const k of keys) {
    const fa = t(k, 'fa');
    const en = t(k, 'en');
    assert.notEqual(en, k, `کلید «${k}» در انگلیسی ترجمه نشده`);
    assert.ok(fa.length > 0 && en.length > 0, `کلید «${k}» خالی`);
  }
});

test('i18n: setLocale نامعتبر رد می‌شود', () => {
  const before = getLocale();
  setLocale('fr');
  assert.equal(getLocale(), before);
});

test('i18n: hasLocale', () => {
  assert.equal(hasLocale('fa'), true);
  assert.equal(hasLocale('en'), true);
  assert.equal(hasLocale('de'), false);
});

test('i18n: بدون localStorage امن', () => {
  assert.doesNotThrow(() => setLocale('en'));
  assert.doesNotThrow(() => getLocale());
});
