/* Pump Log — 2x/week full-body logger for low-volume, high-effort training:
   two straight working sets per exercise, ~2 RIR. Data never leaves the device. */

'use strict';

import {
  bestTopWeight, calculateBmi, lastPerformance, parseDecimal, progressionTarget,
  scaleStarterWeight, strengthScale, updateRange,
} from './domain.js';
import { normalizeLanguage, translate } from './i18n.js';

const KEY = 'pumplog.v1';
const PROGRAM_REV = 3;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const preferredLanguage = () => normalizeLanguage(typeof navigator === 'undefined' ? 'en' : navigator.language);

/* ------------------------------------------------------------------ library */
/* kind drives the default rest period (compound = long, isolation = short).   */

const LIBRARY = [
  ['hack-squat', 'Hack Squat', 'c'], ['back-squat', 'Back Squat', 'c'],
  ['pendulum-squat', 'Pendulum Squat', 'c'], ['smith-squat', 'Smith Machine Squat', 'c'],
  ['leg-press', 'Leg Press', 'c'], ['walking-lunge', 'Walking Lunge', 'c'],
  ['bulgarian', 'Bulgarian Split Squat', 'c'],
  ['leg-ext', 'Leg Extension', 'i'],
  ['rdl', 'Romanian Deadlift', 'c'], ['good-morning', 'Good Morning', 'c'],
  ['back-ext', '45° Back Extension', 'i'], ['seated-curl', 'Seated Leg Curl', 'i'],
  ['lying-curl', 'Lying Leg Curl', 'i'], ['nordic', 'Nordic Curl', 'i'],
  ['inc-bb-press', 'Incline Barbell Press', 'c'], ['inc-db-press', 'Incline DB Press', 'c'],
  ['flat-bb-press', 'Flat Barbell Press', 'c'], ['machine-press', 'Machine Chest Press', 'c'],
  ['dip', 'Weighted Dip', 'c'], ['pec-deck', 'Pec Deck / Cable Fly', 'i'],
  ['cs-row', 'Chest-Supported Row', 'c'], ['seal-row', 'Seal Row', 'c'],
  ['cable-row', 'Seated Cable Row', 'c'], ['db-row', 'Single-Arm DB Row', 'c'],
  ['t-bar', 'T-Bar Row', 'c'],
  ['pulldown', 'Lat Pulldown', 'c'], ['neutral-pulldown', 'Neutral-Grip Pulldown', 'c'],
  ['pullup', 'Weighted Pull-Up', 'c'], ['pullover', 'Machine Pullover', 'i'],
  ['db-ohp', 'Seated DB Shoulder Press', 'c'], ['machine-ohp', 'Machine Shoulder Press', 'c'],
  ['bb-ohp', 'Standing Barbell Press', 'c'],
  ['cable-lat-raise', 'Cable Lateral Raise', 'i'], ['db-lat-raise', 'DB Lateral Raise', 'i'],
  ['machine-lat-raise', 'Machine Lateral Raise', 'i'], ['rear-delt', 'Rear Delt Fly', 'i'],
  ['oh-cable-ext', 'Overhead Cable Triceps Ext', 'i'], ['skull', 'EZ-Bar Skull Crusher', 'i'],
  ['pushdown', 'Cable Pushdown', 'i'], ['dip-machine', 'Triceps Dip Machine', 'i'],
  ['inc-db-curl', 'Incline DB Curl', 'i'], ['ez-curl', 'EZ-Bar Curl', 'i'],
  ['cable-curl', 'Cable Curl', 'i'], ['preacher', 'Preacher Curl', 'i'],
  ['hammer', 'Hammer Curl', 'i'],
  ['standing-calf', 'Standing Calf Raise', 'i'], ['seated-calf', 'Seated Calf Raise', 'i'],
  ['press-calf', 'Leg Press Calf Raise', 'i'],
  ['ab-crunch', 'Weighted Cable Crunch', 'i'], ['hanging-leg', 'Hanging Leg Raise', 'i'],
];

const slot = (id, label, pick, options, top, back, style, inc, cue, mode) =>
  ({ id, label, pick, options, top, back, style, inc, cue, mode: mode || 'straight2' });
const starter = (sl, weight, reps) => Object.assign(sl, {
  startExId: sl.pick, baseStartWeight: weight, startWeight: weight, startReps: reps,
});

function seedProgram() {
  /* Low-volume defaults: two straight working sets taken to ~2 reps in reserve.
     Compounds live mostly in 6–10; isolations use 8–12 or 10–15 so load does not
     come at the expense of control. Second set = same weight and range, not a
     back-off. 'topback' mode remains available per slot. */
  return {
    A: {
      name: 'Full Body A',
      slots: [
        starter(slot('a1', 'Quads',           'back-squat',    ['back-squat', 'hack-squat', 'pendulum-squat', 'leg-press', 'smith-squat'], [6, 10], [6, 10], 'straight', 5, 'deep, control the negative'), 95, 8),
        starter(slot('a2', 'Horizontal Push', 'flat-bb-press', ['flat-bb-press', 'machine-press', 'inc-db-press', 'inc-bb-press', 'dip'], [6, 10], [6, 10], 'straight', 2.5, 'full stretch at the bottom, no bounce'), 87.5, 8),
        starter(slot('a3', 'Horizontal Pull', 'db-row',        ['db-row', 'cs-row', 'seal-row', 'cable-row', 't-bar'], [6, 10], [6, 10], 'straight', 2.5, 'weight is per dumbbell; keep torso still'), 30, 8),
        starter(slot('a4', 'Hamstrings',      'seated-curl',   ['seated-curl', 'lying-curl', 'nordic'], [8, 12], [8, 12], 'straight', 2.5, 'seated beats lying — hams fully lengthened'), 35, 10),
        starter(slot('a5', 'Side Delts',      'db-lat-raise',  ['db-lat-raise', 'cable-lat-raise', 'machine-lat-raise'], [10, 15], [10, 15], 'straight', 1, 'weight is per dumbbell; no swinging'), 8, 12),
        starter(slot('a6', 'Triceps',         'pushdown',      ['pushdown', 'oh-cable-ext', 'skull', 'dip-machine'], [8, 12], [8, 12], 'straight', 2.5, 'stack varies by machine; keep elbows fixed'), 25, 10),
      ],
    },
    B: {
      name: 'Full Body B',
      slots: [
        starter(slot('b1', 'Hinge',         'rdl',          ['rdl', 'good-morning', 'back-ext', 'lying-curl'], [6, 10], [6, 10], 'straight', 2.5, 'push hips back, feel the hamstring stretch'), 80, 8),
        starter(slot('b2', 'Vertical Pull', 'pulldown',     ['pulldown', 'neutral-pulldown', 'pullover', 'pullup'], [6, 10], [6, 10], 'straight', 2.5, 'stack varies; full hang between reps'), 50, 8),
        starter(slot('b3', 'Vertical Push', 'machine-ohp',  ['machine-ohp', 'db-ohp', 'bb-ohp'], [8, 12], [8, 12], 'straight', 2, 'stack varies; stable setup and controlled reps'), 35, 10),
        starter(slot('b4', 'Quads / Glutes','leg-press',    ['leg-press', 'hack-squat', 'walking-lunge', 'bulgarian', 'leg-ext'], [8, 12], [8, 12], 'straight', 5, 'control the negative and use a deep, stable range'), 120, 10),
        starter(slot('b5', 'Biceps',        'inc-db-curl',  ['inc-db-curl', 'ez-curl', 'cable-curl', 'preacher', 'hammer'], [8, 12], [8, 12], 'straight', 1, 'weight is per dumbbell; keep shoulder still'), 10, 10),
        starter(slot('b6', 'Calves',        'press-calf',   ['press-calf', 'standing-calf', 'seated-calf'], [8, 12], [8, 12], 'straight', 2.5, 'machine varies; pause in the deep stretch'), 80, 10),
      ],
    },
  };
}

