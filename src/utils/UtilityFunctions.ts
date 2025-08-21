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
