import { LOCAL_STORAGE_KEY, appState } from "./state.js";
import { render } from "./render.js";
import { updateUrlFromState, loadStateFromUrl } from "./urlState.js";

export function save() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appState));
  updateUrlFromState();
}

export function load() {
  loadStateFromUrl();

  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    render();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
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
