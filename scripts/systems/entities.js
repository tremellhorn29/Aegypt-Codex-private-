export function makePixelEntity(className, x, y, size = 32) {
  const el = document.createElement("div");
  el.className = `pixel ${className}`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  setEntityPos(el, x, y);
  return el;
}

export function setEntityPos(el, x, y) {
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
