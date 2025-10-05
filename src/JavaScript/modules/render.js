import { appState } from "./state.js";
import { formatDateTime } from "./utils.js";
import { save } from "./storage.js";
import { reorderTasksManually } from "./reorder.js";
import { handleTaskSelectionClick } from "./select.js";

const uiRefs = {
  taskList: document.getElementById("taskList"),
  emptyState: document.getElementById("emptyState"),
  filters: Array.from(document.querySelectorAll(".filter")),
  sortField: document.getElementById("sortBy"),
  sortDirection: document.getElementById("sortDir"),
  searchInput: document.getElementById("searchInput"),
  statsChip: document.getElementById("statsChip"),
  doneChip: document.getElementById("doneChip"),
  bulkBar: document.getElementById("bulkBar"),
  bulkCount: document.getElementById("bulkCount"),
  bulkDone: document.getElementById("bulkDone"),
  bulkUndone: document.getElementById("bulkUndone"),
  bulkDelete: document.getElementById("bulkDelete"),
  bulkClearSelection: document.getElementById("bulkClearSel"),
};

let draggedTaskId = null;

export function getVisibleTasks() {
  const query = appState.searchQuery.trim().toLowerCase();
  let filteredTasks = appState.taskList.filter((task) => {
    if (appState.activeFilter === "active" && task.done) return false;
    if (appState.activeFilter === "done" && !task.done) return false;
    if (query && !task.title.toLowerCase().includes(query)) return false;
    return true;
  });

  const sortMultiplier = appState.sortDirection === "asc" ? 1 : -1;

  switch (appState.sortField) {
    case "created":
      filteredTasks.sort((a, b) => (a.created - b.created) * sortMultiplier);
      break;
    case "title":
      filteredTasks.sort(
        (a, b) => a.title.localeCompare(b.title, "ru") * sortMultiplier
      );
      break;
    case "status":
      filteredTasks.sort(
        (a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1) * sortMultiplier
      );
      break;
    case "manual":
      filteredTasks.sort(
        (a, b) => (a.order - b.order) * (sortMultiplier === 1 ? 1 : -1)
      );
      break;
  }

  return filteredTasks;
}

export function render() {
  const tasksToRender = getVisibleTasks();
  uiRefs.taskList.innerHTML = "";

  if (tasksToRender.length === 0) {
    uiRefs.emptyState.hidden = false;
    return;
  }

  uiRefs.emptyState.hidden = true;

  for (const task of tasksToRender) {
    const taskItem = document.createElement("li");
    taskItem.className =
      "task" +
      (task.done ? " done" : "") +
      (appState.selectedTaskIds.includes(task.id) ? " selected" : "");
    taskItem.draggable = appState.sortField === "manual";
    taskItem.dataset.id = task.id;

    const dragHandle = document.createElement("div");
    dragHandle.className = "handle";
    dragHandle.textContent = "⋮⋮";

    const titleContainer = document.createElement("div");
    titleContainer.className = "title";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      save();
      render();
    });

    const titleText = document.createElement("div");
    titleText.className = "text";
    titleText.textContent = task.title;

    titleContainer.appendChild(checkbox);
    titleContainer.appendChild(titleText);

    const metaContainer = document.createElement("div");
    metaContainer.className = "meta";

    const creationDate = document.createElement("span");
    creationDate.className = "date";
    creationDate.textContent = formatDateTime(task.created);

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => startInlineEdit(taskItem, task));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      appState.taskList = appState.taskList.filter((t) => t.id !== task.id);
      save();
      render();
    });

    metaContainer.appendChild(creationDate);
    metaContainer.appendChild(editButton);
    metaContainer.appendChild(deleteButton);
    taskItem.appendChild(dragHandle);
    taskItem.appendChild(titleContainer);
    taskItem.appendChild(metaContainer);

    taskItem.addEventListener("click", (event) => {
      if (
        event.target === checkbox ||
        event.target === editButton ||
        event.target === deleteButton
      )
        return;
      handleTaskSelectionClick(task.id, event);
    });

    if (taskItem.draggable) {
      taskItem.addEventListener("dragstart", (event) => {
        draggedTaskId = task.id;
        taskItem.classList.add("dragging");
        event.dataTransfer.effectAllowed = "move";
      });

      taskItem.addEventListener("dragend", () => {
        draggedTaskId = null;
        taskItem.classList.remove("dragging");
        document
          .querySelectorAll(".drag-over")
          .forEach((el) => el.classList.remove("drag-over"));
      });
    }

    uiRefs.taskList.appendChild(taskItem);
  }

  const totalTasks = appState.taskList.length;
  const completedTasks = appState.taskList.filter((t) => t.done).length;
  uiRefs.statsChip.textContent = `${totalTasks} задач`;
  uiRefs.doneChip.textContent = `${completedTasks} выполнено`;

  if (appState.selectedTaskIds.length > 0) {
    uiRefs.bulkBar.classList.add("active");
    uiRefs.bulkCount.textContent = `${appState.selectedTaskIds.length} выбрано`;
  } else {
    uiRefs.bulkBar.classList.remove("active");
  }

  save();
}

uiRefs.taskList.addEventListener("dragover", (event) => {
  if (!draggedTaskId || appState.sortField !== "manual") return;
  event.preventDefault();
  const targetTask = event.target.closest("li.task");
  if (!targetTask || targetTask.dataset.id === draggedTaskId) return;
  targetTask.classList.add("drag-over");
});

uiRefs.taskList.addEventListener("dragleave", (event) => {
  const targetTask = event.target.closest("li.task");
  if (targetTask) targetTask.classList.remove("drag-over");
});

uiRefs.taskList.addEventListener("drop", (event) => {
  event.preventDefault();
  const targetTask = event.target.closest("li.task");
  if (!targetTask || !draggedTaskId) return;
  const targetId = targetTask.dataset.id;
  reorderTasksManually(draggedTaskId, targetId);
  draggedTaskId = null;
});

function startInlineEdit(taskItem, task) {
  const textElement = taskItem.querySelector(".text");
  const oldTitle = task.title;
  const input = document.createElement("input");
  input.type = "text";
  input.value = oldTitle;
  textElement.replaceWith(input);
  input.focus();

  const commitEdit = () => {
    task.title = input.value.trim() || oldTitle;
    save();
    render();
  };

  const cancelEdit = () => render();

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") commitEdit();
    if (event.key === "Escape") cancelEdit();
  });

  input.addEventListener("blur", commitEdit);
}
