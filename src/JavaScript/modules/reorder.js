import { appState } from "./state.js";
import { save } from "./storage.js";
import { render } from "./render.js";

export function reorderTasksManually(draggedId, targetId) {
  if (appState.sortField !== "manual") return;

  const orderMap = new Map(
    appState.taskList.map((task) => [task.id, task.order])
  );
  const draggedOrder = orderMap.get(draggedId);
  const targetOrder = orderMap.get(targetId);
  if (draggedOrder == null || targetOrder == null) return;

  const isMovingForward = draggedOrder < targetOrder;

  for (const task of appState.taskList) {
    if (task.id === draggedId) continue;
    if (!isMovingForward && task.order >= targetOrder) task.order += 1;
    if (isMovingForward && task.order <= targetOrder) task.order -= 1;
  }

  const newOrder = targetOrder - (isMovingForward ? 0 : 1);
  const sorted = [...appState.taskList].sort((a, b) => a.order - b.order);
  sorted.forEach((t, i) => (t.order = i));

  const draggedTask = appState.taskList.find((t) => t.id === draggedId);
  if (draggedTask) draggedTask.order = newOrder;

  save();
  render();
}
