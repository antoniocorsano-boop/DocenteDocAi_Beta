/**
 * Ensure the Performance API exists before React/Scheduler load so React
 * never tries to hand the scheduler an undefined timing object.
 */
const ensurePerformanceApi = () => {
  const now = () => Date.now();

  if (typeof window !== 'undefined') {
    const windowWithPerformance = window as unknown as { performance?: unknown };
    if (!windowWithPerformance.performance) {
      windowWithPerformance.performance = {};
    }
    const perfObj = windowWithPerformance.performance as unknown as { now?: () => number };
    if (typeof perfObj.now !== 'function') {
      perfObj.now = now;
    }
  }

  if (typeof globalThis !== 'undefined') {
    const globalWithPerformance = globalThis as unknown as { performance?: unknown };
    if (!globalWithPerformance.performance) {
      globalWithPerformance.performance = {};
    }
    const perfObj = globalWithPerformance.performance as unknown as { now?: () => number };
    if (typeof perfObj.now !== 'function') {
      perfObj.now = now;
    }
  }
};

/**
 * CRITICAL: Initialize scheduler for React BEFORE any imports
 * This prevents "Cannot set properties of undefined (setting 'unstable_now')" error
 */
const ensureScheduler = () => {
  // Get the timing function
  const getTimingFunction = () => {
    if (typeof performance !== 'undefined' && performance.now) {
      return () => performance.now();
    }
    return () => Date.now();
  };

  // Create scheduler object with all required functions
  const schedulerImpl: Record<string, unknown> = {
    unstable_now: getTimingFunction(),
    unstable_scheduleCallback: (_priority: unknown, callback: FrameRequestCallback | TimerHandler) => {
      return setTimeout(callback as TimerHandler, 0);
    },
    unstable_cancelCallback: (timerId: unknown) => {
      clearTimeout(timerId as ReturnType<typeof setTimeout>);
    },
    unstable_shouldYield: () => false,
    unstable_getFirstCallbackNode: () => null,
    unstable_pauseExecution: () => {},
    unstable_continueExecution: () => {},
    unstable_ImmediatePriority: 1,
    unstable_UserBlockingPriority: 2,
    unstable_NormalPriority: 3,
    unstable_LowPriority: 4,
    unstable_IdlePriority: 5,
  };

  // Ensure globalThis.scheduler exists and is writable
  if (typeof globalThis !== 'undefined') {
    // Use Object.defineProperty to ensure we can set it even if it's read-only
    try {
      Object.defineProperty(globalThis, 'scheduler', {
        value: schedulerImpl,
        writable: true,
        configurable: true,
      });
    } catch {
      // Fallback if property is not configurable
      const globalWithScheduler = globalThis as unknown as { scheduler?: unknown };
      globalWithScheduler.scheduler = schedulerImpl;
    }
  }

  // Also ensure window.scheduler if in browser
  if (typeof window !== 'undefined') {
    try {
      Object.defineProperty(window, 'scheduler', {
        value: schedulerImpl,
        writable: true,
        configurable: true,
      });
    } catch {
      const windowWithScheduler = window as unknown as { scheduler?: unknown };
      windowWithScheduler.scheduler = schedulerImpl;
    }
  }
};

ensurePerformanceApi();
ensureScheduler();

export {};