function seed() {
  const ex = {};
  LIBRARY.forEach(([id, name, kind]) => { ex[id] = { id, name, kind }; });
  return {
    v: 1,
    programRev: PROGRAM_REV,
    settings: { language: preferredLanguage(), unit: 'kg', restC: 180, restI: 120, targetMin: 60, beep: true, defReps: 8, defRir: 2 },
    profile: null,
    exercises: ex,
    program: seedProgram(),
    logs: [],
    bw: [],
    active: null,
    ui: { tab: 'train' },
  };
}

function safeRange(value, fallback = [8, 12]) {
  if (!Array.isArray(value) || value.length < 2) return fallback.slice();
  return updateRange(updateRange(fallback, 0, value[0]), 1, value[1]);
}

const finiteNumber = value => value !== null && value !== '' && Number.isFinite(+value) ? +value : null;

function sanitizeProgram(value) {
  if (!value || typeof value !== 'object') return null;
  const result = {};
  for (const day of ['A', 'B']) {
    const source = value[day];
    if (!source || !Array.isArray(source.slots)) return null;
    result[day] = {
      name: typeof source.name === 'string' ? source.name : `Full Body ${day}`,
      slots: source.slots.filter(sl => sl && typeof sl === 'object').map((sl, index) => {
        const rawOptions = Array.isArray(sl.options) ? sl.options.map(String).filter(Boolean) : [];
        const pick = String(sl.pick || rawOptions[0] || 'leg-press');
        const options = [...new Set([pick, ...rawOptions])];
        const clean = {
          id: String(sl.id || `${day.toLowerCase()}-${index}`),
          label: typeof sl.label === 'string' ? sl.label : 'Exercise',
          pick, options,
          top: safeRange(sl.top), back: safeRange(sl.back),
          style: ['straight', 'restpause', 'lengthened'].includes(sl.style) ? sl.style : 'straight',
          inc: Number.isFinite(+sl.inc) && +sl.inc > 0 ? +sl.inc : 1,
          cue: typeof sl.cue === 'string' ? sl.cue : '',
          mode: sl.mode === 'topback' ? 'topback' : 'straight2',
        };
        if (typeof sl.startExId === 'string') clean.startExId = sl.startExId;
        const baseStartWeight = finiteNumber(sl.baseStartWeight);
        const startWeight = finiteNumber(sl.startWeight), startReps = finiteNumber(sl.startReps);
        if (baseStartWeight !== null) clean.baseStartWeight = baseStartWeight;
        if (startWeight !== null) clean.startWeight = startWeight;
        if (startReps !== null && startReps > 0) clean.startReps = startReps;
        return clean;
      }),
    };
  }
  return result;
}

function sanitizeSets(value) {
  return (Array.isArray(value) ? value : [])
    .filter(set => set && typeof set === 'object')
    .map(set => {
      const clean = {
        slotId: String(set.slotId || ''), exId: String(set.exId || ''),
        kind: set.kind === 'back' ? 'back' : 'top',
        weight: parseDecimal(set.weight), reps: parseDecimal(set.reps),
      };
      const rpe = finiteNumber(set.rpe), ts = finiteNumber(set.ts);
      if (rpe !== null) clean.rpe = rpe;
      if (ts !== null) clean.ts = ts;
      return clean;
    });
}

function sanitizeLogs(value) {
  return (Array.isArray(value) ? value : [])
    .filter(log => log && typeof log === 'object' && Number.isFinite(+log.start))
    .map(log => ({
      id: String(log.id || 'L' + log.start), day: log.day === 'B' ? 'B' : 'A',
      start: +log.start, end: Number.isFinite(+log.end) ? +log.end : +log.start,
      ...(Number.isFinite(+log.dur) ? { dur: +log.dur } : {}),
      notes: typeof log.notes === 'string' ? log.notes : '',
      sets: sanitizeSets(log.sets),
    }));
}

function sanitizeBodyweight(value) {
  return (Array.isArray(value) ? value : [])
    .filter(row => row && /^\d{4}-\d{2}-\d{2}$/.test(row.d) && Number.isFinite(+row.kg))
    .map(row => ({ d: row.d, kg: +row.kg }));
}

function sanitizeProfile(value) {
  if (!value || typeof value !== 'object') return null;
  const heightCm = parseDecimal(value.heightCm), massKg = parseDecimal(value.massKg), bench1Rm = parseDecimal(value.bench1Rm);
  if (heightCm < 120 || heightCm > 230 || massKg < 35 || massKg > 250 || bench1Rm < 20 || bench1Rm > 300) return null;
  return {
    heightCm, massKg, bench1Rm,
    strengthScale: strengthScale(bench1Rm),
    createdAt: finiteNumber(value.createdAt) || Date.now(),
    updatedAt: finiteNumber(value.updatedAt) || Date.now(),
  };
}

/* -------------------------------------------------------------------- state */

let S = load();
let setupDraft = {};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      const base = seed();
      // keep any exercises added by later app versions
      p.exercises = Object.assign(base.exercises, p.exercises || {});
      const hadDefRir = p.settings && Object.prototype.hasOwnProperty.call(p.settings, 'defRir');
      p.settings = Object.assign(base.settings, p.settings || {});
      // v1 called this value RPE even though it has always meant reps in reserve.
      if (!hadDefRir && p.settings.defRpe !== undefined) p.settings.defRir = p.settings.defRpe;
      delete p.settings.defRpe;
      // always open on Train — the start button should be the first thing you see
      p.ui = { tab: 'train' };
      p.logs = sanitizeLogs(p.logs);
      p.bw = sanitizeBodyweight(p.bw);
      p.profile = sanitizeProfile(p.profile);
      // keep the user's program; backfill fields added by newer app versions
      p.program = sanitizeProgram(p.program);
      if (!p.program) p.program = base.program;
      else ['A', 'B'].forEach(d => (p.program[d] ? p.program[d].slots : []).forEach(sl => {
        if (sl.cue === undefined) {
          const def = base.program[d].slots.find(x => x.id === sl.id);
          if (def) sl.cue = def.cue;
        }
        const def = base.program[d].slots.find(x => x.id === sl.id);
        if (def && sl.startExId === undefined) sl.startExId = def.startExId;
        if (def && sl.baseStartWeight === undefined) sl.baseStartWeight = def.baseStartWeight;
        if (def && sl.startWeight === undefined) sl.startWeight = def.startWeight;
        if (def && sl.startReps === undefined) sl.startReps = def.startReps;
        if (!sl.mode) sl.mode = 'topback';
      }));
      // Rev 2 changes only untouched Day A defaults. Custom selections survive.
      if ((p.programRev || 0) < 2 && p.program && p.program.A) {
        const replacements = {
          a1: ['hack-squat', 'back-squat'],
          a2: ['machine-press', 'flat-bb-press'],
          a3: ['cs-row', 'db-row'],
          a5: ['cable-lat-raise', 'db-lat-raise'],
          a6: ['oh-cable-ext', 'pushdown'],
        };
        p.program.A.slots.forEach(sl => {
          const change = replacements[sl.id];
          if (!change || sl.pick !== change[0]) return;
          sl.pick = change[1];
          if (Array.isArray(sl.options) && sl.options.includes(change[1])) {
            sl.options = [change[1], ...sl.options.filter(x => x !== change[1])];
          }
        });
        p.programRev = 2;
        p.savedAt = Date.now();
        localStorage.setItem(KEY, JSON.stringify(p));
      }
      // Rev 3 adds lunges to the quad/glute variations without changing the user's pick.
      if ((p.programRev || 0) < 3 && p.program && p.program.B) {
        const quadSlot = p.program.B.slots.find(sl => sl.id === 'b4');
        if (quadSlot) {
          if (quadSlot.label === 'Quads') quadSlot.label = 'Quads / Glutes';
          if (!quadSlot.options.includes('walking-lunge')) {
            const before = quadSlot.options.indexOf('bulgarian');
            quadSlot.options.splice(before >= 0 ? before : quadSlot.options.length, 0, 'walking-lunge');
          }
          if (quadSlot.cue === 'machine varies; deep knee bend, slow eccentric') {
            quadSlot.cue = 'control the negative and use a deep, stable range';
          }
        }
        p.programRev = PROGRAM_REV;
        p.savedAt = Date.now();
        localStorage.setItem(KEY, JSON.stringify(p));
      }
      if (p.active && typeof p.active === 'object' && ['A', 'B'].includes(p.active.day)) {
        p.active.sets = sanitizeSets(p.active.sets);
        p.active.draft = p.active.draft && typeof p.active.draft === 'object' ? p.active.draft : {};
        p.active.picks = p.active.picks && typeof p.active.picks === 'object' ? p.active.picks : {};
        p.active.notes = typeof p.active.notes === 'string' ? p.active.notes : '';
        p.active.start = finiteNumber(p.active.start) || Date.now();
        p.active.restEnd = finiteNumber(p.active.restEnd) || 0;
        p.active.pausedAt = finiteNumber(p.active.pausedAt) || 0;
        p.active.pausedMs = finiteNumber(p.active.pausedMs) || 0;
      } else p.active = null;
      return p;
    }
  } catch (e) { console.warn('load failed, starting fresh', e); }
  return seed();
}

