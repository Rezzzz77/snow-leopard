/**
 * پلنگ برفی — منطق اصلی
 */

import { loadFromStorage, saveToStorage, exportData, importData, wipeStorage } from './src/db.js';
import { GOAL_TYPES, MOOD_SCALE, BREATHING_PATTERNS, REFLECTION_TAGS } from './src/defaults.js';
import { randomPrompt } from './src/prompts.js';
import {
  computeXP, getStage, addEnergy, startAdventure, checkIn,
  getHighestUnlockedStage, resetDailyGoals, dayKey, ENERGY
} from './src/leopard.js';
import { generateCoachCard } from './src/coach.js';
import { getStageTheme, STAGE_ORDER } from './src/theme.js';
import { computeStats, moodTrend, weeklySummary, smartSuggestion, tagDistribution } from './src/insights.js';
import { checkQuests, claimQuest, questProgress } from './src/quests.js';
import { S3_PASS, S4_PASS, S5_STANDARDS, DEEP_REFLECTION_PROMPTS } from './src/defaults.js';
import { nextStageProgress, stage3Met, stage4Met, countActiveDays } from './src/leopard.js';
import { SOUNDSCAPES } from './src/defaults.js';
import { toggleSoundscape, stopSoundscape, release as releaseAudio, getCurrentKey, isPlaying } from './src/audio.js';
import { LOCALES, getLocale, setLocale, applyLocale, t, getDir } from './src/i18n.js';

let appState = resetDailyGoals(loadFromStorage());
let activeStageView = 1;
let breathingTimer = null;
let breathingRunning = false;
let currentPrompt = randomPrompt();
let currentReflectionTags = new Set();
let selectedPattern = BREATHING_PATTERNS[0].key;

const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toFa(n) {
  return String(n).replace(/\d/g, (d) => faDigits[Number(d)]);
}

