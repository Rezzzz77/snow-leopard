import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeXP, getStage, addEnergy, spendEnergy, addSnowflakes, startAdventure,
  checkIn, getHighestUnlockedStage, resetDailyGoals, dayKey, dayDiff,
  ENERGY, STAGE_THRESHOLDS
} from '../src/leopard.js';
import { getDefaultData } from '../src/db.js';

const fresh = () => getDefaultData();

test('xp: وضعیت خالی صفر است', () => assert.equal(computeXP(fresh()), 0));
test('xp: قدم‌های مرحله ۱ XP می‌دهند', () => {
  const s = fresh();
  s.s1Steps[0].done = true;
  assert.ok(computeXP(s) > 0);
});
test('xp: تأمل XP می‌دهد', () => {
  const s = fresh();
  s.reflections.push({ text: 'a', at: Date.now() });
  assert.equal(computeXP(s), 15);
});
test('xp: null امن است', () => {
  assert.equal(computeXP(null), 0);
  assert.equal(computeXP(undefined), 0);
});

test('stage: آستانه‌ها درست کار می‌کنند', () => {
  assert.equal(getStage(0).stage, 1);
  assert.equal(getStage(149).stage, 1);
  assert.equal(getStage(150).stage, 2);
  assert.equal(getStage(599).stage, 2);
  assert.equal(getStage(600).stage, 3);
  assert.equal(getStage(1500).stage, 4);
  assert.equal(getStage(3000).stage, 5);
});

test('stage: بالاتر از آستانه آخر ۱۰۰٪', () => {
  const r = getStage(99999);
  assert.equal(r.stage, 5);
  assert.equal(r.progress, 100);
  assert.equal(r.xpForNext, null);
});

test('stage: XP منفی امن', () => {
  assert.equal(getStage(-100).stage, 1);
  assert.equal(getStage(null).stage, 1);
});

test('stage: progress در بازه ۰-۱۰۰', () => {
  for (const xp of [0, 50, 149, 150, 300, 599, 600, 1000, 1499, 1500, 2999, 3000, 5000]) {
    const p = getStage(xp).progress;
    assert.ok(p >= 0 && p <= 100, `progress ${p} برای xp=${xp}`);
  }
});

test('energy: افزودن', () => {
  const s = fresh();
  addEnergy(s, 10, 'test');
  assert.equal(s.energy, 10);
});

test('energy: سقف روزانه', () => {
  const s = fresh();
  addEnergy(s, ENERGY.DAILY_CAP + 100, 'test');
  assert.equal(s.energy, ENERGY.DAILY_CAP);
});

test('energy: منفی نمی‌شود', () => {
  const s = fresh();
  addEnergy(s, -50, 'test');
  assert.equal(s.energy, 0);
});

test('energy: مصرف موفق', () => {
  const s = fresh();
  addEnergy(s, 100, 'test');
  assert.equal(spendEnergy(s, 50), true);
  assert.equal(s.energy, 50);
});

test('energy: مصرف ناموفق', () => {
  const s = fresh();
  addEnergy(s, 10, 'test');
  assert.equal(spendEnergy(s, 50), false);
  assert.equal(s.energy, 10);
});

test('snowflakes: افزودن و منفی‌نشدن', () => {
  const s = fresh();
  addSnowflakes(s, 50);
  assert.equal(s.snowflakes, 50);
  addSnowflakes(s, -100);
  assert.equal(s.snowflakes, 50);
});

test('adventure: بدون انرژی رد', () => {
  const r = startAdventure(fresh(), 1);
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'not-enough-energy');
});

test('adventure: موفق با داستان', () => {
  const s = fresh();
  addEnergy(s, 100, 'test');
  const r = startAdventure(s, 5);
  assert.equal(r.ok, true);
  assert.ok(r.story.length > 10);
  assert.equal(s.energy, 50);
});

test('adventure: با seed قطعی است', () => {
  const a = fresh(); addEnergy(a, 100, 't');
  const b = fresh(); addEnergy(b, 100, 't');
  assert.equal(startAdventure(a, 42).story, startAdventure(b, 42).story);
});

test('streak: اولین چک‌این', () => {
  const r = checkIn(fresh());
  assert.equal(r.count, 1);
  assert.equal(r.reset, false);
});

test('streak: دو بار یک روز', () => {
  const s = fresh();
  checkIn(s);
  assert.equal(checkIn(s).alreadyToday, true);
});

test('streak: روز پیاپی +1', () => {
  const s = fresh();
  const a = new Date('2026-01-10T12:00:00Z').getTime();
  const b = new Date('2026-01-11T12:00:00Z').getTime();
  checkIn(s, a);
  const r = checkIn(s, b);
  assert.equal(r.count, 2);
});

test('streak: gap زیاد → ریست', () => {
  const s = fresh();
  checkIn(s, new Date('2026-01-10T12:00:00Z').getTime());
  const r = checkIn(s, new Date('2026-01-15T12:00:00Z').getTime());
  assert.equal(r.count, 1);
  assert.equal(r.reset, true);
});

test('streak: تعمیر رایگان', () => {
  const s = fresh();
  checkIn(s, new Date('2026-01-10T12:00:00Z').getTime());
  s.streak.freeRepairs = 1;
  const r = checkIn(s, new Date('2026-01-15T12:00:00Z').getTime());
  assert.equal(r.repaired, true);
  assert.equal(s.streak.freeRepairs, 0);
});

test('streak: هر ۷ روز تعمیر می‌دهد', () => {
  const s = fresh();
  const base = new Date('2026-01-01T12:00:00Z').getTime();
  for (let i = 0; i < 7; i++) checkIn(s, base + i * 86400000);
  assert.equal(s.streak.count, 7);
  assert.equal(s.streak.freeRepairs, 1);
});

test('unlock: بدون قدم‌ها → ۱', () => assert.equal(getHighestUnlockedStage(fresh()), 1));
test('unlock: با همه قدم‌ها → ۲', () => {
  const s = fresh();
  s.s1Steps.forEach((x) => (x.done = true));
  assert.equal(getHighestUnlockedStage(s), 2);
});
test('unlock: null → ۱', () => assert.equal(getHighestUnlockedStage(null), 1));

test('dayKey: فرمت درست', () => {
  assert.match(dayKey(new Date('2026-03-05T12:00:00Z').getTime()), /^\d{4}-\d{2}-\d{2}$/);
});

test('dayDiff: محاسبه درست', () => {
  assert.equal(dayDiff('2026-01-01', '2026-01-02'), 1);
  assert.equal(dayDiff('2026-01-01', '2026-01-08'), 7);
  assert.equal(dayDiff('2026-01-31', '2026-02-01'), 1);
});

test('dailyReset: ریست می‌شود', () => {
  const s = fresh();
  s.goals = [{ title: 'a', done: true }];
  s.goalsResetDay = '2000-01-01';
  resetDailyGoals(s);
  assert.equal(s.goals[0].done, false);
});

test('dailyReset: دو بار در روز تغییر نمی‌کند', () => {
  const s = fresh();
  s.goals = [{ title: 'a', done: true }];
  resetDailyGoals(s);
  s.goals[0].done = true;
  resetDailyGoals(s);
  assert.equal(s.goals[0].done, true);
});

test('thresholds: صعودی و پنج‌تایی', () => {
  assert.equal(STAGE_THRESHOLDS.length, 5);
  for (let i = 1; i < STAGE_THRESHOLDS.length; i++) {
    assert.ok(STAGE_THRESHOLDS[i].minXp > STAGE_THRESHOLDS[i - 1].minXp);
  }
});