let saveTimer = null;

function flushSave() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    S.savedAt = Date.now();
    const json = JSON.stringify(S);
    localStorage.setItem(KEY, json);
    idbPut(json);
  }
  catch (e) { toast(tr('msg.saveFailed')); }
}

/* --- durability: mirror the whole state into IndexedDB ------------------
   localStorage is the fast synchronous store; IndexedDB is the
   eviction-resistant copy. On boot the newer of the two wins, so a cleared
   or evicted localStorage no longer means a lost logbook. --------------- */

const IDB = { db: null };

function idbOpen() {
  return new Promise(res => {
    if (!('indexedDB' in self)) return res(null);
    try {
      const r = indexedDB.open('pumplog', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}

function idbPut(json) {
  if (!IDB.db) return;
  try { IDB.db.transaction('kv', 'readwrite').objectStore('kv').put(json, 'state'); }
  catch (e) { /* mirror is best-effort */ }
}

function idbGet() {
  return new Promise(res => {
    if (!IDB.db) return res(null);
    try {
      const r = IDB.db.transaction('kv').objectStore('kv').get('state');
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    } catch (e) { res(null); }
  });
}

function idbClear() {
  return new Promise(resolve => {
    if (!IDB.db) return resolve();
    try {
      const tx = IDB.db.transaction('kv', 'readwrite');
      tx.objectStore('kv').delete('state');
      tx.oncomplete = resolve;
      tx.onerror = resolve;
      tx.onabort = resolve;
    } catch (e) { resolve(); }
  });
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 120);
}

/* iOS can kill a backgrounded PWA without warning — never leave a set in limbo. */
addEventListener('pagehide', flushSave);
addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });

/* ------------------------------------------------------------------ helpers */

const L = () => normalizeLanguage(S.settings.language);
const tr = (key, values, fallback) => translate(L(), key, values, fallback);
const exName = id => tr(`exercise.${id}`, {}, S.exercises[id] ? S.exercises[id].name : id);
const isComp = id => (S.exercises[id] ? S.exercises[id].kind : 'c') === 'c';
const U = () => S.settings.unit;

const DEFAULT_CUES = {
  a1: 'deep, control the negative', a2: 'full stretch at the bottom, no bounce',
  a3: 'weight is per dumbbell; keep torso still', a4: 'seated beats lying — hams fully lengthened',
  a5: 'weight is per dumbbell; no swinging', a6: 'stack varies by machine; keep elbows fixed',
  b1: 'push hips back, feel the hamstring stretch', b2: 'stack varies; full hang between reps',
  b3: 'stack varies; stable setup and controlled reps', b4: 'control the negative and use a deep, stable range',
  b5: 'weight is per dumbbell; keep shoulder still', b6: 'machine varies; pause in the deep stretch',
};

const LEGACY_CUE_KEYS = {
  'let the lats lengthen before each pull': 'cue.legacy.latLengthen',
  'start from a deep across-body stretch': 'cue.legacy.deltStretch',
  'overhead = long head at full stretch': 'cue.legacy.tricepsStretch',
  'full hang between reps, lats loaded long': 'cue.legacy.fullHang',
  'machine stability lets you push closer to failure': 'cue.legacy.machineFailure',
  'deep knee bend, slow eccentric': 'cue.legacy.deepKnee',
  'incline puts the elbow behind you — full stretch': 'cue.legacy.curlStretch',
  'hold the deep stretch 3–5s, skip the top half': 'cue.legacy.calfStretch',
};

const programName = (day, fallback) => {
  const value = S.program[day] ? S.program[day].name : fallback;
  return value === `Full Body ${day}` ? tr(`default.day${day}`) : value;
};
const slotLabel = sl => tr(`slot.${sl.label}`, {}, sl.label);
const cueText = sl => DEFAULT_CUES[sl.id] === sl.cue
  ? tr(`cue.${sl.id}`, {}, sl.cue)
  : LEGACY_CUE_KEYS[sl.cue] ? tr(LEGACY_CUE_KEYS[sl.cue], {}, sl.cue) : sl.cue;

const num = parseDecimal;
const trim = n => (Math.round(n * 100) / 100).toString();
const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const dayKey = t => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function niceDate(t) {
  const d = new Date(t), now = new Date();
  const same = d.toDateString() === now.toDateString();
  const yest = new Date(now.getTime() - 864e5).toDateString() === d.toDateString();
  const s = d.toLocaleDateString(L() === 'uk' ? 'uk-UA' : undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return same ? tr('date.today') : yest ? tr('date.yesterday') : s;
}

function ago(t) {
  const mid = x => { const d = new Date(x); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const days = Math.round((mid(Date.now()) - mid(t)) / 864e5);
  return days <= 0 ? tr('date.today') : days === 1 ? tr('date.yesterday') : days < 14
    ? tr('date.daysAgo', { count: days }) : tr('date.weeksAgo', { count: Math.round(days / 7) });
}

const e1rm = (w, r) => (r > 0 ? w * (1 + r / 30) : 0);

const target = (sl, exId) => progressionTarget(S.logs, sl, exId, S.settings.defRir);

const restFor = (sl, kind, exId) => {
  const base = isComp(exId || sl.pick) ? S.settings.restC : S.settings.restI;
  return kind === 'top' ? base : Math.round(base * 0.7);
};

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

/* --------------------------------------------------------------- audio cue  */

let ac = null;
document.addEventListener('pointerdown', () => {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* no audio */ } }
  if (ac && ac.state === 'suspended') ac.resume();
}, { once: false });

function beep() {
  if (!S.settings.beep || !ac) return;
  try {
    [0, 0.18].forEach(off => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.001, ac.currentTime + off);
      g.gain.exponentialRampToValueAtTime(0.3, ac.currentTime + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + off + 0.15);
      o.connect(g); g.connect(ac.destination);
      o.start(ac.currentTime + off); o.stop(ac.currentTime + off + 0.16);
    });
  } catch (e) { /* ignore */ }
}

/* ==================================================================== views */

function render() {
  const needsSetup = !S.profile;
  document.documentElement.lang = L();
  $('#topline').textContent = tr(needsSetup ? 'tagline.setup' : 'tagline');
  const tabKeys = { train: 'tab.train', history: 'tab.history', body: 'tab.body', program: 'tab.program', data: 'tab.data' };
  document.querySelectorAll('#tabs button').forEach(button => {
    const label = button.querySelector('span');
    if (label) label.textContent = tr(tabKeys[button.dataset.tab]);
  });
  $('#rest .restInfo i').textContent = tr('rest');
  $('[data-rest="skip"]').textContent = tr('skip');
  $('#pauseBtn').setAttribute('aria-label', tr(S.active && S.active.pausedAt ? 'resume' : 'pause'));
  $('[data-act="stopSession"]').setAttribute('aria-label', tr('finishSession'));
  $('#tabs').classList.toggle('hidden', needsSetup);
  if (needsSetup) {
    $('#view').innerHTML = onboarding();
    tick();
    return;
  }
  const v = { train, history, body, program, data }[S.ui.tab] || train;
  $('#view').innerHTML = v();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.ui.tab));
  tick();
}

