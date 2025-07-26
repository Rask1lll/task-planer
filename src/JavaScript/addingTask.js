import { deleteTask } from "./deleteTask.js";
import { editTask } from "./editTask.js";
function addTaskToDesc(event) {
  event.preventDefault();
  const task = document.querySelector(".task-input").value;
  const taskDesk = document.getElementById("task-list");

  taskDesk.innerHTML += `<li class="task-item" draggable>${task} <div class="task-item-options"> <div class="edit-task-item">Edit Task</div> <div class="delete-task-item">Delete Task</div></div></li>`;
  editTask();
}
document.querySelector(".task-button").addEventListener("click", addTaskToDesc);
document.addEventListener("click", deleteTask);
