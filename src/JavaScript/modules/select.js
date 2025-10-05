import { appState } from "./state.js";
import { getVisibleTasks, render } from "./render.js";

export function handleTaskSelectionClick(taskId, event) {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey;
  const isShift = event.shiftKey;

  if (isShift && appState.lastSelectedTaskId) {
    const visible = getVisibleTasks();
    const idxA = visible.findIndex((t) => t.id === appState.lastSelectedTaskId);
    const idxB = visible.findIndex((t) => t.id === taskId);

    if (idxA !== -1 && idxB !== -1) {
      const [from, to] = idxA < idxB ? [idxA, idxB] : [idxB, idxA];
      const range = visible.slice(from, to + 1).map((t) => t.id);
      const set = new Set(appState.selectedTaskIds);
      range.forEach((id) => set.add(id));
      appState.selectedTaskIds = Array.from(set);
    } else toggleSingleSelection(taskId, isCtrlOrCmd);

    appState.lastSelectedTaskId = taskId;
  } else if (isCtrlOrCmd) {
    toggleSingleSelection(taskId, true);
    appState.lastSelectedTaskId = taskId;
  } else {
    appState.selectedTaskIds = [taskId];
    appState.lastSelectedTaskId = taskId;
  }

  render();
}

function toggleSingleSelection(taskId, keepExisting) {
  const alreadySelected = appState.selectedTaskIds.includes(taskId);
  if (keepExisting) {
    appState.selectedTaskIds = alreadySelected
      ? appState.selectedTaskIds.filter((id) => id !== taskId)
      : appState.selectedTaskIds.concat(taskId);
  } else {
    appState.selectedTaskIds = alreadySelected ? [] : [taskId];
  }
}
