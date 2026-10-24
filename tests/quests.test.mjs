import test from 'node:test';
import assert from 'node:assert/strict';

import { checkQuests, claimQuest, claimableQuests, questProgress, QUESTS } from '../src/quests.js';
import { getDefaultData } from '../src/db.js';

const fresh = () => getDefaultData();

test('quests: همه تعریف شده', () => {
  assert.ok(QUESTS.length >= 10);
  for (const q of QUESTS) {
    assert.ok(q.key && q.title && q.desc);
    assert.ok(typeof q.reward === 'number');
    assert.ok(typeof q.check === 'function');
  }
});

test('quests: state خالی هیچ‌کدام کامل نیست', () => {
  const all = checkQuests(fresh());
  assert.equal(all.filter((q) => q.done).length, 0);
});

test('quests: هدف → first-goal کامل', () => {
  const s = fresh();
  s.goals = [{ title: 'a', done: false }];
  const q = checkQuests(s).find((x) => x.key === 'first-goal');
  assert.equal(q.done, true);
});

test('quests: claim موفق جایزه می‌دهد', () => {
  const s = fresh();
  s.goals = [{ title: 'a', done: true }];
  const before = s.snowflakes;
  const r = claimQuest(s, 'complete-goal');
  assert.equal(r.ok, true);
  assert.ok(s.snowflakes > before);
  assert.ok(s.questsClaimed.includes('complete-goal'));
});

test('quests: claim دوباره رد می‌شود', () => {
  const s = fresh();
  s.goals = [{ title: 'a', done: true }];
  claimQuest(s, 'complete-goal');
  assert.equal(claimQuest(s, 'complete-goal').ok, false);
});

test('quests: claim ناتمام رد می‌شود', () => {
  assert.equal(claimQuest(fresh(), 'streak-7').ok, false);
});

test('quests: quest ناشناخته رد می‌شود', () => {
  assert.equal(claimQuest(fresh(), 'nonexistent').ok, false);
});

test('quests: claimable فقط کامل‌های ناخواسته', () => {
  const s = fresh();
  s.goals = [{ title: 'a', done: true }];
  const c = claimableQuests(s);
  assert.ok(c.length >= 1);
  assert.ok(c.every((q) => q.done && !q.claimed));
});

test('quests: progress شمارش', () => {
  const s = fresh();
  const p = questProgress(s);
  assert.equal(p.total, QUESTS.length);
  assert.equal(p.done, 0);
});