function el(id) {
  return document.getElementById(id);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function fmtDate(ts) {
  try {
    return new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(new Date(ts));
  } catch (_) {
    return dayKey(ts);
  }
}

function save() {
  saveToStorage(appState);
  renderLeopard();
  renderHeader();
  renderCoach();
  renderTabs();
}

function renderHeader() {
  const unlocked = getHighestUnlockedStage(appState);
  const theme = getStageTheme(unlocked);

  if (el('user-display-name')) el('user-display-name').textContent = appState.user?.name || 'مسافر';
  if (el('user-stage-label')) el('user-stage-label').textContent = `مرحله ${toFa(unlocked)} — ${theme.name}`;
  if (el('energy-badge')) el('energy-badge').textContent = `⚡ ${toFa(appState.energy || 0)}`;
  if (el('snowflake-badge')) el('snowflake-badge').textContent = `❄ ${toFa(appState.snowflakes || 0)}`;
  if (el('app-header')) {
    el('app-header').className = `sticky top-0 z-30 p-4 bg-gradient-to-l ${theme.gradient} shadow-lg transition-all duration-300`;
  }
}

function renderLeopard() {
  const xp = computeXP(appState);
  const info = getStage(xp);
  const theme = getStageTheme(info.stage);

  if (el('leopard-stage-name')) el('leopard-stage-name').textContent = info.label;
  if (el('leopard-xp-label')) el('leopard-xp-label').textContent = `${toFa(xp)} XP`;

  const bar = el('leopard-progress');
  if (bar) {
    bar.style.width = `${info.progress}%`;
    bar.style.background = theme.hex;
  }

  if (el('leopard-next-label')) {
    el('leopard-next-label').textContent = info.xpForNext
      ? `تا رشد بعدی: ${toFa(info.xpForNext)} XP`
      : 'به بالاترین مرحله رشد رسیدی';
  }

  const img = el('leopard-image');
  const webp = el('leopard-source-webp');
  if (img) {
    const png = `./assets/leopard/stage-${info.stage}.png`;
    const wsp = `./assets/leopard/stage-${info.stage}.webp`;
    if (img.getAttribute('src') !== png) img.setAttribute('src', png);
    if (webp && webp.getAttribute('srcset') !== wsp) webp.setAttribute('srcset', wsp);
    img.alt = `پلنگ برفی — ${info.label}`;
  }

  const hero = el('leopard-container');
  if (hero) hero.classList.toggle('is-happy', (appState.energy || 0) >= ENERGY.ADVENTURE_COST);
}

function renderCoach() {
  const card = generateCoachCard(appState);
  const box = el('coach-card');
  if (!box) return;
  if (!appState.user) {
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');
  if (el('coach-progress')) el('coach-progress').textContent = `${toFa(card.progress)}٪`;
  if (el('coach-next-action')) el('coach-next-action').textContent = `${card.nextActionTitle} — ${card.nextActionDetail}`;
  if (el('coach-motivation')) el('coach-motivation').textContent = `«${card.motivation}»`;
}

function renderTabs() {
  const bar = el('stage-tabs-bar');
  if (!bar) return;
  const unlocked = getHighestUnlockedStage(appState);

  bar.innerHTML = STAGE_ORDER.map((n) => {
    const t = getStageTheme(n);
    const active = activeStageView === n;
    const locked = n > unlocked;
    const cls = active ? 'bg-white text-slate-950 font-extrabold shadow' : locked ? 'text-white/40' : 'text-white/80 hover:bg-white/10';
    return `<button onclick="switchStage(${n})" ${locked ? 'aria-disabled="true"' : ''}
      aria-label="مرحله ${toFa(n)} — ${esc(t.name)}"
      class="py-2 rounded-xl text-center transition ${cls} text-[10px] leading-tight">
      <div class="font-bold">${esc(t.name)} ${locked ? '🔒' : ''}</div>
      <div class="text-[9px] opacity-70 mt-0.5">${esc(t.age)}</div>
    </button>`;
  }).join('');
}

function switchStage(n) {
  const unlocked = getHighestUnlockedStage(appState);
  if (n > unlocked) {
    toast(`مرحله ${toFa(n)} هنوز باز نشده. اول مرحله ${toFa(unlocked)} را کامل کن.`);
    return;
  }
  activeStageView = n;
  document.querySelectorAll('.stage-content').forEach((s) => s.classList.add('hidden'));
  const panel = el(`stage-${n}`);
  if (panel) {
    panel.classList.remove('hidden');
    panel.classList.remove('stage-panel');
    void panel.offsetWidth;
    panel.classList.add('stage-panel');
  }
  renderTabs();
  renderHeader();
}

function renderStage1() {
  const box = el('s1-steps-container');
  if (!box) return;
  const steps = appState.s1Steps || [];
  const doneCount = steps.filter((s) => s.done).length;

  box.innerHTML = steps.map((s, i) => `
    <button onclick="toggleS1Step(${i})"
      class="w-full text-right p-3 rounded-xl border transition ${s.done ? 'bg-sky-950/60 border-sky-600/60' : 'bg-slate-950/60 border-slate-700 hover:border-slate-600'}">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="text-xs font-bold ${s.done ? 'text-sky-300' : 'text-white'}">${esc(s.title)}</div>
          <p class="text-[11px] text-slate-400 mt-0.5 leading-relaxed">${esc(s.desc)}</p>
        </div>
        <div class="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center border text-xs font-bold ${s.done ? 'bg-sky-600 border-sky-400 text-white' : 'border-slate-600 text-transparent'}">✓</div>
      </div>
    </button>`).join('');

  const pct = Math.round((doneCount / Math.max(1, steps.length)) * 100);
  if (el('s1-progress-label')) el('s1-progress-label').textContent = `${toFa(doneCount)} از ${toFa(steps.length)} اقدام`;
  if (el('s1-progress-pct')) el('s1-progress-pct').textContent = `${toFa(pct)}٪`;
  if (el('s1-progress-bar')) el('s1-progress-bar').style.width = `${pct}%`;
}

function toggleS1Step(i) {
  const step = appState.s1Steps?.[i];
  if (!step) return;
  step.done = !step.done;
  if (step.done) addEnergy(appState, 15, `s1-${step.key}`);
  save();
  renderStage1();
  checkStageAdvance();
}

function checkStageAdvance() {
  const unlocked = getHighestUnlockedStage(appState);
  if (unlocked > activeStageView) toast(`🎉 مرحله ${toFa(unlocked)} باز شد!`);
}

function renderGoals() {
  const box = el('goals-list');
  if (!box) return;
  const goals = appState.goals || [];

  if (goals.length === 0) {
    box.innerHTML = `<div class="text-center py-6">
      <div class="text-3xl mb-2 opacity-40">🎯</div>
      <p class="text-[11px] text-slate-500">هنوز هدفی نداری.</p>
      <p class="text-[10px] text-slate-600 mt-0.5">با دکمه + یک هدف کوچک اضافه کن.</p>
    </div>`;
    return;
  }

  box.innerHTML = goals.map((g, i) => {
    const type = GOAL_TYPES.find((t) => t.key === g.type) || GOAL_TYPES[4];
    return `<div class="flex items-center gap-2 p-2.5 rounded-xl border transition ${g.done ? 'bg-sky-950/40 border-sky-700/50' : 'bg-slate-950/60 border-slate-800'}">
      <button onclick="toggleGoal(${i})" aria-label="${g.done ? 'لغو' : 'تکمیل'} هدف ${esc(g.title)}"
        class="w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center text-sm transition ${g.done ? 'bg-sky-600 border-sky-400 text-white' : 'border-slate-600 text-transparent hover:border-sky-500'}">✓</button>
      <span class="text-lg shrink-0">${type.emoji}</span>
      <span class="text-xs flex-1 min-w-0 truncate ${g.done ? 'text-slate-500 line-through' : 'text-white'}">${esc(g.title)}</span>
      <button onclick="removeGoal(${i})" aria-label="حذف هدف" class="text-slate-600 hover:text-red-400 text-xs px-1 transition">✕</button>
    </div>`;
  }).join('');
}

function toggleGoal(i) {
  const g = appState.goals?.[i];
  if (!g) return;
  g.done = !g.done;
  g.doneAt = g.done ? Date.now() : null;
  if (g.done) addEnergy(appState, ENERGY.PER_GOAL, 'goal');
  save();
  renderGoals();
}

function removeGoal(i) {
  appState.goals.splice(i, 1);
  save();
  renderGoals();
}

function openGoalModal() {
  const types = GOAL_TYPES.map((t) => `
    <button onclick="selectGoalType('${t.key}')" data-type="${t.key}"
      class="goal-type-btn p-2.5 rounded-xl border border-slate-700 bg-slate-950 hover:border-sky-500 transition text-center">
      <div class="text-xl">${t.emoji}</div>
      <div class="text-[10px] text-slate-400 mt-0.5">${t.label}</div>
    </button>`).join('');

  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">هدف جدید</h2>
    <div class="grid grid-cols-5 gap-1.5 mb-3">${types}</div>
    <input id="goal-title" type="text" placeholder="مثلاً: دو لیوان آب بنوشم"
      class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-sky-500 outline-none mb-3" />
    <div class="flex gap-2">
      <button onclick="closeModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition">انصراف</button>
      <button onclick="addGoal()" class="flex-1 bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-2.5 text-xs font-bold transition">افزودن</button>
    </div>`);
}

function selectGoalType(key) {
  document.querySelectorAll('.goal-type-btn').forEach((b) => {
    const on = b.dataset.type === key;
    b.classList.toggle('border-sky-500', on);
    b.classList.toggle('bg-sky-950/50', on);
    b.classList.toggle('border-slate-700', !on);
  });
  const inp = el('goal-title');
  if (inp) inp.dataset.type = key;
}

function addGoal() {
  const input = el('goal-title');
  const title = (input?.value || '').trim();
  if (!title) {
    toast('یک عنوان برای هدف بنویس.');
    return;
  }
  appState.goals.push({ title, type: input.dataset.type || 'custom', done: false, doneAt: null, createdAt: Date.now() });
  save();
  renderGoals();
  closeModal();
}

function renderReflections() {
  const box = el('reflections-list');
  if (!box) return;
  const list = (appState.reflections || []).slice(0, 3);

  if (list.length === 0) {
    box.innerHTML = `<div class="text-center py-6">
      <div class="text-3xl mb-2 opacity-40">✍️</div>
      <p class="text-[11px] text-slate-500">هنوز چیزی ننوشتی.</p>
      <p class="text-[10px] text-slate-600 mt-0.5">با دکمه ✎ یک تأمل کوتاه بنویس.</p>
    </div>`;
    return;
  }

  box.innerHTML = list.map((r) => `
    <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
      <div class="flex items-center justify-between mb-1">
        <div class="flex gap-1 flex-wrap">
          ${(r.tags || []).map((t) => {
            const tag = REFLECTION_TAGS.find((x) => x.key === t);
            return tag ? `<span class="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">${tag.emoji} ${tag.label}</span>` : '';
          }).join('')}
        </div>
        <span class="text-[9px] text-slate-600">${fmtDate(r.at)}</span>
      </div>
      <p class="text-[11px] text-slate-300 leading-relaxed line-clamp-3">${esc(r.text)}</p>
    </div>`).join('');
}

function openReflectionModal() {
  currentPrompt = randomPrompt();
  currentReflectionTags = new Set();
  const tags = REFLECTION_TAGS.map((t) => `
    <button onclick="toggleReflectionTag('${t.key}')" data-tag="${t.key}"
      class="reflection-tag-btn text-[10px] px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-slate-400 transition">${t.emoji} ${t.label}</button>`).join('');

  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">تأمل</h2>
    <div class="bg-sky-950/50 border border-sky-800/50 rounded-xl p-3 mb-3">
      <p id="prompt-text" class="text-[11px] text-sky-200 leading-relaxed">${esc(currentPrompt)}</p>
      <button onclick="nextPrompt()" class="text-[10px] text-sky-400 hover:text-sky-300 mt-1.5 transition">پرامپت بعدی ↻</button>
    </div>
    <textarea id="reflection-text" rows="4" placeholder="هر چه در دلت است…"
      class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-sky-500 outline-none resize-none mb-2"></textarea>
    <button onclick="startVoiceInput()" class="text-[10px] text-slate-400 hover:text-sky-300 mb-3 transition">🎤 تایپ صوتی</button>
    <div class="flex gap-1.5 flex-wrap mb-3">${tags}</div>
    <div class="flex gap-2">
      <button onclick="closeModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition">انصراف</button>
      <button onclick="saveReflection()" class="flex-1 bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-2.5 text-xs font-bold transition">ذخیره</button>
    </div>`);
}

function nextPrompt() {
  currentPrompt = randomPrompt();
  const p = el('prompt-text');
  if (p) p.textContent = currentPrompt;
}

function toggleReflectionTag(key) {
  if (currentReflectionTags.has(key)) currentReflectionTags.delete(key);
  else currentReflectionTags.add(key);
  document.querySelectorAll('.reflection-tag-btn').forEach((b) => {
    const on = currentReflectionTags.has(b.dataset.tag);
    b.classList.toggle('border-sky-500', on);
    b.classList.toggle('bg-sky-950/60', on);
    b.classList.toggle('text-sky-300', on);
    b.classList.toggle('border-slate-700', !on);
    b.classList.toggle('text-slate-400', !on);
  });
}

function saveReflection() {
  const text = (el('reflection-text')?.value || '').trim();
  if (!text) {
    toast('چند جمله بنویس.');
    return;
  }
  appState.reflections.unshift({ text, prompt: currentPrompt, tags: Array.from(currentReflectionTags), at: Date.now() });
  addEnergy(appState, ENERGY.PER_REFLECTION, 'reflection');
  appState.snowflakes = (appState.snowflakes || 0) + 5;
  save();
  renderReflections();
  closeModal();
  checkStageAdvance();
  toast('تأمل ذخیره شد ✨');
}

function startVoiceInput() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    toast('مرورگرت از تایپ صوتی پشتیبانی نمی‌کند.');
    return;
  }
  const rec = new SR();
  rec.lang = 'fa-IR';
  rec.interimResults = false;
  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    const area = el('reflection-text');
    if (area) area.value = (area.value ? area.value + ' ' : '') + text;
  };
  rec.onerror = () => toast('ضبط صدا ناموفق بود.');
  rec.start();
  toast('🎤 گوش می‌دهم…');
}

