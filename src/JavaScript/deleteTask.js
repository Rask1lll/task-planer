// ========= Модель состояния =========
const storeKey = "taskPlanner.v1";

/** @type {{
      tasks: Array<{id:string,title:string,created:number,done:boolean,order:number}>,
      filter: 'all'|'active'|'done',
      sortBy: 'created'|'title'|'status'|'manual',
      sortDir: 'asc'|'desc',
      q: string,
      selected: string[],
      lastAnchorId: string|null
    }} */
let state = {
  tasks: [],
  filter: "all",
  sortBy: "created",
  sortDir: "asc",
  q: "",
  selected: [],
  lastAnchorId: null,
};

// ========= DOM =========
const els = {
  taskList: document.getElementById("taskList"),
  newTaskInput: document.getElementById("newTaskInput"),
  addBtn: document.getElementById("addBtn"),
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

// ========= Утилиты =========
const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const escapeHTML = (s) =>
  s.replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m])
  );
const formatDate = (ts) => {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

function encodeStateToURL() {
  const payload = {
    tasks: state.tasks,
    filter: state.filter,
    sortBy: state.sortBy,
    sortDir: state.sortDir,
    q: state.q,
  };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  const params = new URLSearchParams(location.search);
  params.set("s", b64);
  history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
}
function tryDecodeStateFromURL() {
  const params = new URLSearchParams(location.search);
  if (!params.has("s")) return false;
  try {
    const json = decodeURIComponent(escape(atob(params.get("s"))));
    const parsed = JSON.parse(json);
    if (parsed && Array.isArray(parsed.tasks)) {
      state.tasks = parsed.tasks.map((t, i) => ({
        id: String(t.id || uid()),
        title: String(t.title || "").slice(0, 200),
        created: Number(t.created || Date.now()),
        done: !!t.done,
        order: Number.isFinite(t.order) ? t.order : i,
      }));
      state.filter = ["all", "active", "done"].includes(parsed.filter)
        ? parsed.filter
        : "all";
      state.sortBy = ["created", "title", "status", "manual"].includes(
        parsed.sortBy
      )
        ? parsed.sortBy
        : "created";
      state.sortDir = ["asc", "desc"].includes(parsed.sortDir)
        ? parsed.sortDir
        : "asc";
      state.q = String(parsed.q || "");
      return true;
    }
  } catch (e) {}
  return false;
}

function save() {
  localStorage.setItem(storeKey, JSON.stringify(state));
  encodeStateToURL();
}
function load() {
  if (tryDecodeStateFromURL()) return;
  const raw = localStorage.getItem(storeKey);
  if (raw) {
    try {
      const s = JSON.parse(raw);
      state.tasks = Array.isArray(s.tasks) ? s.tasks : [];
      state.filter = s.filter || "all";
      state.sortBy = s.sortBy || "created";
      state.sortDir = s.sortDir || "asc";
      state.q = s.q || "";
      state.selected = Array.isArray(s.selected) ? s.selected : [];
      state.lastAnchorId = s.lastAnchorId || null;
    } catch (e) {}
  }
}

// ========= Логика сортировки/фильтра =========
function getVisibleTasks() {
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
      // done last in asc; reverse in desc
      items.sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1) * dir);
      break;
    case "manual":
      items.sort((a, b) => (a.order - b.order) * (dir === 1 ? 1 : -1)); // направление влияет
      break;
  }
  return items;
}

// ========= Рендер =========
function render() {
  // UI inputs reflect state
  els.searchInput.value = state.q;
  els.sortBy.value = state.sortBy;
  els.sortDir.value = state.sortDir;
  els.filters.forEach((b) =>
    b.classList.toggle("active", b.dataset.filter === state.filter)
  );

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
      li.draggable = state.sortBy === "manual"; // drag только в «Ручной порядок»
      li.dataset.id = t.id;

      const handle = document.createElement("div");
      handle.className = "handle";
      handle.title = li.draggable
        ? "Перетащить"
        : 'Перетаскивание отключено (выбрана сортировка не "Ручной порядок")';
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
      text.title = t.title;

      // редактирование по двойному клику
      text.addEventListener("dblclick", () => startInlineEdit(li, t));

      titleWrap.appendChild(cb);
      titleWrap.appendChild(text);

      const meta = document.createElement("div");
      meta.className = "meta";

      const date = document.createElement("span");
      date.className = "date";
      date.textContent = formatDate(t.created);

      const editBtn = document.createElement("button");
      editBtn.textContent = "Редакт.";
      editBtn.addEventListener("click", () => startInlineEdit(li, t));

      const delBtn = document.createElement("button");
      delBtn.textContent = "Удалить";
      delBtn.style.borderColor = "#fee2e2";
      delBtn.addEventListener("click", () => {
        state.tasks = state.tasks.filter((x) => x.id !== t.id);
        state.selected = state.selected.filter((id) => id !== t.id);
        save();
        render();
      });

      meta.appendChild(date);
      meta.appendChild(editBtn);
      meta.appendChild(delBtn);

      li.appendChild(handle);
      li.appendChild(titleWrap);
      li.appendChild(meta);

      // выбор: клик по строке
      li.addEventListener("click", (ev) => {
        if (ev.target === cb || ev.target === editBtn || ev.target === delBtn)
          return;
        onSelectClick(t.id, ev);
      });

      // Drag & Drop
      if (li.draggable) {
        li.addEventListener("dragstart", (e) => {
          li.classList.add("dragging");
          e.dataTransfer.setData("text/plain", t.id);
          e.dataTransfer.effectAllowed = "move";
        });
        li.addEventListener("dragend", () => {
          li.classList.remove("dragging");
        });
        li.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          li.classList.add("drag-over");
        });
        li.addEventListener("dragleave", () => {
          li.classList.remove("drag-over");
        });
        li.addEventListener("drop", (e) => {
          e.preventDefault();
          li.classList.remove("drag-over");
          const draggedId = e.dataTransfer.getData("text/plain");
          if (!draggedId || draggedId === t.id) return;
          reorderManual(draggedId, t.id);
        });
      }

      els.taskList.appendChild(li);
    }
  }

  // stats
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.done).length;
  els.statsChip.textContent = `${total} задач`;
  els.doneChip.textContent = `${done} выполнено`;

  // bulk toolbar
  if (state.selected.length > 0) {
    els.bulkBar.classList.add("active");
    els.bulkCount.textContent = `${state.selected.length} выбрано`;
  } else {
    els.bulkBar.classList.remove("active");
  }

  // сохранить url/localStorage после рендера
  save();
}

