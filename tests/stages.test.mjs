import test from 'node:test';
import assert from 'node:assert/strict';

import { getStage, computeXP } from '../src/leopard.js';
import {
  getHighestUnlockedStage, stage3Met, stage4Met,
  countActiveDays, nextStageProgress
} from '../src/leopard.js';
import { getDefaultData } from '../src/db.js';

const fresh = () => getDefaultData();
const now = Date.now();

function at(daysAgo) {
  return now - daysAgo * 86400000;
}

test('stage3: بدون داده false', () => {
  assert.equal(stage3Met(fresh()), false);
  assert.equal(stage3Met(null), false);
});

test('stage3: با ۱۰ تأمل + ۲۸ روز + هدف true', () => {
  const s = fresh();
  // ۱۰ تأمل در ۲۸ روز مختلف
  s.reflections = Array.from({ length: 28 }, (_, i) => ({ text: 'x', at: at(i) }));
  s.s3Goals = [{ title: 'g', done: false }];
  assert.equal(countActiveDays(s), 28);
  assert.equal(stage3Met(s), true);
});

test('stage3: با ۱۰ تأمل در ۱۰ روز → false (روز کافی نیست)', () => {
  const s = fresh();
  s.reflections = Array.from({ length: 10 }, (_, i) => ({ text: 'x', at: at(i) }));
  s.s3Goals = [{ title: 'g', done: false }];
  assert.equal(stage3Met(s), false);
});

test('stage4: بدون پک false', () => {
  assert.equal(stage4Met(fresh()), false);
});

test('stage4: با پک + ۵ وایب + عادت ۲۱ روزه true', () => {
  const s = fresh();
  s.pack = [{ name: 'a' }];
  s.vibesSent = Array(5).fill({ key: 'wave', at: now });
  s.habits = [{ title: 'h', streak: 21 }];
  assert.equal(stage4Met(s), true);
});

test('countActiveDays: روزهای متمایز', () => {
  const s = fresh();
  s.reflections = [{ text: 'a', at: at(0) }, { text: 'b', at: at(1) }];
  s.moods = [{ day: '2026-01-01', value: 4 }];
  assert.equal(countActiveDays(s), 3);
});

test('countActiveDays: خالی صفر', () => {
  assert.equal(countActiveDays(fresh()), 0);
});

test('unlock: مرحله ۴ با تکمیل شرایط ۳', () => {
  const s = fresh();
  s.s1Steps.forEach((x) => (x.done = true));
  s.streak.count = 7;
  s.reflections = Array.from({ length: 28 }, (_, i) => ({ text: 'x', at: at(i) }));
  s.s3Goals = [{ title: 'g', done: false }];
  assert.equal(getHighestUnlockedStage(s), 4);
});

test('unlock: مرحله ۳ وقتی شرایط ۳ ناقص است', () => {
  const s = fresh();
  s.s1Steps.forEach((x) => (x.done = true));
  s.streak.count = 7;
  assert.equal(getHighestUnlockedStage(s), 3);
});

test('nextStageProgress: مرحله ۲ → ۳', () => {
  const s = fresh();
  s.s1Steps.forEach((x) => (x.done = true));
  s.streak.count = 3;
  const p = nextStageProgress(s);
  assert.equal(p.stage, 3);
  assert.ok(p.pct > 0 && p.pct < 100);
});

test('nextStageProgress: قله ۱۰۰٪', () => {
  const s = fresh();
  s.s1Steps.forEach((x) => (x.done = true));
  s.streak.count = 7;
  s.reflections = Array.from({ length: 28 }, (_, i) => ({ text: 'x', at: at(i) }));
  s.s3Goals = [{ title: 'g', done: false }];
  s.pack = [{ name: 'a' }];
  s.vibesSent = Array(5).fill({ at: now });
  s.habits = [{ title: 'h', streak: 21 }];
  assert.equal(getHighestUnlockedStage(s), 5);
  assert.equal(nextStageProgress(s).pct, 100);
});

test('xp: شامل مراحل بالاتر می‌شود', () => {
  const s = fresh();
  const before = computeXP(s);
  s.journalEntries = [{ text: 'j', at: now }];
  assert.ok(computeXP(s) >= before);
});
