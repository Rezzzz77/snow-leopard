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

  // مرحله ۳ — جوان
  habits: [],
  s3Goals: [],          // اهداف بلندمدت ۳۰ روزه
  journalEntries: [],   // ژورنال عمیق

  // مرحله ۴ — بالغ
  pack: [],             // حداکثر ۵ نفر نزدیک
  vibesSent: [],
  shares: [],

  // مرحله ۵ — رهبر قله
  mentorNotes: [],
  legacyLetter: '',

  questsClaimed: [],

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
  { key: 'snow', label: 'برف', emoji: '❄', file: 'snow.ogg' },
  { key: 'wind', label: 'باد', emoji: '🌬', file: 'wind.ogg' },
  { key: 'water', label: 'آب', emoji: '💧', file: 'water.ogg' },
  { key: 'shore', label: 'موج', emoji: '🌊', file: 'shore.ogg' },
  { key: 'silence', label: 'سکوت', emoji: '🤍', file: 'silence.ogg' }
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

/* ---------------- مرحله ۳ — جوان (۳۰ روز) ---------------- */
export const S3_PASS = [
  { text: 'حداقل ۱۰ تأمل عمیق نوشته‌ام.', key: 'ref10' },
  { text: 'چهار هفته پیوسته فعال بوده‌ام.', key: 'activeWeek4' },
  { text: 'یک الگوی تکرارشونده در خودم پیدا کرده‌ام.', key: 'pattern' },
  { text: 'برای ۳۰ روز آینده هدف مشخصی دارم.', key: 's3goal' },
  { text: 'می‌دانم کدام فعالیت بیشتر به من کمک می‌کند.', key: 'knows' }
];

/* ---------------- مرحله ۴ — بالغ (۹۰ روز) ---------------- */
export const S4_PASS = [
  { text: 'حداقل یک نفر را در مسیرش همراهی کرده‌ام.', key: 'mentor1' },
  { text: 'عمیق‌ترین عادتم را می‌شناسم و حفظش کرده‌ام.', key: 'deepHabit' },
  { text: 'می‌توانم بدون اپ هم به خودم رسیدگی کنم.', key: 'indep' },
  { text: 'برای خودم آیین شخصی ساخته‌ام.', key: 'ritual' }
];

/* ---------------- مرحله ۵ — رهبر قله ---------------- */
export const S5_STANDARDS = [
  { text: 'هر روز یک قدم کوچک برای خودم برمی‌دارم، حتی وقتی سخت است.', key: 'daily' },
  { text: 'به دیگران هم یاد می‌دهم که چطور از خودشان مراقبت کنند.', key: 'teach' },
  { text: 'الگوی زنده‌ام — نه با حرف، با عمل.', key: 'model' },
  { text: 'مسیرم را می‌شناسم و از آن نمی‌ترسم.', key: 'path' },
  { text: 'میراثی می‌سازم که بدون من هم بماند.', key: 'legacy' }
];

/* ---------------- حالت‌های کاراکتر ---------------- */
export const LEOPARD_MOODS = [
  { key: 'idle', label: 'آرام', emoji: '😌' },
  { key: 'happy', label: 'شاد', emoji: '😊' },
  { key: 'sleeping', label: 'خواب', emoji: '😴' },
  { key: 'exploring', label: 'کاوش', emoji: '🐾' },
  { key: 'proud', label: 'سرافراز', emoji: '✨' }
];

/* ---------------- مشوق‌های مرحله ۳ ---------------- */
export const DEEP_REFLECTION_PROMPTS = [
  'الگویی که این روزها در خودم می‌بینم چیست؟',
  'چه چیزی را مدام به فردا موکول می‌کنم و چرا؟',
  'اگر همین الان یک نفر جای من بود، چه نصیحتی می‌کردم؟',
  'کدام بخش از وجودم را هنوز نپذیرفته‌ام؟',
  'ترس اصلی من در این مسیر چیست؟',
  'چه زمانی بیشتر از خودم فرار می‌کنم؟',
  'کدام عادتم بیش از همه به من خدمت می‌کند؟',
  'اگر هیچ‌کس قضاوت نمی‌کرد، چه چیزی می‌گفتم؟',
  'کجا از خودم انتظار زیادی دارم؟',
  'در پنج سال آینده، بابت چه چیزی از امروز سپاسگزار خواهم بود؟',
  'کدام رابطه‌ام را باید ترمیم کنم؟',
  'زندگی‌ام الان روی چه چیزی سرمایه‌گذاری شده است؟',
  'چه چیزی را نوشته‌ام اما انجام نداده‌ام؟',
  'کدام موفقیت را برای خودم کوچک شمرده‌ام؟',
  'اگر بدترین سناریو رخ دهد، واقعاً چه می‌شود؟',
  'به وقت خودم با چه کسی مرز نگذاشته‌ام؟',
  'کدام بخش از روزم با ارزش‌هایم هم‌راستا نیست؟',
  'چه چیزی را دارم که قبلاً برایش دعا می‌کردم؟',
  'اگر امروز آخرین روزم بود، چه کردم که افتخار کنم؟',
  'در این لحظه، چه چیزی را رها کردن آرامم می‌کند؟'
];
