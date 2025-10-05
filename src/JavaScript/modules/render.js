import { state } from "./state.js";
import { formatDate } from "./utils.js";
import { save } from "./storage.js";
import { reorderManual } from "./reorder.js";
import { onSelectClick } from "./select.js";

const els = {
  taskList: document.getElementById("taskList"),
  emptyState: document.getElementById("emptyState"),
  filters: Array.from(document.querySelectorAll(".filter")),
  sortBy: document.getElementById("sortBy"),
  sortDir: document.getElementById("sortDir"),
  searchInput: document.getElementById("searchInput"),
  statsChip: document.getElementById("statsChip"),
  doneChip: document.getElementById("doneChip"),
  bulkBar: document.getElementById("bulkBar"),
  bulkCount: document.getElementById("bulkCount"),
  bulkDone: document.getElementById("bulkDone"),
  bulkUndone: document.getElementById("bulkUndone"),
  bulkDelete: document.getElementById("bulkDelete"),
  bulkClearSel: document.getElementById("bulkClearSel"),
};

let draggedId = null;

export function getVisibleTasks() {
  const q = state.q.trim().toLowerCase();
  let items = state.tasks.filter((t) => {
    if (state.filter === "active" && t.done) return false;
    if (state.filter === "done" && !t.done) return false;
    if (q && !t.title.toLowerCase().includes(q)) return false;
    return true;
  });
  const dir = state.sortDir === "asc" ? 1 : -1;
  switch (state.sortBy) {
    case "created":
      items.sort((a, b) => (a.created - b.created) * dir);
      break;
    case "title":
      items.sort((a, b) => a.title.localeCompare(b.title, "ru") * dir);
      break;
    case "status":
      items.sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1) * dir);
      break;
    case "manual":
      items.sort((a, b) => (a.order - b.order) * (dir === 1 ? 1 : -1));
      break;
  }
  return items;
}

export function render() {
  const items = getVisibleTasks();
  els.taskList.innerHTML = "";

  if (items.length === 0) {
    els.emptyState.hidden = false;
  } else {
    els.emptyState.hidden = true;
    for (const t of items) {
      const li = document.createElement("li");
      li.className =
        "task" +
        (t.done ? " done" : "") +
        (state.selected.includes(t.id) ? " selected" : "");
      li.draggable = state.sortBy === "manual";
      li.dataset.id = t.id;

      const handle = document.createElement("div");
      handle.className = "handle";
      handle.textContent = "⋮⋮";

      const titleWrap = document.createElement("div");
      titleWrap.className = "title";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = t.done;
      cb.addEventListener("change", () => {
        t.done = cb.checked;
        save();
        render();
      });

      const text = document.createElement("div");
      text.className = "text";
      text.textContent = t.title;

      titleWrap.appendChild(cb);
      titleWrap.appendChild(text);

      const meta = document.createElement("div");
      meta.className = "meta";

      const date = document.createElement("span");
      date.className = "date";
      date.textContent = formatDate(t.created);

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => startInlineEdit(li, t));

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        state.tasks = state.tasks.filter((x) => x.id !== t.id);
        save();
        render();
      });

      meta.appendChild(date);
      meta.appendChild(editBtn);
      meta.appendChild(delBtn);
      li.appendChild(handle);
      li.appendChild(titleWrap);
      li.appendChild(meta);

      li.addEventListener("click", (ev) => {
        if (ev.target === cb || ev.target === editBtn || ev.target === delBtn)
          return;
        onSelectClick(t.id, ev);
      });

      if (li.draggable) {
        li.addEventListener("dragstart", (e) => {
          draggedId = t.id;
          li.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
        });
        li.addEventListener("dragend", () => {
          draggedId = null;
          li.classList.remove("dragging");
          document
            .querySelectorAll(".drag-over")
            .forEach((el) => el.classList.remove("drag-over"));
        });
      }

      els.taskList.appendChild(li);
    }
  }

  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  els.statsChip.textContent = `${total} задач`;
  els.doneChip.textContent = `${done} выполнено`;

  if (state.selected.length > 0) {
    els.bulkBar.classList.add("active");
    els.bulkCount.textContent = `${state.selected.length} выбрано`;
  } else {
    els.bulkBar.classList.remove("active");
  }

  save();
}

els.taskList.addEventListener("dragover", (e) => {
  if (!draggedId || state.sortBy !== "manual") return;
  e.preventDefault();
  const target = e.target.closest("li.task");
  if (!target || target.dataset.id === draggedId) return;
  target.classList.add("drag-over");
});

els.taskList.addEventListener("dragleave", (e) => {
  const target = e.target.closest("li.task");
  if (target) target.classList.remove("drag-over");
});

els.taskList.addEventListener("drop", (e) => {
  e.preventDefault();
  const target = e.target.closest("li.task");
  if (!target || !draggedId) return;
  const targetId = target.dataset.id;
  reorderManual(draggedId, targetId);
  draggedId = null;
});

function startInlineEdit(li, task) {
  const textDiv = li.querySelector(".text");
  const old = task.title;
  const input = document.createElement("input");
  input.type = "text";
  input.value = old;
  textDiv.replaceWith(input);
  input.focus();

  const commit = () => {
    task.title = input.value.trim() || old;
    save();
    render();
  };
  const cancel = () => render();

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancel();
  });
  input.addEventListener("blur", commit);
}
