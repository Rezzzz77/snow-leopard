import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeStats, moodTrend, tagDistribution, moodGoalCorrelation,
  bestHour, weeklySummary, smartSuggestion
} from '../src/insights.js';
import { getDefaultData } from '../src/db.js';

const fresh = () => getDefaultData();

test('stats: خالی صفر', () => {
  const s = computeStats(null);
  assert.equal(s.totalGoals, 0);
  assert.equal(s.avgMood, 0);
});

test('stats: اهداف شمارش می‌شوند', () => {
  const st = fresh();
  st.goals = [{ done: true }, { done: false }];
  const s = computeStats(st);
  assert.equal(s.totalGoals, 2);
  assert.equal(s.doneGoals, 1);
  assert.equal(s.goalRate, 50);
});

test('stats: میانگین حال', () => {
  const st = fresh();
  st.moods = [{ value: 4 }, { value: 2 }];
  assert.equal(computeStats(st).avgMood, 3);
});

test('trend: بدون داده unknown', () => {
  assert.equal(moodTrend(fresh()).trend, 'unknown');
});

test('trend: رو به بالا', () => {
  const st = fresh();
  const d = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  st.moods = [
    { day: d(6), value: 1 }, { day: d(5), value: 2 },
    { day: d(2), value: 4 }, { day: d(1), value: 5 }
  ];
  assert.equal(moodTrend(st, 7).trend, 'up');
});

test('tags: شمارش درست', () => {
  const st = fresh();
  st.reflections = [{ tags: ['win', 'mood'] }, { tags: ['win'] }];
  const t = tagDistribution(st);
  assert.equal(t.win, 2);
  assert.equal(t.mood, 1);
});

test('correlation: داده کم → available false', () => {
  assert.equal(moodGoalCorrelation(fresh()).available, false);
});

test('bestHour: بدون داده null', () => {
  assert.equal(bestHour(fresh()), null);
});

test('summary: خالی پیام راهنما', () => {
  const s = weeklySummary(fresh());
  assert.ok(typeof s === 'string' && s.length > 10);
});

test('suggestion: اولین پیشنهاد تأمل است', () => {
  assert.equal(smartSuggestion(fresh()).actionId, 'reflection');
});
