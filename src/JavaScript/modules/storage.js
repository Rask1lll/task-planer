import { storeKey, state } from "./state.js";
import { render } from "./render.js";

export function save() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

export function load() {
  const raw = localStorage.getItem(storeKey);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    state.tasks = Array.isArray(s.tasks) ? s.tasks : [];
    state.filter = s.filter || "all";
    state.sortBy = s.sortBy || "created";
    state.sortDir = s.sortDir || "asc";
    state.q = s.q || "";
    state.selected = Array.isArray(s.selected) ? s.selected : [];
    state.lastAnchorId = s.lastAnchorId || null;
  } catch {}
  render();
}