function onboarding() {
  return `
    <section class="onboarding">
      <div class="setupMark">1</div>
      <h1>${tr('setup.title')}</h1>
      <p class="muted">${tr('setup.intro')}</p>
      <div class="card setupCard">
        <label class="fld"><span>${tr('language')}</span>
          <select data-act="language">
            <option value="en" ${L() === 'en' ? 'selected' : ''}>${tr('language.en')}</option>
            <option value="uk" ${L() === 'uk' ? 'selected' : ''}>${tr('language.uk')}</option>
          </select></label>
        <div class="grid2">
          <label class="fld"><span>${tr('setup.height')}</span>
            <input id="setupHeight" inputmode="decimal" autocomplete="off" placeholder="${tr('setup.heightExample')}" value="${esc(setupDraft.height || '')}"></label>
          <label class="fld"><span>${tr('setup.mass')}</span>
            <input id="setupMass" inputmode="decimal" autocomplete="off" placeholder="${tr('setup.massExample')}" value="${esc(setupDraft.mass || '')}"></label>
        </div>
        <label class="fld"><span>${tr('setup.bench')}</span>
          <input id="setupBench" inputmode="decimal" autocomplete="off" placeholder="${tr('setup.benchExample')}" value="${esc(setupDraft.bench || '')}"></label>
        <div class="tiny muted">${tr('setup.benchHelp')}</div>
        <button class="primary big" style="margin-top:16px" data-act="saveProfile" data-source="setup">${tr('setup.create')}</button>
      </div>
      <div class="tiny muted center">${tr('setup.caution')}</div>
    </section>`;
}

/* ------------------------------------------------------------------- train  */

function nextDay() {
  for (let i = S.logs.length - 1; i >= 0; i--) if (S.logs[i].day) return S.logs[i].day === 'A' ? 'B' : 'A';
  return 'A';
}

function train() {
  if (!S.active) {
    const nd = nextDay();
    const last = S.logs[S.logs.length - 1];
    return `
      <div class="startChoices">
        ${['A', 'B'].map(day => `
          <button class="startBig" data-act="start" data-day="${day}">
            <b>${tr('train.startDay', { day })}</b>
            <i>${esc(programName(day))}${day === nd ? ` &middot; ${tr('train.upNext')}` : ''}</i>
          </button>`).join('')}
      </div>
      ${last ? `
        <div class="card small">
          <div class="row spread"><b>${tr('train.last', { name: esc(programName(last.day, tr('program.day', { day: last.day }))) })}</b>
            <span class="muted">${ago(last.end || last.start)}</span></div>
          <div class="muted" style="margin-top:6px">
            ${tr('train.setsTotal', {
              sets: last.sets.length,
              volume: Math.round(last.sets.reduce((a, s) => a + s.weight * s.reps, 0)).toLocaleString(L() === 'uk' ? 'uk-UA' : undefined),
              unit: U(),
            })}
            ${last.end ? ' &middot; ' + mmss((last.dur !== undefined ? last.dur : last.end - last.start) / 1000) : ''}
          </div>
        </div>` : ''}`;
  }

  const A = S.active, day = S.program[A.day];
  return `
    <h2>${tr('train.inProgress', { name: esc(programName(A.day)) })}</h2>
    ${day.slots.map(sl => slotCard(sl, A)).join('')}
    <div class="card">
      <label class="fld"><span>${tr('train.notes')}</span>
        <textarea rows="2" data-act="notes" placeholder="${tr('train.notesPlaceholder')}">${esc(A.notes || '')}</textarea></label>
      <button class="primary big" data-act="finish">${tr('finishSession')}</button>
      <button class="ghost" style="width:100%;margin-top:8px" data-act="abandon">${tr('train.discard')}</button>
    </div>`;
}

function slotCard(sl, A) {
  const exId = (A.picks && A.picks[sl.id]) || sl.pick;
  const tg = target(sl, exId);
  const p = tg ? tg.prev : lastPerformance(S.logs, exId, sl.id);
  const best = bestTopWeight(S.logs, exId, sl.id);
  const rows = ['top', 'back'].map(kind => setRow(sl, exId, kind, A, tg)).join('');
  const doneBoth = ['top', 'back'].every(k => logged(A, sl.id, k));

  return `
    <section class="slot ${doneBoth ? 'done' : ''}">
      <div class="slotHead">
        <div class="slotLabel">${esc(slotLabel(sl))}</div>
        <div class="row" style="margin-bottom:8px">
          <select class="grow" data-act="swap" data-slot="${sl.id}" style="margin-bottom:0">
            ${sl.options.map(o => `<option value="${esc(o)}" ${o === exId ? 'selected' : ''}>${esc(exName(o))}</option>`).join('')}
          </select>
          <a class="vid" target="_blank" rel="noopener" aria-label="${tr('train.howTo', { name: esc(exName(exId)) })}"
            href="https://www.youtube.com/results?search_query=${encodeURIComponent(exName(exId) + ' form technique')}">&#9654;</a>
        </div>
        <div class="hint">
          ${p && p.top
            ? `<span>${tr('train.lastSet')} <b>${trim(p.top.weight)}${U()}&times;${p.top.reps}</b>${p.back ? ` &middot; ${trim(p.back.weight)}&times;${p.back.reps}` : ''}</span>`
            : `<span class="muted">${tr('train.noHistory')}</span>`}
          ${tg ? `<span class="tgt">${tr('train.target')} <b>${trim(tg.weight)}${U()}</b>${tg.up ? ' ▲' : ''}</span>` : ''}
          ${best ? `<span class="muted">${tr('train.best')} ${trim(best)}${U()}</span>` : ''}
        </div>
        ${sl.cue ? `<div class="cue">${esc(cueText(sl))}</div>` : ''}
      </div>
      ${rows}
    </section>`;
}

const logged = (A, slotId, kind) => A.sets.find(s => s.slotId === slotId && s.kind === kind);
const dkey = (slotId, kind) => slotId + ':' + kind;

function setRow(sl, exId, kind, A, tg) {
  const done = logged(A, sl.id, kind);
  const d = A.draft[dkey(sl.id, kind)] || {};
  const straight2 = sl.mode !== 'topback';
  const range = (kind === 'top' || straight2) ? sl.top : sl.back;
  const rp = kind === 'back' ? (sl.style === 'restpause' ? ' RP' : sl.style === 'lengthened' ? ' LP' : '') : '';
  const label = straight2 ? tr(kind === 'top' ? 'train.set1' : 'train.set2') : tr(kind === 'top' ? 'train.top' : 'train.back');

  // prefill: logged value > local draft > progression target (set 2 mirrors set 1 in straight mode)
  const backGuess = tg ? (straight2 ? tg.weight : Math.round(tg.weight * 0.8 / sl.inc) * sl.inc) : '';
  let w = done ? done.weight : (d.weight !== undefined ? d.weight : (tg ? (kind === 'top' ? tg.weight : backGuess) : ''));
  let r = done ? done.reps : (d.reps !== undefined ? d.reps : (sl.startReps || S.settings.defReps));
  let rir = done ? done.rpe : (d.rpe !== undefined ? d.rpe : S.settings.defRir);

  return `
    <div class="setRow ${done ? 'logged' : ''}">
      <div class="setKind">
        <b>${label}</b>
        <i>${range[0]}–${range[1]}${rp}</i>
      </div>
      ${stepper('weight', sl.id, kind, w, sl.inc, U())}
      ${stepper('reps', sl.id, kind, r, 1, tr('train.reps'))}
      ${stepper('rpe', sl.id, kind, rir, 0.5, 'RIR')}
      <button class="ok ${done ? 'on' : ''}" data-act="log" data-slot="${sl.id}" data-kind="${kind}"
        aria-label="${tr(done ? 'train.undoSet' : 'train.logSet')}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6"
            stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>`;
}

function stepper(field, slotId, kind, val, step, tag) {
  const id = `f-${slotId}-${kind}-${field}`;
  return `<div>
    <div class="stp">
      <button data-act="step" data-for="${id}" data-step="${-step}" aria-label="${tr('train.less')}">&minus;</button>
      <input id="${id}" inputmode="decimal" data-field="${field}" data-slot="${slotId}" data-kind="${kind}"
        value="${val === '' || val === undefined ? '' : trim(val)}" placeholder="–">
      <button data-act="step" data-for="${id}" data-step="${step}" aria-label="${tr('train.more')}">&#43;</button>
    </div>
    <span class="unitTag">${tag}</span>
  </div>`;
}

