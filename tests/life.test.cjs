const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../scripts/systems/life.js');
const life = globalThis.FastLife;
const decisions = { nova: 'cleanRelease', rex: 'negotiator', mina: 'authenticCover', kai: 'industryDoor', jett: 'schoolHandled', finale: 'protectedTomorrow' };
function ready() { const s = life.restore({ decisions }); life.nextDay(s); return s; }
test('old save restores story decisions and completion without re-awarding rewards', () => {
  const s = life.restore({ decisions, reputation: 73 });
  assert.equal(s.missionStage, 3); assert.equal(Object.keys(s.talked).length, 5); assert.equal(s.reputation, 73);
});
test('partial story restores exactly the crew already met', () => {
  const s = life.restore({ decisions: { nova: 'cleanRelease' } });
  assert.equal(s.missionStage, 0); assert.deepEqual(s.talked, { nova: true });
  const full = life.restore({ decisions: { ...decisions, finale: null } }); assert.equal(full.missionStage, 1);
});
test('invalid save data is sanitized', () => {
  const s = life.restore({ stats: { money: '999', energy: 999, knowledge: -10 }, decisions: { nova: '<script>' } });
  assert.equal(s.stats.money, 20); assert.equal(s.stats.energy, 100); assert.equal(s.stats.knowledge, 0); assert.deepEqual(s.decisions, {});
});
test('activities remain locked until Day 2', () => {
  const s = life.restore({ decisions }); assert.equal(life.perform(s, 'shift').ok, false);
  assert.equal(life.nextDay(life.restore(null)), false);
});
test('balanced day grants a single legacy bonus and resets daily activity limits', () => {
  const s = ready(); const money = s.stats.money;
  ['shift', 'study', 'family'].forEach(id => assert.equal(life.perform(s, id).ok, true));
  assert.equal(s.life.remaining, 0); assert.equal(s.stats.money, money + 35);
  assert.equal(life.perform(s, 'rest').ok, false);
  life.nextDay(s); assert.equal(s.stats.legacy, 1); assert.equal(s.life.remaining, 3);
  life.nextDay(s); assert.equal(s.stats.legacy, 1);
});
test('duplicate activity cannot pay twice; zero energy has a recovery path', () => {
  const s = ready(); life.perform(s, 'shift'); const snapshot = JSON.stringify(s);
  assert.equal(life.perform(s, 'shift').ok, false); assert.equal(JSON.stringify(s), snapshot);
  s.stats.energy = 0; assert.equal(life.perform(s, 'study').ok, false);
  assert.equal(life.perform(s, 'rest').ok, true); assert.equal(s.stats.energy, 25);
});
test('knowledge gates, supply costs, and earlier choices change studio outcome', () => {
  const s = ready(); assert.equal(life.perform(s, 'studio').ok, false);
  s.stats.knowledge = 20; s.stats.money = 9; assert.equal(life.perform(s, 'studio').ok, false);
  s.stats.money = 10; assert.equal(life.perform(s, 'studio').ok, true);
  assert.equal(s.stats.money, 20); assert.equal(s.stats.legacy, 2); assert.equal(s.reputation, 12);
});
test('skilled shift unlocks at 25 knowledge', () => {
  const s = ready(); s.stats.knowledge = 25; life.perform(s, 'shift'); assert.equal(s.stats.money, 70);
});
test('version 3 reload preserves day, actions, and stats', () => {
  const s = ready(); life.perform(s, 'study');
  const reloaded = life.restore(JSON.parse(JSON.stringify({ version: 3, ...s })));
  assert.deepEqual(reloaded.life, s.life); assert.deepEqual(reloaded.stats, s.stats);
  assert.equal(life.perform(reloaded, 'study').ok, false);
});
test('rest and sleep never exceed the energy cap', () => {
  const s = ready(); life.perform(s, 'rest'); assert.equal(s.stats.energy, 100);
  life.nextDay(s); assert.equal(s.stats.energy, 100);
});
