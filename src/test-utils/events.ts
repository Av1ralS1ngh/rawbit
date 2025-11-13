export function createMouseEvent(
  type: string,
  options: MouseEventInit & { clientX?: number; clientY?: number } = {}
): MouseEvent {
  return new MouseEvent(type, options);
}

export function createKeyboardEvent(
  type: string,
  options: KeyboardEventInit = {}
): KeyboardEvent {
  return new KeyboardEvent(type, options);
}
