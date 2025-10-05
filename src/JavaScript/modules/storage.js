import { LOCAL_STORAGE_KEY, appState } from "./state.js";
import { render } from "./render.js";

export function save() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));
}

export function load() {
  const rawData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!rawData) return;
  try {
    const parsed = JSON.parse(rawData);
    appState.taskList = Array.isArray(parsed.taskList) ? parsed.taskList : [];
    appState.activeFilter = parsed.activeFilter || "all";
    appState.sortField = parsed.sortField || "created";
    appState.sortDirection = parsed.sortDirection || "asc";
    appState.searchQuery = parsed.searchQuery || "";
    appState.selectedTaskIds = Array.isArray(parsed.selectedTaskIds)
      ? parsed.selectedTaskIds
      : [];
    appState.lastSelectedTaskId = parsed.lastSelectedTaskId || null;
  } catch {}
  render();
}