/* ----------------------------------------------------------------- history  */

function history() {
  if (!S.logs.length) return `<h2>${tr('history.title')}</h2><div class="card muted small">${tr('history.empty')}</div>`;

  const weeks = {};
  S.logs.forEach(l => {
    const d = new Date(l.start), y = d.getFullYear();
    const wk = Math.floor((d - new Date(y, 0, 1)) / 6048e5);
    (weeks[y + '-' + wk] = weeks[y + '-' + wk] || []).push(l);
  });
  const perWeek = Object.values(weeks);
  const avg = perWeek.length ? (S.logs.length / perWeek.length) : 0;

  return `
    <h2>${tr('history.title')}</h2>
    <div class="card">
      <div class="stat">
        <div><b>${S.logs.length}</b><span>${tr('history.sessions')}</span></div>
        <div><b>${avg.toFixed(1)}</b><span>${tr('history.perWeek')}</span></div>
        <div><b>${Math.round(S.logs.reduce((a, l) => a + l.sets.reduce((x, s) => x + s.weight * s.reps, 0), 0) / 1000)}t</b><span>${tr('history.totalVolume')}</span></div>
      </div>
    </div>
    ${S.logs.slice().reverse().map(logCard).join('')}`;
}

function logCard(l) {
  const vol = Math.round(l.sets.reduce((a, s) => a + s.weight * s.reps, 0));
  const dur = l.end ? mmss((l.dur !== undefined ? l.dur : l.end - l.start) / 1000) : '—';
  return `
    <details class="log">
      <summary>
        <span><b>${esc(programName(l.day, tr('program.day', { day: l.day })))}</b>
          <div class="meta">${niceDate(l.start)} &middot; ${dur} &middot; ${vol.toLocaleString(L() === 'uk' ? 'uk-UA' : undefined)} ${U()}</div></span>
        <span class="meta">${tr('history.sets', { count: l.sets.length })}</span>
      </summary>
      <div class="body">
        ${l.sets.map(s => `
          <div class="logSet">
            <span class="nm"><span class="badge ${s.kind === 'top' ? '' : 'b'}">${s.kind === 'top' ? 'S1' : 'S2'}</span> ${esc(exName(s.exId))}</span>
            <span>${trim(s.weight)}${U()} &times; ${s.reps}${Number.isFinite(s.rpe) ? ` <span class="muted">${trim(s.rpe)} RIR</span>` : ''}
              <span class="muted tiny">e1RM ${Math.round(e1rm(s.weight, s.reps))}</span></span>
          </div>`).join('')}
        ${l.notes ? `<div class="small muted" style="margin-top:10px">“${esc(l.notes)}”</div>` : ''}
        <button class="ghost danger" style="margin-top:10px" data-act="delLog" data-id="${esc(l.id)}">${tr('history.delete')}</button>
      </div>
    </details>`;
}

/* -------------------------------------------------------------------- body  */

function body() {
  const list = S.bw.slice().sort((a, b) => a.d < b.d ? 1 : -1);
  const latest = list[0];
  const first = list[list.length - 1];
  const wk = list.filter(b => Date.now() - new Date(b.d).getTime() < 7 * 864e5);
  const wkAvg = wk.length ? wk.reduce((a, b) => a + b.kg, 0) / wk.length : null;

  return `
    <h2>${tr('body.profile')}</h2>
    <div class="card">
      <div class="stat">
        <div><b>${trim(S.profile.heightCm)}</b><span>${tr('body.height')}</span></div>
        <div><b>${trim(S.profile.massKg)}</b><span>${tr('body.baseline')}</span></div>
        <div><b>${calculateBmi(S.profile.heightCm, S.profile.massKg).toFixed(1)}</b><span>${tr('bmi')}</span></div>
        <div><b>${trim(S.profile.bench1Rm)}</b><span>${tr('body.bench')}</span></div>
      </div>
      <div class="tiny muted" style="margin-top:10px">${tr('body.bmiHelp')}</div>
    </div>
    <h2>${tr('body.title')}</h2>
    <div class="card">
      <div class="row" style="gap:8px">
        <input id="bwIn" inputmode="decimal" placeholder="${tr('body.example')}" value="${latest && latest.d === dayKey(Date.now()) ? trim(latest.kg) : ''}">
        <button class="primary" data-act="bwSave">${tr('body.save')}</button>
      </div>
      <div class="tiny muted" style="margin-top:6px">${tr('body.savedToday', { date: dayKey(Date.now()) })}</div>
    </div>
    ${list.length ? `
      <div class="card">
        <div class="stat">
          <div><b>${trim(latest.kg)}</b><span>${tr('body.latest', { unit: U() })}</span></div>
          ${wkAvg !== null ? `<div><b>${wkAvg.toFixed(1)}</b><span>${tr('body.average')}</span></div>` : ''}
          ${first && list.length > 1 ? `<div><b>${(latest.kg - first.kg >= 0 ? '+' : '')}${trim(latest.kg - first.kg)}</b><span>${tr('body.allTime')}</span></div>` : ''}
        </div>
      </div>
      ${list.length > 1 ? `<div class="card">${spark(list.slice().reverse())}</div>` : ''}
      <h2>${tr('body.entries')}</h2>
      <div class="card">
        ${list.map(b => `<div class="bwRow"><span>${esc(b.d)}</span>
          <span><b>${trim(b.kg)}</b> <span class="muted">${U()}</span>
          <button class="icon" data-act="bwDel" data-d="${esc(b.d)}" aria-label="${tr('body.delete')}">✕</button></span></div>`).join('')}
      </div>` : `<div class="card muted small">${tr('body.empty')}</div>`}`;
}

function spark(pts) {
  const W = 320, H = 120, pad = 6;
  const vals = pts.map(p => p.kg);
  const lo = Math.min(...vals) - 0.4, hi = Math.max(...vals) + 0.4;
  const x = i => pad + (i * (W - pad * 2)) / Math.max(1, pts.length - 1);
  const y = v => H - pad - ((v - lo) / Math.max(0.1, hi - lo)) * (H - pad * 2);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - pad} L${pad},${H - pad} Z`;
  return `
    <svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${tr('body.trend')}">
      <path d="${area}" fill="rgba(245,158,11,.14)"></path>
      <path d="${line}" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
      ${pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="2.2" fill="#f59e0b"></circle>`).join('')}
    </svg>
    <div class="row spread tiny muted"><span>${esc(pts[0].d)}</span><span>${trim(lo + 0.4)}–${trim(hi - 0.4)} ${U()}</span><span>${esc(pts[pts.length - 1].d)}</span></div>`;
}

/* ----------------------------------------------------------------- program  */

function program() {
  return `
    <h2>${tr('program.title')}</h2>
    <div class="card small muted">
      ${tr('program.intro')}
    </div>
    ${['A', 'B'].map(d => `
      <h2>${tr('program.day', { day: d })}</h2>
      <div class="card">
        <label class="fld"><span>${tr('program.dayName')}</span>
          <input data-act="dayName" data-day="${d}" value="${esc(programName(d))}"></label>
      </div>
      ${S.program[d].slots.map((sl, i) => slotEditor(d, sl, i)).join('')}
      <button class="ghost" style="width:100%" data-act="addSlot" data-day="${d}">${tr('program.addSlot')}</button>
    `).join('')}
    <h2>${tr('program.reset')}</h2>
    <div class="card">
      <button class="ghost danger" data-act="resetProgram">${tr('program.restore')}</button>
      <div class="tiny muted" style="margin-top:6px">${tr('program.resetHelp')}</div>
    </div>`;
}

