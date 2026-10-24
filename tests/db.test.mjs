import test from 'node:test';
import assert from 'node:assert/strict';

import { mergeWithDefaults, exportData, importData, getDefaultData } from '../src/db.js';
import { DEFAULT_DATA } from '../src/defaults.js';

test('db: mergeWithDefaults(null) پیش‌فرض کامل می‌دهد', () => {
  const m = mergeWithDefaults(null);
  assert.equal(m.xp, 0);
  assert.equal(m.stage, 1);
  assert.equal(m.s1Steps.length, DEFAULT_DATA.s1Steps.length);
});

test('db: داده کاربر حفظ می‌شود', () => {
  const m = mergeWithDefaults({ xp: 250, why: 'سلامت', stage: 2 });
  assert.equal(m.xp, 250);
  assert.equal(m.why, 'سلامت');
  assert.equal(m.stage, 2);
});

test('db: آرایه‌های کاربر حفظ می‌شوند', () => {
  const m = mergeWithDefaults({ goals: [{ title: 'آب', done: true }] });
  assert.equal(m.goals.length, 1);
  assert.equal(m.goals[0].title, 'آب');
});

test('db: آرایه خالی کاربر خالی می‌ماند', () => {
  assert.deepEqual(mergeWithDefaults({ reflections: [] }).reflections, []);
});

test('db: s1Steps خالی با seed پر می‌شود', () => {
  const m = mergeWithDefaults({ s1Steps: [] });
  assert.equal(m.s1Steps.length, DEFAULT_DATA.s1Steps.length);
});

test('db: کلیدهای گم‌شده در آبجکت تودرتو پر می‌شوند', () => {
  const m = mergeWithDefaults({ streak: { count: 3 } });
  assert.equal(m.streak.count, 3);
  assert.equal(m.streak.lastCheckin, null);
  assert.equal(m.streak.freeRepairs, 0);
});

test('db: ورودی نامعتبر امن است', () => {
  assert.doesNotThrow(() => mergeWithDefaults(undefined));
  assert.doesNotThrow(() => mergeWithDefaults('string'));
  assert.doesNotThrow(() => mergeWithDefaults(42));
});

test('db: exportData ساختار درست می‌دهد', () => {
  const parsed = JSON.parse(exportData(getDefaultData()));
  assert.equal(parsed.app, 'snow-leopard');
  assert.ok(parsed.exportedAt);
  assert.ok(parsed.data);
});

test('db: importData چرخه کامل را حفظ می‌کند', () => {
  const s = getDefaultData();
  s.xp = 999;
  s.why = 'تست';
  const r = importData(exportData(s));
  assert.equal(r.ok, true);
  assert.equal(r.state.xp, 999);
  assert.equal(r.state.why, 'تست');
});

test('db: importData با JSON خام کار می‌کند', () => {
  const r = importData(JSON.stringify({ xp: 42, stage: 2 }));
  assert.equal(r.ok, true);
  assert.equal(r.state.xp, 42);
});

test('db: importData با JSON خراب خطا می‌دهد', () => {
  const r = importData('{not json');
  assert.equal(r.ok, false);
  assert.ok(r.error);
});

test('db: importData با null خطا می‌دهد', () => {
  assert.equal(importData('null').ok, false);
});

test('db: getDefaultData نمونه مستقل می‌دهد', () => {
  const a = getDefaultData();
  const b = getDefaultData();
  a.xp = 100;
  assert.equal(b.xp, 0);
});
