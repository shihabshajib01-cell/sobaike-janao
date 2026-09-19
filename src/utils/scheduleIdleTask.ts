export type IdleTaskCancel = () => void;

type IdleCapableWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout?: number }
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function scheduleIdleTask(
  task: () => void,
  timeoutMs = 1200
): IdleTaskCancel {
  if (typeof window === 'undefined') {
    task();
    return () => {};
  }

  let cancelled = false;
  const idleWindow = window as IdleCapableWindow;
  const run = () => {
    if (!cancelled) task();
  };

  if (typeof idleWindow.requestIdleCallback === 'function') {
    const handle = idleWindow.requestIdleCallback(run, { timeout: timeoutMs });
    return () => {
      cancelled = true;
      idleWindow.cancelIdleCallback?.(handle);
    };
  }

  const handle = window.setTimeout(run, Math.min(timeoutMs, 800));
  return () => {
    cancelled = true;
    window.clearTimeout(handle);
  };
}