function renderStreak() {
  const days = el('s2-days-bar');
  if (!days) return;
  const count = appState.streak?.count || 0;
  const today = dayKey();
  const checkedToday = appState.streak?.lastCheckin === today;

  days.innerHTML = Array.from({ length: 7 }, (_, i) => {
    const n = i + 1;
    const filled = n <= count;
    return `<div class="py-2 rounded-lg text-center text-[10px] font-bold border transition ${filled ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}">${toFa(n)}</div>`;
  }).join('');

  if (el('s2-streak-badge')) {
    el('s2-streak-badge').textContent = checkedToday ? `✓ ${toFa(count)} / ${toFa(7)}` : `${toFa(count)} / ${toFa(7)}`;
  }
}

function submitDailyReport() {
  const note = (el('s2-note')?.value || '').trim();
  const result = checkIn(appState);

  if (result.alreadyToday) {
    toast('امروز قبلاً چک‌این کردی. فردا برگرد 🌙');
    return;
  }

  appState.dailyReports.unshift({ note, at: Date.now(), streak: result.count });
  save();
  renderStreak();
  if (el('s2-note')) el('s2-note').value = '';

  if (result.reset) toast('زنجیره شکست ولی دوباره شروع کردیم. مهم ادامه دادن است 💪');
  else if (result.repaired) toast(`تعمیر استفاده شد — زنجیره: ${toFa(result.count)} روز ✨`);
  else toast(`زنجیره: ${toFa(result.count)} روز 🔥`);

  checkStageAdvance();
}

function renderBreathingPatterns() {
  const box = el('breathing-patterns');
  if (!box) return;
  box.innerHTML = BREATHING_PATTERNS.map((p) => `
    <button onclick="selectPattern('${p.key}')" data-pattern="${p.key}"
      class="pattern-btn p-2 rounded-xl border border-slate-700 bg-slate-950 hover:border-emerald-500 transition text-center">
      <div class="text-[11px] font-bold text-white">${p.label}</div>
      <div class="text-[9px] text-slate-500 mt-0.5">${p.inhale}-${p.hold}-${p.exhale}</div>
    </button>`).join('');
  selectPattern(BREATHING_PATTERNS[0].key);
}

function selectPattern(key) {
  selectedPattern = key;
  document.querySelectorAll('.pattern-btn').forEach((b) => {
    const on = b.dataset.pattern === key;
    b.classList.toggle('border-emerald-500', on);
    b.classList.toggle('bg-emerald-950/40', on);
    b.classList.toggle('border-slate-700', !on);
  });
}

function toggleBreathing() {
  if (breathingRunning) stopBreathing();
  else startBreathing();
}

