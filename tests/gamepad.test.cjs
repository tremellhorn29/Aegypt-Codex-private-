const test = require("node:test");
const assert = require("node:assert/strict");
const GP = require("../scripts/gamepad.js");

function pad({ index = 0, down = [], axes = [0, 0], id = "DUALSHOCK 4 Wireless Controller", mapping = "standard", connected = true } = {}) {
  return {
    index, id, mapping, connected, axes,
    buttons: Array.from({ length: 17 }, (_, i) => ({
      pressed: down.includes(i), value: down.includes(i) ? 1 : 0
    }))
  };
}

test("paired but not exposed gamepad returns no controller; first press is detected", () => {
  const r = GP.createReader();
  assert.equal(r.poll([null]).connected, false);
  const first = r.poll([pad({ down: [0] })]);
  assert.equal(first.connected, true);
  assert.equal(first.newConnection, true);
  assert.ok(first.edges.includes("cross"));
});
test("button presses are edge-triggered and don't auto-repeat while held", () => {
  const r = GP.createReader();
  assert.ok(r.poll([pad({ down: [0, 2, 3] })]).edges.includes("square"));
  assert.deepEqual(r.poll([pad({ down: [0, 2, 3] })]).edges, []);
  assert.deepEqual(r.poll([pad({ down: [] })]).edges, []);
  assert.deepEqual(r.poll([pad({ down: [1] })]).edges, ["circle"]);
});
test("L1/L2 guard is held; R1/R2 finisher triggers on press", () => {
  const r = GP.createReader();
  let snap = r.poll([pad({ down: [4, 5] })]);
  assert.equal(snap.guard, true); assert.ok(snap.edges.includes("r1"));
  snap = r.poll([pad({ down: [6, 7] })]);
  assert.equal(snap.guard, true); assert.ok(snap.edges.includes("r2"));
  snap = r.poll([pad({ down: [] })]);
  assert.equal(snap.guard, false);
});
test("analog left stick maps to proportional movement with a deadzone", () => {
  const r = GP.createReader();
  assert.equal(r.poll([pad({ axes: [0.14, 0] })]).move, 0);
  const left = r.poll([pad({ axes: [-0.62, 0] })]);
  assert.ok(left.move < -0.49 && left.move > -0.54);
  assert.equal(r.poll([pad({ axes: [1, 0] })]).move, 1);
});
test("D-pad moves and stick vertical axis navigates menus on edge", () => {
  const r = GP.createReader();
  let snap = r.poll([pad({ down: [15] })]);
  assert.equal(snap.move, 1);
  assert.ok(snap.edges.includes("right"));
  snap = r.poll([pad({ down: [14] })]);
  assert.equal(snap.move, -1);
  assert.ok(snap.edges.includes("left"));
  snap = r.poll([pad({ axes: [0, -0.9] })]);
  assert.ok(snap.edges.includes("up"));
  assert.ok(!r.poll([pad({ axes: [0, -0.9] })]).edges.includes("up"));
  assert.ok(r.poll([pad({ axes: [0, 0.9] })]).edges.includes("down"));
});
test("controller disconnect is reported once and clears held input", () => {
  const r = GP.createReader();
  r.poll([pad({ down: [4, 14] })]);
  const lost = r.poll([null]);
  assert.equal(lost.disconnected, true);
  assert.equal(lost.guard, false);
  assert.equal(lost.move, 0);
  assert.equal(r.poll([null]).disconnected, false);
  assert.equal(r.poll([pad({ down: [0] })]).newConnection, true);
});
test("controller index is sticky through other pad connections", () => {
  const r = GP.createReader();
  r.poll([pad({ index: 2, down: [0] })]);
  const snap = r.poll([pad({ index: 1, down: [1] }), pad({ index: 2, down: [2] })]);
  assert.equal(snap.disconnected, false);
  assert.ok(snap.edges.includes("square"));
  assert.ok(!snap.edges.includes("circle"));
});
test("non-standard unidentified devices are ignored", () => {
  const r = GP.createReader();
  assert.equal(r.poll([pad({ id: "Unknown USB Device", mapping: "" })]).connected, false);
});
test("OPTIONS is edge-triggered for pause behavior", () => {
  const r = GP.createReader();
  assert.ok(r.poll([pad({ down: [9] })]).edges.includes("options"));
  assert.ok(!r.poll([pad({ down: [9] })]).edges.includes("options"));
  r.poll([pad()]);
  assert.ok(r.poll([pad({ down: [9] })]).edges.includes("options"));
});
