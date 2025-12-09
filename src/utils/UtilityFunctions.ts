export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): T => {
  let timer: ReturnType<typeof setTimeout>;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  } as T;
};

// Taken from https://phuoc.ng/collection/html-dom/move-the-cursor-to-the-end-of-a-content-editable-element
export const moveCursorToEnd = async (element: HTMLDivElement) => {
  const range = document.createRange();
  const selection = window.getSelection();
  range.setStart(element, element.childNodes.length);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
};
