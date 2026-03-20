function truncate(str: string, max = 10): string {
  if (str.length > max) {
    return str.slice(0, max) + "...";
  } else return str;
}

function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: "${selector}"`);
  }
  return element;
}

function getElementOrNull<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

const updateStats = (text: string) => {
  const charCount = text.length;
  const words = text.trim().match(/\S+/g);
  const wordCount = words ? words.length : 0;

  const charCountEl = document.getElementById("char-count");
  if (charCountEl) {
    charCountEl.innerText = charCount.toString();
  }

  const wordCountEl = document.getElementById("word-count");
  if (wordCountEl) {
    if (wordCount === 1) {
      wordCountEl.innerText = "1 word";
    } else {
      wordCountEl.innerText = `${wordCount} words`;
    }
  }
};
function setupZoomBar() {
  const btnIn = document.getElementById("btn-zoom-in")!;
  const btnOut = document.getElementById("btn-zoom-out")!;
  const label = document.getElementById("zoom-level")!;

  const DEFAULT_SIZE = 16;
  let currentSize = DEFAULT_SIZE;
  const MIN_SIZE = 12;
  const MAX_SIZE = 24;

  const applyZoom = (newSize: number) => {
    currentSize = Math.max(MIN_SIZE, Math.min(newSize, MAX_SIZE));

    const scale = currentSize / DEFAULT_SIZE;
    const editorEl = document.getElementById("editor") as HTMLElement;
    if (editorEl) {
      editorEl.style.fontSize = `${scale}em`;
    }

    const percentage = Math.round(scale * 100);
    label.innerText = `${percentage}%`;
  };
  btnIn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    applyZoom(currentSize + 2);
  });

  btnOut.addEventListener("mousedown", (e) => {
    e.preventDefault();
    applyZoom(currentSize - 2);
  });
  label.addEventListener("mousedown", (e) => {
    e.preventDefault();
    applyZoom(DEFAULT_SIZE);
  });
  label.style.cursor = "pointer";
}
export {
  debounce,
  getElement,
  getElementOrNull,
  setupZoomBar,
  truncate,
  updateStats,
};
