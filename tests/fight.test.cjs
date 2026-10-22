const test = require("node:test");
const assert = require("node:assert/strict");
const Combat = require("../scripts/fight-core.js");

function advance(game, frames = 25, controls = {}) {
  for (let i = 0; i < frames; i++) Combat.step(game, i === 0 ? controls : {}, 1 / 60, () => .999);
}
function closeRange(game) { game.fighters[1].x = game.fighters[0].x + 82; }

test("fresh match starts with two healthy fighters and three-round score", () => {
  const game = Combat.createMatch(0);
  assert.equal(game.phase, "ready");
  assert.deepEqual(game.score, [0, 0]);
  assert.equal(game.fighters[0].health, 100);
  assert.equal(game.fighters[1].health, 100);
  assert.equal(Combat.startRound(game), true);
  assert.equal(game.phase, "fighting");
});
test("invalid rival index is clamped", () => {
  assert.equal(Combat.createMatch(-10).rivalIndex, 0);
  assert.equal(Combat.createMatch(99).rivalIndex, Combat.RIVALS.length - 1);
});
test("jabs in range reduce health and consume stamina", () => {
  const game = Combat.createMatch(); Combat.startRound(game); closeRange(game);
  const initialStamina = game.fighters[0].stamina;
  advance(game, 20, { action: "jab" });
  assert.ok(game.fighters[1].health < 100);
  assert.ok(game.fighters[0].stamina < initialStamina);
});
test("out-of-range strikes miss", () => {
  const game = Combat.createMatch(); Combat.startRound(game);
  advance(game, 22, { action: "jab" });
  assert.equal(game.fighters[1].health, 100);
});
test("guard reduces damage and draws stamina", () => {
  const open = Combat.createMatch(), blocked = Combat.createMatch();
  for (const game of [open, blocked]) { Combat.startRound(game); closeRange(game); }
  advance(open, 19, { action: "kick" });
  // An AI guard is held by a deterministic decision in this controlled slice.
  blocked.ai.clock = 999; blocked.ai.guard = true;
  advance(blocked, 19, { action: "kick" });
  assert.ok(blocked.fighters[1].health > open.fighters[1].health);
  assert.ok(blocked.fighters[1].stamina < 100);
});
test("special attacks require meter; meter is spent", () => {
  const game = Combat.createMatch(); Combat.startRound(game); closeRange(game);
  assert.equal(Combat.beginAttack(game, 0, "special"), false);
  game.fighters[0].meter = 80;
  assert.equal(Combat.beginAttack(game, 0, "special"), true);
  assert.equal(game.fighters[0].meter, 15);
  advance(game, 20);
  assert.ok(game.fighters[1].health <= 67);
});
test("dodge spends stamina, obeys cooldown and grants brief evasion", () => {
  const game = Combat.createMatch(); Combat.startRound(game);
  Combat.step(game, { dodge:true }, 1/60, () => .999);
  assert.ok(game.fighters[0].dodge > 0);
  assert.ok(game.fighters[0].dodgeCooldown > 0);
  assert.ok(game.fighters[0].stamina < 100);
  const cooldown = game.fighters[0].dodgeCooldown;
  Combat.step(game, { dodge:true }, 1/60, () => .999);
  assert.ok(game.fighters[0].dodgeCooldown < cooldown);
});
test("first to two rounds wins match; next-round reset preserves score", () => {
  const game = Combat.createMatch(2); Combat.startRound(game); closeRange(game);
  game.fighters[1].health = 1;
  advance(game, 12, { action: "jab" });
  assert.equal(game.phase, "roundOver"); assert.deepEqual(game.score, [1,0]);
  assert.equal(Combat.startNextRound(game), true);
  assert.equal(game.round, 2);
  assert.equal(game.fighters[1].health, 100);
  Combat.startRound(game); closeRange(game); game.fighters[1].health = 1;
  advance(game, 12, { action: "jab" });
  assert.equal(game.phase, "matchOver"); assert.deepEqual(game.score, [2,0]);
  assert.equal(Combat.startNextRound(game), false);
});
test("timer settles in favor of higher health", () => {
  const game = Combat.createMatch(); Combat.startRound(game);
  game.time = .005; game.fighters[0].health = 70;
  game.fighters[1].health = 38;
  Combat.step(game, {}, 1/60, () => .999);
  assert.equal(game.winner, 0);
  assert.equal(game.phase, "roundOver");
});
test("draw replays the current round without awarding a point", () => {
  const game = Combat.createMatch(); Combat.startRound(game);
  game.time = .005; Combat.step(game, {}, 1/60, () => .999);
  assert.equal(game.winner, -1);
  assert.deepEqual(game.score, [0,0]);
  Combat.startNextRound(game);
  assert.equal(game.round, 1);
});