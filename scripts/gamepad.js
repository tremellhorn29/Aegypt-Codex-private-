/* FAST LN controller reader. Standard Web Gamepad layout supports DualShock 4 on compatible browsers.
 * Dependency-free so button edge / analog handling can be regression-tested in Node.
 */
(function (root) {
  "use strict";
  const DEADZONE = 0.20;
  const DIRECTIONS = Object.freeze({ up: 12, down: 13, left: 14, right: 15 });
  const BUTTONS = Object.freeze({
    cross: 0, circle: 1, square: 2, triangle: 3,
    l1: 4, r1: 5, l2: 6, r2: 7, options: 9,
    ...DIRECTIONS
  });
  const snap = (v) => !Number.isFinite(v) ? 0 : Math.max(-1, Math.min(1, v));
  const analog = (v) => {
    const raw = snap(v);
    if (Math.abs(raw) <= DEADZONE) return 0;
    return Math.sign(raw) * (Math.abs(raw) - DEADZONE) / (1 - DEADZONE);
  };
  const pressed = (pad, number) => {
    const button = pad?.buttons?.[number];
    return Boolean(typeof button === "number" ? button >= 0.5 : button?.pressed || button?.value >= 0.5);
  };
  function createReader() {
    let index = null;
    let previous = new Set();
    function poll(pads) {
      // Safari returns an array with null holes, and only exposes devices after a controller interaction.
      const all = Array.from(pads || []);
      const same = all.find(p => p && p.connected !== false && p.index === index);
      const pad = same || all.find(p => p && p.connected !== false && p.mapping === "standard") || null;
      const disconnected = index !== null && (!pad || pad.index !== index);
      const connected = Boolean(pad);
      const newConnection = connected && pad.index !== index;
      if (!connected) {
        index = null;
        previous = new Set();
        return { connected: false, disconnected, newConnection: false, name: "", move: 0, guard: false, edges: [], held: [] };
      }
      if (newConnection) previous = new Set();
      index = pad.index;
      const held = new Set();
      for (const [name, number] of Object.entries(BUTTONS)) if (pressed(pad, number)) held.add(name);
      const x = snap(pad.axes?.[0]);
      const y = snap(pad.axes?.[1]);
      // D-pad supports left/right movement when the analog stick is neutral.
      const stick = analog(x);
      const move = Math.abs(stick) > 0 ? stick : (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);
      if (y < -0.60) held.add("up");
      if (y > 0.60) held.add("down");
      const edges = Array.from(held).filter(key => !previous.has(key));
      previous = held;
      return {
        connected, disconnected, newConnection, name: String(pad.id || "GAME CONTROLLER"),
        mapping: pad.mapping || "", move, guard: held.has("l1") || held.has("l2"),
        held: Array.from(held), edges
      };
    }
    function reset() { previous = new Set(); }
    return { poll, reset };
  }
  const api = { DEADZONE, BUTTONS, analog, createReader };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.FASTLNGamepad = api;
})(typeof window !== "undefined" ? window : globalThis);
