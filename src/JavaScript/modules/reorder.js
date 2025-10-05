import { state } from "./state.js";
import { save } from "./storage.js";
import { render } from "./render.js";

export function reorderManual(dragId, targetId) {
  if (state.sortBy !== "manual") return;
  const orderMap = new Map(state.tasks.map((t) => [t.id, t.order]));
  const dragOrder = orderMap.get(dragId);
  const targetOrder = orderMap.get(targetId);
  if (dragOrder == null || targetOrder == null) return;

  const movedForward = dragOrder < targetOrder;
  for (const t of state.tasks) {
    if (t.id === dragId) continue;
    if (!movedForward && t.order >= targetOrder) t.order += 1;
    if (movedForward && t.order <= targetOrder) t.order -= 1;
  }
  const targetNew = targetOrder - (movedForward ? 0 : 1);
  const sorted = [...state.tasks].sort((a, b) => a.order - b.order);
  sorted.forEach((t, i) => (t.order = i));
  state.tasks.find((t) => t.id === dragId).order = targetNew;
  save();
  render();
}
