/**
 * Questها — راهنمای کشف امکانات
 * هر quest یک شرط دارد که از state ارزیابی می‌شود.
 */

import { computeStats } from './insights.js';

export const QUESTS = [
  {
    key: 'first-goal',
    title: 'اولین هدف',
    desc: 'یک هدف کوچک برای امروز اضافه کن.',
    reward: 25,
    check: (s) => (s.goals || []).length >= 1
  },
  {
    key: 'complete-goal',
    title: 'اولین تیک',
    desc: 'یک هدف را کامل کن و انرژی بگیر.',
    reward: 25,
    check: (s) => (s.goals || []).some((g) => g.done)
  },
  {
    key: 'first-reflection',
    title: 'اولین تأمل',
    desc: 'یک پرامپت بگیر و چند جمله بنویس.',
    reward: 30,
    check: (s) => (s.reflections || []).length >= 1
  },
  {
    key: 'first-breath',
    title: 'اولین نفس',
    desc: 'یک جلسه تنفس انجام بده.',
    reward: 30,
    check: (s) => (s.breathingSessions || []).length >= 1
  },
  {
    key: 'first-mood',
    title: 'اولین حال',
    desc: 'حال امروزت را ثبت کن.',
    reward: 20,
    check: (s) => (s.moods || []).length >= 1
  },
  {
    key: 'first-checkin',
    title: 'اولین چک‌این',
    desc: 'گزارش شبانه بنویس و زنجیره را شروع کن.',
    reward: 25,
    check: (s) => (s.streak?.count || 0) >= 1
  },
  {
    key: 'streak-3',
    title: 'سه روز پیوسته',
    desc: 'سه روز پشت سر هم چک‌این کن.',
    reward: 50,
    check: (s) => (s.streak?.count || 0) >= 3
  },
  {
    key: 'streak-7',
    title: 'هفت روز پیوسته',
    desc: 'یک هفته کامل بدون شکستن زنجیره.',
    reward: 100,
    check: (s) => (s.streak?.count || 0) >= 7
  },
  {
    key: 'first-adventure',
    title: 'اولین ماجراجویی',
    desc: 'پلنگت را با ۵۰ انرژی به سفر بفرست.',
    reward: 40,
    check: (s) => (s.adventures || []).length >= 1
  },
  {
    key: 'five-reflections',
    title: 'پنج تأمل',
    desc: 'پنج بار با خودت حرف بزن.',
    reward: 60,
    check: (s) => (s.reflections || []).length >= 5
  },
  {
    key: 'discovery',
    title: 'اولین کشف',
    desc: 'پلنگت چیزی را کشف کند که دوست دارد.',
    reward: 40,
    check: (s) => (s.discoveries || []).length >= 1
  },
  {
    key: 'all-tags',
    title: 'چهار تگ',
    desc: 'از هر چهار تگ تأمل حداقل یک‌بار استفاده کن.',
    reward: 55,
    check: (s) => {
      const used = new Set();
      (s.reflections || []).forEach((r) => (r.tags || []).forEach((t) => used.add(t)));
      return used.size >= 4;
    }
  },
  {
    key: 'active-week',
    title: 'هفت روز فعال',
    desc: 'در هفت روز مختلف فعالیت داشته باش.',
    reward: 80,
    check: (s) => computeStats(s).activeDays >= 7
  }
];

/**
 * وضعیت همه questها
 * @returns {Array<{key,title,desc,reward,done,claimed}>}
 */
export function checkQuests(state) {
  const claimed = new Set(state?.questsClaimed || []);
  return QUESTS.map((q) => {
    let done = false;
    try {
      done = !!q.check(state || {});
    } catch (_) {
      done = false;
    }
    return {
      key: q.key,
      title: q.title,
      desc: q.desc,
      reward: q.reward,
      done,
      claimed: claimed.has(q.key)
    };
  });
}

/**
 * questهای آماده دریافت جایزه
 */
export function claimableQuests(state) {
  return checkQuests(state).filter((q) => q.done && !q.claimed);
}

/**
 * دریافت جایزه یک quest
 * @returns {{ok:boolean, reward?:number, reason?:string}}
 */
export function claimQuest(state, key) {
  if (!state) return { ok: false, reason: 'no-state' };
  if (!state.questsClaimed) state.questsClaimed = [];

  const q = QUESTS.find((x) => x.key === key);
  if (!q) return { ok: false, reason: 'unknown-quest' };
  if (state.questsClaimed.includes(key)) return { ok: false, reason: 'already-claimed' };

  let done = false;
  try {
    done = !!q.check(state);
  } catch (_) {
    done = false;
  }
  if (!done) return { ok: false, reason: 'not-complete' };

  state.questsClaimed.push(key);
  state.snowflakes = (state.snowflakes || 0) + q.reward;

  return { ok: true, reward: q.reward };
}

/**
 * تعداد questهای کامل‌شده
 */
export function questProgress(state) {
  const all = checkQuests(state);
  return {
    total: all.length,
    done: all.filter((q) => q.done).length,
    claimed: all.filter((q) => q.claimed).length
  };
}
