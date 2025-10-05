import { appState } from "./state.js";

export function updateUrlFromState() {
  const params = new URLSearchParams();

  params.set("filter", appState.activeFilter);
  params.set("sort", appState.sortField);
  params.set("dir", appState.sortDirection);
  if (appState.searchQuery) params.set("q", appState.searchQuery);

  const queryString = params.toString();
  const newUrl = `${location.pathname}${queryString ? "?" + queryString : ""}`;
  history.replaceState(null, "", newUrl);
}

export function loadStateFromUrl() {
  const params = new URLSearchParams(location.search);

  if (params.has("filter")) appState.activeFilter = params.get("filter");
  if (params.has("sort")) appState.sortField = params.get("sort");
  if (params.has("dir")) appState.sortDirection = params.get("dir");
  if (params.has("q")) appState.searchQuery = params.get("q");
}