function startBreathing() {
  const pattern = BREATHING_PATTERNS.find((p) => p.key === selectedPattern) || BREATHING_PATTERNS[0];
  const circle = el('breath-circle');
  const label = el('breath-label');
  const btn = el('breath-btn');
  if (!circle || !label || !btn) return;

  breathingRunning = true;
  btn.textContent = 'توقف';
  btn.classList.add('bg-red-600', 'hover:bg-red-500');
  btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');

  const phases = [
    { name: 'دم', dur: pattern.inhale, scale: 1 },
    { name: 'نگه‌دار', dur: pattern.hold, scale: 1 },
    { name: 'بازدم', dur: pattern.exhale, scale: 0.72 },
    { name: 'نگه‌دار', dur: pattern.holdAfter, scale: 0.72 }
  ].filter((p) => p.dur > 0);

  let phaseIdx = 0;
  let remaining = phases[0].dur;

  const tick = () => {
    const phase = phases[phaseIdx];
    label.textContent = `${phase.name} — ${toFa(Math.ceil(remaining))}`;
    circle.style.transform = `scale(${phase.scale})`;
    circle.style.transitionDuration = `${phase.dur}s`;
    remaining -= 1;
    if (remaining <= 0) {
      phaseIdx = (phaseIdx + 1) % phases.length;
      remaining = phases[phaseIdx].dur;
    }
  };

  tick();
  breathingTimer = setInterval(tick, 1000);

  setTimeout(() => {
    if (!breathingRunning) return;
    appState.breathingSessions.push({ pattern: pattern.key, durationSec: 60, at: Date.now() });
    addEnergy(appState, ENERGY.PER_BREATHING, 'breathing');
    save();
  }, 60000);
}

function stopBreathing() {
  breathingRunning = false;
  clearInterval(breathingTimer);
  const label = el('breath-label');
  const circle = el('breath-circle');
  const btn = el('breath-btn');
  if (label) label.textContent = 'آماده';
  if (circle) circle.style.transform = 'scale(1)';
  if (btn) {
    btn.textContent = 'شروع تنفس';
    btn.classList.remove('bg-red-600', 'hover:bg-red-500');
    btn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
  }
}

function renderMood() {
  const scale = el('mood-scale');
  if (!scale) return;
  const today = dayKey();
  const todayMood = (appState.moods || []).find((m) => m.day === today);

  scale.innerHTML = MOOD_SCALE.map((m) => `
    <button onclick="setMood(${m.value})" aria-label="${m.label}"
      class="py-2 rounded-xl border transition text-center ${todayMood?.value === m.value ? 'bg-emerald-600 border-emerald-400' : 'bg-slate-950 border-slate-800 hover:border-emerald-600'}">
      <div class="text-lg">${m.emoji}</div>
    </button>`).join('');
  renderMoodChart();
}

function setMood(value) {
  const today = dayKey();
  const idx = (appState.moods || []).findIndex((m) => m.day === today);
  if (idx >= 0) {
    appState.moods[idx].value = value;
    appState.moods[idx].at = Date.now();
  } else {
    appState.moods.push({ day: today, value, at: Date.now() });
    addEnergy(appState, 5, 'mood');
  }
  save();
  renderMood();
}

function renderMoodChart() {
  const box = el('mood-chart');
  if (!box) return;
  const today = new Date();
  const bars = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d.getTime());
    const rec = (appState.moods || []).find((m) => m.day === key);
    bars.push({ key, value: rec?.value || 0, label: fmtDate(d.getTime()) });
  }

  if (bars.every((b) => b.value === 0)) {
    box.innerHTML = `<div class="w-full text-center text-[10px] text-slate-600 self-center">هنوز حالی ثبت نشده</div>`;
    return;
  }

  box.innerHTML = bars.map((b) => {
    const h = b.value ? b.value * 16 : 4;
    const color = b.value ? (b.value >= 4 ? 'bg-emerald-500' : b.value === 3 ? 'bg-amber-500' : 'bg-rose-500') : 'bg-slate-800';
    return `<div class="flex-1 flex flex-col items-center gap-1">
      <div class="${color} rounded-t w-full transition-all" style="height:${h}px"></div>
      <span class="text-[8px] text-slate-600">${b.label}</span>
    </div>`;
  }).join('');
}

function renderAdventure() {
  const btn = el('adventure-btn');
  const text = el('adventure-text');
  if (!btn) return;
  const canAfford = (appState.energy || 0) >= ENERGY.ADVENTURE_COST;
  btn.disabled = !canAfford;
  btn.textContent = canAfford
    ? `شروع ماجراجویی (${toFa(ENERGY.ADVENTURE_COST)} ⚡)`
    : `انرژی کافی نیست (${toFa(appState.energy || 0)}/${toFa(ENERGY.ADVENTURE_COST)})`;

  const last = (appState.adventures || [])[(appState.adventures || []).length - 1];
  if (text) {
    text.textContent = last ? last.story : 'با ۵۰ انرژی، پلنگت را به ماجراجویی بفرست تا با یک داستان برگردد.';
  }
}

function startAdventure2() {
  const result = startAdventure(appState);
  if (!result.ok) {
    toast(`انرژی کافی نیست. ${toFa(ENERGY.ADVENTURE_COST)} انرژی لازم است.`);
    return;
  }
  save();
  renderAdventure();
  if (result.discovery) {
    toast(`${result.discovery.kind === 'like' ? '💚 کشف کرد که دوست دارد:' : '🚫 کشف کرد که دوست ندارد:'} ${result.discovery.label}`);
  } else {
    toast('از ماجراجویی برگشت 🏔');
  }
}

function openModal(html) {
  const root = el('modal-root');
  if (!root) return;
  root.innerHTML = `<div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
       onclick="if(event.target===this) closeModal()">
      <div class="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-4">${html}</div>
    </div>`;
}

function closeModal() {
  const root = el('modal-root');
  if (root) root.innerHTML = '';
}

