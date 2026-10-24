/**
 * کوچ — اقدام بعدی + انگیزه + پیشرفت
 * کاملاً لوکال، بدون شبکه.
 */

import { computeXP, getStage, getHighestUnlockedStage } from './leopard.js';

const MOTIVATION = {
  1: [
    'شروع، سخت‌ترین قدم است — و تو همین حالا برداشتی.',
    'لازم نیست کامل باشی؛ فقط حاضر باش.',
    'هر قدم کوچک، یک آجر از قلعه‌ی توست.',
    'پلنگت منتظر است ببیند امروز چه می‌کنی.',
    '۷۲ ساعت اول، بنای همه‌ی روزهای بعد است.'
  ],
  2: [
    'تداوم از انگیزه قوی‌تر است. امروز هم حاضر شو.',
    'زنجیره با یک روز ساخته می‌شود، نه با یک هفته.',
    'بدن و ذهنت دارند یاد می‌گیرند. صبور باش.',
    'یک نفس عمیق، یک قدم کوچک، همین.',
    'امروز سخت است؟ فقط یک کار را انجام بده.'
  ],
  3: [
    'ساختن، یعنی تکرار آگاهانه. ادامه بده.',
    'عمیق‌تر شو — نه سریع‌تر.',
    'الگوها دارند شکل می‌گیرند. نگاهشان کن.',
    'تو داری کسی می‌شوی که دیروز نبودی.',
    'هر تأمل، یک آینه است.'
  ],
  4: [
    'بالغ، کسی است که خودش را می‌شناسد.',
    'عمق، جای عرض را می‌گیرد.',
    'آرام و استوار — مثل پلنگ برفی.',
    'مسیرت مال خودت است.'
  ],
  5: [
    'قله، جایی است که آرام می‌شوی و می‌بینی.',
    'حالا تو راه را نشان می‌دهی.',
    'میراث، همان چیزی است که بدون تو هم می‌ماند.'
  ]
};

export function getNextAction(state) {
  if (!state) {
    return { title: 'شروع', detail: 'اولین قدم را بردار.', actionId: 'start', stage: 1 };
  }

  const steps = state.s1Steps || [];
  const pendingStep = steps.find((s) => !s.done);
  if (pendingStep) {
    return {
      title: `قدم «${pendingStep.title}»`,
      detail: pendingStep.desc,
      actionId: `s1-${pendingStep.key}`,
      stage: 1
    };
  }

  const goals = state.goals || [];
  const undoneGoal = goals.find((g) => !g.done);
  if (undoneGoal) {
    return {
      title: `هدف: ${undoneGoal.title}`,
      detail: 'یک تیک کوچک، انرژی تازه برای پلنگت.',
      actionId: 'goal',
      stage: getHighestUnlockedStage(state)
    };
  }

  const streak = state.streak?.count || 0;
  if (streak < 7) {
    return {
      title: `گزارش شبانه — روز ${streak + 1} از ۷`,
      detail: 'امروز چه چیزی خوب بود؟ چند جمله بنویس.',
      actionId: 'report',
      stage: 2
    };
  }

  if ((state.reflections || []).length === 0) {
    return {
      title: 'اولین تأمل',
      detail: 'یک پرامپت بگیر و چند جمله بنویس.',
      actionId: 'reflection',
      stage: 1
    };
  }

  if ((state.breathingSessions || []).length === 0) {
    return {
      title: 'اولین تنفس',
      detail: 'یک الگوی تنفس انتخاب کن و یک چرخه انجام بده.',
      actionId: 'breathing',
      stage: 2
    };
  }

  if ((state.moods || []).length === 0) {
    return {
      title: 'حال امروزت',
      detail: 'یک ایموجی انتخاب کن. همین.',
      actionId: 'mood',
      stage: 2
    };
  }

  return {
    title: 'همه‌چیز مرتب است',
    detail: 'امروز کارت را کردی. استراحت کن و فردا برگرد.',
    actionId: 'done',
    stage: getHighestUnlockedStage(state)
  };
}

export function getMotivation(stage, seed) {
  const pool = MOTIVATION[stage] || MOTIVATION[1];
  const i = typeof seed === 'number' ? seed % pool.length : Math.floor(Math.random() * pool.length);
  return pool[i];
}

export function getOverallProgress(state) {
  if (!state) return 0;
  let done = 0;
  let total = 0;

  const steps = state.s1Steps || [];
  total += steps.length * 2;
  done += steps.filter((s) => s.done).length * 2;

  total += 7;
  done += Math.min(state.streak?.count || 0, 7);

  total += 10;
  done += Math.min((state.reflections || []).length, 10);

  total += 5;
  done += Math.min((state.breathingSessions || []).length, 5);

  total += 7;
  done += Math.min((state.moods || []).length, 7);

  total += 7;
  done += Math.min((state.dailyReports || []).length, 7);

  return total > 0 ? Math.round((done / total) * 100) : 0;
}

export function generateCoachCard(state) {
  const xp = computeXP(state);
  const stageInfo = getStage(xp);
  const next = getNextAction(state);

  return {
    stage: stageInfo.stage,
    stageLabel: stageInfo.label,
    progress: getOverallProgress(state),
    xp,
    nextActionTitle: next.title,
    nextActionDetail: next.detail,
    actionId: next.actionId,
    motivation: getMotivation(stageInfo.stage),
    timestamp: Date.now()
  };
}
