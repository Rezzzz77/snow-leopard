/**
 * موتور پلنگ برفی — رشد، انرژی، ماجراجویی
 * بدون وابستگی به DOM. کاملاً قابل تست.
 */

import { randomStory, DISCOVERIES } from './stories.js';

export const ENERGY = {
  PER_GOAL: 10,
  PER_CHECKIN: 5,
  PER_BREATHING: 8,
  PER_REFLECTION: 7,
  ADVENTURE_COST: 50,
  DAILY_CAP: 150
};

export const AWARDS = {
  PER_QUEST: 50,
  PER_ADVENTURE: 5,
  PER_WEEK_STREAK: 100
};

export const STAGE_THRESHOLDS = [
  { stage: 1, minXp: 0, label: 'جوجه', visual: 'stage-1' },
  { stage: 2, minXp: 150, label: 'نوجوان', visual: 'stage-2' },
  { stage: 3, minXp: 600, label: 'جوان', visual: 'stage-3' },
  { stage: 4, minXp: 1500, label: 'بالغ', visual: 'stage-4' },
  { stage: 5, minXp: 3000, label: 'رهبر قله', visual: 'stage-5' }
];

export function computeXP(state) {
  if (!state) return 0;
  let xp = 0;
  xp += (state.goals || []).filter((g) => g.done).length * 10;
  xp += (state.reflections || []).length * 15;
  xp += (state.breathingSessions || []).length * 12;
  xp += (state.moods || []).length * 8;
  xp += (state.streak?.count || 0) * 20;
  xp += (state.dailyReports || []).length * 10;
  xp += (state.adventures || []).length * 25;
  xp += (state.s1Steps || []).filter((s) => s.done).length * 10;
  return Math.max(0, Math.floor(xp));
}

export function getStage(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  let current = STAGE_THRESHOLDS[0];
  let next = null;

  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (safeXp >= STAGE_THRESHOLDS[i].minXp) {
      current = STAGE_THRESHOLDS[i];
      next = STAGE_THRESHOLDS[i + 1] || null;
    } else break;
  }

  const xpInStage = safeXp - current.minXp;
  const span = next ? next.minXp - current.minXp : 0;
  const progress = next ? Math.min(100, Math.round((xpInStage / span) * 100)) : 100;

  return {
    stage: current.stage,
    label: current.label,
    visual: current.visual,
    progress,
    nextThreshold: next ? next.minXp : null,
    xpInStage,
    xpForNext: next ? next.minXp - safeXp : null
  };
}

export function addEnergy(state, amount, source = 'unknown') {
  if (!state) return { state, added: 0, capped: false };
  const today = dayKey();
  if (!state.energyLog || state.energyLog.day !== today) {
    state.energyLog = { day: today, total: 0 };
  }
  const remainingToday = Math.max(0, ENERGY.DAILY_CAP - state.energyLog.total);
  const wanted = Math.max(0, Math.floor(Number(amount) || 0));
  const added = Math.min(wanted, remainingToday);
  state.energy = Math.max(0, (state.energy || 0) + added);
  state.energyLog.total += added;
  return { state, added, capped: added < wanted, source };
}

export function spendEnergy(state, amount) {
  if (!state) return false;
  const cost = Math.max(0, Math.floor(Number(amount) || 0));
  if ((state.energy || 0) < cost) return false;
  state.energy -= cost;
  return true;
}

export function addSnowflakes(state, amount) {
  if (!state) return 0;
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  state.snowflakes = (state.snowflakes || 0) + n;
  return state.snowflakes;
}

export function startAdventure(state, seed) {
  if (!state) return { ok: false, reason: 'no-state' };

  if (!spendEnergy(state, ENERGY.ADVENTURE_COST)) {
    return { ok: false, reason: 'not-enough-energy' };
  }

  const story = randomStory(seed);
  const roll = typeof seed === 'number' ? (seed * 7919) % 100 : Math.random() * 100;

  let discovery = null;
  if (roll < 20) {
    const idx = typeof seed === 'number' ? seed % DISCOVERIES.length : Math.floor(Math.random() * DISCOVERIES.length);
    const d = DISCOVERIES[idx];
    discovery = d;
    if (!state.discoveries) state.discoveries = [];
    if (!state.discoveries.some((x) => x.key === d.key)) {
      state.discoveries.push({ ...d, foundAt: Date.now() });
    }
  }

  if (!state.adventures) state.adventures = [];
  state.adventures.push({ story, discovery: discovery ? discovery.key : null, at: Date.now() });
  addSnowflakes(state, AWARDS.PER_ADVENTURE);

  return { ok: true, story, discovery };
}

export function checkIn(state, now = Date.now()) {
  if (!state) return { ok: false, count: 0, reset: false, alreadyToday: false };
  if (!state.streak) state.streak = { count: 0, lastCheckin: null, freeRepairs: 0 };

  const today = dayKey(now);
  const last = state.streak.lastCheckin;

  if (last === today) {
    return { ok: true, count: state.streak.count, reset: false, alreadyToday: true };
  }

  if (!last) {
    state.streak.count = 1;
    state.streak.lastCheckin = today;
    addEnergy(state, ENERGY.PER_CHECKIN, 'checkin');
    return { ok: true, count: 1, reset: false, alreadyToday: false };
  }

  const gap = dayDiff(last, today);

  if (gap === 1) {
    state.streak.count += 1;
    state.streak.lastCheckin = today;
    addEnergy(state, ENERGY.PER_CHECKIN, 'checkin');
    if (state.streak.count % 7 === 0) {
      state.streak.freeRepairs = (state.streak.freeRepairs || 0) + 1;
      addSnowflakes(state, AWARDS.PER_WEEK_STREAK);
    }
    return { ok: true, count: state.streak.count, reset: false, alreadyToday: false };
  }

  if (gap > 1 && (state.streak.freeRepairs || 0) > 0) {
    state.streak.freeRepairs -= 1;
    state.streak.count += 1;
    state.streak.lastCheckin = today;
    addEnergy(state, ENERGY.PER_CHECKIN, 'checkin');
    return { ok: true, count: state.streak.count, reset: false, alreadyToday: false, repaired: true };
  }

  state.streak.count = 1;
  state.streak.lastCheckin = today;
  addEnergy(state, ENERGY.PER_CHECKIN, 'checkin');
  return { ok: true, count: 1, reset: true, alreadyToday: false };
}

export function getHighestUnlockedStage(state) {
  if (!state) return 1;
  const s1Done = (state.s1Steps || []).every((s) => s.done);
  if (!s1Done) return 1;
  const streak = state.streak?.count || 0;
  if (streak < 7) return 2;
  const xp = computeXP(state);
  const { stage } = getStage(xp);
  return Math.min(2, stage);
}

export function resetDailyGoals(state, now = Date.now()) {
  if (!state) return state;
  const today = dayKey(now);
  if (state.goalsResetDay === today) return state;
  state.goalsResetDay = today;
  state.goals = (state.goals || []).map((g) => ({ ...g, done: false, doneAt: null }));
  return state;
}

export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayDiff(fromKey, toKey) {
  const [y1, m1, d1] = fromKey.split('-').map(Number);
  const [y2, m2, d2] = toKey.split('-').map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86400000);
}
