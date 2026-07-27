// CRITICAL: Scheduler polyfill must execute BEFORE React modules load
// This is a classic (non-module) script that blocks module execution
(function() {
  'use strict';
  
  // Ensure 'self' exists - some environments/bundlers expect it
  if (typeof self === 'undefined') {
    if (typeof window !== 'undefined') {
      window.self = window;
    } else if (typeof globalThis !== 'undefined') {
      globalThis.self = globalThis;
    }
  }

  const root = typeof globalThis !== 'undefined' ? globalThis : 
               typeof self !== 'undefined' ? self : 
               typeof window !== 'undefined' ? window : {};

  console.log('[SCHEDULER POLYFILL] Starting on root:', root === window ? 'window' : 'other');
  
  // Ensure performance.now exists and is a function
  if (!root.performance) {
    root.performance = {};
  }
  if (typeof root.performance.now !== 'function') {
    root.performance.now = function() { return Date.now(); };
  }

  const perfNow = function() { return root.performance.now(); };
  
  // Ensure scheduler object exists on all possible globals
  const schedulerPolyfill = {
    unstable_now: perfNow,
    unstable_scheduleCallback: function(priority, callback) {
      var g = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
      if (g.setImmediate) return g.setImmediate(callback);
      return setTimeout(callback, 0);
    },
    unstable_cancelCallback: function(id) {
      var g = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
      if (g.clearImmediate) g.clearImmediate(id);
      else clearTimeout(id);
    },
    unstable_shouldYield: function() { return false; },
    unstable_requestPaint: function() {},
    unstable_runWithPriority: function(priority, callback) { return callback(); },
    unstable_next: function(callback) { return callback(); },
    unstable_getFirstCallbackNode: function() { return null; },
    unstable_pauseExecution: function() {},
    unstable_continueExecution: function() {},
    unstable_getCurrentPriorityLevel: function() { return 3; },
    unstable_ImmediatePriority: 1,
    unstable_UserBlockingPriority: 2,
    unstable_NormalPriority: 3,
    unstable_LowPriority: 4,
    unstable_IdlePriority: 5,
  };

  // Define scheduler on root
  if (!root.scheduler) {
    try {
      Object.defineProperty(root, 'scheduler', {
        value: schedulerPolyfill,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } catch (err) {
      void err;
      root.scheduler = schedulerPolyfill;
    }
  } else {
    // Ensure all properties exist on existing scheduler
    for (var prop in schedulerPolyfill) {
      if (!root.scheduler[prop]) {
        root.scheduler[prop] = schedulerPolyfill[prop];
      }
    }
  }
  
  // Sync across all common globals
  if (typeof window !== 'undefined') window.scheduler = root.scheduler;
  if (typeof self !== 'undefined') self.scheduler = root.scheduler;
  
  // CRITICAL: Some minified code might try to set properties on a local 'exports' 
  // that it thinks exists because of how it was bundled. 
  // We can't easily fix that here, but ensuring 'performance.now' is solid helps.
  
  console.log('[SCHEDULER POLYFILL] Complete. React can now load safely.');
})();
