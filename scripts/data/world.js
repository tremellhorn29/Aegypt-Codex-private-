export const WORLD = { width: 1600, height: 1000 };

export const WALLS = [
  { x: 0, y: 0, w: 1600, h: 28 },
  { x: 0, y: 972, w: 1600, h: 28 },
  { x: 0, y: 0, w: 28, h: 1000 },
  { x: 1572, y: 0, w: 28, h: 1000 },
  { x: 410, y: 410, w: 36, h: 420 },
  { x: 970, y: 250, w: 36, h: 360 },
  { x: 1210, y: 590, w: 280, h: 34 },
];

export const FURNITURE = [
  { type: "sofa", label: "Family Couch", x: 90, y: 690, w: 230, h: 105 },
  { type: "desk", label: "Study Desk", x: 120, y: 310, w: 170, h: 85 },
  { type: "tv", label: "TV", x: 310, y: 140, w: 70, h: 150 },
  { type: "studio", label: "Bedroom Studio", x: 535, y: 640, w: 260, h: 120 },
  { type: "counter", label: "Corner Store", x: 1065, y: 150, w: 330, h: 110 },
  { type: "bench", label: "Courtyard Bench", x: 1090, y: 700, w: 210, h: 72 },
  { type: "hoop", label: "The Court", x: 1390, y: 350, w: 70, h: 140 },
];

export const CREW = [
  { id: "nova", name: "Nova", role: "Producer", look: "violet", x: 520, y: 560, line: "The beat is ready, but talent means nothing if you never show up." },
  { id: "rex", name: "Rex", role: "Strategist", look: "gold", x: 760, y: 455, line: "You can chase quick respect, or build something nobody can take from you." },
  { id: "mina", name: "Mina", role: "Artist", look: "rose", x: 865, y: 730, line: "I made the cover feel like our block—rough edges, bright future." },
  { id: "kai", name: "Kai", role: "Connector", look: "cyan", x: 1125, y: 520, line: "People remember who helped before they remember who talked the loudest." },
  { id: "jett", name: "Jett", role: "Tech", look: "green", x: 1350, y: 700, line: "Your phone is the real command center. Check it before the next move." },
];