function toast(msg) {
  const existing = document.getElementById('sl-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'sl-toast';
  t.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] bg-slate-800 border border-slate-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl max-w-[85vw] text-center';
  t.textContent = msg;
  t.style.animation = 'sl-fade-up 0.2s ease-out';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function openSettings() {
  const langOpts = LOCALES.map((l) => {
    const active = getLocale() === l.code;
    return `<button onclick="doSetLocale('${l.code}')"
      class="flex-1 py-2 rounded-xl border text-[11px] font-bold transition ${active ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-950 border-slate-700 text-slate-400'}">
      ${l.flag} ${l.label}
    </button>`;
  }).join('');

  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">تنظیمات</h2>
    <div class="mb-4">
      <div class="text-[10px] text-slate-500 mb-1.5">زبان / Language</div>
      <div class="flex gap-1.5">${langOpts}</div>
    </div>
    <div class="space-y-2 mb-4">
      <button onclick="doExport()" class="w-full text-right bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white transition">📤 خروجی گرفتن از همه داده‌ها (JSON)</button>
      <button onclick="triggerImport()" class="w-full text-right bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white transition">📥 وارد کردن داده‌ها</button>
      <input id="import-file" type="file" accept="application/json" class="hidden" onchange="doImport(event)" />
      <button onclick="doDiagnostics()" class="w-full text-right bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white transition">🔍 وضعیت ذخیره‌سازی</button>
      <button onclick="doWipe()" class="w-full text-right bg-red-950/40 hover:bg-red-950/70 border border-red-800/60 rounded-xl px-3 py-2.5 text-xs text-red-300 transition">🗑 پاک کردن کامل همه داده‌ها</button>
    </div>
    <p class="text-[10px] text-slate-500 leading-relaxed mb-3">همه داده‌ها فقط روی همین دستگاه ذخیره می‌شوند. هیچ اتصال شبکه‌ای وجود ندارد.</p>
    <button onclick="closeModal()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition">بستن</button>`);
}

function doSetLocale(code) {
  setLocale(code);
  applyLocale(code);
  toast(code === 'en' ? 'Language: English' : 'زبان: فارسی');
  closeModal();
  location.reload();
}

function doExport() {
  try {
    const json = exportData(appState);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snow-leopard-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('فایل خروجی ساخته شد ✅');
  } catch (_) {
    toast('خروجی گرفتن ناموفق بود.');
  }
}

function triggerImport() {
  el('import-file')?.click();
}

function doImport(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const result = importData(String(reader.result));
    if (!result.ok) {
      toast(result.error || 'فایل معتبر نیست.');
      return;
    }
    appState = result.state;
    save();
    renderAll();
    closeModal();
    toast('داده‌ها وارد شد ✅');
  };
  reader.readAsText(file);
}

function doDiagnostics() {
  const size = (() => {
    try { return new Blob([JSON.stringify(appState)]).size; } catch (_) { return 0; }
  })();

  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">وضعیت ذخیره‌سازی</h2>
    <div class="space-y-1.5 text-[11px] text-slate-300 mb-4">
      <div class="flex justify-between"><span class="text-slate-500">حجم داده:</span><span class="font-mono">${toFa((size / 1024).toFixed(1))} KB</span></div>
      <div class="flex justify-between"><span class="text-slate-500">اهداف:</span><span class="font-mono">${toFa((appState.goals || []).length)}</span></div>
      <div class="flex justify-between"><span class="text-slate-500">تأمل‌ها:</span><span class="font-mono">${toFa((appState.reflections || []).length)}</span></div>
      <div class="flex justify-between"><span class="text-slate-500">حال‌ها:</span><span class="font-mono">${toFa((appState.moods || []).length)}</span></div>
      <div class="flex justify-between"><span class="text-slate-500">زنجیره:</span><span class="font-mono">${toFa(appState.streak?.count || 0)}</span></div>
      <div class="flex justify-between"><span class="text-slate-500">XP:</span><span class="font-mono">${toFa(computeXP(appState))}</span></div>
    </div>
    <button onclick="closeModal()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition">بستن</button>`);
}

function doWipe() {
  if (!confirm('همه داده‌ها برای همیشه پاک می‌شوند. مطمئنی؟')) return;
  wipeStorage();
  location.reload();
}

function startJourney() {
  const name = (el('setup-name')?.value || '').trim();
  const why = (el('setup-why')?.value || '').trim();
  if (!name) {
    toast('یک اسم برای خودت بنویس.');
    return;
  }
  appState.user = { name };
  appState.why = why;
  appState.createdAt = Date.now();
  save();
  boot();
}



/* ============================================================
   صداهای محیطی
   ============================================================ */

function renderSoundscapes() {
  const box = el('soundscape-options');
  if (!box) return;

  const cur = getCurrentKey();
  const on = isPlaying();

  box.innerHTML = SOUNDSCAPES.map((s) => {
    const active = on && cur === s.key;
    return `<button onclick="doToggleSound('${s.key}')" data-sound="${s.key}"
      class="sound-btn py-2 rounded-xl border transition text-center ${active ? 'bg-emerald-900/60 border-emerald-500' : 'bg-slate-950 border-slate-800 hover:border-emerald-600'}">
      <div class="text-base">${s.emoji}</div>
      <div class="text-[9px] ${active ? 'text-emerald-300' : 'text-slate-500'} mt-0.5">${s.label}</div>
    </button>`;
  }).join('');
}

function doToggleSound(key) {
  const r = toggleSoundscape(key);
  renderSoundscapes();
  if (!r.playing) {
    toast('صدا متوقف شد ⏹');
  } else {
    const sc = SOUNDSCAPES.find((s) => s.key === key);
    toast(`${sc.emoji} ${sc.label} — پخش`);
  }
}

function stopAllAudio() {
  stopSoundscape();
  renderSoundscapes();
  toast('همه صداها متوقف شد');
}

/* ============================================================
   مرحله ۲ — مأموریت‌ها
   ============================================================ */

function renderQuests() {
  const box = el('quests-list');
  if (!box) return;

  const all = checkQuests(appState);
  const prog = questProgress(appState);
  if (el('quest-progress')) el('quest-progress').textContent = `${toFa(prog.claimed)} / ${toFa(prog.total)}`;

  const visible = all.filter((q) => q.done || !q.claimed).slice(0, 6);

  box.innerHTML = visible.map((q) => {
    const canClaim = q.done && !q.claimed;
    return `<div class="flex items-center gap-2 p-2 rounded-xl border ${q.claimed ? 'bg-slate-950/40 border-slate-800/60' : canClaim ? 'bg-emerald-950/40 border-emerald-700/50' : 'bg-slate-950/60 border-slate-800'}">
      <span class="text-sm shrink-0">${q.claimed ? '✅' : q.done ? '🎁' : '⭕'}</span>
      <div class="flex-1 min-w-0">
        <div class="text-[11px] font-bold ${q.claimed ? 'text-slate-500 line-through' : 'text-white'}">${esc(q.title)}</div>
        <div class="text-[9px] text-slate-500 truncate">${esc(q.desc)}</div>
      </div>
      ${canClaim
        ? `<button onclick="doClaimQuest('${q.key}')" class="text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-lg font-bold shrink-0 transition">+${toFa(q.reward)} ❄</button>`
        : `<span class="text-[9px] text-slate-600 shrink-0 tabular-nums">${toFa(q.reward)} ❄</span>`}
    </div>`;
  }).join('');
}

function doClaimQuest(key) {
  const r = claimQuest(appState, key);
  if (!r.ok) {
    toast('این مأموریت هنوز آماده نیست.');
    return;
  }
  save();
  renderQuests();
  toast(`🎁 ${toFa(r.reward)} برف گرفتی!`);
}

