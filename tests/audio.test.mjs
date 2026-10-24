import test from 'node:test';
import assert from 'node:assert/strict';

import { playSoundscape, stopSoundscape, toggleSoundscape, isPlaying, getCurrentKey, release } from '../src/audio.js';
import { SOUNDSCAPES } from '../src/defaults.js';

test('audio: بدون DOM امن است', async () => {
  const r = await playSoundscape('snow');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'no-dom');
});

test('audio: soundscape ناشناخته رد می‌شود', async () => {
  const r = await playSoundscape('nonexistent');
  assert.equal(r.ok, false);
});

test('audio: stop بدون خطا', () => {
  assert.doesNotThrow(() => stopSoundscape());
});

test('audio: toggle بدون خطا', () => {
  assert.doesNotThrow(() => toggleSoundscape('wind'));
});

test('audio: isPlaying false در node', () => {
  assert.equal(isPlaying(), false);
});

test('audio: getCurrentKey null در node', () => {
  assert.equal(getCurrentKey(), null);
});

test('audio: release بدون خطا', () => {
  assert.doesNotThrow(() => release());
});

test('soundscapes: پنج مورد با فایل', () => {
  assert.equal(SOUNDSCAPES.length, 5);
  for (const s of SOUNDSCAPES) {
    assert.ok(s.key && s.label && s.emoji && s.file);
    assert.match(s.file, /\.ogg$/);
  }
});

test('soundscapes: کلیدهای یکتا', () => {
  const keys = SOUNDSCAPES.map((s) => s.key);
  assert.equal(new Set(keys).size, keys.length);
});
