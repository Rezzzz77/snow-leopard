/**
 * داده‌های پیش‌فرض (Seed) — پلنگ برفی
 * فقط در اولین اجرا استفاده می‌شود. کاربر می‌تواند همه را تغییر دهد.
 */

export const DEFAULT_DATA = {
  version: 1,

  user: null,
  createdAt: null,
  why: '',
  story: '',

  xp: 0,
  energy: 0,
  snowflakes: 0,
  stage: 1,
  discoveries: [],

  s1Steps: [
    { key: 'goal', title: 'هدف من', desc: 'بنویس چرا این مسیر را انتخاب کردی.', done: false },
    { key: 'commit', title: 'تعهد', desc: 'به خودت قول بده که ۷۲ ساعت ادامه بدهی.', done: false },
    { key: 'morning', title: 'آیین صبح', desc: 'یک کار کوچک صبحگاهی انتخاب کن.', done: false },
    { key: 'evening', title: 'آیین شب', desc: 'یک کار کوچک شبانه انتخاب کن.', done: false },
    { key: 'first', title: 'اولین تأمل', desc: 'اولین یادداشت امروزت را بنویس.', done: false }
  ],

  goals: [],
  goalsResetDay: null,
  reflections: [],

  streak: { count: 0, lastCheckin: null, freeRepairs: 0 },
  dailyReports: [],
  breathingSessions: [],
  moods: [],
  soundscapePreference: 'snow',
  adventures: [],

  settings: { reduceMotion: false }
};

export const GOAL_TYPES = [
  { key: 'water', label: 'آب', emoji: '💧', color: 'sky' },
  { key: 'move', label: 'حرکت', emoji: '🏃', color: 'emerald' },
  { key: 'mind', label: 'ذهن‌آگاهی', emoji: '🧘', color: 'violet' },
  { key: 'sleep', label: 'خواب', emoji: '🌙', color: 'indigo' },
  { key: 'custom', label: 'سفارشی', emoji: '⭐', color: 'amber' }
];

export const MOOD_SCALE = [
  { value: 1, emoji: '😞', label: 'خیلی بد' },
  { value: 2, emoji: '🙁', label: 'بد' },
  { value: 3, emoji: '😐', label: 'معمولی' },
  { value: 4, emoji: '🙂', label: 'خوب' },
  { value: 5, emoji: '😊', label: 'خیلی خوب' }
];

export const BREATHING_PATTERNS = [
  { key: 'box', label: 'جعبه', inhale: 4, hold: 4, exhale: 4, holdAfter: 4, desc: '۴-۴-۴-۴ — آرام‌سازی سریع' },
  { key: '478', label: '۴-۷-۸', inhale: 4, hold: 7, exhale: 8, holdAfter: 0, desc: 'برای خواب و اضطراب' },
  { key: 'coherent', label: 'هماهنگ', inhale: 5.5, hold: 0, exhale: 5.5, holdAfter: 0, desc: '۵.۵ ثانیه دم و بازدم' }
];

export const SOUNDSCAPES = [
  { key: 'snow', label: 'برف', emoji: '❄' },
  { key: 'wind', label: 'باد', emoji: '🌬' },
  { key: 'water', label: 'آب', emoji: '💧' },
  { key: 'silence', label: 'سکوت', emoji: '🤍' }
];

export const REFLECTION_TAGS = [
  { key: 'mood', label: 'حال', emoji: '💭' },
  { key: 'insight', label: 'بینش', emoji: '💡' },
  { key: 'challenge', label: 'چالش', emoji: '🌪' },
  { key: 'win', label: 'برد', emoji: '🏆' }
];

export const S1_PASS = [
  { text: 'هدفم را نوشتم و می‌دانم چرا اینجایم.', key: 'goal' },
  { text: 'به خودم قول دادم ۷۲ ساعت ادامه بدهم.', key: 'commit' },
  { text: 'یک آیین صبحگاهی انتخاب کردم.', key: 'morning' },
  { text: 'یک آیین شبانه انتخاب کردم.', key: 'evening' },
  { text: 'اولین تأملم را ثبت کردم.', key: 'first' }
];

export const S2_PASS = [
  { text: 'هفت روز پیوسته چک‌این کردم.', key: 'streak7' },
  { text: 'حداقل یک جلسه تنفس انجام دادم.', key: 'breath' },
  { text: 'حال حداقل سه روز را ثبت کردم.', key: 'mood3' }
];
