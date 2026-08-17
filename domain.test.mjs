import test from 'node:test';
import assert from 'node:assert/strict';
import { bestTopWeight, lastPerformance, parseDecimal, progressionTarget, updateRange } from './domain.js';

const slot = {
  id: 'a1', mode: 'straight2', top: [6, 10], inc: 2.5,
  startExId: 'squat', startWeight: 95,
};

test('starter target is used only for its intended exercise', () => {
  assert.equal(progressionTarget([], slot, 'squat', 2).weight, 95);
  assert.equal(progressionTarget([], slot, 'leg-press', 2), null);
});

test('progression requires both sets in the same slot', () => {
  const logs = [{ start: 1, sets: [
    { slotId: 'b4', exId: 'squat', kind: 'top', weight: 100, reps: 10, rpe: 2 },
    { slotId: 'b4', exId: 'squat', kind: 'back', weight: 100, reps: 10, rpe: 2 },
  ] }];
  assert.equal(lastPerformance(logs, 'squat', 'a1'), null);
  assert.equal(progressionTarget(logs, slot, 'squat', 2).weight, 95);
});

test('progression increases only after both prescribed sets qualify', () => {
  const logs = [{ start: 1, sets: [
    { slotId: 'a1', exId: 'squat', kind: 'top', weight: 95, reps: 10, rpe: 2 },
    { slotId: 'a1', exId: 'squat', kind: 'back', weight: 95, reps: 10, rpe: 2 },
  ] }];
  assert.deepEqual(progressionTarget(logs, slot, 'squat', 2), {
    weight: 97.5, up: true, prev: lastPerformance(logs, 'squat', 'a1'),
  });
});

test('progression holds when the recorded effort is easier than prescribed', () => {
  const logs = [{ start: 1, sets: [
    { slotId: 'a1', exId: 'squat', kind: 'top', weight: 95, reps: 10, rpe: 3 },
    { slotId: 'a1', exId: 'squat', kind: 'back', weight: 95, reps: 10, rpe: 3 },
  ] }];
  assert.equal(progressionTarget(logs, slot, 'squat', 2).weight, 95);
});

test('best weight is scoped to the current program slot', () => {
  const logs = [{ start: 1, sets: [
    { slotId: 'a1', exId: 'squat', kind: 'top', weight: 95, reps: 8, rpe: 2 },
    { slotId: 'b4', exId: 'squat', kind: 'top', weight: 140, reps: 8, rpe: 2 },
  ] }];
  assert.equal(bestTopWeight(logs, 'squat', 'a1'), 95);
});

test('range edits cannot leave min greater than max', () => {
  assert.deepEqual(updateRange([6, 10], 0, 12), [12, 12]);
  assert.deepEqual(updateRange([6, 10], 1, 4), [4, 4]);
});

test('decimal parser accepts dot and comma keyboards', () => {
  assert.equal(parseDecimal('99.2'), 99.2);
  assert.equal(parseDecimal('99,2'), 99.2);
  assert.equal(parseDecimal(' 99,2 '), 99.2);
  assert.equal(parseDecimal('not a weight'), 0);
});
