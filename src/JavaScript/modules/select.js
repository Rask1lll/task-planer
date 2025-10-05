import { appState } from "./state.js";
import { getVisibleTasks, render } from "./render.js";

export function handleTaskSelectionClick(taskId, event) {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey;
  const isShiftPressed = event.shiftKey;

  if (isShiftPressed && appState.lastSelectedTaskId) {
    const visibleTasks = getVisibleTasks();
    const anchorIndex = visibleTasks.findIndex(
      (t) => t.id === appState.lastSelectedTaskId
    );
    const clickedIndex = visibleTasks.findIndex((t) => t.id === taskId);

    if (anchorIndex !== -1 && clickedIndex !== -1) {
      const [from, to] =
        anchorIndex < clickedIndex
          ? [anchorIndex, clickedIndex]
          : [clickedIndex, anchorIndex];

      const selectedRange = visibleTasks.slice(from, to + 1).map((t) => t.id);
      const newSelectionSet = new Set(appState.selectedTaskIds);
      selectedRange.forEach((id) => newSelectionSet.add(id));
      appState.selectedTaskIds = Array.from(newSelectionSet);
    } else {
      toggleSingleSelection(taskId, isCtrlOrCmd);
    }
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

function toggleSingleSelection(taskId, keepExistingSelection) {
  const alreadySelected = appState.selectedTaskIds.includes(taskId);

  if (keepExistingSelection) {
    appState.selectedTaskIds = alreadySelected
      ? appState.selectedTaskIds.filter((id) => id !== taskId)
      : appState.selectedTaskIds.concat(taskId);
  } else {
    appState.selectedTaskIds = alreadySelected ? [] : [taskId];
  }
}
