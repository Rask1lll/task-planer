import { appState } from "./state.js";
import { save } from "./storage.js";
import { render } from "./render.js";

export function reorderTasksManually(draggedTaskId, targetTaskId) {
  if (appState.sortField !== "manual") return;

  const orderMap = new Map(
    appState.taskList.map((task) => [task.id, task.order])
  );
  const draggedOrder = orderMap.get(draggedTaskId);
  const targetOrder = orderMap.get(targetTaskId);
  if (draggedOrder == null || targetOrder == null) return;

  const isMovingForward = draggedOrder < targetOrder;

  for (const task of appState.taskList) {
    if (task.id === draggedTaskId) continue;
    if (!isMovingForward && task.order >= targetOrder) task.order += 1;
    if (isMovingForward && task.order <= targetOrder) task.order -= 1;
  }

  const newOrderPosition = targetOrder - (isMovingForward ? 0 : 1);
  const sortedTasks = [...appState.taskList].sort((a, b) => a.order - b.order);
  sortedTasks.forEach((task, index) => (task.order = index));

  const draggedTask = appState.taskList.find(
    (task) => task.id === draggedTaskId
  );
  if (draggedTask) draggedTask.order = newOrderPosition;

  save();
  render();
}
