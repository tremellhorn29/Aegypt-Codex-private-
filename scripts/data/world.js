export const WORLD = { width: 1600, height: 900 };

export const WALLS = [
  { x: 0, y: 0, w: 1600, h: 30 },
  { x: 0, y: 870, w: 1600, h: 30 },
  { x: 0, y: 0, w: 30, h: 900 },
  { x: 1570, y: 0, w: 30, h: 900 },
  { x: 460, y: 530, w: 300, h: 40 },
  { x: 980, y: 300, w: 220, h: 36 },
];

export const FURNITURE = [
  { x: 140, y: 640, w: 200, h: 100 },
  { x: 760, y: 620, w: 230, h: 110 },
  { x: 1150, y: 650, w: 180, h: 80 },
];

export const CREW = [
  { id: "nova", name: "Nova", x: 260, y: 560, line: "I tuned the drums, now we need your vocal take." },
  { id: "rex", name: "Rex", x: 640, y: 470, line: "Write that opener. Episode 1 has to hit." },
  { id: "mina", name: "Mina", x: 820, y: 690, line: "Cover art is ready. Let's match the vibe." },
  { id: "kai", name: "Kai", x: 1060, y: 500, line: "Promo clips are queued, just need the record." },
  { id: "jett", name: "Jett", x: 1320, y: 640, line: "CRT is patched. Old-school visuals are live." },
];
