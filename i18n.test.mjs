import test from 'node:test';
import assert from 'node:assert/strict';
import { missingTranslations, normalizeLanguage, translate } from './i18n.js';

test('Ukrainian browser locales select Ukrainian', () => {
  assert.equal(normalizeLanguage('uk-UA'), 'uk');
  assert.equal(normalizeLanguage('en-US'), 'en');
});

test('translations interpolate values and fall back safely', () => {
  assert.equal(translate('uk', 'train.startDay', { day: 'A' }), 'Почати день A');
  assert.equal(translate('en', 'brand.name'), 'Heavy Decisions');
  assert.equal(translate('uk', 'brand.name'), 'Важкі рішення');
  assert.equal(translate('uk', 'missing.key', {}, 'Custom name'), 'Custom name');
});

test('Ukrainian covers every core English interface string', () => {
  assert.deepEqual(missingTranslations('uk'), []);
});
