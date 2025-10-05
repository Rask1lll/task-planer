import { state } from "./state.js";
import { getVisibleTasks, render } from "./render.js";

export function onSelectClick(id, ev) {
  const isCtrl = ev.ctrlKey || ev.metaKey;
  const isShift = ev.shiftKey;
  if (isShift && state.lastAnchorId) {
    const vis = getVisibleTasks();
    const idxA = vis.findIndex((t) => t.id === state.lastAnchorId);
    const idxB = vis.findIndex((t) => t.id === id);
    if (idxA !== -1 && idxB !== -1) {
      const [from, to] = idxA < idxB ? [idxA, idxB] : [idxB, idxA];
      const range = vis.slice(from, to + 1).map((t) => t.id);
      const set = new Set(state.selected);
      range.forEach((i) => set.add(i));
      state.selected = Array.from(set);
    } else toggleSingle(id, isCtrl);
    state.lastAnchorId = id;
  } else if (isCtrl) {
    toggleSingle(id, true);
    state.lastAnchorId = id;
  } else {
    state.selected = [id];
    state.lastAnchorId = id;
  }
  render();
}

function toggleSingle(id, keepOthers) {
  const exists = state.selected.includes(id);
  if (keepOthers) {
    state.selected = exists
      ? state.selected.filter((x) => x !== id)
      : state.selected.concat(id);
  } else {
    state.selected = exists ? [] : [id];
  }
}
