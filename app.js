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
  openModal(`
    <h2 class="text-sm font-extrabold text-white mb-3">تنظیمات</h2>
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
  openSettings, closeModal, doExport, triggerImport, doImport, doDiagnostics, doWipe
});

boot();
