/* Shared, dependency-free daily simulation. Loaded before game.bundle.js. */
(function (root) {
  'use strict';
  var activities = [
    { id: 'shift', app: 'jobs', title: 'Corner store shift', detail: 'Help the neighborhood shop. Knowledge 25 unlocks a $50 skilled shift.', energy: 20, effects: { money: 35 }, label: '+$35' },
    { id: 'study', app: 'school', title: 'Personal vision workshop', detail: 'Build the skills that open better opportunities.', energy: 15, effects: { knowledge: 6 }, label: '+6 knowledge' },
    { id: 'family', app: 'calendar', title: 'Show up for family', detail: 'Put the phone down and spend time at home.', energy: 10, effects: { relationships: 5 }, label: '+5 relationships' },
    { id: 'studio', app: 'jobs', title: 'Independent studio session', detail: 'Knowledge 20 and $10 for supplies. Your crew decisions shape the release.', energy: 25, cost: 10, knowledge: 20, effects: { reputation: 12, legacy: 1 }, label: '+12 REP, +1 legacy' },
    { id: 'rest', app: 'calendar', title: 'Take a breather', detail: 'Recover energy now at the cost of one time block.', energy: 0, effects: { energy: 25 }, label: '+25 energy' }
  ];
  var crewIds = ['nova', 'rex', 'mina', 'kai', 'jett'];
  var flags = { nova: ['cleanRelease', 'fastRelease'], rex: ['negotiator', 'quietBuilder'], mina: ['authenticCover', 'luxuryCover'], kai: ['familyFirst', 'industryDoor'], jett: ['schoolHandled', 'jobApplied'], finale: ['nightGrind', 'protectedTomorrow'] };
  function number(value, fallback, max) { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max || 1000000, Math.floor(value))) : fallback; }
  function fresh() { return { day: 1, remaining: 3, done: [], log: [], recap: '' }; }
  function restore(saved) {
    saved = saved && typeof saved === 'object' ? saved : {};
    var stats = { money: 20, energy: 85, knowledge: 10, relationships: 5, legacy: 0 };
    Object.keys(stats).forEach(function (key) { stats[key] = number(saved.stats && saved.stats[key], stats[key], key === 'energy' ? 100 : 1000000); });
    var decisions = {};
    Object.keys(flags).forEach(function (id) { if (saved.decisions && flags[id].indexOf(saved.decisions[id]) >= 0) decisions[id] = saved.decisions[id]; });
    var talked = {}; crewIds.forEach(function (id) { if (decisions[id]) talked[id] = true; });
    var stage = decisions.finale ? 3 : Object.keys(talked).length === 5 ? 1 : 0;
    var life = fresh(), old = saved.version === 3 && saved.life;
    if (old && stage === 3) {
      life.day = Math.max(1, number(old.day, 1));
      life.done = activities.filter(function (a) { return Array.isArray(old.done) && old.done.indexOf(a.id) >= 0; }).map(function (a) { return a.id; }).slice(0, 3);
      life.remaining = 3 - life.done.length;
      life.log = Array.isArray(old.log) ? old.log.filter(function (s) { return typeof s === 'string'; }).slice(-3).map(function (s) { return s.slice(0, 200); }) : [];
      life.recap = typeof old.recap === 'string' ? old.recap.slice(0, 300) : '';
    }
    return { stats: stats, reputation: number(saved.reputation, 0), decisions: decisions, talked: talked, missionStage: stage, life: life };
  }
  function reason(state, action) {
    if (!action) return 'Unknown activity';
    if (state.missionStage < 3 || state.life.day < 2) return 'Finish First Move, then start Day 2 in Calendar';
    if (state.life.done.indexOf(action.id) >= 0) return 'Completed today';
    if (state.life.remaining < 1) return 'Day complete — sleep in Calendar';
    if (state.stats.knowledge < (action.knowledge || 0)) return 'Requires ' + action.knowledge + ' knowledge';
    if (state.stats.money < (action.cost || 0)) return 'Requires $' + action.cost;
    if (state.stats.energy < action.energy) return 'Need ' + action.energy + ' energy — rest or sleep';
    return '';
  }
  function effects(state, action) {
    var result = Object.assign({}, action.effects);
    if (action.id === 'shift' && state.stats.knowledge >= 25) result.money = 50;
    if (action.id === 'studio' && state.decisions.nova === 'cleanRelease') result.legacy += 1;
    if (action.id === 'studio' && state.decisions.kai === 'industryDoor') result.money = 20;
    return result;
  }
  function perform(state, id) {
    var action = activities.find(function (a) { return a.id === id; }), blocked = reason(state, action);
    if (blocked) return { ok: false, message: blocked };
    state.life.done.push(id); state.life.remaining -= 1;
    state.stats.energy -= action.energy; state.stats.money -= action.cost || 0;
    var reward = effects(state, action);
    Object.keys(reward).forEach(function (key) {
      if (key === 'reputation') state.reputation += reward[key];
      else state.stats[key] = Math.min(key === 'energy' ? 100 : 1000000, state.stats[key] + reward[key]);
    });
    var message = action.title + ': ' + Object.keys(reward).map(function (key) { return '+' + reward[key] + ' ' + key; }).join(', ');
    if (action.cost) message += ' (supplies -$' + action.cost + ')';
    state.life.log.push(message);
    return { ok: true, message: message };
  }
  function nextDay(state) {
    if (state.missionStage < 3) return false;
    var life = state.life, summary;
    if (life.day === 1) summary = 'First Move is complete. Your choices carry into tomorrow.';
    else {
      var balanced = ['shift', 'study', 'family'].every(function (id) { return life.done.indexOf(id) >= 0; });
      if (balanced) state.stats.legacy += 1;
      summary = 'Day ' + life.day + ': ' + life.done.length + '/3 blocks used. ' + (balanced ? 'Provider, learner, family builder: +1 legacy.' : 'Your priorities shaped the day. Work + study + family earns a balance bonus.');
    }
    state.stats.energy = Math.min(100, state.stats.energy + 35);
    state.life = { day: life.day + 1, remaining: 3, done: [], log: [], recap: summary };
    return true;
  }
  root.FastLife = { activities: activities, fresh: fresh, restore: restore, reason: reason, effects: effects, perform: perform, nextDay: nextDay };
}(typeof window !== 'undefined' ? window : globalThis));