/* ============================================================
   مرحله ۳ — جوان
   ============================================================ */

function renderStage3() {
  const stats = computeStats(appState);

  if (el('insight-summary')) el('insight-summary').textContent = weeklySummary(appState);
  if (el('stat-goals')) el('stat-goals').textContent = toFa(stats.doneGoals);
  if (el('stat-reflections')) el('stat-reflections').textContent = toFa(stats.totalReflections);
  if (el('stat-mood')) el('stat-mood').textContent = toFa(stats.avgMood || 0);
  if (el('stat-days')) el('stat-days').textContent = toFa(stats.activeDays);

  // اهداف سی روزه
  const gbox = el('s3-goals-list');
  if (gbox) {
    const goals = appState.s3Goals || [];
    gbox.innerHTML = goals.length === 0
      ? `<div class="text-center py-4 text-[11px] text-slate-500">هدف بلندمدتی نداری. یکی اضافه کن.</div>`
      : goals.map((g, i) => `
        <div class="flex items-center gap-2 p-2 rounded-xl border ${g.done ? 'bg-amber-950/40 border-amber-700/50' : 'bg-slate-950/60 border-slate-800'}">
          <button onclick="toggleS3Goal(${i})" class="w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center text-[10px] ${g.done ? 'bg-amber-600 border-amber-400 text-white' : 'border-slate-600 text-transparent'}">✓</button>
          <span class="text-[11px] flex-1 min-w-0 truncate ${g.done ? 'text-slate-500 line-through' : 'text-white'}">${esc(g.title)}</span>
          <button onclick="removeS3Goal(${i})" class="text-slate-600 hover:text-red-400 text-[10px] px-1">✕</button>
        </div>`).join('');
  }

  // ژورنال
  const jbox = el('journal-list');
  if (jbox) {
    const entries = (appState.journalEntries || []).slice(0, 3);
    jbox.innerHTML = entries.length === 0
      ? `<div class="text-center py-4 text-[11px] text-slate-500">هنوز ژورنال عمیقی ننوشتی.</div>`
      : entries.map((j) => `
        <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
          <div class="flex justify-between mb-1">
            <span class="text-[9px] text-amber-400">${esc(j.prompt || 'ژورنال')}</span>
            <span class="text-[9px] text-slate-600">${fmtDate(j.at)}</span>
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed line-clamp-3">${esc(j.text)}</p>
        </div>`).join('');
  }

  // عادت‌ها
  const hbox = el('habits-list');
  if (hbox) {
    const habits = appState.habits || [];
    hbox.innerHTML = habits.length === 0
      ? `<div class="text-center py-3 text-[11px] text-slate-500">عادتی ثبت نشده.</div>`
      : habits.map((h, i) => `
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-[11px] text-white truncate">${esc(h.title)}</span>
          <span class="text-[10px] ${h.streak >= 21 ? 'text-amber-300 font-bold' : 'text-slate-500'} tabular-nums">${toFa(h.streak || 0)} روز</span>
        </div>`).join('');
  }

  // معیار عبور
  const cbox = el('s3-pass-criteria');
  if (cbox) {
    cbox.innerHTML = S3_PASS.map((p) => {
      const ok = checkS3Criterion(p.key, stats);
      return `<div class="flex items-center gap-2 ${ok ? 'text-amber-200' : 'text-slate-400'}">
        <span class="text-xs">${ok ? '✅' : '○'}</span><span>${esc(p.text)}</span>
      </div>`;
    }).join('');
  }

  const nxt = nextStageProgress(appState);
  if (el('s3-next-label')) el('s3-next-label').textContent = nxt.label;
  if (el('s3-next-pct')) el('s3-next-pct').textContent = `${toFa(nxt.pct)}٪`;
  if (el('s3-next-bar')) el('s3-next-bar').style.width = `${nxt.pct}%`;
}

function checkS3Criterion(key, stats) {
  const days = countActiveDays(appState);
  switch (key) {
    case 'ref10': return stats.totalReflections >= 10;
    case 'activeWeek4': return days >= 28;
    case 'pattern': return (appState.reflections || []).length >= 15;
    case 's3goal': return (appState.s3Goals || []).length > 0;
    case 'knows': return stats.totalBreathing >= 3;
    default: return false;
  }
}

function openS3GoalModal() {
  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">هدف سی روزه</h2>
    <input id="s3-goal-title" type="text" placeholder="مثلاً: هر روز بیست دقیقه پیاده‌روی"
      class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 outline-none mb-3" />
    <div class="flex gap-2">
      <button onclick="closeModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition">انصراف</button>
      <button onclick="addS3Goal()" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-2.5 text-xs font-bold transition">افزودن</button>
    </div>`);
}

function addS3Goal() {
  const t = (el('s3-goal-title')?.value || '').trim();
  if (!t) { toast('عنوان هدف را بنویس.'); return; }
  if (!appState.s3Goals) appState.s3Goals = [];
  appState.s3Goals.push({ title: t, done: false, createdAt: Date.now() });
  save(); renderStage3(); closeModal();
}

function toggleS3Goal(i) {
  const g = appState.s3Goals?.[i];
  if (!g) return;
  g.done = !g.done;
  save(); renderStage3();
}

function removeS3Goal(i) {
  appState.s3Goals.splice(i, 1);
  save(); renderStage3();
}

function openJournalModal() {
  const prompt = DEEP_REFLECTION_PROMPTS[Math.floor(Math.random() * DEEP_REFLECTION_PROMPTS.length)];
  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">ژورنال عمیق</h2>
    <div class="bg-amber-950/50 border border-amber-800/50 rounded-xl p-3 mb-3">
      <p id="deep-prompt" class="text-[11px] text-amber-200 leading-relaxed">${esc(prompt)}</p>
      <button onclick="nextDeepPrompt()" class="text-[10px] text-amber-400 hover:text-amber-300 mt-1.5">پرامپت بعدی ↻</button>
    </div>
    <textarea id="journal-text" rows="5" placeholder="هر چه هست، بنویس…"
      class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 outline-none resize-none mb-3"></textarea>
    <div class="flex gap-2">
      <button onclick="closeModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition">انصراف</button>
      <button onclick="saveJournal()" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-2.5 text-xs font-bold transition">ذخیره</button>
    </div>`);
}

