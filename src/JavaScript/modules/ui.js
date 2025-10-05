import { appState } from "./state.js";
import { generateUniqueId } from "./utils.js";
import { save } from "./storage.js";
import { render } from "./render.js";

export function attachUIEvents() {
  const els = {
    addBtn: document.getElementById("addBtn"),
    newTaskInput: document.getElementById("newTaskInput"),
    searchInput: document.getElementById("searchInput"),
    filters: Array.from(document.querySelectorAll(".filter")),
    sortBy: document.getElementById("sortBy"),
    sortDir: document.getElementById("sortDir"),
    bulkDone: document.getElementById("bulkDone"),
    bulkUndone: document.getElementById("bulkUndone"),
    bulkDelete: document.getElementById("bulkDelete"),
    bulkClearSel: document.getElementById("bulkClearSel"),
  };

  els.addBtn.addEventListener("click", () => {
    const value = els.newTaskInput.value.trim();
    if (!value) return;

    const nextOrder = appState.taskList.length
      ? Math.max(...appState.taskList.map((t) => t.order)) + 1
      : 0;

    appState.taskList.push({
      id: generateUniqueId(),
      title: value.slice(0, 200),
      created: Date.now(),
      done: false,
      order: nextOrder,
    });

    els.newTaskInput.value = "";
    save();
    render();
  });

  els.newTaskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") els.addBtn.click();
  });

  els.searchInput.addEventListener("input", () => {
    appState.searchQuery = els.searchInput.value;
    render();
  });

  els.filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      appState.activeFilter = btn.dataset.filter;
      render();
    })
  );

  els.sortBy.addEventListener("change", () => {
    appState.sortField = els.sortBy.value;
    render();
  });

  els.sortDir.addEventListener("change", () => {
    appState.sortDirection = els.sortDir.value;
    render();
  });

  els.bulkDone.addEventListener("click", () => {
    const selected = new Set(appState.selectedTaskIds);
    appState.taskList.forEach((task) => {
      if (selected.has(task.id)) task.done = true;
    });
    save();
    render();
  });

  els.bulkUndone.addEventListener("click", () => {
    const selected = new Set(appState.selectedTaskIds);
    appState.taskList.forEach((task) => {
      if (selected.has(task.id)) task.done = false;
    });
    save();
    render();
  });

  els.bulkDelete.addEventListener("click", () => {
    const selected = new Set(appState.selectedTaskIds);
    appState.taskList = appState.taskList.filter(
      (task) => !selected.has(task.id)
    );
    appState.selectedTaskIds = [];
    save();
    render();
  });

  els.bulkClearSel.addEventListener("click", () => {
    appState.selectedTaskIds = [];
    appState.lastSelectedTaskId = null;
    render();
  });
}