function slotEditor(d, sl, i) {
  const others = Object.values(S.exercises).filter(e => !sl.options.includes(e.id))
    .sort((a, b) => exName(a.id).localeCompare(exName(b.id), L() === 'uk' ? 'uk-UA' : 'en'));
  return `
    <div class="card">
      <div class="row spread">
        <input data-act="slotLabel" data-day="${d}" data-slot="${sl.id}" value="${esc(slotLabel(sl))}" style="font-weight:600">
        <div class="row" style="gap:2px">
          <button class="icon" data-act="moveSlot" data-day="${d}" data-slot="${sl.id}" data-dir="-1" aria-label="${tr('program.up')}">↑</button>
          <button class="icon" data-act="moveSlot" data-day="${d}" data-slot="${sl.id}" data-dir="1" aria-label="${tr('program.down')}">↓</button>
          <button class="icon danger" data-act="delSlot" data-day="${d}" data-slot="${sl.id}" aria-label="${tr('program.remove')}">✕</button>
        </div>
      </div>

      <div class="tiny muted" style="margin:10px 0 0">${tr('program.variations')}</div>
      <div class="chips">
        ${sl.options.map(o => `
          <span class="chip ${o === sl.pick ? 'sel' : ''}">
            <span data-act="setPick" data-day="${d}" data-slot="${sl.id}" data-ex="${esc(o)}">${esc(exName(o))}</span>
            ${sl.options.length > 1 ? `<button data-act="delOpt" data-day="${d}" data-slot="${sl.id}" data-ex="${esc(o)}" aria-label="${tr('program.remove')}">✕</button>` : ''}
          </span>`).join('')}
      </div>
      <select data-act="addOpt" data-day="${d}" data-slot="${sl.id}">
        <option value="">${tr('program.addVariation')}</option>
        ${others.map(e => `<option value="${esc(e.id)}">${esc(exName(e.id))}</option>`).join('')}
        <option value="__new">${tr('program.newExercise')}</option>
      </select>

      <div class="grid2" style="margin-top:10px">
        <label class="fld"><span>${tr('program.structure')}</span>
          <select data-act="mode" data-day="${d}" data-slot="${sl.id}">
            <option value="straight2" ${sl.mode !== 'topback' ? 'selected' : ''}>${tr('program.straight2')}</option>
            <option value="topback" ${sl.mode === 'topback' ? 'selected' : ''}>${tr('program.topBack')}</option>
          </select></label>
        <label class="fld"><span>${tr('program.set2Technique')}</span>
          <select data-act="style" data-day="${d}" data-slot="${sl.id}">
            <option value="straight" ${sl.style === 'straight' ? 'selected' : ''}>${tr('program.straight')}</option>
            <option value="restpause" ${sl.style === 'restpause' ? 'selected' : ''}>${tr('program.restPause')}</option>
            <option value="lengthened" ${sl.style === 'lengthened' ? 'selected' : ''}>${tr('program.lengthened')}</option>
          </select></label>
      </div>
      <div class="grid4">
        <label class="fld"><span>${tr('program.repsMin')}</span><input inputmode="numeric" data-act="rng" data-day="${d}" data-slot="${sl.id}" data-k="top" data-j="0" value="${sl.top[0]}"></label>
        <label class="fld"><span>${tr('program.repsMax')}</span><input inputmode="numeric" data-act="rng" data-day="${d}" data-slot="${sl.id}" data-k="top" data-j="1" value="${sl.top[1]}"></label>
        ${sl.mode === 'topback' ? `
        <label class="fld"><span>${tr('program.backMin')}</span><input inputmode="numeric" data-act="rng" data-day="${d}" data-slot="${sl.id}" data-k="back" data-j="0" value="${sl.back[0]}"></label>
        <label class="fld"><span>${tr('program.backMax')}</span><input inputmode="numeric" data-act="rng" data-day="${d}" data-slot="${sl.id}" data-k="back" data-j="1" value="${sl.back[1]}"></label>` : `
        <label class="fld"><span>${tr('program.increment', { unit: U() })}</span>
          <input inputmode="decimal" data-act="inc" data-day="${d}" data-slot="${sl.id}" value="${sl.inc}"></label>`}
      </div>
      ${sl.mode === 'topback' ? `<label class="fld"><span>${tr('program.increment', { unit: U() })}</span>
        <input inputmode="decimal" data-act="inc" data-day="${d}" data-slot="${sl.id}" value="${sl.inc}"></label>` : ''}
      <label class="fld"><span>${tr('program.cue')}</span>
        <input data-act="cue" data-day="${d}" data-slot="${sl.id}" value="${esc(cueText(sl) || '')}"></label>
    </div>`;
}

/* -------------------------------------------------------------------- data  */

function data() {
  const bytes = new Blob([JSON.stringify(S)]).size;
  return `
    <h2>${tr('language')}</h2>
    <div class="card">
      <label class="fld"><span>${tr('language')}</span>
        <select data-act="language">
          <option value="en" ${L() === 'en' ? 'selected' : ''}>${tr('language.en')}</option>
          <option value="uk" ${L() === 'uk' ? 'selected' : ''}>${tr('language.uk')}</option>
        </select></label>
    </div>

    <h2>${tr('data.profileTitle')}</h2>
    <div class="card">
      <div class="grid2">
        <label class="fld"><span>${tr('setup.height')}</span>
          <input id="profileHeight" inputmode="decimal" value="${trim(S.profile.heightCm)}"></label>
        <label class="fld"><span>${tr('setup.mass')}</span>
          <input id="profileMass" inputmode="decimal" value="${trim(S.profile.massKg)}"></label>
      </div>
      <label class="fld"><span>${tr('setup.bench')}</span>
        <input id="profileBench" inputmode="decimal" value="${trim(S.profile.bench1Rm)}"></label>
      <div class="row spread small" style="margin:2px 0 12px">
        <span class="muted">${tr('data.currentBmi')}</span><b>${calculateBmi(S.profile.heightCm, S.profile.massKg).toFixed(1)}</b>
      </div>
      <button class="primary" style="width:100%" data-act="saveProfile" data-source="profile">${tr('data.updateProfile')}</button>
      <div class="tiny muted" style="margin-top:8px">${tr('data.profileHelp')}</div>
    </div>

    <h2>${tr('data.settings')}</h2>
    <div class="card">
      <div class="grid2">
        <label class="fld"><span>${tr('data.unit')}</span>
          <select data-act="set" data-k="unit">
            <option value="kg" ${U() === 'kg' ? 'selected' : ''}>kg</option>
            <option value="lb" ${U() === 'lb' ? 'selected' : ''}>lb</option>
          </select></label>
        <label class="fld"><span>${tr('data.sessionTarget')}</span>
          <input inputmode="numeric" data-act="set" data-k="targetMin" value="${S.settings.targetMin}"></label>
        <label class="fld"><span>${tr('data.restCompound')}</span>
          <input inputmode="numeric" data-act="set" data-k="restC" value="${S.settings.restC}"></label>
        <label class="fld"><span>${tr('data.restIsolation')}</span>
          <input inputmode="numeric" data-act="set" data-k="restI" value="${S.settings.restI}"></label>
        <label class="fld"><span>${tr('data.defaultReps')}</span>
          <input inputmode="numeric" data-act="set" data-k="defReps" value="${S.settings.defReps}"></label>
        <label class="fld"><span>${tr('data.defaultRir')}</span>
          <input inputmode="decimal" data-act="set" data-k="defRir" value="${S.settings.defRir}"></label>
      </div>
      <label class="row" style="gap:10px">
        <input type="checkbox" data-act="beep" ${S.settings.beep ? 'checked' : ''} style="width:24px;min-height:24px">
        <span class="small">${tr('data.beep')}</span>
      </label>
      <div class="tiny muted" style="margin-top:8px">${tr('data.unitHelp')}</div>
    </div>

    <h2>${tr('data.backup')}</h2>
    <div class="card">
      <div class="small muted" style="margin-bottom:10px">
        ${tr('data.backupHelp', { sessions: S.logs.length, weighIns: S.bw.length, size: (bytes / 1024).toFixed(1) })}
      </div>
      <button class="primary" style="width:100%" data-act="export">${tr('data.download')}</button>
      <button class="ghost" style="width:100%;margin-top:8px" data-act="copy">${tr('data.copy')}</button>
      <label class="fld" style="margin-top:14px"><span>${tr('data.restoreFile')}</span>
        <input type="file" accept="application/json,.json" data-act="importFile"></label>
      <label class="fld"><span>${tr('data.restorePaste')}</span>
        <textarea rows="3" id="pasteIn" placeholder='{"v":1,…}'></textarea></label>
      <button class="ghost" style="width:100%" data-act="importPaste">${tr('data.restore')}</button>
    </div>

    <h2>${tr('data.danger')}</h2>
    <div class="card">
      <button class="ghost danger" style="width:100%" data-act="wipe">${tr('data.erase')}</button>
    </div>

    <h2>${tr('data.install')}</h2>
    <div class="card small muted">
      ${tr('data.installHelp')}
    </div>`;
}

