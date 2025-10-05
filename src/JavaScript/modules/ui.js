import { state } from "./state.js";
import { uid } from "./utils.js";
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
    const v = els.newTaskInput.value.trim();
    if (!v) return;
    const nextOrder = state.tasks.length
      ? Math.max(...state.tasks.map((t) => t.order)) + 1
      : 0;
    state.tasks.push({
      id: uid(),
      title: v.slice(0, 200),
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
    state.q = els.searchInput.value;
    render();
  });

  els.filters.forEach((b) =>
    b.addEventListener("click", () => {
      state.filter = b.dataset.filter;
      render();
    })
  );

  els.sortBy.addEventListener("change", () => {
    state.sortBy = els.sortBy.value;
    render();
  });

  els.sortDir.addEventListener("change", () => {
    state.sortDir = els.sortDir.value;
    render();
  });

  els.bulkDone.addEventListener("click", () => {
    const set = new Set(state.selected);
    state.tasks.forEach((t) => {
      if (set.has(t.id)) t.done = true;
    });
    save();
    render();
  });

  els.bulkUndone.addEventListener("click", () => {
    const set = new Set(state.selected);
    state.tasks.forEach((t) => {
      if (set.has(t.id)) t.done = false;
    });
    save();
    render();
  });

  els.bulkDelete.addEventListener("click", () => {
    const set = new Set(state.selected);
    state.tasks = state.tasks.filter((t) => !set.has(t.id));
    state.selected = [];
    save();
    render();
  });

  els.bulkClearSel.addEventListener("click", () => {
    state.selected = [];
    state.lastAnchorId = null;
    render();
  });
}
