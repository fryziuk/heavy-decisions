/* Pump Log — 2x/week full-body logger for low-volume, high-effort training:
   two straight working sets per exercise, ~2 RIR. Data never leaves the device. */

'use strict';

const KEY = 'pumplog.v1';
const PROGRAM_REV = 2;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ------------------------------------------------------------------ library */
/* kind drives the default rest period (compound = long, isolation = short).   */

const LIBRARY = [
  ['hack-squat', 'Hack Squat', 'c'], ['back-squat', 'Back Squat', 'c'],
  ['pendulum-squat', 'Pendulum Squat', 'c'], ['smith-squat', 'Smith Machine Squat', 'c'],
  ['leg-press', 'Leg Press', 'c'], ['bulgarian', 'Bulgarian Split Squat', 'c'],
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

function seedProgram() {
  /* Low-volume defaults: two straight working sets taken to ~2 reps in reserve.
     Compounds live mostly in 6–10; isolations use 8–12 or 10–15 so load does not
     come at the expense of control. Second set = same weight and range, not a
     back-off. 'topback' mode remains available per slot. */
  return {
    A: {
      name: 'Full Body A',
      slots: [
        slot('a1', 'Quads',           'back-squat',       ['back-squat', 'hack-squat', 'pendulum-squat', 'leg-press', 'smith-squat'], [6, 10], [6, 10], 'straight', 5, 'deep, control the negative'),
        slot('a2', 'Horizontal Push', 'flat-bb-press',    ['flat-bb-press', 'machine-press', 'inc-db-press', 'inc-bb-press', 'dip'], [6, 10], [6, 10], 'straight', 2.5, 'full stretch at the bottom, no bounce'),
        slot('a3', 'Horizontal Pull', 'db-row',           ['db-row', 'cs-row', 'seal-row', 'cable-row', 't-bar'], [6, 10], [6, 10], 'straight', 2.5, 'let the lats lengthen before each pull'),
        slot('a4', 'Hamstrings',      'seated-curl',     ['seated-curl', 'lying-curl', 'nordic'], [8, 12], [8, 12], 'straight', 2.5, 'seated beats lying — hams fully lengthened'),
        slot('a5', 'Side Delts',      'db-lat-raise',    ['db-lat-raise', 'cable-lat-raise', 'machine-lat-raise'], [10, 15], [10, 15], 'straight', 1, 'stable setup, control every rep'),
        slot('a6', 'Triceps',         'pushdown',        ['pushdown', 'oh-cable-ext', 'skull', 'dip-machine'], [8, 12], [8, 12], 'straight', 2.5, 'keep elbows fixed; control the return'),
      ],
    },
    B: {
      name: 'Full Body B',
      slots: [
        slot('b1', 'Hinge',         'rdl',           ['rdl', 'good-morning', 'back-ext', 'lying-curl'], [6, 10], [6, 10], 'straight', 2.5, 'push hips back, feel the hamstring stretch'),
        slot('b2', 'Vertical Pull', 'pulldown',      ['pulldown', 'neutral-pulldown', 'pullover', 'pullup'], [6, 10], [6, 10], 'straight', 2.5, 'full hang between reps, lats loaded long'),
        slot('b3', 'Vertical Push', 'machine-ohp',   ['machine-ohp', 'db-ohp', 'bb-ohp'], [8, 12], [8, 12], 'straight', 2, 'machine stability lets you push hard with less noise'),
        slot('b4', 'Quads',         'leg-press',     ['leg-press', 'hack-squat', 'bulgarian', 'leg-ext'], [8, 12], [8, 12], 'straight', 5, 'deep knee bend, slow eccentric'),
        slot('b5', 'Biceps',        'inc-db-curl',   ['inc-db-curl', 'ez-curl', 'cable-curl', 'preacher', 'hammer'], [8, 12], [8, 12], 'straight', 1, 'incline puts the elbow behind you — full stretch'),
        slot('b6', 'Calves',        'press-calf',    ['press-calf', 'standing-calf', 'seated-calf'], [8, 12], [8, 12], 'straight', 2.5, 'pause in the deep stretch; use full controlled reps'),
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
    settings: { unit: 'kg', restC: 180, restI: 120, targetMin: 60, beep: true, defReps: 8, defRir: 2 },
    exercises: ex,
    program: seedProgram(),
    logs: [],
    bw: [],
    active: null,
    ui: { tab: 'train' },
  };
}

/* -------------------------------------------------------------------- state */

let S = load();

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
      p.logs = p.logs || []; p.bw = p.bw || [];
      // keep the user's program; backfill fields added by newer app versions
      if (!p.program) p.program = base.program;
      else ['A', 'B'].forEach(d => (p.program[d] ? p.program[d].slots : []).forEach(sl => {
        if (sl.cue === undefined) {
          const def = base.program[d].slots.find(x => x.id === sl.id);
          if (def) sl.cue = def.cue;
        }
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
        p.programRev = PROGRAM_REV;
        p.savedAt = Date.now();
        localStorage.setItem(KEY, JSON.stringify(p));
      }
      if (p.active) { p.active.pausedAt = p.active.pausedAt || 0; p.active.pausedMs = p.active.pausedMs || 0; }
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
  catch (e) { toast('Could not save — storage full?'); }
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
  if (!IDB.db) return;
  try { IDB.db.transaction('kv', 'readwrite').objectStore('kv').delete('state'); }
  catch (e) { /* ignore */ }
}

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 120);
}

/* iOS can kill a backgrounded PWA without warning — never leave a set in limbo. */
addEventListener('pagehide', flushSave);
addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });

/* ------------------------------------------------------------------ helpers */

const exName = id => (S.exercises[id] ? S.exercises[id].name : id);
const isComp = id => (S.exercises[id] ? S.exercises[id].kind : 'c') === 'c';
const U = () => S.settings.unit;

const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
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
  const s = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return same ? 'Today' : yest ? 'Yesterday' : s;
}

function ago(t) {
  const mid = x => { const d = new Date(x); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const days = Math.round((mid(Date.now()) - mid(t)) / 864e5);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 14 ? days + ' days ago'
    : Math.round(days / 7) + ' weeks ago';
}

const e1rm = (w, r) => (r > 0 ? w * (1 + r / 30) : 0);

/* Most recent completed performance of a given exercise. */
function lastPerf(exId) {
  for (let i = S.logs.length - 1; i >= 0; i--) {
    const sets = S.logs[i].sets.filter(s => s.exId === exId);
    if (sets.length) {
      return { when: S.logs[i].end || S.logs[i].start,
               top: sets.find(s => s.kind === 'top'), back: sets.find(s => s.kind === 'back') };
    }
  }
  return null;
}

/* Double progression: clear the top of the rep range, earn the increment. */
function target(sl, exId) {
  const p = lastPerf(exId);
  if (!p || !p.top) return null;
  // With two straight sets, earn a load increase only after owning the full
  // rep range on both. A strong first set must not hide a large drop-off.
  const effortOk = set => set && Number.isFinite(set.rpe) && set.rpe <= S.settings.defRir;
  const hit = sl.mode === 'topback'
    ? p.top.reps >= sl.top[1] && effortOk(p.top)
    : p.top.reps >= sl.top[1] && effortOk(p.top) &&
      !!p.back && p.back.reps >= sl.top[1] && effortOk(p.back);
  return { weight: hit ? p.top.weight + sl.inc : p.top.weight, up: hit, prev: p };
}

function bestTop(exId) {
  let best = null;
  S.logs.forEach(l => l.sets.forEach(s => {
    if (s.exId === exId && s.kind === 'top' && (!best || s.weight > best)) best = s.weight;
  }));
  return best;
}

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
  const v = { train, history, body, program, data }[S.ui.tab] || train;
  $('#view').innerHTML = v();
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.ui.tab));
  tick();
}

/* ------------------------------------------------------------------- train  */

function nextDay() {
  for (let i = S.logs.length - 1; i >= 0; i--) if (S.logs[i].day) return S.logs[i].day === 'A' ? 'B' : 'A';
  return 'A';
}

