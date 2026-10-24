/**
 * ماژول بینش (Insights) — تحلیل الگوهای کاربر
 * کاملاً لوکال، بدون شبکه.
 */

import { dayKey, computeXP } from './leopard.js';

/* ---------------- آمار پایه ---------------- */

/**
 * آمار کلی برای داشبورد مرحله ۳
 */
export function computeStats(state) {
  if (!state) {
    return {
      totalGoals: 0, doneGoals: 0, goalRate: 0,
      totalReflections: 0, totalMoods: 0, totalBreathing: 0,
      avgMood: 0, activeDays: 0, streak: 0, xp: 0
    };
  }

  const goals = state.goals || [];
  const reflections = state.reflections || [];
  const moods = state.moods || [];
  const breathing = state.breathingSessions || [];

  const totalGoals = goals.length;
  const doneGoals = goals.filter((g) => g.done).length;
  const goalRate = totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;

  const avgMood = moods.length > 0
    ? Math.round((moods.reduce((s, m) => s + (m.value || 0), 0) / moods.length) * 10) / 10
    : 0;

  // روزهای فعال = روزهایی که حداقل یک فعالیت داشته‌اند
  const days = new Set();
  reflections.forEach((r) => r.at && days.add(dayKey(r.at)));
  moods.forEach((m) => m.day && days.add(m.day));
  breathing.forEach((b) => b.at && days.add(dayKey(b.at)));
  (state.dailyReports || []).forEach((d) => d.at && days.add(dayKey(d.at)));
  (state.adventures || []).forEach((a) => a.at && days.add(dayKey(a.at)));

  return {
    totalGoals,
    doneGoals,
    goalRate,
    totalReflections: reflections.length,
    totalMoods: moods.length,
    totalBreathing: breathing.length,
    avgMood,
    activeDays: days.size,
    streak: state.streak?.count || 0,
    xp: computeXP(state)
  };
}

/* ---------------- روند حال ---------------- */

/**
 * روند حال در N روز اخیر
 * @returns {{trend:'up'|'down'|'flat'|'unknown', delta:number, points:Array}}
 */
export function moodTrend(state, days = 7) {
  const moods = (state?.moods || []).slice().sort((a, b) => (a.day < b.day ? -1 : 1));
  if (moods.length === 0) return { trend: 'unknown', delta: 0, points: [] };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffKey = dayKey(cutoff.getTime());

  const recent = moods.filter((m) => m.day >= cutoffKey);
  if (recent.length < 2) return { trend: 'unknown', delta: 0, points: recent };

  const fistHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));

  const avg = (arr) => arr.reduce((s, m) => s + m.value, 0) / (arr.length || 1);
  const delta = Math.round((avg(secondHalf) - avg(fistHalf)) * 10) / 10;

  let trend = 'flat';
  if (delta > 0.4) trend = 'up';
  else if (delta < -0.4) trend = 'down';

  return { trend, delta, points: recent };
}

/* ---------------- توزیع تگ‌ها ---------------- */

export function tagDistribution(state) {
  const counts = { mood: 0, insight: 0, challenge: 0, win: 0 };
  (state?.reflections || []).forEach((r) => {
    (r.tags || []).forEach((t) => {
      if (counts[t] !== undefined) counts[t] += 1;
    });
  });
  return counts;
}

/* ---------------- همبستگی‌ها ---------------- */

/**
 * کدام روزها حال بهتر بوده؟ (بر اساس تعداد اهداف تکمیل‌شده)
 * ساده و قابل فهم — نه آمار پیچیده.
 */