let deepPromptCache = '';
function nextDeepPrompt() {
  deepPromptCache = DEEP_REFLECTION_PROMPTS[Math.floor(Math.random() * DEEP_REFLECTION_PROMPTS.length)];
  const p = el('deep-prompt');
  if (p) p.textContent = deepPromptCache;
}

function saveJournal() {
  const t = (el('journal-text')?.value || '').trim();
  if (!t) { toast('چند جمله بنویس.'); return; }
  if (!appState.journalEntries) appState.journalEntries = [];
  const prompt = el('deep-prompt')?.textContent || '';
  appState.journalEntries.unshift({ text: t, prompt, at: Date.now() });
  addEnergy(appState, 20, 'journal');
  appState.snowflakes = (appState.snowflakes || 0) + 10;
  save(); renderStage3(); closeModal(); toast('ژورنال ذخیره شد 📖');
}

function openHabitModal() {
  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">عادت جدید</h2>
    <input id="habit-title" type="text" placeholder="مثلاً: ده دقیقه کتاب خواندن"
      class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 outline-none mb-3" />
    <div class="flex gap-2">
      <button onclick="closeModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition">انصراف</button>
      <button onclick="addHabit()" class="flex-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-2.5 text-xs font-bold transition">افزودن</button>
    </div>`);
}

function addHabit() {
  const t = (el('habit-title')?.value || '').trim();
  if (!t) { toast('عنوان عادت را بنویس.'); return; }
  if (!appState.habits) appState.habits = [];
  appState.habits.push({ title: t, streak: 0, createdAt: Date.now(), lastDone: null });
  save(); renderStage3(); closeModal();
}

/* ============================================================
   مرحله ۴ — بالغ
   ============================================================ */

const VIBES = [
  { key: 'wave', label: 'سلام', emoji: '👋' },
  { key: 'heart', label: 'دلگرمی', emoji: '💚' },
  { key: 'star', label: 'افتخار', emoji: '⭐' },
  { key: 'hug', label: 'همراهی', emoji: '🤗' }
];

function renderStage4() {
  const pbox = el('pack-list');
  if (pbox) {
    const pack = appState.pack || [];
    pbox.innerHTML = pack.length === 0
      ? `<div class="text-center py-4 text-[11px] text-slate-500">پک تو خالی است.</div>`
      : pack.map((p, i) => `
        <div class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span class="text-lg">${p.avatar || '🐾'}</span>
          <div class="flex-1 min-w-0">
            <div class="text-[11px] font-bold text-white truncate">${esc(p.name)}</div>
            <div class="text-[9px] text-slate-500">${esc(p.note || 'همراه مسیر')}</div>
          </div>
          <button onclick="removePackMember(${i})" class="text-slate-600 hover:text-red-400 text-[10px] px-1">✕</button>
        </div>`).join('');
  }

  const vbox = el('vibe-options');
  if (vbox) {
    vbox.innerHTML = VIBES.map((v) => `
      <button onclick="sendVibe('${v.key}')" class="py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500 transition text-center">
        <div class="text-lg">${v.emoji}</div>
        <div class="text-[9px] text-slate-500 mt-0.5">${v.label}</div>
      </button>`).join('');
  }
  if (el('vibes-count')) el('vibes-count').textContent = toFa((appState.vibesSent || []).length);

  const rbox = el('ritual-box');
  if (rbox) {
    const ritual = appState.ritual || '';
    rbox.innerHTML = ritual
      ? `<div class="bg-violet-950/40 border border-violet-700/40 rounded-xl p-3 text-[11px] text-violet-200">${esc(ritual)}</div>
         <button onclick="editRitual()" class="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2 text-[10px] font-bold transition">ویرایش</button>`
      : `<button onclick="editRitual()" class="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-2.5 text-[11px] font-bold transition">تعریف آیین شخصی</button>`;
  }

  const cbox = el('s4-pass-criteria');
  if (cbox) {
    cbox.innerHTML = S4_PASS.map((p) => {
      const ok = checkS4Criterion(p.key);
      return `<div class="flex items-center gap-2 ${ok ? 'text-violet-200' : 'text-slate-400'}">
        <span class="text-xs">${ok ? '✅' : '○'}</span><span>${esc(p.text)}</span>
      </div>`;
    }).join('');
  }
}

function checkS4Criterion(key) {
  switch (key) {
    case 'mentor1': return (appState.pack || []).length >= 1;
    case 'deepHabit': return (appState.habits || []).some((h) => h.streak >= 21);
    case 'indep': return (appState.journalEntries || []).length >= 20;
    case 'ritual': return !!(appState.ritual || '').trim();
    default: return false;
  }
}

function openPackModal() {
  if ((appState.pack || []).length >= 5) {
    toast('پک پر است — حداکثر ۵ نفر.');
    return;
  }
  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">افزودن به پک</h2>
    <input id="pack-name" type="text" placeholder="اسم (یا نام مستعار)"
      class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white mb-2 focus:border-violet-500 outline-none" />
    <input id="pack-note" type="text" placeholder="یادداشت (اختیاری)"
      class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white mb-3 focus:border-violet-500 outline-none" />
    <div class="flex gap-2">
      <button onclick="closeModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition">انصراف</button>
      <button onclick="addPackMember()" class="flex-1 bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-2.5 text-xs font-bold transition">افزودن</button>
    </div>`);
}

function addPackMember() {
  const name = (el('pack-name')?.value || '').trim();
  if (!name) { toast('اسم را بنویس.'); return; }
  if (!appState.pack) appState.pack = [];
  if (appState.pack.length >= 5) { toast('حداکثر ۵ نفر.'); return; }
  appState.pack.push({ name, note: (el('pack-note')?.value || '').trim(), avatar: '🐾', addedAt: Date.now() });
  save(); renderStage4(); closeModal();
}

function removePackMember(i) {
  appState.pack.splice(i, 1);
  save(); renderStage4();
}

function sendVibe(key) {
  if ((appState.pack || []).length === 0) {
    toast('اول یک نفر به پک اضافه کن.');
    return;
  }
  if (!appState.vibesSent) appState.vibesSent = [];
  const v = VIBES.find((x) => x.key === key);
  appState.vibesSent.push({ key, at: Date.now() });
  addEnergy(appState, 5, 'vibe');
  save(); renderStage4();
  toast(`${v.emoji} فرستاده شد به پک`);
}