function train() {
  if (!S.active) {
    const nd = nextDay();
    const other = nd === 'A' ? 'B' : 'A';
    const last = S.logs[S.logs.length - 1];
    return `
      <button class="startBig" data-act="start" data-day="${nd}">
        <b>Start Day ${nd}</b>
        <i>${esc(S.program[nd].name)} &middot; up next</i>
      </button>
      <button class="startAlt" data-act="start" data-day="${other}">or Day ${other} — ${esc(S.program[other].name)}</button>
      ${last ? `
        <div class="card small">
          <div class="row spread"><b>Last: ${esc(S.program[last.day] ? S.program[last.day].name : 'Day ' + last.day)}</b>
            <span class="muted">${ago(last.end || last.start)}</span></div>
          <div class="muted" style="margin-top:6px">
            ${last.sets.length} sets &middot; ${Math.round(last.sets.reduce((a, s) => a + s.weight * s.reps, 0)).toLocaleString()} ${U()} total
            ${last.end ? ' &middot; ' + mmss((last.dur !== undefined ? last.dur : last.end - last.start) / 1000) : ''}
          </div>
        </div>` : ''}`;
  }

  const A = S.active, day = S.program[A.day];
  return `
    <h2>${esc(day.name)} &middot; in progress</h2>
    ${day.slots.map(sl => slotCard(sl, A)).join('')}
    <div class="card">
      <label class="fld"><span>Session notes</span>
        <textarea rows="2" data-act="notes" placeholder="Sleep, energy, niggles…">${esc(A.notes || '')}</textarea></label>
      <button class="primary big" data-act="finish">Finish session</button>
      <button class="ghost" style="width:100%;margin-top:8px" data-act="abandon">Discard session</button>
    </div>`;
}

