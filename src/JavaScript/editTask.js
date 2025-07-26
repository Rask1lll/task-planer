function editTask() {
  document.addEventListener("click", addEditing);
}

function addEditing(event) {
  if (!event.target.matches(".edit-task-item")) {
    return;
  }
  const el = event.target;
  console.log(el.parentElement.textContent);
  const paretnElement = el.parentElement;
  let textInTask = paretnElement.textContent;
  textInTask = getTextIntoTask(textInTask);
  paretnElement.innerHTML = `<input type="text" class="task-input" value='${textInTask}' required /> <div class="save-edit">Save Edit</div>`;
  const addingTrigger = paretnElement.querySelector(".save-edit");
  addingTrigger.addEventListener("click", renderNewTask);
}

export { editTask };

function getTextIntoTask(text) {
  text = text.split(" ");
  text = text.slice(0, -4);
  let resulet = text.join(" ");
  return resulet;
}

function renderNewTask(event) {
  const parentElement = event.target.parentElement;
  const textInTask = parentElement.querySelector(".task-input").value;
  event.target.parentElement.innerHTML = `${textInTask}  <div class="edit-task-item">Edit Task</div>  <div class="delete-task-item">Delete Task</div>`;
}