function editRitual() {
  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">آیین شخصی</h2>
    <textarea id="ritual-input" rows="3" placeholder="مثلاً: هر صبح قبل از گوشی، یک لیوان آب و سه نفس"
      class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-violet-500 outline-none resize-none mb-3">${esc(appState.ritual || '')}</textarea>
    <div class="flex gap-2">
      <button onclick="closeModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition">انصراف</button>
      <button onclick="saveRitual()" class="flex-1 bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-2.5 text-xs font-bold transition">ذخیره</button>
    </div>`);
}

function saveRitual() {
  appState.ritual = (el('ritual-input')?.value || '').trim();
  save(); renderStage4(); closeModal();
}

/* ============================================================
   مرحله ۵ — رهبر قله
   ============================================================ */

function renderStage5() {
  const sbox = el('s5-standards');
  if (sbox) {
    if (!appState.s5Standards) appState.s5Standards = {};
    sbox.innerHTML = S5_STANDARDS.map((s) => `
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" ${appState.s5Standards[s.key] ? 'checked' : ''} onchange="toggleS5Standard('${s.key}')" class="accent-yellow-500 rounded" />
        <span class="${appState.s5Standards[s.key] ? 'text-yellow-200 font-bold' : 'text-slate-400'}">${esc(s.text)}</span>
      </label>`).join('');
  }

  const mbox = el('mentor-list');
  if (mbox) {
    const notes = (appState.mentorNotes || []).slice(0, 3);
    mbox.innerHTML = notes.length === 0
      ? `<div class="text-center py-4 text-[11px] text-slate-500">هنوز یادداشتی نداری.</div>`
      : notes.map((m) => `
        <div class="bg-slate-950/60 border border-yellow-800/30 rounded-xl p-2.5">
          <div class="flex justify-between mb-1">
            <span class="text-[9px] text-yellow-400">${esc(m.who || 'همراه')}</span>
            <span class="text-[9px] text-slate-600">${fmtDate(m.at)}</span>
          </div>
          <p class="text-[11px] text-slate-300 leading-relaxed">${esc(m.text)}</p>
        </div>`).join('');
  }

  const legacy = el('legacy-input');
  if (legacy && !legacy.value && appState.legacyLetter) legacy.value = appState.legacyLetter;

  const stats = computeStats(appState);
  if (el('legacy-xp')) el('legacy-xp').textContent = toFa(stats.xp);
  if (el('legacy-days')) el('legacy-days').textContent = toFa(stats.activeDays);
  if (el('legacy-pack')) el('legacy-pack').textContent = toFa((appState.pack || []).length);
}

function toggleS5Standard(key) {
  if (!appState.s5Standards) appState.s5Standards = {};
  appState.s5Standards[key] = !appState.s5Standards[key];
  save(); renderStage5();
}

function openMentorModal() {
  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">یادداشت منتورینگ</h2>
    <input id="mentor-who" type="text" placeholder="با کی حرف زدی؟"
      class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white mb-2 focus:border-yellow-500 outline-none" />
    <textarea id="mentor-text" rows="3" placeholder="چه چیزی گفتی یا شنیدی؟"
      class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-yellow-500 outline-none resize-none mb-3"></textarea>
    <div class="flex gap-2">
      <button onclick="closeModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-xs font-bold transition">انصراف</button>
      <button onclick="saveMentorNote()" class="flex-1 bg-yellow-600 hover:bg-yellow-500 text-slate-950 rounded-xl py-2.5 text-xs font-bold transition">ذخیره</button>
    </div>`);
}

function saveMentorNote() {
  const text = (el('mentor-text')?.value || '').trim();
  if (!text) { toast('چند جمله بنویس.'); return; }
  if (!appState.mentorNotes) appState.mentorNotes = [];
  appState.mentorNotes.unshift({ who: (el('mentor-who')?.value || '').trim(), text, at: Date.now() });
  appState.snowflakes = (appState.snowflakes || 0) + 15;
  save(); renderStage5(); closeModal();
}

function saveLegacy() {
  appState.legacyLetter = (el('legacy-input')?.value || '').trim();
  save();
  toast('نامه ذخیره شد ✉️');
}

function renderAll() {
  renderHeader();
  renderLeopard();
  renderCoach();
  renderTabs();
  renderStage1();
  renderGoals();
  renderReflections();
  renderStreak();
  renderBreathingPatterns();
  renderMood();
  renderAdventure();
  renderQuests();
  renderSoundscapes();
  renderStage3();
  renderStage4();
  renderStage5();
}

function boot() {
  resetDailyGoals(appState);
  saveToStorage(appState);

  const welcome = el('welcome-screen');
  if (!appState.user) {
    if (welcome) welcome.classList.remove('hidden');
    return;
  }
  if (welcome) welcome.classList.add('hidden');

  activeStageView = getHighestUnlockedStage(appState);
  document.querySelectorAll('.stage-content').forEach((s) => s.classList.add('hidden'));
  const panel = el(`stage-${activeStageView}`);
  if (panel) panel.classList.remove('hidden');

  renderAll();
  updateTimer();
  setInterval(updateTimer, 1000);
}

function updateTimer() {
  const box = el('s1-timer');
  if (!box) return;
  if (!appState.createdAt) {
    box.textContent = '۷۲:۰۰:۰۰';
    return;
  }
  const elapsed = Date.now() - appState.createdAt;
  const remaining = Math.max(0, 72 * 3600 * 1000 - elapsed);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  box.textContent = `${toFa(String(h).padStart(2, '0'))}:${toFa(String(m).padStart(2, '0'))}:${toFa(String(s).padStart(2, '0'))}`;
}

Object.assign(window, {
  startJourney, switchStage, toggleS1Step,
  openGoalModal, selectGoalType, addGoal, toggleGoal, removeGoal,
  openReflectionModal, nextPrompt, toggleReflectionTag, saveReflection, startVoiceInput,
  submitDailyReport, selectPattern, toggleBreathing, setMood,
  startAdventure: startAdventure2,
  openSettings, closeModal, doExport, triggerImport, doImport, doDiagnostics, doWipe,
  doClaimQuest,
  openS3GoalModal, addS3Goal, toggleS3Goal, removeS3Goal,
  openJournalModal, nextDeepPrompt, saveJournal,
  openHabitModal, addHabit,
  openPackModal, addPackMember, removePackMember, sendVibe, editRitual, saveRitual,
  toggleS5Standard, openMentorModal, saveMentorNote, saveLegacy,
  doToggleSound, stopAllAudio, doSetLocale
});

// اعمال زبان ذخیره‌شده
applyLocale();

// آزادسازی صدا وقتی صفحه پنهان می‌شود
document.addEventListener('visibilitychange', () => {
  if (document.hidden && isPlaying()) {
    stopSoundscape();
    renderSoundscapes();
  }
});

boot();