function slotCard(sl, A) {
  const exId = (A.picks && A.picks[sl.id]) || sl.pick;
  const tg = target(sl, exId);
  const p = tg ? tg.prev : lastPerf(exId);
  const best = bestTop(exId);
  const rows = ['top', 'back'].map(kind => setRow(sl, exId, kind, A, tg)).join('');
  const doneBoth = ['top', 'back'].every(k => logged(A, sl.id, k));

  return `
    <section class="slot ${doneBoth ? 'done' : ''}">
      <div class="slotHead">
        <div class="slotLabel">${esc(sl.label)}</div>
        <div class="row" style="margin-bottom:8px">
          <select class="grow" data-act="swap" data-slot="${sl.id}" style="margin-bottom:0">
            ${sl.options.map(o => `<option value="${esc(o)}" ${o === exId ? 'selected' : ''}>${esc(exName(o))}</option>`).join('')}
          </select>
          <a class="vid" target="_blank" rel="noopener" aria-label="How to do ${esc(exName(exId))}"
            href="https://www.youtube.com/results?search_query=${encodeURIComponent(exName(exId) + ' form technique')}">&#9654;</a>
        </div>
        <div class="hint">
          ${p && p.top
            ? `<span>last <b>${trim(p.top.weight)}${U()}&times;${p.top.reps}</b>${p.back ? ` &middot; ${trim(p.back.weight)}&times;${p.back.reps}` : ''}</span>`
            : `<span class="muted">no history yet</span>`}
          ${tg ? `<span class="tgt">target <b>${trim(tg.weight)}${U()}</b>${tg.up ? ' ▲' : ''}</span>` : ''}
          ${best ? `<span class="muted">best ${trim(best)}${U()}</span>` : ''}
        </div>
        ${sl.cue ? `<div class="cue">${esc(sl.cue)}</div>` : ''}
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
  const label = straight2 ? (kind === 'top' ? 'SET 1' : 'SET 2') : (kind === 'top' ? 'TOP' : 'BACK');

  // prefill: logged value > local draft > progression target (set 2 mirrors set 1 in straight mode)
  const backGuess = tg ? (straight2 ? tg.weight : Math.round(tg.weight * 0.8 / sl.inc) * sl.inc) : '';
  let w = done ? done.weight : (d.weight !== undefined ? d.weight : (tg ? (kind === 'top' ? tg.weight : backGuess) : ''));
  let r = done ? done.reps : (d.reps !== undefined ? d.reps : S.settings.defReps);
  let rir = done ? done.rpe : (d.rpe !== undefined ? d.rpe : S.settings.defRir);

  return `
    <div class="setRow ${done ? 'logged' : ''}">
      <div class="setKind">
        <b>${label}</b>
        <i>${range[0]}–${range[1]}${rp}</i>
      </div>
      ${stepper('weight', sl.id, kind, w, sl.inc, U())}
      ${stepper('reps', sl.id, kind, r, 1, 'reps')}
      ${stepper('rpe', sl.id, kind, rir, 0.5, 'RIR')}
      <button class="ok ${done ? 'on' : ''}" data-act="log" data-slot="${sl.id}" data-kind="${kind}"
        aria-label="${done ? 'Undo set' : 'Log set'}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6"
            stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>`;
}

function stepper(field, slotId, kind, val, step, tag) {
  const id = `f-${slotId}-${kind}-${field}`;
  return `<div>
    <div class="stp">
      <button data-act="step" data-for="${id}" data-step="${-step}" aria-label="less">&minus;</button>
      <input id="${id}" inputmode="decimal" data-field="${field}" data-slot="${slotId}" data-kind="${kind}"
        value="${val === '' || val === undefined ? '' : trim(val)}" placeholder="–">
      <button data-act="step" data-for="${id}" data-step="${step}" aria-label="more">&#43;</button>
    </div>
    <span class="unitTag">${tag}</span>
  </div>`;
}

/* ----------------------------------------------------------------- history  */

function history() {
  if (!S.logs.length) return `<h2>History</h2><div class="card muted small">Nothing logged yet.</div>`;

  const weeks = {};
  S.logs.forEach(l => {
    const d = new Date(l.start), y = d.getFullYear();
    const wk = Math.floor((d - new Date(y, 0, 1)) / 6048e5);
    (weeks[y + '-' + wk] = weeks[y + '-' + wk] || []).push(l);
  });
  const perWeek = Object.values(weeks);
  const avg = perWeek.length ? (S.logs.length / perWeek.length) : 0;

  return `
    <h2>History</h2>
    <div class="card">
      <div class="stat">
        <div><b>${S.logs.length}</b><span>sessions</span></div>
        <div><b>${avg.toFixed(1)}</b><span>per week</span></div>
        <div><b>${Math.round(S.logs.reduce((a, l) => a + l.sets.reduce((x, s) => x + s.weight * s.reps, 0), 0) / 1000)}t</b><span>total volume</span></div>
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
        <span><b>${esc(S.program[l.day] ? S.program[l.day].name : 'Day ' + l.day)}</b>
          <div class="meta">${niceDate(l.start)} &middot; ${dur} &middot; ${vol.toLocaleString()} ${U()}</div></span>
        <span class="meta">${l.sets.length} sets</span>
      </summary>
      <div class="body">
        ${l.sets.map(s => `
          <div class="logSet">
            <span class="nm"><span class="badge ${s.kind === 'top' ? '' : 'b'}">${s.kind === 'top' ? 'S1' : 'S2'}</span> ${esc(exName(s.exId))}</span>
            <span>${trim(s.weight)}${U()} &times; ${s.reps}${Number.isFinite(s.rpe) ? ` <span class="muted">${trim(s.rpe)} RIR</span>` : ''}
              <span class="muted tiny">e1RM ${Math.round(e1rm(s.weight, s.reps))}</span></span>
          </div>`).join('')}
        ${l.notes ? `<div class="small muted" style="margin-top:10px">“${esc(l.notes)}”</div>` : ''}
        <button class="ghost danger" style="margin-top:10px" data-act="delLog" data-id="${esc(l.id)}">Delete session</button>
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
    <h2>Bodyweight</h2>
    <div class="card">
      <div class="row" style="gap:8px">
        <input id="bwIn" inputmode="decimal" placeholder="e.g. 82.4" value="${latest && latest.d === dayKey(Date.now()) ? trim(latest.kg) : ''}">
        <button class="primary" data-act="bwSave">Save</button>
      </div>
      <div class="tiny muted" style="margin-top:6px">Saved against today’s date (${dayKey(Date.now())}). Saving twice overwrites.</div>
    </div>
    ${list.length ? `
      <div class="card">
        <div class="stat">
          <div><b>${trim(latest.kg)}</b><span>latest ${U()}</span></div>
          ${wkAvg !== null ? `<div><b>${wkAvg.toFixed(1)}</b><span>7-day avg</span></div>` : ''}
          ${first && list.length > 1 ? `<div><b>${(latest.kg - first.kg >= 0 ? '+' : '')}${trim(latest.kg - first.kg)}</b><span>all time</span></div>` : ''}
        </div>
      </div>
      ${list.length > 1 ? `<div class="card">${spark(list.slice().reverse())}</div>` : ''}
      <h2>Entries</h2>
      <div class="card">
        ${list.map(b => `<div class="bwRow"><span>${esc(b.d)}</span>
          <span><b>${trim(b.kg)}</b> <span class="muted">${U()}</span>
          <button class="icon" data-act="bwDel" data-d="${esc(b.d)}" aria-label="delete">✕</button></span></div>`).join('')}
      </div>` : `<div class="card muted small">No weigh-ins yet. Same time of day, after waking, is the most consistent.</div>`}`;
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
    <svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Bodyweight trend">
      <path d="${area}" fill="rgba(245,158,11,.14)"></path>
      <path d="${line}" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
      ${pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.kg).toFixed(1)}" r="2.2" fill="#f59e0b"></circle>`).join('')}
    </svg>
    <div class="row spread tiny muted"><span>${esc(pts[0].d)}</span><span>${trim(lo + 0.4)}–${trim(hi - 0.4)} ${U()}</span><span>${esc(pts[pts.length - 1].d)}</span></div>`;
}

/* ----------------------------------------------------------------- program  */

function program() {
  return `
    <h2>Program</h2>
    <div class="card small muted">
      Two full-body days, each slot holding the variations you rotate between.
      Change the pick mid-session on the Train tab — history follows the exercise, so progression stays honest.
    </div>
    ${['A', 'B'].map(d => `
      <h2>Day ${d}</h2>
      <div class="card">
        <label class="fld"><span>Day name</span>
          <input data-act="dayName" data-day="${d}" value="${esc(S.program[d].name)}"></label>
      </div>
      ${S.program[d].slots.map((sl, i) => slotEditor(d, sl, i)).join('')}
      <button class="ghost" style="width:100%" data-act="addSlot" data-day="${d}">+ Add exercise slot</button>
    `).join('')}
    <h2>Reset</h2>
    <div class="card">
      <button class="ghost danger" data-act="resetProgram">Restore default program</button>
      <div class="tiny muted" style="margin-top:6px">Your logged sessions and bodyweight are kept.</div>
    </div>`;
}

function slotEditor(d, sl, i) {
  const others = Object.values(S.exercises).filter(e => !sl.options.includes(e.id))
    .sort((a, b) => a.name < b.name ? -1 : 1);
  return `
    <div class="card">
      <div class="row spread">
        <input data-act="slotLabel" data-day="${d}" data-slot="${sl.id}" value="${esc(sl.label)}" style="font-weight:600">
        <div class="row" style="gap:2px">
          <button class="icon" data-act="moveSlot" data-day="${d}" data-slot="${sl.id}" data-dir="-1" aria-label="up">↑</button>
          <button class="icon" data-act="moveSlot" data-day="${d}" data-slot="${sl.id}" data-dir="1" aria-label="down">↓</button>
          <button class="icon danger" data-act="delSlot" data-day="${d}" data-slot="${sl.id}" aria-label="remove">✕</button>
        </div>
      </div>

      <div class="tiny muted" style="margin:10px 0 0">Variations — tap to make it the default pick</div>
      <div class="chips">
        ${sl.options.map(o => `
          <span class="chip ${o === sl.pick ? 'sel' : ''}">
            <span data-act="setPick" data-day="${d}" data-slot="${sl.id}" data-ex="${esc(o)}">${esc(exName(o))}</span>
            ${sl.options.length > 1 ? `<button data-act="delOpt" data-day="${d}" data-slot="${sl.id}" data-ex="${esc(o)}" aria-label="remove">✕</button>` : ''}
          </span>`).join('')}
      </div>
      <select data-act="addOpt" data-day="${d}" data-slot="${sl.id}">
        <option value="">+ add a variation…</option>
        ${others.map(e => `<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('')}
        <option value="__new">＋ new exercise…</option>
      </select>

      <div class="grid2" style="margin-top:10px">
        <label class="fld"><span>Structure</span>
          <select data-act="mode" data-day="${d}" data-slot="${sl.id}">
            <option value="straight2" ${sl.mode !== 'topback' ? 'selected' : ''}>2 straight sets</option>
            <option value="topback" ${sl.mode === 'topback' ? 'selected' : ''}>Top + back-off</option>
          </select></label>
        <label class="fld"><span>Set 2 technique</span>
          <select data-act="style" data-day="${d}" data-slot="${sl.id}">
            <option value="straight" ${sl.style === 'straight' ? 'selected' : ''}>Straight set</option>
            <option value="restpause" ${sl.style === 'restpause' ? 'selected' : ''}>Rest-pause</option>
            <option value="lengthened" ${sl.style === 'lengthened' ? 'selected' : ''}>Lengthened partials</option>
          </select></label>
      </div>
      <div class="grid4">
        <label class="fld"><span>Reps min</span><input inputmode="numeric" data-act="rng" data-day="${d}" data-slot="${sl.id}" data-k="top" data-j="0" value="${sl.top[0]}"></label>
        <label class="fld"><span>Reps max</span><input inputmode="numeric" data-act="rng" data-day="${d}" data-slot="${sl.id}" data-k="top" data-j="1" value="${sl.top[1]}"></label>
        ${sl.mode === 'topback' ? `
        <label class="fld"><span>Back min</span><input inputmode="numeric" data-act="rng" data-day="${d}" data-slot="${sl.id}" data-k="back" data-j="0" value="${sl.back[0]}"></label>
        <label class="fld"><span>Back max</span><input inputmode="numeric" data-act="rng" data-day="${d}" data-slot="${sl.id}" data-k="back" data-j="1" value="${sl.back[1]}"></label>` : `
        <label class="fld"><span>Increment (${U()})</span>
          <input inputmode="decimal" data-act="inc" data-day="${d}" data-slot="${sl.id}" value="${sl.inc}"></label>`}
      </div>
      ${sl.mode === 'topback' ? `<label class="fld"><span>Increment (${U()})</span>
        <input inputmode="decimal" data-act="inc" data-day="${d}" data-slot="${sl.id}" value="${sl.inc}"></label>` : ''}
      <label class="fld"><span>Form cue (shown while training)</span>
        <input data-act="cue" data-day="${d}" data-slot="${sl.id}" value="${esc(sl.cue || '')}"></label>
    </div>`;
}

/* -------------------------------------------------------------------- data  */

function data() {
  const bytes = new Blob([JSON.stringify(S)]).size;
  return `
    <h2>Settings</h2>
    <div class="card">
      <div class="grid2">
        <label class="fld"><span>Unit label</span>
          <select data-act="set" data-k="unit">
            <option value="kg" ${U() === 'kg' ? 'selected' : ''}>kg</option>
            <option value="lb" ${U() === 'lb' ? 'selected' : ''}>lb</option>
          </select></label>
        <label class="fld"><span>Session target (min)</span>
          <input inputmode="numeric" data-act="set" data-k="targetMin" value="${S.settings.targetMin}"></label>
        <label class="fld"><span>Rest — compound (s)</span>
          <input inputmode="numeric" data-act="set" data-k="restC" value="${S.settings.restC}"></label>
        <label class="fld"><span>Rest — isolation (s)</span>
          <input inputmode="numeric" data-act="set" data-k="restI" value="${S.settings.restI}"></label>
        <label class="fld"><span>Default reps</span>
          <input inputmode="numeric" data-act="set" data-k="defReps" value="${S.settings.defReps}"></label>
        <label class="fld"><span>Default reps in reserve</span>
          <input inputmode="decimal" data-act="set" data-k="defRir" value="${S.settings.defRir}"></label>
      </div>
      <label class="row" style="gap:10px">
        <input type="checkbox" data-act="beep" ${S.settings.beep ? 'checked' : ''} style="width:24px;min-height:24px">
        <span class="small">Beep when the rest timer ends</span>
      </label>
      <div class="tiny muted" style="margin-top:8px">Switching unit relabels the app; it does not convert weights you already logged.</div>
    </div>

    <h2>Backup</h2>
    <div class="card">
      <div class="small muted" style="margin-bottom:10px">
        Data stays on this device — ${S.logs.length} sessions, ${S.bw.length} weigh-ins, ${(bytes / 1024).toFixed(1)} KB,
        kept in two copies (localStorage + an IndexedDB mirror) so an evicted cache self-heals.
        Still: export now and then — a file you hold is the only backup that survives losing the phone.
      </div>
      <button class="primary" style="width:100%" data-act="export">Download backup (.json)</button>
      <button class="ghost" style="width:100%;margin-top:8px" data-act="copy">Copy backup to clipboard</button>
      <label class="fld" style="margin-top:14px"><span>Restore from a backup file</span>
        <input type="file" accept="application/json,.json" data-act="importFile"></label>
      <label class="fld"><span>…or paste backup JSON</span>
        <textarea rows="3" id="pasteIn" placeholder='{"v":1,…}'></textarea></label>
      <button class="ghost" style="width:100%" data-act="importPaste">Restore from pasted JSON</button>
    </div>

    <h2>Danger zone</h2>
    <div class="card">
      <button class="ghost danger" style="width:100%" data-act="wipe">Erase all data</button>
    </div>

    <h2>Install on iPhone</h2>
    <div class="card small muted">
      Safari → Share → <b>Add to Home Screen</b>. It then opens full-screen, works offline in the gym,
      and its saved data is far more durable than a plain browser tab.
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
  if (!A.sets.length) { toast('No sets logged'); return; }
  const end = Date.now();
  const dur = end - A.start - A.pausedMs - (A.pausedAt ? end - A.pausedAt : 0);
  S.logs.push({ id: 'L' + A.start, day: A.day, start: A.start, end, dur, sets: A.sets, notes: A.notes || '' });
  S.active = null;
  S.ui.tab = 'history';
  save(); render();
  toast('Session saved');
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
  if (!reps) { toast('Enter reps first'); return; }
  if (!weight && !confirm('No weight entered — log this set at bodyweight (0)?')) return;
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
  const logs = p.logs
    .filter(l => l && typeof l === 'object' && Array.isArray(l.sets) && Number.isFinite(+l.start))
    .map(l => ({
      id: String(l.id || 'L' + l.start), day: l.day === 'B' ? 'B' : 'A',
      start: +l.start, end: Number.isFinite(+l.end) ? +l.end : +l.start,
      ...(Number.isFinite(+l.dur) ? { dur: +l.dur } : {}),
      notes: typeof l.notes === 'string' ? l.notes : '',
      sets: l.sets.filter(x => x && typeof x === 'object').map(x => ({
        slotId: String(x.slotId || ''), exId: String(x.exId || ''),
        kind: x.kind === 'back' ? 'back' : 'top',
        weight: num(x.weight), reps: num(x.reps), rpe: num(x.rpe), ts: num(x.ts),
      })),
    }));
  const bw = (Array.isArray(p.bw) ? p.bw : [])
    .filter(b => b && /^\d{4}-\d{2}-\d{2}$/.test(b.d) && Number.isFinite(+b.kg))
    .map(b => ({ d: b.d, kg: +b.kg }));
  return {
    v: 1,
    settings: (p.settings && typeof p.settings === 'object') ? p.settings : {},
    exercises: (p.exercises && typeof p.exercises === 'object') ? p.exercises : {},
    program: (p.program && p.program.A && p.program.B) ? p.program : null,
    logs, bw, active: null, ui: { tab: 'train' },
  };
}

function restore(text) {
  let p;
  try { p = JSON.parse(text); } catch (e) { toast('That is not valid JSON'); return; }
  const clean = sanitizeBackup(p);
  if (!clean) { toast('Not a Pump Log backup'); return; }
  if (!confirm(`Restore ${clean.logs.length} sessions and ${clean.bw.length} weigh-ins? This replaces what is on this device.`)) return;
  localStorage.setItem(KEY, JSON.stringify(clean));
  S = load(); flushSave(); render(); toast('Backup restored');
}

const findSlot = (d, id) => S.program[d].slots.find(s => s.id === id);

/* ------------------------------------------------------------ event wiring */

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!t) return;
  const a = t.dataset.act, d = t.dataset.day, id = t.dataset.slot;

  switch (a) {
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
        if (confirm('Finish and save this session?')) finishSession();
      } else if (confirm('No sets logged — discard this session?')) {
        S.active = null; save(); render();
      }
      break;
    case 'abandon':
      if (confirm('Discard this session? Logged sets will be lost.')) { S.active = null; save(); render(); }
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
      if (confirm('Delete this session permanently?')) {
        S.logs = S.logs.filter(l => l.id !== t.dataset.id); save(); render();
      }
      break;

    case 'bwSave': {
      const v = num(($('#bwIn') || {}).value);
      if (!v) { toast('Enter a weight'); break; }
      const d0 = dayKey(Date.now());
      S.bw = S.bw.filter(b => b.d !== d0).concat({ d: d0, kg: v });
      save(); render(); toast('Bodyweight saved');
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
      if (confirm('Remove this slot from the program?')) {
        S.program[d].slots = S.program[d].slots.filter(s => s.id !== id); save(); render();
      }
      break;
    case 'addSlot': {
      const sid = d.toLowerCase() + Date.now().toString(36);
      S.program[d].slots.push(slot(sid, 'New slot', 'leg-press', ['leg-press'], [8, 12], [8, 12], 'straight', 2.5, ''));
      save(); render(); break;
    }
    case 'resetProgram':
      if (confirm('Restore the default two-day program? Your logs are kept.')) {
        S.program = seedProgram(); save(); render();
      }
      break;

    case 'export': exportData(); break;
    case 'copy':
      navigator.clipboard.writeText(JSON.stringify(S, null, 2))
        .then(() => toast('Backup copied')).catch(() => toast('Clipboard blocked — use download'));
      break;
    case 'importPaste': restore(($('#pasteIn') || {}).value || ''); break;
    case 'wipe':
      if (confirm('Erase every session, weigh-in and program change on this device?') &&
          confirm('Really erase? This cannot be undone.')) {
        localStorage.removeItem(KEY); idbClear(); S = seed(); render(); toast('All data erased');
      }
      break;
  }
});

/* keep drafts + settings in sync without re-rendering (would steal focus) */
document.addEventListener('input', e => {
  const t = e.target;

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
    case 'rng': findSlot(d, id)[t.dataset.k][+t.dataset.j] = Math.max(1, parseInt(num(t.value), 10) || 1); save(); break;
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

  if (a === 'swap' && S.active) {
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
      const name = (prompt('Exercise name') || '').trim();
      if (!name) { render(); return; }
      const nid = 'x' + Date.now().toString(36);
      const heavy = confirm('Treat as a compound (longer rest)?  OK = compound, Cancel = isolation');
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
  $('#clockTarget').textContent = A.pausedAt ? 'paused' : `/ ${S.settings.targetMin}m`;
  $('#pauseBtn').innerHTML = A.pausedAt ? '&#9654;' : '&#9208;';

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
        toast('Recovered data from backup copy');
      }
    } catch (e) { /* corrupt mirror — overwritten below */ }
  }
  idbPut(JSON.stringify(S));
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW failed', e)));
}