/* ================================================================== actions */

function startSession(day) {
  S.active = { day, start: Date.now(), sets: [], draft: {}, picks: {}, notes: '', restEnd: 0, pausedAt: 0, pausedMs: 0 };
  S.program[day].slots.forEach(sl => { S.active.picks[sl.id] = sl.pick; });
  save(); render();
}

function finishSession() {
  const A = S.active;
  if (!A) return;
  if (!A.sets.length) { toast(tr('msg.noSets')); return; }
  const end = Date.now();
  const dur = end - A.start - A.pausedMs - (A.pausedAt ? end - A.pausedAt : 0);
  S.logs.push({ id: 'L' + A.start, day: A.day, start: A.start, end, dur, sets: A.sets, notes: A.notes || '' });
  S.active = null;
  S.ui.tab = 'history';
  save(); render();
  toast(tr('msg.sessionSaved'));
}

function toggleLog(slotId, kind) {
  const A = S.active, sl = S.program[A.day].slots.find(s => s.id === slotId);
  const existing = logged(A, slotId, kind);
  if (!existing && kind === 'top' && sl.mode !== 'topback' && !A.draft[dkey(slotId, 'back')]) {
    // logging set 1 pre-seeds set 2 at the same weight
    const w = num(($(`#f-${slotId}-top-weight`) || {}).value);
    if (w) A.draft[dkey(slotId, 'back')] = { weight: w };
  }
  if (existing) {
    A.sets = A.sets.filter(s => s !== existing);
    A.draft[dkey(slotId, kind)] = { weight: existing.weight, reps: existing.reps, rpe: existing.rpe };
    save(); render();
    return;
  }
  const get = f => num(($(`#f-${slotId}-${kind}-${f}`) || {}).value);
  const weight = get('weight'), reps = get('reps'), rpe = get('rpe');
  if (!reps) { toast(tr('msg.enterReps')); return; }
  if (!weight && !confirm(tr('confirm.bodyweightSet'))) return;
  const exId = A.picks[slotId] || sl.pick;
  A.sets.push({ slotId, exId, kind, weight, reps, rpe, ts: Date.now() });
  A.restEnd = Date.now() + restFor(sl, kind, exId) * 1000;
  save(); render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pumplog-${dayKey(Date.now())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* Coerce an imported backup into a known-good shape; null = not a usable backup.
   Malformed sessions/weigh-ins are dropped rather than crashing render later. */
function sanitizeBackup(p) {
  if (!p || typeof p !== 'object' || !Array.isArray(p.logs)) return null;
  return {
    v: 1,
    programRev: Number.isFinite(+p.programRev) ? +p.programRev : 0,
    settings: (p.settings && typeof p.settings === 'object') ? p.settings : {},
    profile: sanitizeProfile(p.profile),
    exercises: (p.exercises && typeof p.exercises === 'object') ? p.exercises : {},
    program: sanitizeProgram(p.program),
    logs: sanitizeLogs(p.logs), bw: sanitizeBodyweight(p.bw),
    active: null, ui: { tab: 'train' },
  };
}

function restore(text) {
  let p;
  try { p = JSON.parse(text); } catch (e) { toast(tr('msg.invalidJson')); return; }
  const clean = sanitizeBackup(p);
  if (!clean) { toast(tr('msg.notBackup')); return; }
  if (!confirm(tr('confirm.restore', { sessions: clean.logs.length, weighIns: clean.bw.length }))) return;
  localStorage.setItem(KEY, JSON.stringify(clean));
  S = load(); flushSave(); render(); toast(tr('msg.backupRestored'));
}

const findSlot = (d, id) => S.program[d].slots.find(s => s.id === id);

function rescaleStarterWeights(previousScale, nextScale) {
  ['A', 'B'].forEach(day => S.program[day].slots.forEach(sl => {
    if (!Number.isFinite(sl.startWeight)) return;
    if (!Number.isFinite(sl.baseStartWeight)) sl.baseStartWeight = sl.startWeight / (previousScale || 1);
    sl.startWeight = scaleStarterWeight(sl.baseStartWeight, nextScale, sl.inc);
  }));
}

function saveProfile(source) {
  const prefix = source === 'setup' ? 'setup' : 'profile';
  const heightCm = num(($(`#${prefix}Height`) || {}).value);
  const massKg = num(($(`#${prefix}Mass`) || {}).value);
  const bench1Rm = num(($(`#${prefix}Bench`) || {}).value);
  if (heightCm < 120 || heightCm > 230) { toast(tr('msg.heightRange')); return; }
  if (massKg < 35 || massKg > 250) { toast(tr('msg.massRange')); return; }
  if (bench1Rm < 20 || bench1Rm > 300) { toast(tr('msg.benchRange')); return; }

  const previousScale = S.profile ? S.profile.strengthScale : 1;
  const nextScale = strengthScale(bench1Rm);
  rescaleStarterWeights(previousScale, nextScale);
  const now = Date.now();
  S.profile = {
    heightCm, massKg, bench1Rm, strengthScale: nextScale,
    createdAt: S.profile ? S.profile.createdAt : now,
    updatedAt: now,
  };
  const today = dayKey(now);
  S.bw = S.bw.filter(row => row.d !== today).concat({ d: today, kg: massKg });
  save(); render();
  setupDraft = {};
  toast(source === 'setup' ? tr('msg.ready', { bmi: calculateBmi(heightCm, massKg).toFixed(1) }) : tr('msg.profileUpdated'));
}

/* ------------------------------------------------------------ event wiring */

document.addEventListener('click', async e => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const a = t.dataset.act, d = t.dataset.day, id = t.dataset.slot;

  switch (a) {
    case 'saveProfile': saveProfile(t.dataset.source); break;
    case 'start': startSession(t.dataset.day); break;
    case 'finish': finishSession(); break;
    case 'pause': {
      const A = S.active; if (!A) break;
      if (A.pausedAt) {
        const gap = Date.now() - A.pausedAt;
        A.pausedMs += gap;
        if (A.restEnd) A.restEnd += gap;   // resume the rest countdown where it left off
        A.pausedAt = 0;
      } else A.pausedAt = Date.now();
      save(); tick();
      break;
    }
    case 'stopSession':
      if (!S.active) break;
      if (S.active.sets.length) {
        if (confirm(tr('confirm.finish'))) finishSession();
      } else if (confirm(tr('confirm.discardEmpty'))) {
        S.active = null; save(); render();
      }
      break;
    case 'abandon':
      if (confirm(tr('confirm.discard'))) { S.active = null; save(); render(); }
      break;
    case 'log': toggleLog(id, t.dataset.kind); break;

    case 'step': {
      const inp = document.getElementById(t.dataset.for);
      if (!inp) break;
      const step = parseFloat(t.dataset.step);
      let v = num(inp.value) + step;
      if (inp.dataset.field === 'rpe') v = Math.min(5, Math.max(0, v));
      inp.value = trim(Math.max(0, v));
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      break;
    }

    case 'delLog':
      if (confirm(tr('confirm.deleteSession'))) {
        S.logs = S.logs.filter(l => l.id !== t.dataset.id); save(); render();
      }
      break;

    case 'bwSave': {
      const v = num(($('#bwIn') || {}).value);
      if (!v) { toast(tr('msg.enterWeight')); break; }
      const d0 = dayKey(Date.now());
      S.bw = S.bw.filter(b => b.d !== d0).concat({ d: d0, kg: v });
      save(); render(); toast(tr('msg.bodyweightSaved'));
      break;
    }
    case 'bwDel': S.bw = S.bw.filter(b => b.d !== t.dataset.d); save(); render(); break;

    case 'setPick': findSlot(d, id).pick = t.dataset.ex; save(); render(); break;
    case 'delOpt': {
      const sl = findSlot(d, id);
      sl.options = sl.options.filter(o => o !== t.dataset.ex);
      if (sl.pick === t.dataset.ex) sl.pick = sl.options[0];
      save(); render(); break;
    }
    case 'moveSlot': {
      const arr = S.program[d].slots, i = arr.findIndex(s => s.id === id), j = i + parseInt(t.dataset.dir, 10);
      if (j >= 0 && j < arr.length) { arr.splice(j, 0, arr.splice(i, 1)[0]); save(); render(); }
      break;
    }
    case 'delSlot':
      if (confirm(tr('confirm.removeSlot'))) {
        S.program[d].slots = S.program[d].slots.filter(s => s.id !== id); save(); render();
      }
      break;
    case 'addSlot': {
      const sid = d.toLowerCase() + Date.now().toString(36);
      S.program[d].slots.push(slot(sid, 'New slot', 'leg-press', ['leg-press'], [8, 12], [8, 12], 'straight', 2.5, ''));
      save(); render(); break;
    }
    case 'resetProgram':
      if (confirm(tr('confirm.resetProgram'))) {
        S.program = seedProgram();
        rescaleStarterWeights(1, S.profile ? S.profile.strengthScale : 1);
        save(); render();
      }
      break;

    case 'export': exportData(); break;
    case 'copy':
      navigator.clipboard.writeText(JSON.stringify(S, null, 2))
        .then(() => toast(tr('msg.backupCopied'))).catch(() => toast(tr('msg.clipboardBlocked')));
      break;
    case 'importPaste': restore(($('#pasteIn') || {}).value || ''); break;
    case 'wipe':
      if (confirm(tr('confirm.erase')) && confirm(tr('confirm.eraseReally'))) {
        await idbClear();
        localStorage.removeItem(KEY);
        S = seed();
        flushSave();
        render(); toast(tr('msg.allErased'));
      }
      break;
  }
});

/* keep drafts + settings in sync without re-rendering (would steal focus) */
document.addEventListener('input', e => {
  const t = e.target;

  if (t.id === 'setupHeight') setupDraft.height = t.value;
  if (t.id === 'setupMass') setupDraft.mass = t.value;
  if (t.id === 'setupBench') setupDraft.bench = t.value;

  if (t.dataset.field && S.active) {
    const k = dkey(t.dataset.slot, t.dataset.kind);
    S.active.draft[k] = Object.assign({}, S.active.draft[k], { [t.dataset.field]: num(t.value) });
    save(); return;
  }

  const a = t.dataset.act, d = t.dataset.day, id = t.dataset.slot;
  switch (a) {
    case 'notes': if (S.active) { S.active.notes = t.value; save(); } break;
    case 'dayName': S.program[d].name = t.value; save(); break;
    case 'slotLabel': findSlot(d, id).label = t.value; save(); break;
    case 'rng': {
      const sl = findSlot(d, id), key = t.dataset.k, index = +t.dataset.j;
      sl[key] = updateRange(sl[key], index, t.value);
      t.value = sl[key][index];
      const peer = t.closest('.grid4')?.querySelector(`[data-k="${key}"][data-j="${index ? 0 : 1}"]`);
      if (peer) peer.value = sl[key][index ? 0 : 1];
      save(); break;
    }
    case 'inc': findSlot(d, id).inc = num(t.value) || 1; save(); break;
    case 'cue': findSlot(d, id).cue = t.value; save(); break;
    case 'set': {
      const k = t.dataset.k;
      S.settings[k] = k === 'unit' ? t.value
        : k === 'defRir' ? Math.min(5, Math.max(0, num(t.value)))
        : Math.max(1, parseInt(num(t.value), 10) || 1);
      save(); if (k === 'unit') render(); break;
    }
    case 'beep': S.settings.beep = t.checked; save(); break;
  }
});

document.addEventListener('change', e => {
  const t = e.target, a = t.dataset.act, d = t.dataset.day, id = t.dataset.slot;

  if (a === 'language') {
    S.settings.language = normalizeLanguage(t.value);
    save(); render(); return;
  }

  if (a === 'swap' && S.active) {
    if (S.active.sets.some(set => set.slotId === t.dataset.slot)) {
      toast(tr('msg.undoBeforeSwap'));
      render(); return;
    }
    S.active.picks[t.dataset.slot] = t.value;
    Object.keys(S.active.draft).forEach(k => { if (k.startsWith(t.dataset.slot + ':')) delete S.active.draft[k]; });
    save(); render(); return;
  }

  if (a === 'style') { findSlot(d, id).style = t.value; save(); return; }

  if (a === 'mode') { findSlot(d, id).mode = t.value; save(); render(); return; }

  if (a === 'addOpt') {
    const sl = findSlot(d, id);
    let v = t.value;
    if (!v) return;
    if (v === '__new') {
      const name = (prompt(tr('prompt.exerciseName')) || '').trim();
      if (!name) { render(); return; }
      const nid = 'x' + Date.now().toString(36);
      const heavy = confirm(tr('confirm.compound'));
      S.exercises[nid] = { id: nid, name, kind: heavy ? 'c' : 'i' };
      v = nid;
    }
    if (!sl.options.includes(v)) sl.options.push(v);
    save(); render(); return;
  }

  if (a === 'importFile') {
    const f = t.files && t.files[0];
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => restore(String(fr.result));
    fr.readAsText(f);
  }
});

/* rest bar buttons */
$('#rest').addEventListener('click', e => {
  const b = e.target.closest('[data-rest]');
  if (!b || !S.active) return;
  const v = b.dataset.rest;
  if (v === 'skip') S.active.restEnd = 0;
  else S.active.restEnd = Math.max(Date.now(), S.active.restEnd + parseInt(v, 10) * 1000);
  save(); tick();
});

document.querySelectorAll('#tabs button').forEach(b =>
  b.addEventListener('click', () => { S.ui.tab = b.dataset.tab; save(); render(); }));

/* ------------------------------------------------------------------- ticker */

let beeped = false;

function tick() {
  const A = S.active;
  const sess = $('#sess'), rest = $('#rest');

  if (!A) { sess.classList.add('hidden'); rest.classList.add('hidden'); return; }

  const nowRef = A.pausedAt || Date.now();
  const elapsed = nowRef - A.start - A.pausedMs;
  const mins = elapsed / 60000;
  sess.classList.remove('hidden');
  sess.querySelector('.clock').classList.toggle('over', mins > S.settings.targetMin);
  $('#clockTime').textContent = mmss(elapsed / 1000);
  $('#clockTarget').textContent = A.pausedAt ? tr('paused') : `/ ${S.settings.targetMin}m`;
  $('#pauseBtn').innerHTML = A.pausedAt ? '&#9654;' : '&#9208;';
  $('#pauseBtn').setAttribute('aria-label', tr(A.pausedAt ? 'resume' : 'pause'));

  if (A.pausedAt) { rest.classList.add('hidden'); return; }

  const left = (A.restEnd - Date.now()) / 1000;
  if (left > 0) {
    rest.classList.remove('hidden');
    $('#restTime').textContent = mmss(left);
    beeped = false;
  } else {
    if (A.restEnd && !beeped) { beeped = true; beep(); A.restEnd = 0; save(); }
    rest.classList.add('hidden');
  }
}

setInterval(tick, 500);

/* --------------------------------------------------------------------- boot */

/* optional deep link, e.g. index.html?tab=body */
const qTab = new URLSearchParams(location.search).get('tab');
if (['train', 'history', 'body', 'program', 'data'].includes(qTab)) S.ui.tab = qTab;

render();

(async () => {
  IDB.db = await idbOpen();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const mirror = await idbGet();
  if (mirror) {
    try {
      const m = JSON.parse(mirror);
      if ((m.savedAt || 0) > (S.savedAt || 0)) {
        localStorage.setItem(KEY, mirror);
        S = load(); render();
        toast(tr('msg.recovered'));
      }
    } catch (e) { /* corrupt mirror — overwritten below */ }
  }
  idbPut(JSON.stringify(S));
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW failed', e)));
}
