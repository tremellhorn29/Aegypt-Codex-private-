const REP_KEY = "fastln_rep";

export function loadReputation() {
  const raw = localStorage.getItem(REP_KEY);
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function saveReputation(rep) {
  localStorage.setItem(REP_KEY, String(rep));
}