function startInlineEdit(li, task) {
  const textDiv = li.querySelector(".text");
  const old = task.title;
  const input = document.createElement("input");
  input.type = "text";
  input.value = old;
  input.style.width = "100%";
  input.style.border = "1px solid var(--border)";
  input.style.borderRadius = "8px";
  input.style.padding = "6px 8px";
  textDiv.replaceWith(input);
  input.focus();
  input.select();

  const commit = () => {
    const v = input.value.trim();
    task.title = v || old;
    save();
    render();
  };
  const cancel = () => {
    render();
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") cancel();
  });
  input.addEventListener("blur", commit);
}

// ========= Выделение (клик / Ctrl / Shift) =========
function onSelectClick(id, ev) {
  const isCtrl = ev.ctrlKey || ev.metaKey;
  const isShift = ev.shiftKey;

  if (isShift && state.lastAnchorId) {
    // диапазон между lastAnchorId и текущим id (в видимом списке)
    const vis = getVisibleTasks();
    const idxA = vis.findIndex((t) => t.id === state.lastAnchorId);
    const idxB = vis.findIndex((t) => t.id === id);
    if (idxA !== -1 && idxB !== -1) {
      const [from, to] = idxA < idxB ? [idxA, idxB] : [idxB, idxA];
      const range = vis.slice(from, to + 1).map((t) => t.id);
      const set = new Set(state.selected);
      range.forEach((i) => set.add(i));
      state.selected = Array.from(set);
    } else {
      toggleSingle(id, isCtrl);
      state.lastAnchorId = id;
    }
  } else if (isCtrl) {
    // инвертировать
    toggleSingle(id, true);
    state.lastAnchorId = id;
  } else {
    // одиночный выбор
    state.selected = [id];
    state.lastAnchorId = id;
  }
  render();
}
function toggleSingle(id, keepOthers) {
  const exists = state.selected.includes(id);
  if (keepOthers) {
    state.selected = exists
      ? state.selected.filter((x) => x !== id)
      : state.selected.concat(id);
  } else {
    state.selected = exists ? [] : [id];
  }
}

// ========= Ручная перестановка =========
function reorderManual(dragId, targetId) {
  if (state.sortBy !== "manual") return;
  const orderMap = new Map(state.tasks.map((t) => [t.id, t.order]));
  const dragOrder = orderMap.get(dragId);
  const targetOrder = orderMap.get(targetId);
  if (dragOrder == null || targetOrder == null) return;

  // Переместим dragId на позицию перед targetId: сдвинем остальные
  const movedForward = dragOrder < targetOrder;
  for (const t of state.tasks) {
    if (t.id === dragId) continue;
    if (!movedForward && t.order >= targetOrder) t.order += 1;
    if (movedForward && t.order <= targetOrder) t.order -= 1;
  }
  const targetNew = targetOrder - (movedForward ? 0 : 1);
  const minOrder = Math.min(...state.tasks.map((t) => t.order));
  const maxOrder = Math.max(...state.tasks.map((t) => t.order));

  // нормализация, чтобы не разъезжались
  state.tasks.find((t) => t.id === dragId).order = Math.max(
    minOrder - 1,
    Math.min(maxOrder + 1, targetNew)
  );
  // переупорядочим 0..n
  const sorted = [...state.tasks].sort((a, b) => a.order - b.order);
  sorted.forEach((t, i) => (t.order = i));

  save();
  render();
}

// ========= Слушатели UI =========
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

els.filters.forEach((b) => {
  b.addEventListener("click", () => {
    state.filter = b.dataset.filter;
    render();
  });
});

els.sortBy.addEventListener("change", () => {
  state.sortBy = els.sortBy.value;
  render();
});
els.sortDir.addEventListener("change", () => {
  state.sortDir = els.sortDir.value;
  render();
});
-els.bulkDone.addEventListener("click", () => {
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

load();
render();
