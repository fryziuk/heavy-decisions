/* Pure training-domain helpers. No DOM or storage access, so these can be tested. */

export function parseDecimal(value) {
  const normalized = String(value ?? '').trim().replace(/\s+/g, '').replace(',', '.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

export function lastPerformance(logs, exId, slotId) {
  for (let i = logs.length - 1; i >= 0; i--) {
    const sets = logs[i].sets.filter(s =>
      s.exId === exId && (!slotId || s.slotId === slotId));
    if (sets.length) {
      return {
        when: logs[i].end || logs[i].start,
        top: sets.find(s => s.kind === 'top'),
        back: sets.find(s => s.kind === 'back'),
      };
    }
  }
  return null;
}

export function progressionTarget(logs, sl, exId, defaultRir) {
  const previous = lastPerformance(logs, exId, sl.id);
  if (!previous || !previous.top) {
    return exId === sl.startExId && Number.isFinite(sl.startWeight)
      ? { weight: sl.startWeight, up: false, prev: null, starter: true }
      : null;
  }

  const effortOk = set => set && Number.isFinite(set.rpe) && set.rpe <= defaultRir;
  const hit = sl.mode === 'topback'
    ? previous.top.reps >= sl.top[1] && effortOk(previous.top)
    : previous.top.reps >= sl.top[1] && effortOk(previous.top) &&
      !!previous.back && previous.back.reps >= sl.top[1] && effortOk(previous.back);

  return {
    weight: hit ? previous.top.weight + sl.inc : previous.top.weight,
    up: hit,
    prev: previous,
  };
}

export function bestTopWeight(logs, exId, slotId) {
  let best = null;
  logs.forEach(log => log.sets.forEach(set => {
    if (set.exId === exId && set.slotId === slotId && set.kind === 'top' &&
        (best === null || set.weight > best)) best = set.weight;
  }));
  return best;
}

export function updateRange(range, index, rawValue) {
  const value = Math.max(1, Math.trunc(Number(rawValue)) || 1);
  const next = [range[0], range[1]];
  next[index] = value;
  if (next[0] > next[1]) next[index === 0 ? 1 : 0] = value;
  return next;
}
