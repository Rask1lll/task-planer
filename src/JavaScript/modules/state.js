export const storeKey = "taskPlanner.v1";

export let state = {
  tasks: [],
  filter: "all",
  sortBy: "created",
  sortDir: "asc",
  q: "",
  selected: [],
  lastAnchorId: null,
};

export function initState(newState) {
  state = { ...state, ...newState };
}
