/* FAST LN Street Kings: deterministic combat rules, browser + Node compatible. */
(function (root) {
  "use strict";
  const WIDTH = 960;
  const ROUNDS_TO_WIN = 2;
  const ROUND_SECONDS = 50;
  const COMBO_WINDOW = 1.15;
  const MAX_COMBO = 3;
  const RIVALS = Object.freeze([
    { name: "ROOK", title: "THE CORNER ROOKIE", color: "#ff9c41", skin: "#996144", speed: 170, aggression: .47, payout: 50, quote: "Everybody starts somewhere." },
    { name: "VEX", title: "THE COUNTER KING", color: "#ab86ff", skin: "#8e523e", speed: 185, aggression: .64, payout: 90, quote: "You swing. I collect." },
    { name: "CROWN", title: "THE BLOCK CHAMP", color: "#f1c76a", skin: "#705040", speed: 202, aggression: .80, payout: 150, quote: "The throne has a price." }
  ]);
  const MOVES = Object.freeze({
    jab:     { cost: 8,  damage: 8,  reach: 113, windup: .10, duration: .30, cooldown: .30, knock: 10, gain: 13 },
    hook:    { cost: 17, damage: 15, reach: 119, windup: .20, duration: .49, cooldown: .52, knock: 23, gain: 19 },
    kick:    { cost: 23, damage: 20, reach: 164, windup: .23, duration: .63, cooldown: .65, knock: 32, gain: 22 },
    special: { cost: 32, damage: 33, reach: 179, windup: .25, duration: .78, cooldown: .82, knock: 56, gain: 0 }
  });
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  function fighter(name, x, color, skin, speed) {
    return { name, x, health: 100, stamina: 100, meter: 0, color, skin, speed,
      guard: false, dodge: 0, dodgeCooldown: 0, stun: 0, cooldown: 0, attack: null,
      attackClock: 0, hitPending: false, facing: x < WIDTH / 2 ? 1 : -1, moving: 0,
      combo: 0, comboClock: 0 };
  }
  function createMatch(rivalIndex = 0) {
    const index = clamp(Math.floor(Number(rivalIndex) || 0), 0, RIVALS.length - 1);
    const rival = RIVALS[index];
    return {
      rivalIndex: index, round: 1, score: [0, 0], time: ROUND_SECONDS, phase: "ready",
      fighters: [fighter("STAR", 285, "#52e0bc", "#aa7556", 186), fighter(rival.name, 675, rival.color, rival.skin, rival.speed)],
      ai: { clock: 0, move: -1, guard: false, action: null }, winner: null, events: []
    };
  }
  function startRound(game) {
    if (game.phase !== "ready") return false;
    game.phase = "fighting";
    game.events = [{ type: "start", round: game.round }];
    return true;
  }
  function startNextRound(game) {
    if (game.phase !== "roundOver") return false;
    if (game.winner === -1) { /* A draw replays the same round. */ }
    else game.round += 1;
    const rival = RIVALS[game.rivalIndex];
    const meters = game.fighters.map(f => clamp(f.meter * .35, 0, 40));
    game.fighters = [fighter("STAR", 285, "#52e0bc", "#aa7556", 186), fighter(rival.name, 675, rival.color, rival.skin, rival.speed)];
    game.fighters.forEach((f, i) => f.meter = meters[i]);
    game.time = ROUND_SECONDS;
    game.phase = "ready";
    game.winner = null;
    game.events = [];
    game.ai = { clock: 0, move: -1, guard: false, action: null };
    return true;
  }
  function beginAttack(game, index, kind) {
    const f = game.fighters[index], move = MOVES[kind];
    if (!move || game.phase !== "fighting" || f.health <= 0 || f.attack || f.stun > 0 || f.dodge > 0 || f.cooldown > 0 || f.stamina < move.cost || (kind === "special" && f.meter < 65)) return false;
    f.stamina -= move.cost;
    if (kind === "special") f.meter -= 65;
    f.attack = kind;
    f.attackClock = move.duration;
    f.hitPending = true;
    f.guard = false;
    f.cooldown = move.cooldown;
    game.events.push({ type: "swing", who: index, kind });
    return true;
  }
  function dodge(game, index) {
    const f = game.fighters[index], other = game.fighters[1 - index];
    if (f.health <= 0 || f.stun > 0 || f.attack || f.dodgeCooldown > 0 || f.stamina < 18) return false;
    f.stamina -= 18;
    f.dodge = .30;
    f.dodgeCooldown = 1.0;
    f.guard = false;
    f.x = clamp(f.x + (f.x < other.x ? -1 : 1) * 57, 80, 880);
    game.events.push({ type: "dodge", who: index });
    return true;
  }
  function hit(game, index, kind) {
    const a = game.fighters[index], b = game.fighters[1 - index], move = MOVES[kind];
    const distance = Math.abs(a.x - b.x);
    if (distance > move.reach || b.dodge > 0) {
      a.combo = 0;
      a.comboClock = 0;
      // A missed strike creates a meaningful punish window after the animation.
      a.cooldown = Math.max(a.cooldown, move.cooldown + .12);
      game.events.push({ type: b.dodge > 0 ? "evade" : "whiff", who: index, kind });
      return;
    }
    const blocked = b.guard && b.stamina > 0 && b.stun <= 0;
    // Only consecutive clean hits count as a combo. Blocking/whiffing resets it.
    const combo = blocked ? 0 : (a.comboClock > 0 ? Math.min(MAX_COMBO, a.combo + 1) : 1);
    const damage = blocked ? Math.max(1, Math.round(move.damage * .16)) : move.damage + 2 * (combo - 1);
    a.combo = combo;
    a.comboClock = blocked ? 0 : COMBO_WINDOW;
    b.health = clamp(b.health - damage, 0, 100);
    b.stamina = clamp(b.stamina - (blocked ? move.damage * .80 : 5), 0, 100);
    a.meter = clamp(a.meter + (blocked ? 5 : move.gain + 3 * (combo - 1)), 0, 100);
    b.meter = clamp(b.meter + (blocked ? 3 : 8), 0, 100);
    b.x = clamp(b.x + Math.sign(b.x - a.x) * (blocked ? 5 : move.knock), 80, 880);
    if (!blocked) {
      b.stun = kind === "special" ? .38 : (kind === "jab" ? .10 : .23);
      b.attack = null;
      b.hitPending = false;
      b.combo = 0;
      b.comboClock = 0;
    }
    if (blocked && b.stamina <= 0) { b.guard = false; b.stun = .8; game.events.push({ type: "guardBreak", who: 1 - index }); }
    game.events.push({ type: blocked ? "block" : "hit", who: index, target: 1 - index, damage, kind, combo });
  }
  function decideAI(game, dt, random) {
    const a = game.fighters[1], p = game.fighters[0], ai = game.ai;
    ai.clock -= dt;
    if (ai.clock <= 0) {
      const rival = RIVALS[game.rivalIndex];
      const distance = Math.abs(a.x - p.x);
      const threatened = Boolean(p.attack && p.attackClock > .06);
      ai.clock = .18 + random() * .24;
      ai.guard = threatened && random() < (.22 + rival.aggression * .53);
      if (a.stamina < 17) ai.guard = random() < .6;
      ai.move = distance > 118 ? -1 : distance < 88 && random() < .5 ? 1 : (random() < .18 ? -1 : 0);
      ai.action = null;
      if (!ai.guard && distance < 166 && a.stamina >= 9 && random() < (.40 + rival.aggression * .33)) {
        const roll = random();
        ai.action = roll < .48 ? "jab" : roll < .78 ? "hook" : "kick";
        if (a.meter >= 65 && random() < rival.aggression * .46) ai.action = "special";
      }
    }
    return { move: ai.move, guard: ai.guard, action: ai.action };
  }
  function settle(game) {
    if (game.phase !== "fighting") return;
    const a = game.fighters[0], b = game.fighters[1];
    if (a.health > 0 && b.health > 0 && game.time > 0) return;
    const winner = a.health === b.health ? -1 : (a.health > b.health ? 0 : 1);
    game.winner = winner;
    if (winner >= 0) game.score[winner] += 1;
    game.phase = game.score.some(n => n >= ROUNDS_TO_WIN) ? "matchOver" : "roundOver";
    game.events.push({ type: "end", winner, matchOver: game.phase === "matchOver" });
  }
  function step(game, playerInput = {}, dt = 1 / 60, random = Math.random) {
    game.events = [];
    if (game.phase !== "fighting") return game.events;
    const delta = clamp(Number(dt) || 0, 0, .05);
    game.time = Math.max(0, game.time - delta);
    const controls = [playerInput, decideAI(game, delta, random)];
    for (let i = 0; i < 2; i++) {
      const f = game.fighters[i], enemy = game.fighters[1 - i], input = controls[i];
      f.facing = f.x < enemy.x ? 1 : -1;
      f.stun = Math.max(0, f.stun - delta);
      f.comboClock = Math.max(0, f.comboClock - delta);
      if (f.comboClock === 0) f.combo = 0;
      f.cooldown = Math.max(0, f.cooldown - delta);
      f.dodge = Math.max(0, f.dodge - delta);
      f.dodgeCooldown = Math.max(0, f.dodgeCooldown - delta);
      f.guard = Boolean(input.guard && f.stamina > 0 && f.stun === 0 && !f.attack && f.dodge === 0);
      f.moving = 0;
      if (input.dodge && f.dodge === 0) dodge(game, i);
      if (input.action && !f.guard) beginAttack(game, i, input.action);
      if (!f.attack && f.stun === 0 && f.dodge === 0) {
        const move = clamp(Number(input.move) || 0, -1, 1);
        let next = clamp(f.x + move * f.speed * delta, 78, 882);
        if ((i === 0 && next > enemy.x - 68) || (i === 1 && next < enemy.x + 68)) next = i === 0 ? enemy.x - 68 : enemy.x + 68;
        f.moving = f.guard ? move * .36 : move;
        f.x = clamp(f.x + (next - f.x) * (f.guard ? .36 : 1), 78, 882);
      }
      f.stamina = clamp(f.stamina + (f.guard ? 4 : f.attack ? 6 : 18) * delta, 0, 100);
      if (f.attack) {
        const kind = f.attack, move = MOVES[kind], before = f.attackClock;
        f.attackClock = Math.max(0, f.attackClock - delta);
        if (f.hitPending && before > move.duration - move.windup && f.attackClock <= move.duration - move.windup) {
          f.hitPending = false;
          hit(game, i, kind);
        }
        if (f.attackClock <= 0) f.attack = null;
      }
    }
    settle(game);
    return game.events;
  }
  const api = { WIDTH, ROUND_SECONDS, ROUNDS_TO_WIN, COMBO_WINDOW, MAX_COMBO, RIVALS, MOVES, createMatch, startRound, startNextRound, beginAttack, step };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.FightCore = api;
})(typeof window !== "undefined" ? window : globalThis);
