const REP_KEY = "fastln_rep";

export function loadReputation() {
  try {
    const raw = window.localStorage?.getItem(REP_KEY);
    const parsed = Number.parseInt(raw ?? "0", 10);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (error) {
    console.warn("Local save data is unavailable in this browser session:", error);
    return 0;
  }
}

export function saveReputation(rep) {
  try {
    window.localStorage?.setItem(REP_KEY, String(rep));
    return true;
  } catch (error) {
    console.warn("Could not save reputation locally:", error);
    return false;
  }
}
