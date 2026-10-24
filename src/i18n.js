/**
 * i18n — چندزبانه (فارسی + انگلیسی)
 * ساختار ساده: دیکشنری کلید → متن.
 * انتخاب زبان از localStorage؛ پیش‌فرض فارسی.
 */

const DEFAULT_LOCALE = 'fa';
const LS_KEY = 'snow_leopard_locale';

export const LOCALES = [
  { code: 'fa', label: 'فارسی', dir: 'rtl', flag: '🇮🇷' },
  { code: 'en', label: 'English', dir: 'ltr', flag: '🇬🇧' }
];

/* ---------------- دیکشنری ---------------- */

const STRINGS = {
  fa: {
    'app.name': 'پلنگ برفی',
    'app.tagline': 'یارت اینجاست. هر قدم کوچکی که برای خودت برداری، او هم با تو بزرگ می‌شود.',
    'app.localOnly': 'همه‌چیز روی همین دستگاه ذخیره می‌شود. هیچ‌چیز جایی نمی‌رود.',
    'app.noAccount': 'حساب کاربری لازم نیست.',

    'welcome.nameLabel': 'اسمت را بگو',
    'welcome.namePlaceholder': 'مثلاً: نگار',
    'welcome.whyLabel': 'چرا این مسیر را انتخاب کردی؟',
    'welcome.whyOptional': '(اختیاری)',
    'welcome.whyPlaceholder': 'یک جمله صادقانه با خودت…',
    'welcome.start': 'شروع سفر',

    'header.settings': 'تنظیمات',

    'leopard.growthStage': 'مرحله رشد',
    'leopard.nextGrowth': 'تا رشد بعدی',
    'leopard.maxStage': 'به بالاترین مرحله رشد رسیدی',

    'coach.title': 'کوچ امروز',
    'coach.nextAction': 'اقدام بعدی',

    'stage1.title': 'پنج قدم آغاز',
    'stage1.goals': 'اهداف امروز',
    'stage1.reflections': 'تأمل امروز',
    'stage1.stepsDone': 'از',
    'stage1.stepsUnit': 'اقدام',

    'stage2.streak': 'زنجیره هفت روزه',
    'stage2.nightReport': 'گزارش شبانه',
    'stage2.nightPlaceholder': 'امروز چه چیزی خوب پیش رفت؟',
    'stage2.submitReport': 'ثبت گزارش و ادامه زنجیره',
    'stage2.soundscapes': 'صداهای محیطی',
    'stage2.soundNote': 'صداها کاملاً لوکال ساخته شده‌اند — هیچ چیزی از اینترنت پخش نمی‌شود.',
    'stage2.stop': 'توقف',
    'stage2.breathing': 'تنفس و تمرکز',
    'stage2.startBreathing': 'شروع تنفس',
    'stage2.mood': 'حال امروزت چطور است؟',
    'stage2.adventure': 'ماجراجویی',
    'stage2.adventureDesc': 'با ۵۰ انرژی، پلنگت را به ماجراجویی بفرست تا با یک داستان برگردد.',
    'stage2.startAdventure': 'شروع ماجراجویی',
    'stage2.quests': 'مأموریت‌ها',

    'stage3.insights': 'بینش این هفته',
    'stage3.localAnalysis': 'تحلیل لوکال',
    'stage3.goalsDone': 'اهداف کامل',
    'stage3.reflections': 'تأمل‌ها',
    'stage3.avgMood': 'میانگین حال',
    'stage3.activeDays': 'روزهای فعال',
    'stage3.goal30': 'هدف سی روزه',
    'stage3.journal': 'ژورنال عمیق',
    'stage3.habits': 'عادت‌های بلندمدت',
    'stage3.addHabit': 'افزودن عادت',
    'stage3.criteria': 'معیار عبور مرحله ۳',

    'stage4.pack': 'پک من',
    'stage4.packMax': 'حداکثر ۵ نفر',
    'stage4.vibes': 'ارسال انرژی مثبت',
    'stage4.ritual': 'آیین شخصی',
    'stage4.criteria': 'معیار عبور مرحله ۴',

    'stage5.standards': 'پنج استاندارد راهبر',
    'stage5.mentoring': 'یادداشت منتورینگ',
    'stage5.letter': 'نامه به خودت',
    'stage5.legacy': 'میراث عددی',

    'settings.title': 'تنظیمات',
    'settings.export': 'خروجی گرفتن از همه داده‌ها',
    'settings.import': 'وارد کردن داده‌ها',
    'settings.diagnostics': 'وضعیت ذخیره‌سازی',
    'settings.wipe': 'پاک کردن کامل همه داده‌ها',
    'settings.language': 'زبان',
    'settings.close': 'بستن',
    'settings.privacyNote': 'همه داده‌ها فقط روی همین دستگاه ذخیره می‌شوند. هیچ اتصال شبکه‌ای وجود ندارد.',

    'common.cancel': 'انصراف',
    'common.save': 'ذخیره',
    'common.add': 'افزودن',
    'common.close': 'بستن',
    'common.notYet': 'هنوز باز نشده',
    'common.empty': 'خالی است'
  },

  en: {
    'app.name': 'Snow Leopard',
    'app.tagline': 'Your companion is here. Every small step you take for yourself, it grows with you.',
    'app.localOnly': 'Everything is stored on this device. Nothing leaves it.',
    'app.noAccount': 'No account needed.',

    'welcome.nameLabel': 'What should I call you?',
    'welcome.namePlaceholder': 'e.g. Negar',
    'welcome.whyLabel': 'Why did you choose this path?',
    'welcome.whyOptional': '(optional)',
    'welcome.whyPlaceholder': 'One honest sentence to yourself…',
    'welcome.start': 'Begin the journey',

    'header.settings': 'Settings',

    'leopard.growthStage': 'Growth stage',
    'leopard.nextGrowth': 'Next growth in',
    'leopard.maxStage': 'You reached the highest growth stage',

    'coach.title': "Today's coach",
    'coach.nextAction': 'Next action',

    'stage1.title': 'Five first steps',
    'stage1.goals': "Today's goals",
    'stage1.reflections': 'Reflection',
    'stage1.stepsDone': 'of',
    'stage1.stepsUnit': 'steps',

    'stage2.streak': 'Seven-day streak',
    'stage2.nightReport': 'Evening report',
    'stage2.nightPlaceholder': 'What went well today?',
    'stage2.submitReport': 'Save report and continue',
    'stage2.soundscapes': 'Soundscapes',
    'stage2.soundNote': 'All sounds are generated locally — nothing is streamed.',
    'stage2.stop': 'Stop',
    'stage2.breathing': 'Breath & focus',
    'stage2.startBreathing': 'Start breathing',
    'stage2.mood': 'How are you feeling today?',
    'stage2.adventure': 'Adventure',
    'stage2.adventureDesc': 'Spend 50 energy to send your leopard out and get a story back.',
    'stage2.startAdventure': 'Start adventure',
    'stage2.quests': 'Quests',

    'stage3.insights': "This week's insight",
    'stage3.localAnalysis': 'Local analysis',
    'stage3.goalsDone': 'Goals done',
    'stage3.reflections': 'Reflections',
    'stage3.avgMood': 'Average mood',
    'stage3.activeDays': 'Active days',
    'stage3.goal30': '30-day goal',
    'stage3.journal': 'Deep journal',
    'stage3.habits': 'Long-term habits',
    'stage3.addHabit': 'Add habit',
    'stage3.criteria': 'Stage 3 pass criteria',

    'stage4.pack': 'My pack',
    'stage4.packMax': 'Up to 5 people',
    'stage4.vibes': 'Send good vibes',
    'stage4.ritual': 'Personal ritual',
    'stage4.criteria': 'Stage 4 pass criteria',

    'stage5.standards': 'Five leadership standards',
    'stage5.mentoring': 'Mentoring notes',
    'stage5.letter': 'Letter to yourself',
    'stage5.legacy': 'Numeric legacy',

    'settings.title': 'Settings',
    'settings.export': 'Export all data',
    'settings.import': 'Import data',
    'settings.diagnostics': 'Storage status',
    'settings.wipe': 'Erase all data',
    'settings.language': 'Language',
    'settings.close': 'Close',
    'settings.privacyNote': 'All data stays on this device. There is no network connection.',

    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.notYet': 'Not unlocked yet',
    'common.empty': 'Empty'
  }
};

