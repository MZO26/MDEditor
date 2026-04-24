import type { Editor } from "@tiptap/core";
import { debounce, getElement } from "../utils/helpers";

function calculateToDos(editor: Editor) {
  const container = getElement(".todo-progress-container");
  let tasks = 0;
  let completed = 0;

  editor.state.doc.descendants((node) => {
    if (node.type.name === "taskItem") {
      tasks++;
      if (node.attrs["checked"]) completed++;
    }
  });
  if (tasks === 0) {
    if (container.style.display !== "none") container.style.display = "none";
    return;
  }
  if (container.style.display !== "block") container.style.display = "block";

  const countLabel = document.querySelector<HTMLElement>("#todo-count");
  const progressBar = document.querySelector<HTMLElement>("#todo-progress");
  if (countLabel) countLabel.innerText = `${completed}/${tasks}`;

  if (progressBar) {
    const percentage = (completed / tasks) * 100;
    progressBar.style.width = `${percentage}%`;
    progressBar.style.backgroundColor =
      percentage === 100 ? "var(--tag-color)" : "var(--text-muted)";
  }
}

const debouncedToDoUpdate = debounce(calculateToDos, 500);

export { debouncedToDoUpdate };
