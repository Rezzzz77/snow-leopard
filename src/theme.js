/**
 * تم بصری پنج مرحله — پلنگ برفی
 * تنها منبع حقیقت برای رنگ‌ها و نام مرحله.
 */

export const STAGE_THEME = {
  1: {
    key: 'cub',
    name: 'جوجه',
    englishName: 'Cub',
    age: '۷۲ ساعت',
    color: 'var(--stage-1)',
    hex: '#6ba3d6',
    bg: 'bg-sky-950/60',
    border: 'border-sky-600/40',
    text: 'text-sky-300',
    accent: 'bg-sky-500',
    ring: 'ring-sky-500/40',
    gradient: 'from-sky-700 to-sky-950'
  },
  2: {
    key: 'adolescent',
    name: 'نوجوان',
    englishName: 'Adolescent',
    age: '۷ روز',
    color: 'var(--stage-2)',
    hex: '#52b788',
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-600/40',
    text: 'text-emerald-300',
    accent: 'bg-emerald-500',
    ring: 'ring-emerald-500/40',
    gradient: 'from-emerald-700 to-emerald-950'
  },
  3: {
    key: 'young',
    name: 'جوان',
    englishName: 'Young Adult',
    age: '۳۰ روز',
    color: 'var(--stage-3)',
    hex: '#d99a4e',
    bg: 'bg-amber-950/60',
    border: 'border-amber-600/40',
    text: 'text-amber-300',
    accent: 'bg-amber-500',
    ring: 'ring-amber-500/40',
    gradient: 'from-amber-700 to-amber-950'
  },
  4: {
    key: 'adult',
    name: 'بالغ',
    englishName: 'Adult',
    age: '۹۰ روز',
    color: 'var(--stage-4)',
    hex: '#9b7ede',
    bg: 'bg-violet-950/60',
    border: 'border-violet-600/40',
    text: 'text-violet-300',
    accent: 'bg-violet-500',
    ring: 'ring-violet-500/40',
    gradient: 'from-violet-700 to-violet-950'
  },
  5: {
    key: 'guardian',
    name: 'رهبر قله',
    englishName: 'Peak Guardian',
    age: 'مستمر',
    color: 'var(--stage-5)',
    hex: '#e0b94a',
    bg: 'bg-yellow-950/60',
    border: 'border-yellow-500/40',
    text: 'text-yellow-300',
    accent: 'bg-yellow-500',
    ring: 'ring-yellow-500/40',
    gradient: 'from-yellow-700 to-yellow-950'
  }
};

export const STAGE_ORDER = [1, 2, 3, 4, 5];

export function getStageTheme(stage) {
  return STAGE_THEME[stage] || STAGE_THEME[1];
}

export function stageName(stage) {
  return getStageTheme(stage).name;
}
