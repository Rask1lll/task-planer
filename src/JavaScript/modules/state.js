export const LOCAL_STORAGE_KEY = "taskPlanner.v1";

export let appState = {
  taskList: [],
  activeFilter: "all",
  sortField: "created",
  sortDirection: "asc",
  searchQuery: "",
  selectedTaskIds: [],
  lastSelectedTaskId: null,
};

export function initializeState(updatedState) {
  appState = { ...appState, ...updatedState };
}
