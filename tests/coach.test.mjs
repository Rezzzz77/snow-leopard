import test from 'node:test';
import assert from 'node:assert/strict';

import { getNextAction, getMotivation, getOverallProgress, generateCoachCard } from '../src/coach.js';
import { getDefaultData } from '../src/db.js';

const fresh = () => getDefaultData();

test('coach: state خالی اقدام می‌دهد', () => {
  const r = getNextAction(null);
  assert.ok(r.title);
  assert.ok(r.actionId);
});

test('coach: قدم ناتمام اولویت اول', () => {
  const r = getNextAction(fresh());
  assert.equal(r.stage, 1);
  assert.ok(r.actionId.startsWith('s1-'));
});

test('coach: پس از قدم‌ها سراغ هدف', () => {
  const s = fresh();
  s.s1Steps.forEach((x) => (x.done = true));
  s.goals = [{ title: 'آب', done: false }];
  assert.equal(getNextAction(s).actionId, 'goal');
});

test('coach: بدون هدف سراغ گزارش', () => {
  const s = fresh();
  s.s1Steps.forEach((x) => (x.done = true));
  assert.equal(getNextAction(s).actionId, 'report');
});

test('coach: همه کامل → done', () => {
  const s = fresh();
  s.s1Steps.forEach((x) => (x.done = true));
  s.streak.count = 7;
  s.reflections = [{ text: 'x', at: 1 }];
  s.breathingSessions = [{ at: 1 }];
  s.moods = [{ day: '2026-01-01', value: 4 }];
  assert.equal(getNextAction(s).actionId, 'done');
});

test('coach: motivation برای همه مراحل', () => {
  for (let st = 1; st <= 5; st++) {
    const m = getMotivation(st, 0);
    assert.ok(typeof m === 'string' && m.length > 5);
  }
});

test('coach: motivation با seed قطعی', () => {
  assert.equal(getMotivation(1, 3), getMotivation(1, 3));
});

test('coach: progress صفر برای state تازه', () => {
  assert.equal(getOverallProgress(fresh()), 0);
});

test('coach: progress افزایش می‌یابد', () => {
  const s = fresh();
  const p0 = getOverallProgress(s);
  s.s1Steps.forEach((x) => (x.done = true));
  assert.ok(getOverallProgress(s) > p0);
});

test('coach: progress در بازه', () => {
  const s = fresh();
  s.s1Steps.forEach((x) => (x.done = true));
  s.streak.count = 7;
  const p = getOverallProgress(s);
  assert.ok(p >= 0 && p <= 100);
});

test('coach: progress null → ۰', () => assert.equal(getOverallProgress(null), 0));

test('coach: card همه فیلدها را دارد', () => {
  const c = generateCoachCard(fresh());
  for (const f of ['stage', 'stageLabel', 'progress', 'xp', 'nextActionTitle', 'nextActionDetail', 'actionId', 'motivation', 'timestamp']) {
    assert.ok(c[f] !== undefined, `فیلد ${f}`);
  }
});