export function moodGoalCorrelation(state) {
  const moods = state?.moods || [];
  const goals = state?.goals || [];

  // فقط روز جاری داده داریم برای goals، پس مقایسه ساده
  if (moods.length < 3) {
    return { available: false, insight: 'برای دیدن الگو، حداقل چند روز حال ثبت کن.' };
  }

  const avgMood = moods.reduce((s, m) => s + m.value, 0) / moods.length;

  if (avgMood >= 4) {
    return { available: true, insight: 'حال کلی تو این روزها خوب بوده. همین مسیر را ادامه بده.' };
  }
  if (avgMood <= 2.5) {
    return { available: true, insight: 'حال کلی سخت‌تر بوده. شاید وقتش باشد بار را سبک‌تر کنی.' };
  }
  return { available: true, insight: 'حالت در میانه است. نوسان طبیعی است — ادامه بده.' };
}

/* ---------------- بهترین زمان ---------------- */

/**
 * بهترین ساعت روز برای فعالیت (بر اساس timestamp تأمل‌ها)
 */
export function bestHour(state) {
  const refs = state?.reflections || [];
  if (refs.length < 3) return null;

  const hours = new Array(24).fill(0);
  refs.forEach((r) => {
    if (r.at) hours[new Date(r.at).getHours()] += 1;
  });

  let best = 0;
  for (let h = 1; h < 24; h++) {
    if (hours[h] > hours[best]) best = h;
  }

  const label = best < 6 ? 'سحر' : best < 12 ? 'صبح' : best < 17 ? 'بعدازظهر' : best < 21 ? 'عصر' : 'شب';
  return { hour: best, label, count: hours[best] };
}

/* ---------------- خلاصه هفتگی ---------------- */

export function weeklySummary(state) {
  const stats = computeStats(state);
  const trend = moodTrend(state, 7);
  const tags = tagDistribution(state);

  const lines = [];

  if (stats.doneGoals > 0) {
    lines.push(`${stats.doneGoals} هدف کامل کردی.`);
  }
  if (stats.totalReflections > 0) {
    lines.push(`${stats.totalReflections} بار خودت را نوشتی.`);
  }
  if (stats.totalBreathing > 0) {
    lines.push(`${stats.totalBreathing} جلسه تنفس داشتی.`);
  }
  if (stats.streak > 0) {
    lines.push(`${stats.streak} روز پیوسته.`);
  }
  if (trend.trend === 'up') lines.push('حالت رو به بهتر شدن است.');
  else if (trend.trend === 'down') lines.push('حالت کمی افت کرده — مهربان‌تر با خودت باش.');

  if (tags.win > 0) lines.push(`${tags.win} بار بردهایت را ثبت کردی.`);
  if (tags.challenge > 0) lines.push(`${tags.challenge} چالش را نام بردی — این خودش شجاعت است.`);

  if (lines.length === 0) {
    return 'هنوز داده‌ای برای خلاصه نیست. یک هدف یا یک تأمل شروع خوبی است.';
  }

  return lines.join(' ');
}

/* ---------------- پیشنهاد هوشمند ---------------- */

/**
 * بر اساس الگو، یک پیشنهاد مشخص
 */
export function smartSuggestion(state) {
  const stats = computeStats(state);

  if (stats.totalReflections === 0) {
    return { actionId: 'reflection', text: 'اولین تأملت را بنویس — حتی یک جمله.' };
  }
  if (stats.totalBreathing === 0) {
    return { actionId: 'breathing', text: 'یک چرخه تنفس امتحان کن. فقط ۱۶ ثانیه.' };
  }
  if (stats.totalMoods < 3) {
    return { actionId: 'mood', text: 'چند روز حال خودت را ثبت کن تا الگو ببینی.' };
  }

  const trend = moodTrend(state, 7);
  if (trend.trend === 'down') {
    return { actionId: 'breathing', text: 'حالت افت کرده. یک تنفس ۴-۷-۸ می‌تواند کمک کند.' };
  }
  if (trend.trend === 'up') {
    return { actionId: 'reflection', text: 'خوب پیش می‌روی — این لحظه را ثبت کن.' };
  }
  if (stats.streak === 0) {
    return { actionId: 'report', text: 'امروز را ثبت کن تا زنجیره شروع شود.' };
  }

  return { actionId: 'done', text: 'همه‌چیز مرتب است. امروز استراحت کن.' };
}
