import test from 'node:test';
import assert from 'node:assert/strict';

import { STAGE_THEME, STAGE_ORDER, getStageTheme, stageName } from '../src/theme.js';

test('theme: پنج مرحله تعریف شده', () => {
  assert.equal(STAGE_ORDER.length, 5);
  for (const n of STAGE_ORDER) assert.ok(STAGE_THEME[n], `مرحله ${n} باید تعریف شود`);
});

test('theme: هر مرحله فیلدهای ضروری دارد', () => {
  const required = ['key', 'name', 'englishName', 'age', 'hex', 'bg', 'border', 'text', 'gradient'];
  for (const n of STAGE_ORDER) {
    for (const f of required) {
      assert.ok(STAGE_THEME[n][f] !== undefined, `مرحله ${n} فیلد ${f} را ندارد`);
    }
  }
});

test('theme: نام‌های فارسی درست هستند', () => {
  assert.equal(stageName(1), 'جوجه');
  assert.equal(stageName(2), 'نوجوان');
  assert.equal(stageName(3), 'جوان');
  assert.equal(stageName(4), 'بالغ');
  assert.equal(stageName(5), 'رهبر قله');
});

test('theme: مرحله نامعتبر به مرحله ۱ برمی‌گردد', () => {
  assert.equal(getStageTheme(99).key, 'cub');
  assert.equal(getStageTheme(0).key, 'cub');
  assert.equal(getStageTheme(null).key, 'cub');
  assert.equal(getStageTheme(undefined).key, 'cub');
});

test('theme: hex معتبر است', () => {
  for (const n of STAGE_ORDER) assert.match(STAGE_THEME[n].hex, /^#[0-9a-f]{6}$/i);
});
