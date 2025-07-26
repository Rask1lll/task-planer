function deleteTask(event) {
  const element = event.target;
  if (!element.matches(".delete-task-item")) {
    return;
  }

  const parent = element.parentElement;
  parent.style.display = "none";
}

export { deleteTask };