/* ---------------- API ---------------- */

function store() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch (_) {
    return null;
  }
}

/** زبان فعال */
export function getLocale() {
  const ls = store();
  const saved = ls?.getItem(LS_KEY);
  if (saved && STRINGS[saved]) return saved;
  return DEFAULT_LOCALE;
}

/** تغییر زبان */
export function setLocale(code) {
  if (!STRINGS[code]) return getLocale();
  const ls = store();
  ls?.setItem(LS_KEY, code);
  return code;
}

/** ترجمه یک کلید */
export function t(key, locale = getLocale()) {
  const dict = STRINGS[locale] || STRINGS[DEFAULT_LOCALE];
  return dict[key] ?? STRINGS[DEFAULT_LOCALE][key] ?? key;
}

/** جهت زبان */
export function getDir(locale = getLocale()) {
  return LOCALES.find((l) => l.code === locale)?.dir || 'rtl';
}

/** اعمال زبان روی <html> */
export function applyLocale(code = getLocale()) {
  if (typeof document === 'undefined') return;
  const dir = getDir(code);
  document.documentElement.lang = code;
  document.documentElement.dir = dir;
}

/** همه کلیدهای موجود (برای تست) */
export function allKeys() {
  return Object.keys(STRINGS[DEFAULT_LOCALE]);
}

export function hasLocale(code) {
  return !!STRINGS[code];
}
