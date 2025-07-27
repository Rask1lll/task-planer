let isDrawing = false;
let startX;
let startY;
let draggedElement = null;
let tracking;

document.addEventListener("pointerdown", (event) => {
  const element = event.target;
  if (!element.matches("[draggable]")) {
    return;
  }
  isDrawing = true;
  draggedElement = element;
  element.classList.add("isDragging");

  const rect = element.getBoundingClientRect();
  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;
});

document.addEventListener("pointermove", (event) => {
  if (!isDrawing || !draggedElement) {
    return;
  }

  const elementsUnder = document.elementsFromPoint(
    event.clientX,
    event.clientY
  );

  const elementUnder = elementsUnder[1];

  if (elementUnder == undefined) {
    return;
  }

  if (!tracking) {
    if (elementUnder.matches("[draggable]")) {
      elementUnder.classList.add("active");
    }
    tracking = elementUnder;
  }

  if (tracking !== elementUnder) {
    tracking.classList.remove("active");
    tracking = null;
  }
  draggedElement.style.position = "absolute";
  draggedElement.style.zIndex = 1000;
  draggedElement.style.left = `${event.pageX - startX}px`;
  draggedElement.style.top = `${event.pageY - startY}px`;
});

document.addEventListener("pointerup", (event) => {
  if (!isDrawing) return;

  isDrawing = false;
  if (draggedElement) {
    draggedElement.classList.remove("isDragging");
    draggedElement.style.position = "static";
    draggedElement = null;
  }

  if (
    document
      .elementsFromPoint(event.clientX, event.clientY)[0]
      .matches("[draggable]")
  ) {
    document
      .elementsFromPoint(event.clientX, event.clientY)[0]
      .insertAdjacentElement("beforeBegin", event.target);
  } else {
    alert("ty che eban&");
  }
});
